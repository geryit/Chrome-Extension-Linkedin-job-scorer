import { useEffect, useState } from "react";
import OpenAI from "openai";
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_KEY,
  dangerouslyAllowBrowser: true,
});

const isChromeExtension =
  typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;

function App() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<{
    text: string;
    fileName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  console.log({ resumeFile, resumeData, error, comparing, score });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) {
      return;
    }

    setResumeFile(files[0]);
  };

  const newCv = () => {
    setResumeData(null);
    setScore(null);
    setResumeFile(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setScore(null);
    setComparing(true);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0].id;
      chrome.tabs.sendMessage(
        activeTab as number,
        { action: "getDivContent" },
        (response) => {
          console.log(response.content);

          if (!resumeData) {
            setError("No text found in the resume");
            return;
          }
          if (!response.content) {
            setError("No job description found");
            return;
          }
          compareTexts(resumeData.text, response.content).then(()=>
            setComparing(false)
          );
          // setScore(7.6);
        }
      );
    });
  };

  const generateEmbeddings = async (text: string) => {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small", // Confirm the latest model from OpenAI's documentation
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      setError("Error generating embeddings: " + error);
      console.error("Error generating embeddings:", error);
      return null;
    }
  };

  const cosineSimilarity = (vecA: number[], vecB: number[]) => {
    let dotProduct = 0.0,
      normA = 0.0,
      normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] ** 2;
      normB += vecB[i] ** 2;
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  const transformScore = (score: number) => {
    // Transform from [-1, 1] to [1, 10]
    return 5.5 + 4.5 * score;
  };
  const compareTexts = async (text1: string, text2: string) => {
    const embedding1 = await generateEmbeddings(text1);
    const embedding2 = await generateEmbeddings(text2);

    if (embedding1 && embedding2) {
      const similarity = cosineSimilarity(embedding1, embedding2);
      const transformedScore = transformScore(similarity);
      console.log(`Similarity Score (1-10): ${transformedScore.toFixed(2)}`);
      setScore(parseFloat(transformedScore.toFixed(2)));
    } else {
      setError("Failed to generate embeddings for texts.");
      console.log("Failed to generate embeddings for texts.");
    }
    return setComparing(false);

  };

  useEffect(() => {
    if (isChromeExtension) {
      chrome.storage?.local.get(["resume"], async (result) => {
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

  return (
    <div className="bg-gray-900">
      <div className="w-80 p-4">
        {
          <form onSubmit={handleSubmit}>
            {!resumeData?.text && (
              <label
                className="block mb-2 font-bold text-gray-900 dark:text-white"
                htmlFor="file_input"
              >
                Upload your CV (PDF):
              </label>
            )}
            <div className="">
              {!resumeData?.text ? (
                <label
                  htmlFor="resume"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF
                    </p>
                  </div>
                  <input
                    className="hidden"
                    type="file"
                    id="resume"
                    name="resume"
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div>
                  <div className="text-white italic">
                    {resumeData?.fileName}
                  </div>
                  <button
                    onClick={newCv}
                    type="submit"
                    className="mt-4 text-white underline"
                  >
                    Upload a new CV
                  </button>
                </div>
              )}
            </div>

            {resumeData?.text && (
              <div className="mt-4">
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
        }

        {score && (
          <div>
            <div className="text-white mt-4">
              Score: <span className="font-bold">{score} </span>
            </div>
          </div>
        )}

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
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
