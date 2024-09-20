// Extract the authorization code from the URL
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
  // Send the code to the background script
  chrome.runtime.sendMessage({type: 'auth_code', code: code}, function(response) {
    if (response && response.success) {
      window.close();
    }
  });
} else {
  console.error('No authorization code found in the URL');
}