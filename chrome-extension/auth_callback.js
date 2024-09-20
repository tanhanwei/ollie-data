const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
  // Send the code to Auth0 to get tokens
  fetch('https://dev-rynbpb65bndtk1ka.us.auth0.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: AUTH0_CLIENT_ID,
      client_secret: 'YOUR_AUTH0_CLIENT_SECRET',
      code: code,
      redirect_uri: chrome.runtime.getURL('auth_callback.html')
    })
  })
  .then(response => response.json())
  .then(data => {
    // Send the tokens to the background script
    chrome.runtime.sendMessage({type: 'auth_tokens', tokens: data}, function(response) {
      if (response && response.success) {
        window.close();
      }
    });
  })
  .catch(error => {
    console.error('Error:', error);
  });
} else {
  console.error('No authorization code found in the URL');
}