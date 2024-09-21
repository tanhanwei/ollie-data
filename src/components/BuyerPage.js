import React, { useState, useEffect } from 'react';

const BuyerPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3000/retrieve-data', {
        headers: {
          'X-Nullifier-Hash': 'dummy-hash' // Replace with actual hash if needed
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
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error loading data. Please try again later.');
      setLoading(false);
    }
  };

  const processAndPurchase = async (dataId) => {
    // Placeholder for future ROFL/smart contract interaction
    console.log('Processing and purchasing data with ID:', dataId);
    // Here you would trigger the ROFL process and reveal the data
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