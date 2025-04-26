
// Track pageview in PostHog
function trackPageView() {
  chrome.runtime.sendMessage({
    action: "trackEvent",
    event: "Popup Opened",
    properties: {
      browser: navigator.userAgent
    }
  });
}

// Get current site information
function getCurrentSite() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getTabInfo" }, (response) => {
      if (response && response.hostname) {
        document.getElementById('current-site').textContent = response.hostname;
        resolve(response.hostname);
      } else {
        document.getElementById('current-site').textContent = "Not available";
        resolve(null);
      }
    });
  });
}

// Update the site toggle based on whether the current site is in the disabled list
function updateSiteToggle(hostname, disabledSites) {
  const siteToggle = document.getElementById('site-toggle');
  const siteStatusText = document.getElementById('site-status-text');
  
  if (!hostname) {
    siteToggle.disabled = true;
    siteStatusText.textContent = "Not available";
    return;
  }
  
  const isSiteEnabled = !disabledSites.includes(hostname);
  siteToggle.checked = isSiteEnabled;
  siteStatusText.textContent = isSiteEnabled ? "Enabled for this site" : "Disabled for this site";
}

// Update the main toggle based on the global enabled state
function updateMainToggle(isEnabled) {
  const mainToggle = document.getElementById('main-toggle');
  const statusText = document.getElementById('status-text');
  
  mainToggle.checked = isEnabled;
  statusText.textContent = isEnabled ? "Enabled" : "Disabled";
}

// Render the list of CSS selectors
function renderSelectors(selectors) {
  const selectorList = document.getElementById('selector-list');
  selectorList.innerHTML = '';
  
  selectors.forEach((selector, index) => {
    const selectorItem = document.createElement('div');
    selectorItem.className = 'selector-item';
    
    selectorItem.innerHTML = `
      <span class="selector-text">${selector}</span>
      <div>
        <button class="edit-btn" data-index="${index}">Edit</button>
        <button class="delete-btn" data-index="${index}">Delete</button>
      </div>
    `;
    
    selectorList.appendChild(selectorItem);
  });
  
  // Add event listeners for edit and delete buttons
  document.querySelectorAll('.selector-item .edit-btn').forEach(btn => {
    btn.addEventListener('click', editSelector);
  });
  
  document.querySelectorAll('.selector-item .delete-btn').forEach(btn => {
    btn.addEventListener('click', deleteSelector);
  });
}

// Render the list of button text patterns
function renderButtonPatterns(patterns) {
  const buttonList = document.getElementById('button-list');
  buttonList.innerHTML = '';
  
  patterns.forEach((pattern, index) => {
    const buttonItem = document.createElement('div');
    buttonItem.className = 'button-item';
    
    buttonItem.innerHTML = `
      <span class="button-text">${pattern}</span>
      <div>
        <button class="edit-btn" data-index="${index}">Edit</button>
        <button class="delete-btn" data-index="${index}">Delete</button>
      </div>
    `;
    
    buttonList.appendChild(buttonItem);
  });
  
  // Add event listeners for edit and delete buttons
  document.querySelectorAll('.button-item .edit-btn').forEach(btn => {
    btn.addEventListener('click', editButtonPattern);
  });
  
  document.querySelectorAll('.button-item .delete-btn').forEach(btn => {
    btn.addEventListener('click', deleteButtonPattern);
  });
}

// Function to add a new selector
function addSelector() {
  const input = document.getElementById('new-selector');
  const selector = input.value.trim();
  
  if (!selector) return;
  
  chrome.storage.sync.get(['selectors'], (data) => {
    const selectors = data.selectors || [];
    
    // Don't add duplicate selectors
    if (!selectors.includes(selector)) {
      selectors.push(selector);
      chrome.storage.sync.set({ selectors }, () => {
        renderSelectors(selectors);
        input.value = '';
        
        // Track the event
        chrome.runtime.sendMessage({
          action: "trackEvent",
          event: "Selector Added",
          properties: { selector }
        });
        
        // Refresh content script on the active tab
        chrome.runtime.sendMessage({ action: "refreshContentScript" });
      });
    } else {
      input.value = '';
      alert('This selector already exists!');
    }
  });
}

