chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    chrome.tabs.sendMessage(tabId, {
      action: "urlChanged",
    });
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log({ activeInfo });
});

const scoreTexts = async (
  openAiKey: string,
  jobDescription: string,
  cvText: string
) => {
  try {
    // return "Scored 10";

    return fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`, // Replace 'YOUR_API_KEY' with your actual API key
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: `
Compare the following job description and CV text and evaluate their relevance and similarity.

Return Score between 1 to 10.
1 for no similarity and 10 for perfect similarity.

And two sentence summary of comparison with differences.
Summary should check language skills. 

Dont return in MD format but in HTML format.

Return the score and summary as html (not in MD format):
<div>Score(1-10): <span>{score}</span></div>
----------------
<div>Summary: {Summary}</div>

Job Description:
${jobDescription}

CV Text:
${cvText}

`,
          },
        ],
        max_tokens: 250,
        temperature: 0.7,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("data.choices[0].message.content");
        return data.choices[0].message.content;
      });
  } catch (error) {
    console.error("Error generating completions:", error);
  }
};

chrome.runtime.onConnect.addListener((port) => {
  console.assert(port.name === "scoreItPort");
  port.onMessage.addListener((msg) => {
    if (msg.action === "scoreIt") {
      chrome.storage?.local.get(["resume", "openAiKey"], (result) => {
        const resumeDataFromStorage = result.resume;
        if (resumeDataFromStorage) {
          if (!resumeDataFromStorage || !msg.jobContent) {
            return;
          }

          return scoreTexts(
            result.openAiKey,
            msg.jobContent,
            resumeDataFromStorage.text
          ).then((result) => {
            console.log({ result });
            port.postMessage({ action: "injectResult", result });
          });
        }
      });
    }
  });
});
