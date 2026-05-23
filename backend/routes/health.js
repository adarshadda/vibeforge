import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// Light-touch ping for each service — no credits consumed
async function checkAnthropic(key) {
  if (!key) return "missing";
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-3-5-sonnet-20241022", max_tokens: 1, messages: [{ role: "user", content: "hi" }] })
    });
    return r.status === 200 || r.status === 400 || r.status === 429 || r.status === 529 ? "ok" : "invalid";
  } catch { return "error"; }
}

async function checkGemini(key) {
  if (!key) return "missing";
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    return r.ok ? "ok" : "invalid";
  } catch { return "error"; }
}

async function checkElevenLabs(key) {
  if (!key) return "missing";
  try {
    const r = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: { "xi-api-key": key }
    });
    return r.ok ? "ok" : "invalid";
  } catch { return "error"; }
}

async function checkOpenAI(key) {
  if (!key) return "missing";
  try {
    const r = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` }
    });
    return r.ok ? "ok" : "invalid";
  } catch { return "error"; }
}

async function checkRunway(key) {
  if (!key) return "missing";
  try {
    const r = await fetch("https://api.dev.runwayml.com/v1/tasks", {
      headers: { Authorization: `Bearer ${key}`, "X-Runway-Version": "2024-11-06" }
    });
    return r.status === 200 || r.status === 401 || r.status === 403 || r.status === 404 ? "ok" : "invalid";
  } catch { return "error"; }
}

async function checkCreatomate(key) {
  if (!key) return "missing";
  try {
    const r = await fetch("https://api.creatomate.com/v1/renders?limit=1", {
      headers: { Authorization: `Bearer ${key}` }
    });
    return r.ok ? "ok" : "invalid";
  } catch { return "error"; }
}

router.get("/", async (req, res) => {
  const anthropicKey = req.headers["x-anthropic-key"] || process.env.ANTHROPIC_API_KEY;
  const geminiKey = req.headers["x-gemini-key"] || process.env.GEMINI_API_KEY;
  const elevenlabsKey = req.headers["x-elevenlabs-key"] || process.env.ELEVENLABS_API_KEY;
  const openaiKey = req.headers["x-openai-key"] || process.env.OPENAI_API_KEY;
  const runwayKey = req.headers["x-runway-key"] || process.env.RUNWAY_API_KEY;
  const creatomateKey = req.headers["x-creatomate-key"] || process.env.CREATOMATE_API_KEY;

  const [anthropic, gemini, elevenlabs, openai, runway, creatomate] = await Promise.all([
    checkAnthropic(anthropicKey),
    checkGemini(geminiKey),
    checkElevenLabs(elevenlabsKey),
    checkOpenAI(openaiKey),
    checkRunway(runwayKey),
    checkCreatomate(creatomateKey)
  ]);

  const services = { anthropic, gemini, elevenlabs, openai, runway, creatomate };
  
  // Either Gemini OR Anthropic is required for story generation
  const allCore = (anthropic === "ok" || gemini === "ok");

  res.json({
    status: allCore ? "ready" : "degraded",
    services,
    timestamp: new Date().toISOString()
  });
});

export default router;
