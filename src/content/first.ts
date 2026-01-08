
function getElementCenter(el: Element) {
  const rect = el.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2 + window.scrollX,
    y: rect.top + rect.height / 2 + window.scrollY
  };
}


function clickToElement(selector: string){
    const button = document.querySelector(selector);
    if (!button) return;

    const coords = getElementCenter(button);

    chrome.runtime.sendMessage({
        type: 'CLICK',
        coords
    });
}



chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'TRIGGER_CLICK') {
    const button = document.querySelector(msg.selector);
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const coords = {
      x: rect.left + rect.width / 2 + window.scrollX,
      y: rect.top + rect.height / 2 + window.scrollY
    };

    chrome.runtime.sendMessage({ type: 'CLICK', coords });
  }
});