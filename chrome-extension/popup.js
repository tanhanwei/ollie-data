// popup.js

document.addEventListener('DOMContentLoaded', function() {
    const authStatus = document.getElementById('auth-status');
    const authButton = document.getElementById('auth-button');
    const dataControl = document.getElementById('data-control');
    const debugButton = document.getElementById('debug-button');
    const collectDataCheckbox = document.getElementById('collect-data');
    const testButton = document.getElementById('test-button');
  
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
    chrome.storage.local.get('collectData', function(result) {
      collectDataCheckbox.checked = result.collectData !== false;
    });
    collectDataCheckbox.addEventListener('change', function() {
      chrome.storage.local.set({collectData: this.checked});
    });
  
    // Debug button functionality
    debugButton.addEventListener('click', function() {
      chrome.storage.local.get({collectedData: []}, function(result) {
        console.log('Collected Data:', result.collectedData);
        alert(`Collected ${result.collectedData.length} data points. Check console for details.`);
      });
    });
  
    // Test functionality
    testButton.addEventListener('click', runTest);
  });
  
  function runTest() {
    chrome.tabs.create({url: chrome.runtime.getURL('test.html')}, function(tab) {
      setTimeout(function() {
        chrome.tabs.sendMessage(tab.id, {action: "performTestActions"});
      }, 1000);
    });
  }