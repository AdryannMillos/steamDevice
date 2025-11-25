import express from "express"
import { queryLLM } from "../services/llm.js"
import { startTrace, endTrace } from "../services/langsmith.js"
import { retrieveContextIfNeeded } from "../services/rag.js"

const router = express.Router()

router.post("/", async (req, res) => {

let trace
let start
  try {
      const { message, history = [] } = req.body
  if (!message) return res.status(400).json({ error: "message required" })

   start = Date.now()

   trace = await startTrace({
    name: "chatbot_message",
    inputs: { message },
  })
    const context = await retrieveContextIfNeeded(message)
    const result = await queryLLM({ message, context, history })

    await endTrace(trace, result.text, {
      model: result.model,
      tokens_prompt: result.usage.prompt_tokens,
      tokens_completion: result.usage.completion_tokens,
      tokens_total: result.usage.total_tokens,
      cost_usd: result.cost,
      latency_ms: Date.now() - start,
      context_items: context.length || 0,
    })

    res.json({ response: result.text })
  } catch (err) {
    await endTrace(trace, err.toString(), {
      error: true,
      latency_ms: Date.now() - start,
    })
    res.status(500).json({ error: "internal error" })
  }
})

export default router
