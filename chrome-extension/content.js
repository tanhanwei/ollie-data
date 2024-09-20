// content.js

function collectData(eventName) {
    const data = {
      event_name: eventName,
      event_timestamp: Date.now(),
      url: window.location.href,
      title: document.title,
      user_agent: navigator.userAgent,
    };
  
    chrome.runtime.sendMessage({type: 'collected_data', data: data});
  }
  
  // Collect data on page load
  chrome.storage.local.get('collectData', function(result) {
    if (result.collectData !== false) {
      collectData('page_view');
    }
  });
  
  // Listen for user interactions
  document.addEventListener('click', function() {
    chrome.storage.local.get('collectData', function(result) {
      if (result.collectData !== false) {
        collectData('click');
      }
    });
  });
  
  // Add more event listeners as needed, for example:
  window.addEventListener('scroll', function() {
    chrome.storage.local.get('collectData', function(result) {
      if (result.collectData !== false) {
        collectData('scroll');
      }
    });
  });