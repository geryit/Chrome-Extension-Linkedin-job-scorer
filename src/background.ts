chrome.tabs.onUpdated.addListener((tabId, changeInfo, _) => {
  if (changeInfo.url) {
    chrome.tabs.sendMessage(tabId, {
      action: "urlChanged",
    });
  }
});
