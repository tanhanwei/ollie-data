import React, { useState, useEffect } from 'react';
import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit';
import { ethers } from 'ethers';

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Your Data</h2>
      
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
          {({ open }) => <button onClick={open} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4">Authenticate with World ID</button>}
        </IDKitWidget>
      ) : (
        <>
     
          
          {!isRegistered ? (
            <div className="mb-4">
              <input 
                type="text" 
                value={oasisWallet} 
                onChange={(e) => setOasisWallet(e.target.value)}
                placeholder="Enter your Oasis wallet address"
                className="border p-2 mr-2"
              />
              <button 
                onClick={handleRegisterSeller}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Register as Seller
              </button>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-green-600">You are registered as a seller.</p>
              <p>Oasis Wallet: {oasisWallet}</p>
            </div>
          )}

          <button 
            onClick={clearAllData}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-4"
          >
            Clear All Data
          </button>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2">Event</th>
                  <th className="border border-gray-300 p-2">Timestamp</th>
                  <th className="border border-gray-300 p-2">Domain</th>
                  <th className="border border-gray-300 p-2">Owner</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={item.id || index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="border border-gray-300 p-2">{item.event_name || 'N/A'}</td>
                    <td className="border border-gray-300 p-2">
                      {item.event_timestamp ? new Date(item.event_timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="border border-gray-300 p-2">{item.domain || 'N/A'}</td>
                    <td className="border border-gray-300 p-2">
                      {item.ownerNullifierHash ? `${item.ownerNullifierHash.slice(0, 10)}...` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default UserPage;