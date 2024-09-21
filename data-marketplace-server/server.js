require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { create } = require('ipfs-http-client');
const winston = require('winston');
const jwt = require('jsonwebtoken');
const { expressjwt: expressJwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

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
      // Convert the comma-separated string of ASCII codes to a proper string
      const dataString = rawData.split(',').map(num => String.fromCharCode(parseInt(num))).join('');
      logger.info('Converted data string:', { dataString });
      const parsedData = JSON.parse(dataString);
      logger.info('Parsed data from IPFS:', { parsedData });
      return parsedData;
    } catch (error) {
      logger.error('Error retrieving or parsing data from IPFS', { error: error.message, cid, rawData });
      throw error;
    }
  }


// New endpoint for user authentication
app.post('/auth', checkJwt, (req, res) => {
  logger.info('Received authentication request');
  const auth0Token = req.headers.authorization.split(' ')[1];
  logger.info('Received Auth0 token', { token: auth0Token });
  
  try {
    // Decode the Auth0 token to log its contents (don't verify here, checkJwt already did that)
    const decodedToken = jwt.decode(auth0Token);
    logger.info('Decoded Auth0 token', { decodedToken });

    // Extract World ID information
    const worldIdInfo = {
      nullifier_hash: decodedToken.sub.split('|')[2],
      // Add any other World ID specific claims here
    };
    logger.info('Extracted World ID info', { worldIdInfo });

    // Here you would typically verify the World ID specific claims in the Auth0 token
    // For now, we'll just create our own JWT with the World ID info
    const token = jwt.sign({ worldIdInfo }, JWT_SECRET, { expiresIn: '1h' });
    logger.info('Generated new JWT token', { token });
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
    const data = req.body;
    logger.info('Received data', { data });
    const cid = await storeDataOnIPFS(data);
    logger.info('Stored data with CID', { cid });
    res.json({ success: true, cid });
  } catch (error) {
    logger.error('Error storing data', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Protected route to retrieve data
app.get('/retrieve-data/:cid', expressJwt({ secret: JWT_SECRET, algorithms: ['HS256'] }), async (req, res) => {
  try {
    const { cid } = req.params;
    const data = await retrieveDataFromIPFS(cid);
    logger.info('Retrieved data from IPFS', { cid, data });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error retrieving data', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Temporary endpoint for testing - remove in production
app.get('/test-token', (req, res) => {
    const token = jwt.sign({ worldIdInfo: { nullifier_hash: 'test_hash' } }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });

app.get('/ipfs-health', async (req, res) => {
  try {
    logger.info('Attempting IPFS health check');
    const version = await ipfs.version();
    logger.info('IPFS health check successful', { version });
    res.json({ status: 'ok', version });
  } catch (error) {
    logger.error('IPFS health check failed', { error: error.message, stack: error.stack });
    res.status(500).json({ status: 'error', message: error.message, stack: error.stack });
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

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error', { error: err.message, stack: err.stack });
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('Invalid token');
  } else {
    res.status(500).send('Something broke!');
  }
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