require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { create } = require('ipfs-http-client');
const winston = require('winston');
const jwt = require('jsonwebtoken');
const { expressjwt: expressJwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Setup IPFS client
const ipfs = create({
    host: 'localhost',
    port: 5001,
    protocol: 'http'
});

// Setup logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...rest }) => {
      return `${timestamp} ${level}: ${message} ${Object.keys(rest).length ? JSON.stringify(rest, null, 2) : ''}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

app.use(cors());
app.use(express.json());

// JWT Secret for our own tokens
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Auth0 configuration
const auth0Domain = 'dev-rynbpb65bndtk1ka.us.auth0.com';

// Middleware to verify Auth0 tokens
const checkJwt = expressJwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${auth0Domain}/.well-known/jwks.json`
  }),
  audience: 'mInTjrehlcPtX1VooFCjNKHAIltAhuQo',
  issuer: `https://${auth0Domain}/`,
  algorithms: ['RS256']
});

// CID storage file path
const CID_FILE_PATH = path.join(__dirname, 'cids.json');

// New function to log CID file contents
async function logCIDFile() {
  try {
    const cids = await fs.readFile(CID_FILE_PATH, 'utf8');
    logger.info('Current contents of cids.json:', { cids });
  } catch (error) {
    logger.error('Error reading cids.json:', { error: error.message });
  }
}

// Helper function to store data on IPFS
async function storeDataOnIPFS(data) {
  try {
    const jsonString = JSON.stringify(data);
    logger.info('Storing data on IPFS', { jsonString });
    const result = await ipfs.add(jsonString);
    logger.info('Stored data with CID', { cid: result.path });
    return result.path;
  } catch (error) {
    logger.error('Error storing data on IPFS', { error: error.message });
    throw error;
  }
}

// Helper function to retrieve data from IPFS
async function retrieveDataFromIPFS(cid) {
    let rawData = '';
    try {
      const stream = ipfs.cat(cid);
      for await (const chunk of stream) {
        rawData += chunk.toString();
      }
      logger.info('Raw data from IPFS:', { rawData });
      if (!rawData) {
        throw new Error('No data retrieved from IPFS');
      }
      
      // Check if the data is a comma-separated list of ASCII codes
      if (rawData.match(/^[\d,]+$/)) {
        rawData = String.fromCharCode(...rawData.split(','));
      }
      
      const parsedData = JSON.parse(rawData);
      logger.info('Parsed data from IPFS:', { parsedData });
      return parsedData;
    } catch (error) {
      logger.error('Error retrieving or parsing data from IPFS', { error: error.message, cid, rawData });
      throw error;
    }
  }

// Helper function to get all CIDs
async function getAllCIDsFromDatabase() {
  try {
    const data = await fs.readFile(CID_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create it with an empty array
      await fs.writeFile(CID_FILE_PATH, '[]');
      return [];
    }
    throw error;
  }
}

// Helper function to add CID to database
async function addCIDToDatabase(cid) {
  const cids = await getAllCIDsFromDatabase();
  cids.push(cid);
  await fs.writeFile(CID_FILE_PATH, JSON.stringify(cids, null, 2));
  logger.info('Added new CID to database:', { cid });
  await logCIDFile();
}

// New endpoint for user authentication
app.post('/auth', checkJwt, (req, res) => {
  logger.info('Received authentication request');
  const auth0Token = req.headers.authorization.split(' ')[1];
  logger.info('Received Auth0 token', { token: auth0Token });
  
  try {
    const decodedToken = jwt.decode(auth0Token);
    logger.info('Decoded Auth0 token', { decodedToken });

    const worldIdInfo = {
      nullifier_hash: decodedToken.sub.split('|')[2],
    };
    logger.info('Extracted World ID info', { worldIdInfo });

    const token = jwt.sign({ worldIdInfo }, JWT_SECRET, { expiresIn: '1h' });
    logger.info('Generated new JWT token', { token });
    
    const decodedJWT = jwt.verify(token, JWT_SECRET);
    logger.info('Decoded generated JWT', { decodedJWT });
    
    res.json({ token });
  } catch (error) {
    logger.error('Error in /auth endpoint', { error: error.message });
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Protected route to store data
app.post('/store-data', expressJwt({ secret: JWT_SECRET, algorithms: ['HS256'] }), async (req, res) => {
    logger.info('Received request to store data');
    try {
      logger.info('Received full body', { 
        fullBody: req.body,
        dataProperty: req.body.data,
        isDataArray: Array.isArray(req.body.data)
      });
  
      const data = req.body.data;
      logger.info('Processed data', { data });
      logger.info('Full request headers', req.headers);
      logger.info('Full token payload', req.auth);
  
      if (!req.auth || !req.auth.worldIdInfo) {
        logger.error('Token payload:', JSON.stringify(req.auth, null, 2));
        throw new Error('User information not found in token');
      }
  
      const ownerNullifierHash = req.auth.worldIdInfo.nullifier_hash;
      logger.info('Owner nullifier hash', { ownerNullifierHash });
  
      // Assuming data is an array of events
      const dataWithOwner = data.map(event => ({
        ...event,
        ownerNullifierHash
      }));
  
      const cid = await storeDataOnIPFS(dataWithOwner);
      await addCIDToDatabase(cid);
      logger.info('Stored data with CID', { cid });
      res.json({ success: true, cid });
    } catch (error) {
      logger.error('Error storing data', { error: error.message, stack: error.stack });
      res.status(500).json({ success: false, error: error.message });
    }
  });

// Route to retrieve data
app.get('/retrieve-data', expressJwt({ secret: JWT_SECRET, algorithms: ['HS256'] }), async (req, res) => {
    logger.info('Received request to retrieve data');
    logger.info('Decoded token:', req.auth);
    try {
      const allCIDs = await getAllCIDsFromDatabase();
      let allData = [];
      let errors = [];
      for (const cid of allCIDs) {
        try {
          const data = await retrieveDataFromIPFS(cid);
          allData.push({ ...data, id: cid });
        } catch (error) {
          logger.error(`Error retrieving data for CID: ${cid}`, { error: error.message });
          errors.push({ cid, error: error.message });
        }
      }
      logger.info('Retrieved data:', { allData, errors });
      res.json({ success: true, data: allData, errors });
    } catch (error) {
      logger.error('Error retrieving data', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  });

// Custom error handler
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    logger.error('JWT Error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
  next(err);
});

// Start the server and test IPFS connection
app.listen(port, async () => {
  logger.info(`Server running at http://localhost:${port}`);
  const ipfsConnected = await testIPFSConnection();
  if (ipfsConnected) {
    logger.info('IPFS connection established');
  } else {
    logger.warn('Failed to establish IPFS connection');
  }
});

async function testIPFSConnection() {
  try {
    logger.info('Testing IPFS connection');
    const version = await ipfs.version();
    logger.info('IPFS connection successful', { version });
    return true;
  } catch (error) {
    logger.error('IPFS connection test failed', { error: error.message, stack: error.stack });
    return false;
  }
}