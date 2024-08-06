const getScorerBtn = () =>
  document.querySelector<HTMLButtonElement>("#scorer-btn");

const getScorerResultEl = () =>
  document.querySelector<HTMLButtonElement>("#scorer-result");

const btnDefaultText = "Score My CV For This Job";

const scoreImg = `data:image/png;base64,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`;

const injectBtn = () => {
  chrome.storage?.local.get(["resume"], (result) => {
    if (!result.resume) {
      return injectErrorMsg();
    }

    const jobContentEl = document.querySelector<HTMLElement>(
      ".jobs-box__html-content"
    );
    const targetElement = document.querySelector(".scaffold-layout");
    if (targetElement && jobContentEl) {
      document.querySelector("#scorer-wrapper")?.remove();

      const wrapperElement = document.createElement("div");
      wrapperElement.id = "scorer-wrapper";
      wrapperElement.innerHTML = `
    <div style="padding: 1rem; max-width: 115rem; margin: auto;">
        <div style="display: flex;justify-content: center;">
          <button
            id="scorer-btn"
            style=" color: #fff; background-color: #421c59; padding: 1rem; font-weight: 700; border-radius: 0.5rem; display: flex; align-items: center; gap: 0.5rem;"
          >
            <image src="${scoreImg}" width="20"/>
            ${btnDefaultText}
            

          </button>
        </div>
        <div
          id="scorer-result"
          style="padding: 10px; background-color: #421c59; color: #fff;"
          class="hidden"
        />
      </div>
    `;
      targetElement.insertBefore(wrapperElement, targetElement.firstChild);

      window.scrollTo(0, 0);
      const scorerBtn = getScorerBtn();
      scorerBtn?.addEventListener("click", async () => {
        scorerBtn.textContent = "Scoring...";
        scorerBtn.disabled = true;
        const jobContent = jobContentEl?.innerText;

        return fetch("https://geryit.com/api/openai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": "76YiyjzATgVvuk3",
          },
          body: JSON.stringify({
            jobDescription: jobContent,
            cvText: result.resume.text,
          }),
        })
          .then((result) => result.json())
          .then((result) => {
            if (!result) {
              return injectErrorMsg();
            }
            injectResult(result.data);
          });
      });

      scorerBtn?.addEventListener("mouseover", () => {
        scorerBtn.style.backgroundColor = "#341149";
      });

      scorerBtn?.addEventListener("mouseout", () => {
        scorerBtn.style.backgroundColor = "#421c59";
      });
    }
  });
};

const injectResult = (result: string) => {
  const scorerBtn = getScorerBtn();
  const scorerResultEl = getScorerResultEl();

  if (scorerResultEl) {
    scorerResultEl.innerHTML = result;
    scorerBtn?.classList.toggle("hidden");
    scorerResultEl?.classList.toggle("hidden");
  }
};

const injectErrorMsg = () => {
  const scorerWrapperEl = document.querySelector("#scorer-wrapper");

  if (scorerWrapperEl) {
    scorerWrapperEl.innerHTML = `
    <div style="background-color: #421c59; padding: 1rem; text-align: center;">
      Something went wrong. Did you uploaded your CV?
    </div>`;
  }
};

setTimeout(injectBtn, 1000);

// @ts-expect-error: error
window.navigation.addEventListener("navigate", (event) => {
  const newURL = new URL(event.destination.url);
  if (
    /^https?:\/\/(.+\.)?linkedin\.com\/jobs\/.*\?currentJobId=.*$/.test(
      newURL.href
    )
  ) {
    setTimeout(injectBtn, 1000);
  }
});
