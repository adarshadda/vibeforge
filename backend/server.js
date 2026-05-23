import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import storyRoute     from "./routes/story.js";
import voiceRoute     from "./routes/voice.js";
import videoRoute     from "./routes/video.js";
import thumbnailRoute from "./routes/thumbnail.js";
import assembleRoute  from "./routes/assemble.js";
import healthRoute    from "./routes/health.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

// ── Serve frontend ────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../frontend/public")));

// ── Config Route for Supabase ─────────────────────────────────
app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseKey: process.env.SUPABASE_KEY || ""
  });
});

// ── Studio Route ──────────────────────────────────────────────
app.get("/studio", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/studio.html"));
});

// ── API Routes ────────────────────────────────────────────────
app.use("/api/story",     storyRoute);
app.use("/api/voice",     voiceRoute);
app.use("/api/video",     videoRoute);
app.use("/api/thumbnail", thumbnailRoute);
app.use("/api/assemble",  assembleRoute);
app.use("/api/health",    healthRoute);

// ── Fallback → frontend ───────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/index.html"));
});

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Unexpected server error", detail: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀  VibeForge backend       → http://localhost:${PORT}`);
  console.log(`🎬  Studio Landing Page   → http://localhost:${PORT}`);
  console.log(`🛠️   VibeForge Studio UI   → http://localhost:${PORT}/studio`);
});
