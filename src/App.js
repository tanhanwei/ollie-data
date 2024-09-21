import React from 'react';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import './App.css';
import UserPage from './components/UserPage';
import BuyerPage from './components/BuyerPage';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="bg-gray-800 p-4">
          <ul className="flex justify-center space-x-4">
            <li>
              <Link to="/user" className="text-white hover:text-gray-300">User Page</Link>
            </li>
            <li>
              <Link to="/buyer" className="text-white hover:text-gray-300">Buyer Page</Link>
            </li>
          </ul>
        </nav>

        <header className="App-header">
          <h1 className="text-3xl font-bold mb-4">Privacy-Preserving Data Marketplace</h1>
          <Routes>
            <Route path="/user" element={<UserPage />} />
            <Route path="/buyer" element={<BuyerPage />} />
            <Route path="/" element={<h2>Welcome! Please select a page.</h2>} />
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;