import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import fetch from "node-fetch";
import { load } from "cheerio";

dotenv.config();

const CACHE_FILE = path.resolve(process.cwd(), "backend", "data", "steam_docs_cache.json");
let docs = null;

async function fetchSteamDocs() {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    return JSON.parse(raw);
  }

  const res = await fetch("https://steamdb.info/blog/steam-hardware-2025/");
  const html = await res.text();
  const $ = load(html);

  const textBlocks = [];
  $("p, h1, h2, h3, li").each((i, el) => {
    const txt = $(el).text().trim();
    if (txt) textBlocks.push(txt);
  });

  fs.writeFileSync(CACHE_FILE, JSON.stringify(textBlocks, null, 2), "utf-8");
  return textBlocks;
}

export async function retrieveContextIfNeeded(query) {
  if (!process.env.ENABLE_RAG) return [];

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return [];

  if (!docs) {
    docs = await fetchSteamDocs();
  }

  const client = new OpenAI({ apiKey: openaiKey });

  const embResp = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const qEmb = embResp.data[0].embedding;

  if (!global._steamEmbeddings) {
    global._steamEmbeddings = await Promise.all(
      docs.map(async (d) => {
        const r = await client.embeddings.create({
          model: "text-embedding-3-small",
          input: d,
        });
        return { text: d, emb: r.data[0].embedding };
      })
    );
  }

  function cos(a, b) {
    let dot = 0,
      na = 0,
      nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
  }

  const scored = global._steamEmbeddings.map((d) => ({
    score: cos(d.emb, qEmb),
    text: d.text,
  }));
  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 3).map((s) => s.text);
  return top;
}
