import express from "express";
import { runSteamEval } from "../services/evals.js";

const router = express.Router();

router.get("/run", async (req, res) => {
  try {
    const results = await runSteamEval();
    res.json({ ok: true, results });
  } catch (err) {
    console.error("eval error", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
