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
  if (request.action === "injectResult") {
    const targetElement = document.querySelector(
      ".jobs-search__job-details--wrapper"
    );
    if (targetElement) {
      document.querySelector("#resume-result")?.remove();
      const resultElement = document.createElement("div");
      resultElement.innerHTML = request.result;
      resultElement.id = "resume-result";
      resultElement.style.marginBottom = "20px";
      resultElement.style.padding = "10px";
      resultElement.style.borderBottom = "2px solid #fff";
      resultElement.style.backgroundColor = "#0067ff";
      targetElement.insertBefore(resultElement, targetElement.firstChild);
    }
  }

  if (request.action === "urlChanged") {
    document.querySelector("#resume-result")?.remove();
  }
});
