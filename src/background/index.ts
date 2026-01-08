function dispatchRealClick(tabId: number, x: number, y: number) {
  const send = (method: string, params: any) =>
    chrome.debugger.sendCommand({ tabId }, method, params);

  (async () => {
    // движение мыши
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x,
      y,
      button: 'none'
    });

    // нажатие
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x,
      y,
      button: 'left',
      clickCount: 1
    });

    // отпускание
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x,
      y,
      button: 'left',
      clickCount: 1
    });

    chrome.debugger.detach({ tabId });
  })();
}


chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== 'CLICK' || !sender.tab?.id) return;

  const tabId = sender.tab.id;

  chrome.debugger.attach({ tabId }, '1.3', () => {
    dispatchRealClick(tabId, msg.coords.x, msg.coords.y);
  });
});