// Function to edit a selector
function editSelector(e) {
  const index = parseInt(e.target.dataset.index);
  
  chrome.storage.sync.get(['selectors'], (data) => {
    const selectors = data.selectors || [];
    const currentSelector = selectors[index];
    
    const newSelector = prompt('Edit selector:', currentSelector);
    
    if (newSelector !== null && newSelector.trim() !== '') {
      selectors[index] = newSelector.trim();
      
      chrome.storage.sync.set({ selectors }, () => {
        renderSelectors(selectors);
        
        // Track the event
        chrome.runtime.sendMessage({
          action: "trackEvent",
          event: "Selector Edited",
          properties: { 
            oldSelector: currentSelector,
            newSelector: newSelector.trim()
          }
        });
        
        // Refresh content script on the active tab
        chrome.runtime.sendMessage({ action: "refreshContentScript" });
      });
    }
  });
}

// Function to delete a selector
function deleteSelector(e) {
  const index = parseInt(e.target.dataset.index);
  
  if (confirm('Are you sure you want to remove this selector?')) {
    chrome.storage.sync.get(['selectors'], (data) => {
      const selectors = data.selectors || [];
      const removedSelector = selectors[index];
      
      selectors.splice(index, 1);
      
      chrome.storage.sync.set({ selectors }, () => {
        renderSelectors(selectors);
        
        // Track the event
        chrome.runtime.sendMessage({
          action: "trackEvent",
          event: "Selector Deleted",
          properties: { selector: removedSelector }
        });
        
        // Refresh content script on the active tab
        chrome.runtime.sendMessage({ action: "refreshContentScript" });
      });
    });
  }
}

// Function to add a new button pattern
function addButtonPattern() {
  const input = document.getElementById('new-button-pattern');
  const pattern = input.value.trim();
  
  if (!pattern) return;
  
  chrome.storage.sync.get(['buttonPatterns'], (data) => {
    const patterns = data.buttonPatterns || [];
    
    // Don't add duplicate patterns
    if (!patterns.includes(pattern)) {
      patterns.push(pattern);
      chrome.storage.sync.set({ buttonPatterns }, () => {
        renderButtonPatterns(patterns);
        input.value = '';
        
        // Track the event
        chrome.runtime.sendMessage({
          action: "trackEvent",
          event: "Button Pattern Added",
          properties: { pattern }
        });
        
        // Refresh content script on the active tab
        chrome.runtime.sendMessage({ action: "refreshContentScript" });
      });
    } else {
      input.value = '';
      alert('This button pattern already exists!');
    }
  });
}

// Function to edit a button pattern
function editButtonPattern(e) {
  const index = parseInt(e.target.dataset.index);
  
  chrome.storage.sync.get(['buttonPatterns'], (data) => {
    const patterns = data.buttonPatterns || [];
    const currentPattern = patterns[index];
    
    const newPattern = prompt('Edit button pattern:', currentPattern);
    
    if (newPattern !== null && newPattern.trim() !== '') {
      patterns[index] = newPattern.trim();
      
      chrome.storage.sync.set({ buttonPatterns }, () => {
        renderButtonPatterns(patterns);
        
        // Track the event
        chrome.runtime.sendMessage({
          action: "trackEvent",
          event: "Button Pattern Edited",
          properties: { 
            oldPattern: currentPattern,
            newPattern: newPattern.trim()
          }
        });
        
        // Refresh content script on the active tab
        chrome.runtime.sendMessage({ action: "refreshContentScript" });
      });
    }
  });
}

// Function to delete a button pattern
function deleteButtonPattern(e) {
  const index = parseInt(e.target.dataset.index);
  
  if (confirm('Are you sure you want to remove this button pattern?')) {
    chrome.storage.sync.get(['buttonPatterns'], (data) => {
      const patterns = data.buttonPatterns || [];
      const removedPattern = patterns[index];
      
      patterns.splice(index, 1);
      
      chrome.storage.sync.set({ buttonPatterns }, () => {
        renderButtonPatterns(patterns);
        
        // Track the event
        chrome.runtime.sendMessage({
          action: "trackEvent",
          event: "Button Pattern Deleted",
          properties: { pattern: removedPattern }
        });
        
        // Refresh content script on the active tab
        chrome.runtime.sendMessage({ action: "refreshContentScript" });
      });
    });
  }
}

