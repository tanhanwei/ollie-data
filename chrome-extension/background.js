// background.js

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'auth_code') {
      // Exchange the code for tokens
      const tokenUrl = 'https://dev-rynbpb65bndtk1ka.us.auth0.com/oauth/token';
      const redirectUrl = chrome.identity.getRedirectURL();
  
      fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: 'mInTjrehlcPtX1VooFCjNKHAIltAhuQo',
          client_secret: '4xJmJwzH2rtCtvkYpvlR_hzhn4KqQPBZED3vwsQx-z7G3aeR9rn1jEoQugZHjuRK',
          code: request.code,
          redirect_uri: redirectUrl
        })
      })
      .then(response => response.json())
      .then(data => {
        // Store the tokens securely
        chrome.storage.local.set({auth_tokens: data, authenticated: true}, function() {
          sendResponse({success: true});
        });
      })
      .catch(error => {
        console.error('Error:', error);
        sendResponse({success: false, error: error.message});
      });
  
      return true; // Indicates that the response is sent asynchronously
    }
    
    if (request.type === 'collected_data') {
      // Handle data received from content script
      chrome.storage.local.get({collectedData: []}, function(result) {
        const updatedData = result.collectedData.concat(request.data);
        chrome.storage.local.set({collectedData: updatedData}, function() {
          console.log('New data stored:', request.data);
          console.log('Total data points:', updatedData.length);
        });
      });
    }
  });
  
  // Optional: Periodic data syncing
  function syncData() {
    chrome.storage.local.get({collectedData: [], authenticated: false}, function(result) {
      if (result.authenticated && result.collectedData.length > 0) {
        // TODO: Here you would send the data to your backend
        console.log('Syncing data:', result.collectedData);
        
        // After successful sync, you might want to clear the local storage
        // Uncomment the following line when you implement actual syncing
        // chrome.storage.local.set({collectedData: []});
      }
    });
  }
  
  // Sync data every 5 minutes (300000 milliseconds)
  setInterval(syncData, 300000);
  
  // Listen for installation or update of the extension
  chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === "install" || details.reason === "update") {
      // Initialize storage with default values
      chrome.storage.local.set({
        authenticated: false,
        collectData: true,
        collectedData: []
      });
    }
  });
  
  // Optional: Handle extension icon click
  chrome.action.onClicked.addListener(function(tab) {
    // This will open the popup if it's not already open
    chrome.action.openPopup();
  });