// popup.js

document.addEventListener('DOMContentLoaded', function() {
    const authStatus = document.getElementById('auth-status');
    const authButton = document.getElementById('auth-button');
    const dataControl = document.getElementById('data-control');
    const debugButton = document.getElementById('debug-button');
  
    function updateAuthStatus(isAuthenticated) {
      chrome.storage.local.set({authenticated: isAuthenticated}, function() {
        authStatus.textContent = isAuthenticated ? 'Authenticated' : 'Not authenticated';
        authButton.style.display = isAuthenticated ? 'none' : 'block';
        dataControl.style.display = isAuthenticated ? 'block' : 'none';
        debugButton.style.display = isAuthenticated ? 'block' : 'none';
      });
    }
  
    chrome.storage.local.get(['authenticated'], function(result) {
      updateAuthStatus(result.authenticated);
    });
  
    authButton.addEventListener('click', function() {
      const redirectUrl = chrome.identity.getRedirectURL();
      const clientId = AUTH0_CLIENT_ID;
      const authUrl = `https://dev-rynbpb65bndtk1ka.us.auth0.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=openid&connection=World-ID`;
  
      chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      }, function(redirectUrl) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        } else {
          const url = new URL(redirectUrl);
          const code = url.searchParams.get('code');
          if (code) {
            // Send the code to your background script to exchange for tokens
            chrome.runtime.sendMessage({type: 'auth_code', code: code}, function(response) {
              if (response && response.success) {
                updateAuthStatus(true);
              }
            });
          }
        }
      });
    });
  
    // Handle data collection toggle
    const collectDataCheckbox = document.getElementById('collect-data');
    collectDataCheckbox.addEventListener('change', function() {
      chrome.storage.local.set({collectData: this.checked});
    });
  
    // Debug button functionality
    debugButton.addEventListener('click', function() {
      chrome.storage.local.get({collectedData: []}, function(result) {
        console.log('Collected Data:', result.collectedData);
        alert('Collected data logged to console. Open developer tools to view.');
      });
    });
  });