// Toggle extension functionality globally
function toggleExtension() {
  const isEnabled = document.getElementById('main-toggle').checked;
  
  chrome.storage.sync.set({ isEnabled }, () => {
    updateMainToggle(isEnabled);
    
    // Track the event
    chrome.runtime.sendMessage({
      action: "trackEvent",
      event: isEnabled ? "Extension Enabled" : "Extension Disabled",
      properties: {}
    });
    
    // Refresh content script on the active tab
    chrome.runtime.sendMessage({ action: "refreshContentScript" });
  });
}

// Toggle extension for the current site
function toggleSite(hostname) {
  if (!hostname) return;
  
  chrome.storage.sync.get(['disabledSites'], (data) => {
    let disabledSites = data.disabledSites || [];
    const isSiteEnabled = !disabledSites.includes(hostname);
    
    if (isSiteEnabled) {
      // Disable the site
      disabledSites.push(hostname);
    } else {
      // Enable the site
      disabledSites = disabledSites.filter(site => site !== hostname);
    }
    
    chrome.storage.sync.set({ disabledSites }, () => {
      updateSiteToggle(hostname, disabledSites);
      
      // Track the event
      chrome.runtime.sendMessage({
        action: "trackEvent",
        event: isSiteEnabled ? "Site Disabled" : "Site Enabled",
        properties: { hostname }
      });
      
      // Refresh content script on the active tab
      chrome.runtime.sendMessage({ action: "refreshContentScript" });
    });
  });
}

// Handle tab switching
function switchTab(e) {
  const tabId = e.target.dataset.tab;
  
  // Update active tab button
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  e.target.classList.add('active');
  
  // Show the selected tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabId}-tab`).classList.add('active');
  
  // Track the event
  chrome.runtime.sendMessage({
    action: "trackEvent",
    event: "Tab Switched",
    properties: { tab: tabId }
  });
}

// Refresh the content script on the current page
function refreshPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "reprocessPage" }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script might not be loaded yet
          chrome.runtime.sendMessage({ action: "refreshContentScript" });
        }
      });
      
      // Track the event
      chrome.runtime.sendMessage({
        action: "trackEvent",
        event: "Page Reprocessed",
        properties: { url: tabs[0].url }
      });
    }
  });
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', async () => {
  // Track the popup being opened
  trackPageView();
  
  // Get the current site
  const hostname = await getCurrentSite();
  
  // Load user settings
  chrome.storage.sync.get(['isEnabled', 'disabledSites', 'selectors', 'buttonPatterns'], (data) => {
    // Set default values if not present
    const isEnabled = data.isEnabled !== undefined ? data.isEnabled : true;
    const disabledSites = data.disabledSites || [];
    const selectors = data.selectors || [];
    const buttonPatterns = data.buttonPatterns || [];
    
    // Update UI
    updateMainToggle(isEnabled);
    updateSiteToggle(hostname, disabledSites);
    renderSelectors(selectors);
    renderButtonPatterns(buttonPatterns);
  });
  
  // Event listeners
  document.getElementById('main-toggle').addEventListener('change', toggleExtension);
  document.getElementById('site-toggle').addEventListener('change', () => toggleSite(hostname));
  document.getElementById('add-selector-btn').addEventListener('click', addSelector);
  document.getElementById('add-button-btn').addEventListener('click', addButtonPattern);
  document.getElementById('refresh-btn').addEventListener('click', refreshPage);
  
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', switchTab);
  });
  
  // Add keyboard shortcut for adding selectors and button patterns
  document.getElementById('new-selector').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addSelector();
  });
  
  document.getElementById('new-button-pattern').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addButtonPattern();
  });
  
  // Load statistics - this would normally come from storage or analytics
  document.getElementById('elements-hidden').textContent = '0';
  document.getElementById('buttons-clicked').textContent = '0';
});
