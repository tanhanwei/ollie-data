import React, { useState, useEffect } from 'react';
import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit';
import { ethers } from 'ethers';
import { 
  Typography, 
  Button, 
  TextField, 
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

const UserPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [nullifierHash, setNullifierHash] = useState(null);
  const [oasisWallet, setOasisWallet] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedNullifierHash = localStorage.getItem('nullifierHash');
    if (storedNullifierHash) {
      setIsAuthenticated(true);
      setNullifierHash(storedNullifierHash);
      checkRegistrationStatus(storedNullifierHash);
      fetchData(storedNullifierHash);
    } else {
      setLoading(false);
    }
  }, []);

  const onSuccess = async (response) => {
    console.log("World ID verification successful:", response);
    setIsAuthenticated(true);
    setNullifierHash(response.nullifier_hash);
    localStorage.setItem('nullifierHash', response.nullifier_hash);
    await checkRegistrationStatus(response.nullifier_hash);
    fetchData(response.nullifier_hash);
  };

  const checkRegistrationStatus = async (hash) => {
    try {
      const response = await fetch(`http://localhost:3000/check-registration/${hash}`);
      if (!response.ok) throw new Error('Failed to check registration');
      const data = await response.json();
      setIsRegistered(data.isRegistered);
      if (data.isRegistered) {
        setOasisWallet(data.oasisWallet);
      }
    } catch (err) {
      console.error('Error checking registration:', err);
      setError('Failed to check registration status.');
    }
  };

  const fetchData = async (hash) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/retrieve-data', {
        headers: {
          'X-Nullifier-Hash': hash
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

  const handleRegisterSeller = async () => {
    if (!ethers.utils.isAddress(oasisWallet)) {
      alert('Please enter a valid Oasis wallet address');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/register-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nullifierHash, oasisWallet }),
      });

      if (!response.ok) throw new Error('Failed to register');
      
      const result = await response.json();
      if (result.success) {
        setIsRegistered(true);
        alert('Successfully registered as a seller!');
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error registering seller:', error);
      alert('Failed to register as a seller. Please try again.');
    }
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        const response = await fetch('http://localhost:3000/clear-data', {
          method: 'POST',
          headers: {
            'X-Nullifier-Hash': nullifierHash
          }
        });
        if (!response.ok) throw new Error('Failed to clear data');
        const result = await response.json();
        if (result.success) {
          alert('All data has been cleared');
          setData([]);
        }
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Failed to clear data. Please try again.');
      }
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Your Data</Typography>
      
      {!isAuthenticated ? (
        <IDKitWidget
          app_id={process.env.REACT_APP_WORLD_ID_APP_ID}
          action="authenticate"
          onSuccess={onSuccess}
          handleVerify={(proof) => {
            console.log("Proof received:", proof);
            return true;
          }}
          verification_level={VerificationLevel.Orb}
        >
          {({ open }) => <Button variant="contained" onClick={open} sx={{ mb: 2 }}>Authenticate with World ID</Button>}
        </IDKitWidget>
      ) : (
        <>
          {!isRegistered ? (
            <Box sx={{ mb: 2 }}>
              <TextField
                value={oasisWallet}
                onChange={(e) => setOasisWallet(e.target.value)}
                placeholder="Enter your Oasis wallet address"
                fullWidth
                margin="normal"
              />
              <Button 
                variant="contained"
                onClick={handleRegisterSeller}
                sx={{ mt: 1 }}
              >
                Register as Seller
              </Button>
            </Box>
          ) : (
            <Alert severity="success" sx={{ mb: 2 }}>
              You are registered as a seller. Oasis Wallet: {oasisWallet}
            </Alert>
          )}

          <Button 
            variant="contained"
            color="secondary"
            onClick={clearAllData}
            sx={{ mb: 2 }}
          >
            Clear All Data
          </Button>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Event</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Domain</TableCell>
                  <TableCell>Owner</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default UserPage;