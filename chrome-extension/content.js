// content.js

let isCollectingData = true;  // Default to true, will be updated by background script

function generatePseudoId() {
  return 'user_' + Math.random().toString(36).substr(2, 9);
}

const pseudoId = generatePseudoId();

function anonymizeUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return 'unknown';
  }
}

function hashUserAgent(userAgent) {
  let hash = 0;
  for (let i = 0; i < userAgent.length; i++) {
    const char = userAgent.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

function collectData(eventName) {
  if (!isCollectingData) return;

  const data = {
    event_name: eventName,
    event_timestamp: Date.now(),
    pseudo_id: pseudoId,
    domain: anonymizeUrl(window.location.href),
    user_agent_hash: hashUserAgent(navigator.userAgent),
  };

  try {
    chrome.runtime.sendMessage({type: 'collected_data', data: data});
  } catch (error) {
    console.error('Error sending message to background script:', error);
  }
}

function addEventListeners() {
  document.addEventListener('click', () => collectData('click'));
  window.addEventListener('scroll', () => collectData('scroll'));
}

// Initialize
function initialize() {
  collectData('page_view');
  addEventListeners();
}

// Listen for messages from the background script
try {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateCollectData") {
      isCollectingData = request.collectData;
    }
  });

  // Request initial collect data setting
  chrome.runtime.sendMessage({type: 'get_collect_data_setting'}, (response) => {
    if (response && response.collectData !== undefined) {
      isCollectingData = response.collectData;
    }
    initialize();
  });
} catch (error) {
  console.error('Error setting up message listener:', error);
  initialize();  // Initialize anyway, with default settings
}