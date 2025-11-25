import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { load } from "cheerio";
import axios from "axios";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTML_FILE = path.resolve(__dirname, "../data/steam.html");
const POLYGON_URL = "https://www.polygon.com/steam-machine-specs-analysis/";
const CACHE_FILE = path.resolve(__dirname, "../data/steam_docs_cache.json");
const EMB_CACHE_FILE = path.resolve(__dirname, "../data/steam_docs_embeddings.json");
const TOP_N = parseInt(process.env.TOP_N_DOCS || "3");

let docs = null;

async function parseHTMLFile(filePath) {
  try {
    const html = await fs.readFile(filePath, "utf-8");
    const $ = load(html);
    return $("p, h1, h2, h3, li").map((i, el) => $(el).text().trim()).get().filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchPolygonArticle() {
  try {
    const resp = await axios.get(POLYGON_URL);
    const $ = load(resp.data);
    return $("p, h1, h2, h3, li").map((i, el) => $(el).text().trim()).get().filter(Boolean);
  } catch {
    return [];
  }
}

export async function loadSteamDocs() {
  if (docs) return docs;

  const cached = await fs.readFile(CACHE_FILE, "utf-8").catch(() => null);
  if (cached) {
    docs = JSON.parse(cached);
    return docs;
  }

  const localDocs = await parseHTMLFile(HTML_FILE);
  const polygonDocs = await fetchPolygonArticle();



  docs = [...localDocs, ...polygonDocs];

  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify(docs, null, 2), "utf-8");

  return docs;
}

export async function loadEmbeddings(client) {
  if (global._steamEmbeddings) return global._steamEmbeddings;

  await loadSteamDocs();

  const cached = await fs.readFile(EMB_CACHE_FILE, "utf-8").catch(() => null);
  if (cached) {
    global._steamEmbeddings = JSON.parse(cached);
    return global._steamEmbeddings;
  }

  const embeddings = await Promise.all(
    docs.map(async (d) => {
      const r = await client.embeddings.create({ model: "text-embedding-3-small", input: d });
      return { text: d, emb: r.data[0].embedding };
    })
  );

  await fs.mkdir(path.dirname(EMB_CACHE_FILE), { recursive: true });
  await fs.writeFile(EMB_CACHE_FILE, JSON.stringify(embeddings, null, 2), "utf-8");

  global._steamEmbeddings = embeddings;
  return embeddings;
}

function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}

export async function retrieveContextIfNeeded(query) {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return [];

  const client = new OpenAI({ apiKey: openaiKey });
  const embeddings = await loadEmbeddings(client);

  const qEmb = (await client.embeddings.create({ model: "text-embedding-3-small", input: query }))
    .data[0].embedding;

  const scored = embeddings
    .map(d => ({ score: cosineSimilarity(d.emb, qEmb), text: d.text }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, TOP_N).map(s => s.text);
}
