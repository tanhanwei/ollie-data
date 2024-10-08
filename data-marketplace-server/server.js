// data-marketplace-server/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { create } = require('ipfs-http-client');
const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');
const { ethers } = require('ethers');

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

// CID storage file path
const CID_FILE_PATH = path.join(__dirname, 'cids.json');

// Seller registration storage file path
const SELLER_FILE_PATH = path.join(__dirname, 'sellers.json');

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
}

// Helper function to get all sellers
async function getAllSellers() {
  try {
    const data = await fs.readFile(SELLER_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create it with an empty object
      await fs.writeFile(SELLER_FILE_PATH, '{}');
      return {};
    }
    throw error;
  }
}

// Helper function to add or update a seller
async function updateSeller(nullifierHash, oasisWallet) {
  const sellers = await getAllSellers();
  sellers[nullifierHash] = oasisWallet;
  await fs.writeFile(SELLER_FILE_PATH, JSON.stringify(sellers, null, 2));
  logger.info('Updated seller in database:', { nullifierHash, oasisWallet });
}

// Middleware to check authentication
const checkAuth = (req, res, next) => {
  const nullifierHash = req.headers['x-nullifier-hash'];
  if (!nullifierHash) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.nullifierHash = nullifierHash;
  next();
};

// Protected route to store data
app.post('/store-data', checkAuth, async (req, res) => {
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

    const ownerNullifierHash = req.nullifierHash;
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
app.get('/retrieve-data', checkAuth, async (req, res) => {
  logger.info('Received request to retrieve data');
  try {
    const allCIDs = await getAllCIDsFromDatabase();
    let allData = [];
    let errors = [];
    for (const cid of allCIDs) {
      try {
        const data = await retrieveDataFromIPFS(cid);
        allData.push(...data);
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

// New route to clear all data
app.post('/clear-data', checkAuth, async (req, res) => {
  try {
    // 1. Get all CIDs from the database
    const allCIDs = await getAllCIDsFromDatabase();

    // 2. Attempt to remove each CID from IPFS
    for (const cid of allCIDs) {
      try {
        await ipfs.pin.rm(cid);
        logger.info(`Unpinned CID: ${cid}`);
      } catch (error) {
        logger.warn(`Failed to unpin CID: ${cid}`, error);
      }
    }

    // 3. Clear the CIDs from your local database
    await fs.writeFile(CID_FILE_PATH, '[]');
    
    logger.info('All data cleared');
    res.json({ success: true, message: 'All data cleared' });
  } catch (error) {
    logger.error('Error clearing data', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// New route to check registration status
app.get('/check-registration/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const sellers = await getAllSellers();
    const isRegistered = !!sellers[hash];
    res.json({ 
      isRegistered, 
      oasisWallet: isRegistered ? sellers[hash] : null 
    });
  } catch (error) {
    logger.error('Error checking registration', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// New route to register seller
app.post('/register-seller', async (req, res) => {
  try {
    const { nullifierHash, oasisWallet } = req.body;
    
    if (!nullifierHash || !oasisWallet) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!ethers.utils.isAddress(oasisWallet)) {
      return res.status(400).json({ success: false, message: 'Invalid Oasis wallet address' });
    }

    await updateSeller(nullifierHash, oasisWallet);
    res.json({ success: true, message: 'Seller registered successfully' });
  } catch (error) {
    logger.error('Error registering seller', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
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