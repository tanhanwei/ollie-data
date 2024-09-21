import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import DataMarketplaceABI from './DataMarketplaceABI.json';

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

          // Fetch real data from the server
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
          'X-Nullifier-Hash': ethers.utils.id(account || 'dummybuyer') // Use a dummy hash if account is not set
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
      // Refresh the data after purchase
      await fetchData();
    } catch (err) {
      console.error('Error purchasing data:', err);
      if (err.error && err.error.message) {
        console.error('Contract error message:', err.error.message);
      }
      setError('Failed to purchase data. Please check the console for more details.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Available Data for Purchase</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Event Type</th>
              <th className="border border-gray-300 p-2">Timestamp</th>
              <th className="border border-gray-300 p-2">Domain</th>
              <th className="border border-gray-300 p-2">Owner</th>
              <th className="border border-gray-300 p-2">Actions</th>
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
                <td className="border border-gray-300 p-2">
                  <button 
                    onClick={() => processAndPurchase(item.id)}
                    className="bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded"
                  >
                    Process and Purchase
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BuyerPage;