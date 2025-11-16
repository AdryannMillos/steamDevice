import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

const cache = new Map()

export async function queryLLM({ message, context }) {
  const system = `
You are a helpful assistant that ONLY answers questions about official Steam hardware: 
Steam Machine, Steam Deck, Steam Controller, and Steam Frame (including the VR headset). 
- Answer all factual questions about these devices, including features, specs, connectivity, and modes.  
- If the user only greets you, greet them back and ask them to ask questions about Steam hardware.  
- If the user asks a question about these devices indirectly or in an open-ended way, answer it.  
- If a question is NOT about these devices, respond: "I'm sorry, I can only answer questions about official Steam hardware."  
- Keep answers concise, factual, and self-contained.
`

  const cacheKey = generateCacheKey(message, context)
  if (cache.has(cacheKey)) return cache.get(cacheKey)

  const response = await callOpenAI({ message, context, system })
  cache.set(cacheKey, response)
  return response
}

function generateCacheKey(message, context) {
  const contextStr = context ? context.join("|") : ""
  return `${message.trim().toLowerCase()}|${contextStr.trim().toLowerCase()}`
}

async function callOpenAI({ message, context, system }) {
  const apiKey = process.env.OPENAI_API_KEY

  const messages = [{ role: "system", content: system }]

  if (context && context.length) {
    messages.push({
      role: "system",
      content: "Relevant context:\n" + context.join("\n---\n"),
    })
  }

  messages.push({ role: "user", content: message })

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
  )

  const choice = resp.data.choices?.[0]
  const text = choice?.message?.content || ""

  const usage = resp.data.usage || {}
  const prompt_tokens = usage.prompt_tokens || 0
  const completion_tokens = usage.completion_tokens || 0
  const total_tokens = usage.total_tokens || prompt_tokens + completion_tokens


  return {
    text,
    usage: { prompt_tokens, completion_tokens, total_tokens },
    model: resp.data.model,
  }
}

