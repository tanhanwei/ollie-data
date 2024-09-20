import React, { useState } from 'react';
import './App.css';
import WorldIDAuth from './components/WorldIDAuth';

function App() {
  const [isVerified, setIsVerified] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const handleSuccess = (proof) => {
    setIsVerified(true);
    setUserInfo(proof);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Privacy-Preserving Data Marketplace</h1>
        {!isVerified ? (
          <WorldIDAuth onSuccess={handleSuccess} />
        ) : (
          <div>
            <h2>Welcome, verified user!</h2>
            <p>Your nullifier hash: {userInfo.nullifier_hash}</p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;