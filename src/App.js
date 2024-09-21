import React, { useState, useEffect } from 'react';
import './App.css';
import WorldIDAuth from './components/WorldIDAuth';
import DataMarketplace from './components/DataMarketplace';

function App() {
  const [isVerified, setIsVerified] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsVerified(true);
      // You might want to decode the token to get the user info
      // For now, we'll just set a placeholder
      setUserInfo({ nullifier_hash: 'placeholder' });
    }
  }, []);

  const handleSuccess = (proof) => {
    setIsVerified(true);
    setUserInfo(proof);
    localStorage.setItem('token', proof.token); // Assuming the proof contains a token
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Privacy-Preserving Data Marketplace</h1>
        {!isVerified ? (
          <WorldIDAuth onSuccess={handleSuccess} />
        ) : (
          <DataMarketplace userNullifierHash={userInfo.nullifier_hash} />
        )}
      </header>
    </div>
  );
}

export default App;