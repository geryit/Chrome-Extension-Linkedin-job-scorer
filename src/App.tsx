import { useEffect, useState } from "react";
import "./App.css";
import pdfToText from "react-pdftotext";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_KEY,
  dangerouslyAllowBrowser: true,
});

const jobPost = `
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
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (file) {
      pdfToText(file)
        .then((text: string) => {
          // console.log(text);
          // return callOpenAIAPI(text);
          return askQuestion(text);
        })
        .catch((error: Error) =>
          console.error("Failed to extract text from pdf: ", error)
        );
    }
  };

  const callOpenAIAPI = async (pdfText: string) => {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4-turbo",
            prompt: `Given the job description: ${jobPost}. And a resume: ${pdfText}. On a scale of 1 to 10, how well does the resume match the job description?`,
            max_tokens: 1024,
            temperature: 0.7, // Adjust based on how deterministic you want the output to be
          }),
        }
      );
      const data = await response.json();
      return console.log(data);
    } catch (error) {
      return console.error("Error:", error);
    }
  };

  async function askQuestion(pdfText: string) {
    try {
      console.log(
        `Given the job description: ${jobPost}. And a resume: ${pdfText}. On a scale of 1 to 10, how well does the resume match the job description?`
      );
      // const completion = await openai.chat.completions.create({
      //   messages: [
      //     { role: "system", content: "You are a helpful assistant." },
      //     {
      //       role: "user",
      //       content:
      //         "Here is the job description and the resume text. Please evaluate the match.",
      //     },
      //     {
      //       role: "system",
      //       content:
      //         "Sure, please provide the job description and the resume text.",
      //     },
      //     {
      //       role: "user",
      //       content: `Given the job description: ${jobPost}. And a resume: ${pdfText}. On a scale of 1 to 10, how well does the resume match the job description?`,
      //     },
      //     {
      //       role: "assistant",
      //       content: "I'm processing the information to evaluate the match.",
      //     },
      //     {
      //       role: "assistant",
      //       content:
      //         "Based on the analysis, the resume scores a [X] out of 10 in matching the job description.",
      //     },
      //   ],
      //   model: "gpt-3.5-turbo",
      // });

      // console.log("AI Response:", completion.choices[0]);
    } catch (error) {
      console.error("Error during API call:", error);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="resume">Upload your CV (PDF or DOCX):</label>
        <div className="m-4">
          <input
            type="file"
            id="resume"
            name="resume"
            accept=".pdf,.docx"
            onChange={handleFileChange}
          />
          {file && (
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Submit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default App;
