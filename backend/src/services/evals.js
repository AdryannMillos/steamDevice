import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import axios from "axios";
import { retrieveContextIfNeeded } from "../services/rag.js";

dotenv.config();

const OPENAI_API = "https://api.openai.com/v1";
const EMBEDDING_MODEL = "text-embedding-3-small"; 
const CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `
You are a helpful assistant that ONLY answers questions about Steam hardware (Steam Machine, Steam Frame, Steam Controller).  

- If the user only greets you, greet them back and ask them to ask questions about Steam devices.  
- If the user asks an open-ended question (e.g., about color, price, or features), infer that they are asking about Steam devices.  
- If a question is NOT about Steam devices, respond with: "I'm sorry, I can only answer questions about Steam hardware."  
- Keep all answers concise and factual.
`;

async function getEmbedding(text, apiKey) {
  const resp = await axios.post(
    `${OPENAI_API}/embeddings`,
    { input: text, model: EMBEDDING_MODEL },
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  return resp.data.data[0].embedding;
}

function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (magA * magB);
}

export async function runSteamEval() {
  const filePath = path.resolve(process.cwd(), "src", "evals", "steam_evals.json");
  const raw = JSON.parse(await fs.readFile(filePath, "utf-8"));
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) throw new Error("OPENAI_API_KEY not defined in .env");

  const results = await Promise.all(
    raw.cases.map(async (test) => {
      try {
        const context = await retrieveContextIfNeeded(test.input);

        const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...(context && context.length
            ? [{ role: "system", content: "Relevant context:\n" + context.join("\n---\n") }]
            : []),
          { role: "user", content: test.input },
        ];

        const chatResp = await axios.post(
          `${OPENAI_API}/chat/completions`,
          { model: CHAT_MODEL, messages },
          { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
        );

        const output = chatResp.data.choices?.[0]?.message?.content || "";

        const [idealEmbedding, outputEmbedding] = await Promise.all([
          getEmbedding(test.ideal, apiKey),
          getEmbedding(output, apiKey),
        ]);

        const similarity = cosineSimilarity(idealEmbedding, outputEmbedding);

        return {
          input: test.input,
          ideal: test.ideal,
          output,
          similarity,
          pass: similarity >= 0.7,
        };
      } catch (err) {
        console.error("Error evaluating test case:", test.input, err.message);
        return {
          input: test.input,
          ideal: test.ideal,
          output: "",
          pass: false,
          error: err.message,
        };
      }
    })
  );

  console.log(results);
  return results;
}
