import { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const isChromeExtension =
  typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;

function App() {
  const [openAiKey, setOpenAiKey] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<{
    text: string;
    fileName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
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
        const pdf = await pdfjsLib.getDocument({ url }).promise;
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

    window.open(
      "https://www.linkedin.com/jobs/collections/recommended/",
      "linkedinTab"
    );
  };

  return (
    <div className="bg-gray-900 text-white relative min-h-dvh flex justify-center">
      <div className="w-96 p-4">
        <form onSubmit={saveSettings}>
          <div>
            <label htmlFor="apiKey" className="font-bold">
              OpenAI API Secret Key:
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
                target="_blank"
                className="underline hover:text-gray-500 font-bold"
              >
                https://platform.openai.com/api-keys
              </a>{" "}
              to create your secret key.
              <div className="mt-1">
                We are using <span className="font-bold">gpt-4o mini</span>{" "}
                model for this extension which costs $0.00008 per token.
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

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4"
            role="alert"
          >
            <span className="">{error}</span>
          </div>
        )}

        {openAiKey ? (
          <div className="border-t-2 border-white pt-4 mt-8 font-bold text-lg text-green-700">
            You are ready to use the extension now. Visit a job page in Linkedin
            now and click "<strong>Score My CV For This Job</strong>" button on
            the top of the page to get the score.
          </div>
        ) : (
          <div className="border-t-2 border-white pt-4 mt-8 font-bold text-lg text-green-700">
            Add your OpenAI API key and upload your CV to get started.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
