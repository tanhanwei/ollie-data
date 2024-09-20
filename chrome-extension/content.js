function collectData() {
    const data = {
      event_name: 'page_view',
      event_timestamp: Date.now(),
      event_id: 'ev_' + Math.random().toString(36).substr(2, 9),
      user_pseudo_id: 'user_' + Math.random().toString(36).substr(2, 9),
      session_id: 'session_' + Math.random().toString(36).substr(2, 9),
      platform: 'web',
      user_properties: {
        browser: navigator.userAgent,
        operating_system: navigator.platform,
        device_category: 'desktop'
      },
      event_params: {
        page_title: document.title,
        page_location: window.location.href
      }
    };
  
    // Send data to background script for processing and storage
    chrome.runtime.sendMessage({type: 'collected_data', data: data});
  }
  
  // Check if data collection is enabled before collecting
  chrome.storage.local.get(['collectData', 'authenticated'], function(result) {
    if (result.authenticated && result.collectData !== false) {
      collectData();
    }
  });
  
  // Listen for user interactions (simplified version)
  document.addEventListener('click', function() {
    chrome.storage.local.get(['collectData', 'authenticated'], function(result) {
      if (result.authenticated && result.collectData !== false) {
        const clickData = {
          event_name: 'click',
          event_timestamp: Date.now(),
          // ... other properties similar to page_view
        };
        chrome.runtime.sendMessage({type: 'collected_data', data: clickData});
      }
    });
  });