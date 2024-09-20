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
        const redirectUri = 'https://dev-rynbpb65bndtk1ka.us.auth0.com/login/callback';
        const authUrl = `https://id.worldcoin.org/authorize?client_id=${WORLD_ID_APP_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid`;
        chrome.tabs.create({ url: authUrl });
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