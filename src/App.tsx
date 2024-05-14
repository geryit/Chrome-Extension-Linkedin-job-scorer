import { useEffect, useState } from "react";
import OpenAI from "openai";
import { pdfjs } from "react-pdf";
import testJobDescription from "./testJobDescription";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

const isChromeExtension =
  typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;

function App() {
  const [openAiKey, setOpenAiKey] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<{
    text: string;
    fileName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [content, setContent] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) {
      return;
    }

    setResumeFile(files[0]);
  };

  const newCv = () => {
    setResumeFile(null);
    setResumeData(null);
    setContent(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resumeData) {
      setError("No text found in the resume. Can you try uploading it again?");
      return;
    }

    setContent(null);
    setComparing(true);

    if (!isChromeExtension) {
      scoreTexts(testJobDescription, resumeData.text).then((res) => {
        setContent(res || "");
        setComparing(false);
      });
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0].id;
      chrome.tabs.sendMessage(
        activeTab as number,
        { action: "getDivContent" },
        (response) => {
          if (!response || !response.content) {
            setError(
              "No job description found. Are you sure you are on a job post in Linkedin?"
            );
            return;
          }
          scoreTexts(response.content, resumeData.text).then((res) => {
            setContent(res || "");

            chrome.tabs.sendMessage(activeTab as number, {
              action: "injectResult",
              result: res,
            });
            setComparing(false);
          });
        }
      );
    });
  };

  const scoreTexts = async (jobDescription: string, cvText: string) => {
    try {
      return "Score(1-10): <span>8</span><br>Summary: The CV is a good match for the job description.";

      const openai = new OpenAI({
        apiKey: openAiKey,
        dangerouslyAllowBrowser: true,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: `
            Compare the following job description and CV text and evaluate their relevance and similarity.

            Return Score between 1 to 10.
            1 for no similarity and 10 for perfect similarity.

            And a one sentence summary of comparison with differences.

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
        max_tokens: 500,
        // temperature: 0.7,
      });

      const resp = response.choices[0].message.content?.trim();

      return resp;
    } catch (error) {
      setError("Error generating completions " + error);
      console.error("Error generating completions:", error);
      return null;
    }
  };

  useEffect(() => {
    if (isChromeExtension) {
      chrome.storage?.local.get(["resume"], (result) => {
        const resumeDataFromStorage = result.resume;
        if (resumeDataFromStorage) {
          setResumeData(resumeDataFromStorage);
        }
      });
      chrome.storage?.local.get(["openAiKey"], (result) => {
        const openAIApiKeyFromStorage = result.openAiKey;
        if (openAIApiKeyFromStorage) {
          setOpenAiKey(openAIApiKeyFromStorage);
        }
      });
    } else {
      const resumeDataFromStorage = localStorage.getItem("resume");
      if (resumeDataFromStorage) {
        setResumeData(JSON.parse(resumeDataFromStorage));
      }

      const openAIApiKeyFromStorage = localStorage.getItem("openAiKey");
      if (openAIApiKeyFromStorage) {
        setOpenAiKey(openAIApiKeyFromStorage);
      }
    }
  }, []);

  useEffect(() => {
    if (!resumeFile) {
      return;
    }

    if (resumeFile.type !== "application/pdf") {
      setError("File should be a pdf");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(resumeFile); // Read the file as data URL

    reader.onload = async () => {
      const url = reader.result as string;
      try {
        const pdf = await pdfjs.getDocument({ url }).promise;
        const numPages = pdf.numPages;
        let text = "";

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item) => "str" in item && item.str)
            .join(" ");
          text += pageText + " ";
        }

        const resumeData = {
          text,
          fileName: resumeFile.name,
        };

        setResumeData(resumeData);

        if (isChromeExtension) {
          chrome.storage.local.set({
            resume: resumeData,
          });
        } else {
          localStorage.setItem("resume", JSON.stringify(resumeData));
        }
      } catch (error) {
        setError("Error processing PDF: " + error);
        console.error("Error processing PDF: ", error);
      }
    };
  }, [resumeFile]);

  const saveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const apiKey = data.get("apiKey") as string;
    if (!apiKey) {
      setError("Please enter an API key");
      return;
    }
    setOpenAiKey(apiKey);

    if (isChromeExtension) {
      chrome.storage.local.set({ openAiKey: apiKey });
    } else {
      localStorage.setItem("openAiKey", apiKey);
    }
    setIsSettingsOpen(false);
  };

  const toggleSettingsView = () => {
    setIsSettingsOpen((prev) => !prev);
  };

  return (
    <div className="bg-gray-900 text-white relative">
      {openAiKey && (
        <button className="absolute right-0 m-2" onClick={toggleSettingsView}>
          <img src="/settings.svg" width={18} />
        </button>
      )}

      <div className="w-80 p-4">
        {isSettingsOpen || !openAiKey ? (
          <form onSubmit={saveSettings}>
            <div>
              <label htmlFor="apiKey" className="font-bold">
                OpenAI API Key:
              </label>
              <input
                type="password"
                name="apiKey"
                id="apiKey"
                placeholder="OpenAI API Key"
                className="bg-gray-700 outline-none p-2 mt-2 w-full rounded "
                required
                autoComplete="openai-key"
                defaultValue={openAiKey}
                onChange={() => setError(null)}
              />
              <div className="text-sm mt-2 ">
                Visit{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  className="underline hover:text-gray-500 font-bold"
                >
                  here
                </a>{" "}
                to get your key.
                <div className="mt-1">
                  We are using <span className="font-bold">gpt-4o</span> model
                  for this extension.
                </div>
              </div>
            </div>

            <div className="mt-4 h-[1px] bg-gray-400 " />

            <div className="mt-3">
              {resumeData ? (
                <div>
                  <label htmlFor="resume" className="font-bold">
                    Resume File:
                  </label>
                  <div className="mt-2 italic">{resumeData?.fileName}</div>
                  <button
                    onClick={newCv}
                    type="submit"
                    className="mt-4 text-white underline hover:text-gray-500"
                  >
                    Upload a new Resume
                  </button>
                </div>
              ) : (
                <div>
                  <label htmlFor="resume" className="font-bold">
                    Upload your CV (PDF):
                  </label>

                  <input
                    className="mt-2"
                    type="file"
                    id="resume"
                    name="resume"
                    accept=".pdf"
                    onChange={handleFileChange}
                    required
                  />
                </div>
              )}
            </div>

            <div className="mt-4 h-[1px] bg-gray-400 " />

            <button className="bg-gray-700 hover:bg-gray-800 text-white font-bold p-2 rounded flex items-center gap-2 mt-4">
              Save Settings
            </button>
          </form>
        ) : (
          <div>
            <form onSubmit={handleSubmit}>
              {resumeData?.text && (
                <div className="">
                  <button
                    disabled={comparing}
                    type="submit"
                    className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
                  >
                    <img src="/rate.png" width={24} />
                    {comparing
                      ? "Rating your CV..."
                      : "Rate my CV for this job post"}
                  </button>
                </div>
              )}
            </form>
            {content && (
              <div
                className="text-white mt-4"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}
          </div>
        )}

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4"
            role="alert"
          >
            <span className="">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
