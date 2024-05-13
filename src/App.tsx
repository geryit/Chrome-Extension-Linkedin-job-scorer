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

// @ts-ignore: Unreachable code error
const jobDescription = `
About the job
Are you an experienced software developer looking to make a big impact? Come work with us at Teamspective, a fast growing startup with a fresh approach to people analytics and engagement.


About Teamspective

Teamspective is a growth company from Helsinki, developing the next-generation people analytics and engagement solution for building winning organisations and thriving company culture. We help companies identify and tackle their most important issues in teamwork, leadership, and cross-team collaboration with a unique solution combining continuous feedback collection and people engagement with network analysis using machine learning.


Our team currently consists of 12 seasoned professionals with experience in software business and HR. We all share the passion to unleash the power of people analytics for better leadership.


Our solutions are loved by talent-driven companies in multiple industries (e.g. Sievo, Columbia Road, Silo.ai, QVIK, Kemppi, and Danfoss).


The role

As a member of our small yet highly experienced and driven product team, you will be designing, implementing and delivering solutions to our customers at a rapid pace, all the while contributing to the direction of the code base and architecture. You will operate at a high level of autonomy and collaborate with people across the company.


Main responsibilities

Building solutions hands-on with our product team.
Collaborating with our designers, team and customers to build the best possible product.
Deciding, together with the rest of the team, the direction of our code base and technology stack.


To succeed in this role, you need

Exceptional coding skills
Excellent working knowledge of web technologies and relational databases
Experience with most of our stack: Typescript, React, Node, PostgreSQL
A collaborative and humble working style – eg. sharing your work early and asking for feedback.
A commitment to avoid complex code and architecture by finding pragmatic and clear solutions.
The ambition to take responsibility beyond the obvious, bring a hands-on mentality, and drive initiatives forward.
Good listening and communication skills
Good level of English


What we offer

A high growth environment, very experienced and highly-skilled team
A working environment where we trust, support yet challenge each other, work smartly, and celebrate success together.
Building this company together with others
Hybrid working model
Competitive compensation (salary+options) package


Next steps

Please send us your CV via the 'Apply' button. We might invite candidates for interviews already during the application period and fill the position as soon as we find the right person, so the sooner you apply the better.`;

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!resumeData) {
      setError("No text found in the resume");
      return;
    }
    // compareTexts(resumeData.text, jobDescription);
    setScore(7.6);
  };

  async function generateEmbeddings(text: string) {
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
  }

  async function cosineSimilarity(
    vecA: number[],
    vecB: number[]
  ): Promise<number> {
    let dotProduct = 0.0,
      normA = 0.0,
      normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] ** 2;
      normB += vecB[i] ** 2;
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  function transformScore(score: number) {
    // Transform from [-1, 1] to [1, 10]
    return 5.5 + 4.5 * score;
  }
  // @ts-ignore: Unreachable code error
  async function compareTexts(text1: string, text2: string) {
    const embedding1 = await generateEmbeddings(text1);
    const embedding2 = await generateEmbeddings(text2);

    if (embedding1 && embedding2) {
      const similarity = await cosineSimilarity(embedding1, embedding2);
      const transformedScore = transformScore(similarity);
      console.log(`Similarity Score (1-10): ${transformedScore.toFixed(2)}`);
      setScore(parseFloat(transformedScore.toFixed(2)));
      setComparing(false);
    } else {
      setError("Failed to generate embeddings for texts.");
      console.log("Failed to generate embeddings for texts.");
      setComparing(false);
    }
  }

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
        {!score && (
          <form onSubmit={handleSubmit}>
            <label
              className="block mb-2 font-bold text-gray-900 dark:text-white"
              htmlFor="file_input"
            >
              Upload your CV (PDF):
            </label>
            <div className="">
              {!resumeData?.text ? (
                <label
                  htmlFor="resume"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
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
                <div className="text-white italic">{resumeData?.fileName}</div>
              )}
            </div>

            <div className="mt-4">
              {resumeData?.text && (
                <button
                  disabled={comparing}
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
                >
                  <img src="/rate.png" width={20} />
                  {comparing
                    ? "Rating your CV..."
                    : "Rate my CV for this job post"}
                </button>
              )}
            </div>
          </form>
        )}

        {score && (
          <div>
            <div className="text-white mt-4">
              Similarity Score (1-10):{" "}
              <span className="font-bold">{score}</span>
            </div>
            <div className="text-white mt-4">
              <button
                disabled={comparing}
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                <img src="/rate.png" />
                Rate
              </button>
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
