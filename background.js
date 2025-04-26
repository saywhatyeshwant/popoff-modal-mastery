
// Initialize default values when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Default common selectors for modals/overlays
  const defaultSelectors = [
    '.modal, .overlay, .cookie-banner, .cookie-consent, [class*="cookie"], [id*="cookie"]',
    '.popup, .popover, .lightbox, .newsletter-popup',
    '[class*="modal"], [id*="modal"], [class*="overlay"], [id*="overlay"]',
    '[class*="popup"], [id*="popup"], [aria-modal="true"]',
    '.signup-form, .signup-popup, .subscribe-form, .subscribe-popup'
  ];

  // Button text patterns to click automatically
  const defaultButtonPatterns = [
    'close',
    'dismiss',
    'no thanks',
    'i understand', 
    'accept',
    'got it',
    'continue',
    'agree',
    'skip',
    'later',
    'maybe later',
    'not now'
  ];

  // Setup default settings
  chrome.storage.sync.get(['selectors', 'buttonPatterns', 'disabledSites', 'isEnabled'], (result) => {
    if (!result.selectors) {
      chrome.storage.sync.set({ selectors: defaultSelectors });
    }
    
    if (!result.buttonPatterns) {
      chrome.storage.sync.set({ buttonPatterns: defaultButtonPatterns });
    }
    
    if (!result.disabledSites) {
      chrome.storage.sync.set({ disabledSites: [] });
    }
    
    if (result.isEnabled === undefined) {
      chrome.storage.sync.set({ isEnabled: true });
    }
  });
});

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getTabInfo") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const url = new URL(tabs[0].url);
        const hostname = url.hostname;
        sendResponse({ hostname: hostname });
      } else {
        sendResponse({ hostname: null });
      }
    });
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === "refreshContentScript") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content_script.js']
        });
      }
    });
  }
  
  if (message.action === "trackEvent") {
    // We'll handle analytics here
    console.log("Analytics event:", message.event, message.properties);
    // PostHog tracking would be implemented here
  }
});
