let nullifierHash = null;

// Function to decode JWT without verification
function decodeJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'auth_code') {
      console.log('Received auth_code:', request.code);
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
        console.log('Received Auth0 tokens:', JSON.stringify(data, null, 2));
        const decodedToken = decodeJwt(data.id_token);
        nullifierHash = decodedToken.sub.split('|')[2];
        chrome.storage.local.set({
          nullifierHash: nullifierHash,
          authenticated: true
        }, function() {
          console.log('Nullifier hash saved and authenticated set to true');
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

    if (request.type === 'get_collect_data_setting') {
      chrome.storage.local.get({collectData: true}, (result) => {
        sendResponse({collectData: result.collectData});
      });
      return true;  // Indicates that the response is sent asynchronously
    }
});
  
function syncData() {
  chrome.storage.local.get({collectedData: [], authenticated: false, nullifierHash: null}, function(result) {
    console.log('Sync check - Auth:', result.authenticated, 'Data points:', result.collectedData.length, 'Nullifier hash exists:', !!result.nullifierHash);
    if (result.authenticated && result.collectedData.length > 0 && result.nullifierHash) {
      console.log('Nullifier hash being sent:', result.nullifierHash);
      console.log('Data being sent to server:', result.collectedData);

      const headers = {
        'Content-Type': 'application/json',
        'X-Nullifier-Hash': result.nullifierHash
      };
      console.log('Headers being sent:', headers);

      fetch('http://localhost:3000/store-data', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({data: result.collectedData})
      })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
          });
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          console.log('Data stored on IPFS with CID:', data.cid);
          // Clear the local storage after successful sync
          chrome.storage.local.set({collectedData: []});
        } else {
          console.error('Failed to store data:', data.error);
        }
      })
      .catch(error => {
        console.error('Error syncing data:', error);
        // If there's an authentication error, clear the stored nullifier hash and set authenticated to false
        if (error.message.includes('401')) {
          chrome.storage.local.set({nullifierHash: null, authenticated: false}, function() {
            console.log('Cleared authentication due to error');
          });
        }
      });
    } else {
      console.log('Not syncing data. Authenticated:', result.authenticated, 'Data points:', result.collectedData.length, 'Nullifier hash exists:', !!result.nullifierHash);
    }
  });
}

// Sync data every 30 seconds (30000 milliseconds)
setInterval(syncData, 30000);

// Listen for installation or update of the extension
chrome.runtime.onInstalled.addListener(function(details) {
  chrome.storage.local.set({
    authenticated: false,
    collectData: true,
    collectedData: []
  });
});

// Optional: Handle extension icon click
chrome.action.onClicked.addListener(function(tab) {
  // This will open the popup if it's not already open
  chrome.action.openPopup();
});

// Handle setting changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'local' && 'collectData' in changes) {
    // Notify all tabs about the setting change
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach((tab) => {
        try {
          chrome.tabs.sendMessage(tab.id, {
            action: "updateCollectData",
            collectData: changes.collectData.newValue
          });
        } catch (error) {
          console.error('Error sending message to tab:', tab.id, error);
        }
      });
    });
  }
});