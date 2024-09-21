import React, { useState, useEffect } from 'react';

const DataMarketplace = ({ userNullifierHash }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3000/retrieve-data', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result.data);
      setLoading(false);
    } catch (err) {
      setError('Error loading data. Please try again later.');
      setLoading(false);
    }
  };

  const processAndPurchase = async (dataId) => {
    try {
      const response = await fetch(`http://localhost:3000/process-and-purchase/${dataId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userNullifierHash })
      });
      if (!response.ok) throw new Error('Failed to process and purchase data');
      const result = await response.json();
      // Update the data state with the processed data
      setData(prevData => prevData.map(item => 
        item.id === dataId ? { ...item, processed: result.processedData } : item
      ));
    } catch (error) {
      console.error('Error processing and purchasing data:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Data Marketplace</h1>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Event</th>
            <th className="border border-gray-300 p-2">Timestamp</th>
            <th className="border border-gray-300 p-2">Domain</th>
            <th className="border border-gray-300 p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const isOwner = item.ownerNullifierHash === userNullifierHash;
            return (
              <tr key={item.id}>
                <td className="border border-gray-300 p-2">{item.event_name}</td>
                <td className="border border-gray-300 p-2">
                  {isOwner ? new Date(item.event_timestamp).toLocaleString() : 'Hidden'}
                </td>
                <td className="border border-gray-300 p-2">
                  {isOwner ? item.domain : 'Hidden'}
                </td>
                <td className="border border-gray-300 p-2">
                  {isOwner ? (
                    <span className="text-green-500">You own this data</span>
                  ) : item.processed ? (
                    <pre className="text-sm">{JSON.stringify(item.processed, null, 2)}</pre>
                  ) : (
                    <button 
                      onClick={() => processAndPurchase(item.id)}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
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
  );
};

export default DataMarketplace;