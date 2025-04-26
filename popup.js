
// Basic initialization for popup
document.addEventListener('DOMContentLoaded', function() {
  console.log("PopOff popup opened");
  
  // Initialize toggle switch
  const mainToggle = document.getElementById('main-toggle');
  if (mainToggle) {
    chrome.storage.sync.get(['isEnabled'], function(data) {
      mainToggle.checked = data.isEnabled !== false;
    });
    
    mainToggle.addEventListener('change', function() {
      chrome.storage.sync.set({ isEnabled: mainToggle.checked });
    });
  }
});
