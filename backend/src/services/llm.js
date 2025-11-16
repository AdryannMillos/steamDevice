import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function queryLLM({ message, context }) {
const system = `
You are a helpful assistant that ONLY answers questions about Steam gaming devices (Steam Machine, Steam Deck, Steam Controller).  

- If the user only greets you, greet them back and ask them to ask questions about Steam devices.  
- If the user asks an open-ended question (e.g., about color, price, or features), infer that they are asking about Steam devices.  
- If a question is NOT about Steam devices, respond with: "I'm sorry, I can only answer questions about Steam gaming devices."  
- Keep all answers concise and factual.
`;

  return await callOpenAI({ message, context, system });
}

async function callOpenAI({ message, context, system }) {
  const apiKey = process.env.OPENAI_API_KEY;

  const messages = [{ role: "system", content: system }];

  if (context && context.length) {
    messages.push({
      role: "system",
      content: "Relevant context:\n" + context.join("\n---\n"),
    });
  }

  messages.push({ role: "user", content: message });

  const resp = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  const text = resp.data.choices?.[0]?.message?.content || "";
  return { text };
}
