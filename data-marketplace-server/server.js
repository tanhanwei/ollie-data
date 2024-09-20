// data-marketplace-server/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { create } = require('ipfs-http-client');
const winston = require('winston');

const app = express();
const port = process.env.PORT || 3000;

// Setup IPFS client
const ipfs = create({ url: process.env.IPFS_URL || 'http://localhost:5001' });

// Setup logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'data-marketplace-server' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

app.use(cors());
app.use(express.json());

// Helper function to store data on IPFS
async function storeDataOnIPFS(data) {
  try {
    const result = await ipfs.add(JSON.stringify(data));
    logger.info(`Stored data with CID: ${result.path}`);
    return result.path;
  } catch (error) {
    logger.error('Error storing data on IPFS:', error);
    throw error;
  }
}

// Helper function to retrieve data from IPFS
async function retrieveDataFromIPFS(cid) {
    try {
      const stream = ipfs.cat(cid);
      let data = '';
      for await (const chunk of stream) {
        data += chunk.toString();
      }
      // Convert ASCII codes to characters if necessary
      if (data.includes(',')) {
        data = String.fromCharCode(...data.split(','));
      }
      console.log('Raw data retrieved:', data);  // Log raw data for debugging
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error retrieving data from IPFS:', error);
      // If JSON parsing fails, return the raw data
      return { rawData: data };
    }
  }

// Update your existing /store-data endpoint
app.post('/store-data', async (req, res) => {
  try {
    const data = req.body;
    const cid = await storeDataOnIPFS(data);
    logger.info('Stored data with CID:', cid);
    res.json({ success: true, cid });
  } catch (error) {
    logger.error('Error storing data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Updated endpoint to retrieve data
app.get('/retrieve-data/:cid', async (req, res) => {
    try {
      const { cid } = req.params;
      const result = await retrieveDataFromIPFS(cid);
      if (result.rawData) {
        // If we couldn't parse the JSON, send the raw data
        res.json({ success: true, data: { rawData: result.rawData } });
      } else {
        res.json({ success: true, data: result });
      }
    } catch (error) {
      logger.error('Error retrieving data:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
});