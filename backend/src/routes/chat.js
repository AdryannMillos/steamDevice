import express from "express";
import { queryLLM } from "../services/llm.js";
import { startTrace, endTrace } from "../services/langsmith.js";
import { retrieveContextIfNeeded } from "../services/rag.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });

  const trace = await startTrace({
    name: "chatbot_message",
    inputs: { message },
  });

  try {
    const context = await retrieveContextIfNeeded(message);

    const result = await queryLLM({ message, context, trace });

    await endTrace(trace, result);

    res.json({ response: result.text });
  } catch (err) {
    console.error("chat route error:", err);
    await endTrace(trace, err);
    res.status(500).json({ error: "internal error" });
  }
});

export default router;
