// PostHog analytics setup
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

// Replace with your actual PostHog API key
posthog.init('phc_YOUR_API_KEY', {api_host: 'https://app.posthog.com'});

// Debounce function to limit processing frequency
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Store found and hidden elements to avoid processing them multiple times
const processedElements = new Set();

// Main function to hide elements and click close buttons
function processPage() {
  // Check if this site is disabled
  chrome.storage.sync.get(['isEnabled', 'disabledSites', 'selectors', 'buttonPatterns'], (data) => {
    if (!data.isEnabled) return;
    
    // Get the current hostname
    const hostname = window.location.hostname;
    
    // Check if this site is disabled
    if (data.disabledSites && data.disabledSites.includes(hostname)) {
      return;
    }
    
    // No selectors defined, exit
    if (!data.selectors || !data.selectors.length) return;
    
    let elementsHidden = 0;
    
    // Process each selector
    data.selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          // Skip already processed elements
          if (processedElements.has(element)) return;
          
          // Hide the element
          if (element.style.display !== 'none') {
            element.dataset.popoffHidden = 'true';
            element.dataset.popoffPreviousDisplay = element.style.display || '';
            element.style.display = 'none';
            processedElements.add(element);
            elementsHidden++;
            
            // Track the hidden element
            posthog.capture('Modal Blocked', {
              selector: selector,
              url: window.location.href,
              hostname: hostname
            });
          }
        });
      } catch (e) {
        console.error('PopOff: Error processing selector', selector, e);
      }
    });
    
    // Attempt to click "close" buttons for elements that aren't directly matched by our selectors
    if (data.buttonPatterns && data.buttonPatterns.length) {
      // Create a combined selector for buttons, links, and other clickable elements
      const clickableElements = document.querySelectorAll('button, a, [role="button"], [aria-label*="close"], [aria-label*="dismiss"]');
      
      clickableElements.forEach(element => {
        // Skip already processed elements
        if (processedElements.has(element)) return;
        
        // Get the text content and possible button attributes
        const text = element.textContent?.trim().toLowerCase() || '';
        const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();
        const title = (element.getAttribute('title') || '').toLowerCase();
        
        // Check if this button matches any of our patterns
        const isCloseButton = data.buttonPatterns.some(pattern => {
          pattern = pattern.toLowerCase();
          return text.includes(pattern) || 
                 ariaLabel.includes(pattern) || 
                 title.includes(pattern);
        });
        
        if (isCloseButton) {
          // Click the button
          try {
            element.click();
            processedElements.add(element);
            
            // Track the clicked button
            posthog.capture('Button Clicked', {
              text: text || ariaLabel || title,
              url: window.location.href,
              hostname: hostname
            });
          } catch (e) {
            console.error('PopOff: Error clicking element', element, e);
          }
        }
      });
    }
    
    // Log results
    if (elementsHidden > 0) {
      console.log(`PopOff: Hidden ${elementsHidden} elements on ${hostname}`);
    }
  });
}

// Debounced version of our main function
const debouncedProcessPage = debounce(processPage, 300);

// Process the page immediately on script load
processPage();

// Set up a MutationObserver to detect new elements
const observer = new MutationObserver(mutations => {
  let shouldProcess = false;
  
  for (const mutation of mutations) {
    // Only process if nodes were added
    if (mutation.addedNodes.length > 0) {
      shouldProcess = true;
      break;
    }
  }
  
  if (shouldProcess) {
    debouncedProcessPage();
  }
});

// Start observing the document body for DOM changes
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "reprocessPage") {
    // Clear the set of processed elements to reprocess everything
    processedElements.clear();
    processPage();
    sendResponse({ status: "reprocessing" });
  }
  return true;
});
