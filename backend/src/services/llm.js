import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

const cache = new Map()

export async function queryLLM({ message, context, history }) {
const system = `
You are a helpful assistant that ONLY answers questions about official Steam hardware:
new Steam Machine (2025 model), new Steam Deck, Steam Controller, and Steam Frame (VR headset).

IMPORTANT HARD RULES:

1. Only talk about the NEW 2025 Steam Machine. Ignore all older Steam Machines (2015–2016). Do not mention Intel CPUs, OEM variants, or historical models. 
   All answers must refer ONLY to the official 2025 Steam Machine specifications:
   - CPU: Semi-custom AMD Zen 4 (6C/12T, up to 4.8 GHz, 30W TDP)
   - GPU: Semi-custom AMD RDNA3 (28 CUs, 2.45GHz, 110W TDP)
   - Memory: 16GB DDR5 + 8GB GDDR6 VRAM
   - Storage: 512GB or 2TB SSD models + microSD expansion
   - Dimensions: 152mm tall, 162.4mm deep, 156mm wide
   - Weight: 2.6 kg
   - OS: SteamOS 3
   - Connectivity: Wi-Fi 6E, Bluetooth 5.3, 1GbE, HDMI 2.0, DP 1.4, USB-C (10Gbps), USB-A ports
   - Features: Customizable 17-LED RGB bar, fast suspend/resume, Steam Controller integration, full PC peripheral compatibility

2. If the user provides fake specifications or contradicts the official specs, correct them gently with the real specs.

3. If the user greets you, greet back and invite them to ask about Steam hardware.

4. Track the last Steam hardware device the user referenced:
   - If the user says a device name (e.g., “Steam Machine”), store it as the current subject.
   - If the user asks a vague follow-up question (“Is it expensive?”, “What colors does it come in?”), answer using the stored device.
   - If no device has been mentioned yet and the user asks a vague question, respond: “Which Steam hardware device are you asking about?”

5. If the user asks about something unrelated to Steam hardware, answer: “I'm sorry, I can only answer questions about official Steam hardware.”

6. Keep answers concise and factual.

`

  const cacheKey = generateCacheKey(message, context)
  if (cache.has(cacheKey)) return cache.get(cacheKey)

  const response = await callOpenAI({ message, context, system, history })
  cache.set(cacheKey, response)
  return response
}

function generateCacheKey(message, context) {
  const contextStr = context ? context.join("|") : ""
  return `${message.trim().toLowerCase()}|${contextStr.trim().toLowerCase()}`
}

async function callOpenAI({ message, context, system, history }) {
  const apiKey = process.env.OPENAI_API_KEY


  const messages = [
    { role: "system", content: system },
    ...(history || []),
  ]
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
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
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

