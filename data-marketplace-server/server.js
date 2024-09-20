const express = require('express');
const cors = require('cors');
const { create } = require('ipfs-http-client');

const app = express();
const port = 3000;

// Connect to the IPFS network
const ipfs = create({ url: 'http://localhost:5001' });

app.use(cors());
app.use(express.json());

app.post('/store-data', async (req, res) => {
  try {
    const data = req.body;
    const result = await ipfs.add(JSON.stringify(data));
    console.log('Stored data with CID:', result.path);
    res.json({ success: true, cid: result.path });
  } catch (error) {
    console.error('Error storing data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});