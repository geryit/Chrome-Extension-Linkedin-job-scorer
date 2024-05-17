const port = chrome.runtime.connect({ name: "scoreItPort" });

const getScorerBtn = () =>
  document.querySelector<HTMLButtonElement>("#scorer-btn");

const getScorerResultEl = () =>
  document.querySelector<HTMLButtonElement>("#scorer-result");

const btnDefaultText = "Score My CV For This Job";

const injectBtn = () => {
  const targetElement = document.querySelector(".scaffold-layout");
  if (targetElement) {
    const wrapperElement = document.createElement("div");
    wrapperElement.innerHTML = `
    <div id="scorer-wrapper" style="padding: 1rem; max-width: 115rem; margin: auto;">
        <div style="display: flex;justify-content: center;">
          <button
            id="scorer-btn"
            style=" color: #fff; background-color: #2661ba; padding: 1rem; font-weight: 700; "
          >
            ${btnDefaultText}
          </button>
        </div>
        <div
          id="scorer-result"
          style="padding: 10px; background-color: rgb(28, 73, 116); color: #fff;"
          class="hidden"
        />
      </div>
    `;
    targetElement.insertBefore(wrapperElement, targetElement.firstChild);
    const scorerBtn = getScorerBtn();
    scorerBtn?.addEventListener("click", () => {
      scorerBtn.textContent = "Scoring...";
      scorerBtn.disabled = true;
      const jobContent = document.querySelector<HTMLElement>(
        ".jobs-box__html-content"
      )?.innerText;

      if (jobContent) {
        port.postMessage({ action: "scoreIt", jobContent });
      }
    });
  }
};

setTimeout(() => {
  injectBtn();
}, 3000);

const injectResult = (result: string) => {
  const scorerBtn = getScorerBtn();
  const scorerResultEl = getScorerResultEl();

  if (scorerResultEl) {
    scorerResultEl.innerHTML = result;
    scorerBtn?.classList.toggle("hidden");
    scorerResultEl?.classList.toggle("hidden");
  }
};

port.onMessage.addListener(function (msg) {
  if (msg.action === "injectResult") {
    injectResult(msg.result);
  }
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "urlChanged") {
    console.log("URL Changed")
    const scorerBtn = getScorerBtn();
    const scorerResultEl = getScorerResultEl();

    if (scorerBtn) {
      scorerBtn.textContent = btnDefaultText;
      scorerBtn?.classList.toggle("hidden");
      scorerBtn.disabled = false;
    } 
    scorerResultEl?.classList.toggle("hidden");
  }
});
