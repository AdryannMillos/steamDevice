import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const OPENAI_API = "https://api.openai.com/v1/chat/completions";

export async function runSteamEval() {
  const p = path.resolve(process.cwd(), "backend", "src", "evals", "steam_evals.json");
  const raw = JSON.parse(fs.readFileSync(p, "utf-8"));

  const apiKey = process.env.OPENAI_API_KEY;

  const results = [];

  for (const test of raw.cases) {
    const resp = await axios.post(
      OPENAI_API,
      {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an assistant for Steam device." },
          { role: "user", content: test.input }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const output = resp.data.choices?.[0]?.message?.content || "";

    results.push({
      input: test.input,
      ideal: test.ideal,
      output,
      pass: output.toLowerCase().includes(test.ideal.toLowerCase())
    });
  }

  return results;
}
