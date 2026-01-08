// popup.ts
document.getElementById('btn')?.addEventListener('click', () => {
    
  alert("CLICKED")
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: 'TRIGGER_CLICK', selector: ".recaptcha-checkbox-border" });
  });
});
