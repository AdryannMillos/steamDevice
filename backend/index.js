import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import chatRoute from "./src/routes/chat.js";
import evalRoute from "./src/routes/evals.js";
import { runSteamEval } from "./src/services/evals.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const rateLimitMap = new Map();
const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 1000;

function rateLimiter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];

  const recent = timestamps.filter(ts => now - ts < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    return res.status(429).json({
      error: "Rate limit exceeded. Please wait before sending more requests.",
    });
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);

  next();
}

app.use("/api/chat", rateLimiter, chatRoute);

app.use("/api/evals", evalRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// runSteamEval()