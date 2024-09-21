import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import DataMarketplaceABI from './DataMarketplaceABI.json';
import { 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';

const CONTRACT_ADDRESS = '0x520C9FC81f6B70C7AFc18bCF53d5f5bcABf36c62';

const BuyerPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          setAccount(address);

          const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, DataMarketplaceABI, signer);
          setContract(contractInstance);

          await fetchData();
        } catch (err) {
          console.error("Failed to initialize:", err);
          setError("Failed to connect to the blockchain. Please make sure you're connected to the Oasis Sapphire Testnet.");
          setLoading(false);
        }
      } else {
        setError("Please install MetaMask to use this dApp");
        setLoading(false);
      }
    };

    init();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/retrieve-data', {
        headers: {
          'X-Nullifier-Hash': ethers.utils.id(account || 'dummybuyer')
        }
      });
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const sortedData = result.data.sort((a, b) => new Date(b.event_timestamp) - new Date(a.event_timestamp));
        setData(sortedData);
      } else {
        throw new Error('Unexpected data format');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error loading data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const processAndPurchase = async (dataId) => {
    if (!contract || !account) return;

    try {
      const buyerNullifierHash = ethers.utils.id(account);
      const sellerNullifierHash = ethers.utils.id("dummyseller"); // Using a dummy seller hash
      const amount = ethers.utils.parseEther('0.1'); // Example amount

      console.log('Attempting to purchase data with:');
      console.log('Buyer hash:', buyerNullifierHash);
      console.log('Seller hash:', sellerNullifierHash);
      console.log('Amount:', amount.toString());

      const tx = await contract.purchaseData(buyerNullifierHash, sellerNullifierHash, amount, { value: amount });
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed in block:', receipt.blockNumber);

      console.log('Data purchased successfully');
      await fetchData();
    } catch (err) {
      console.error('Error purchasing data:', err);
      if (err.error && err.error.message) {
        console.error('Contract error message:', err.error.message);
      }
      setError('Failed to purchase data. Please check the console for more details.');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Available Data for Purchase</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Event Type</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell>Domain</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={item.id || index}>
                <TableCell>{item.event_name || 'N/A'}</TableCell>
                <TableCell>
                  {item.event_timestamp ? new Date(item.event_timestamp).toLocaleString() : 'N/A'}
                </TableCell>
                <TableCell>{item.domain || 'N/A'}</TableCell>
                <TableCell>
                  {item.ownerNullifierHash ? `${item.ownerNullifierHash.slice(0, 10)}...` : 'N/A'}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="small"
                    onClick={() => processAndPurchase(item.id)}
                  >
                    Process and Purchase
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BuyerPage;