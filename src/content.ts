// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === "getDivContent") {
    const content = document.querySelector<HTMLElement>(
      ".jobs-box__html-content"
    )?.innerText;
    if (content) {
      sendResponse({ content });
    }
  }
});
