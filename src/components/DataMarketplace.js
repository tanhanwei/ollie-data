import React, { useState, useEffect } from 'react';

const DataMarketplace = ({ userNullifierHash }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3000/retrieve-data', {
        headers: {
          'X-Nullifier-Hash': userNullifierHash
        }
      });
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      console.log('Raw data received:', result);
      if (result.success && Array.isArray(result.data)) {
        console.log('Parsed data:', result.data);
        // Sort the data by timestamp in descending order (latest first)
        const sortedData = result.data.sort((a, b) => new Date(b.event_timestamp) - new Date(a.event_timestamp));
        setData(sortedData);
      } else {
        console.error('Unexpected data format:', result);
        setError('Received data in unexpected format');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error loading data. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Set up an interval to fetch data every 30 seconds
    const intervalId = setInterval(fetchData, 30000);
    // Clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [userNullifierHash]);

  const processAndPurchase = async (dataId) => {
    try {
      const response = await fetch(`http://localhost:3000/process-and-purchase/${dataId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Nullifier-Hash': userNullifierHash
        },
        body: JSON.stringify({ userNullifierHash })
      });
      if (!response.ok) throw new Error('Failed to process and purchase data');
      const result = await response.json();
      setData(prevData => prevData.map(item => 
        item.id === dataId ? { ...item, processed: result.processedData } : item
      ));
    } catch (error) {
      console.error('Error processing and purchasing data:', error);
    }
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        const response = await fetch('http://localhost:3000/clear-data', {
          method: 'POST',
          headers: {
            'X-Nullifier-Hash': userNullifierHash
          }
        });
        if (!response.ok) throw new Error('Failed to clear data');
        const result = await response.json();
        if (result.success) {
          alert('All data has been cleared');
          setData([]);  // Clear the local state
        }
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Failed to clear data. Please try again.');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const truncateText = (text, maxLength) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Data Marketplace</h1>
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
              <th className="border border-gray-300 p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const isOwner = item.ownerNullifierHash === userNullifierHash;
              return (
                <tr key={item.id || index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="border border-gray-300 p-2">{truncateText(item.event_name || 'N/A', 20)}</td>
                  <td className="border border-gray-300 p-2">
                    {item.event_timestamp ? formatDate(item.event_timestamp) : 'N/A'}
                  </td>
                  <td className="border border-gray-300 p-2">{truncateText(item.domain || 'N/A', 20)}</td>
                  <td className="border border-gray-300 p-2">
                    {item.ownerNullifierHash ? `${item.ownerNullifierHash.slice(0, 10)}...` : 'N/A'}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {isOwner ? (
                      <span className="text-green-500 text-xs">You own this data</span>
                    ) : (
                      <button 
                        onClick={() => processAndPurchase(item.id)}
                        className="bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded"
                      >
                        Process and Purchase
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataMarketplace;