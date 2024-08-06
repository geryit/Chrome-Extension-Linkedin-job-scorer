import { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const isChromeExtension =
  typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;

function App() {
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
    } else {
      const resumeDataFromStorage = localStorage.getItem("resume");
      if (resumeDataFromStorage) {
        setResumeData(JSON.parse(resumeDataFromStorage));
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

    window.open(
      "https://www.linkedin.com/jobs/collections/recommended/",
      "linkedinTab"
    );
  };

  return (
    <div className="bg-gray-900 text-white relative min-h-dvh flex justify-center">
      <div className="w-96 p-4">
        <form onSubmit={saveSettings}>
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

          <div className="mt-2 h-[1px] bg-gray-400 " />

          <button className="bg-green-700 hover:bg-gray-800 text-white font-bold p-2 rounded flex items-center gap-2 mt-4">
            Continue
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
      </div>
    </div>
  );
}

export default App;
