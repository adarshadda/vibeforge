import express from "express";
import fetch from "node-fetch";

const router = express.Router();

async function pollRender(renderId, apiKey, maxWaitMs = 300000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 6000));
    const res = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const data = await res.json();
    if (data.status === "succeeded") return { ok: true, url: data.url };
    if (data.status === "failed") return { ok: false, error: data.error_message };
  }
  return { ok: false, error: "Render timeout" };
}

router.post("/", async (req, res) => {
  try {
    const { videoUrls, audioUrl, title, captions } = req.body;

    if (!videoUrls?.length) return res.status(400).json({ error: "videoUrls required" });

    const apiKey = req.headers["x-creatomate-key"] || process.env.CREATOMATE_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "CREATOMATE_API_KEY not configured" });

    // Build Creatomate template composition
    // 6 clips stacked vertically in time, voiceover over all, caption overlay
    const elements = videoUrls.map((url, i) => ({
      type: "video",
      source: url,
      time: i * 5,
      duration: 5,
      x: "50%",
      y: "50%",
      width: "100%",
      height: "100%",
      fit: "cover"
    }));

    if (audioUrl) {
      elements.push({
        type: "audio",
        source: audioUrl,
        time: 0,
        duration: 30,
        volume: "100%"
      });
    }

    // Animated title card at end
    elements.push({
      type: "text",
      text: title || "The End! 🌈",
      time: 26,
      duration: 4,
      x: "50%",
      y: "50%",
      width: "90%",
      font_family: "Nunito",
      font_weight: "800",
      font_size: "9 vmin",
      color: "#FFFFFF",
      text_align: "center",
      animations: [{ type: "scale", scope: "element", easing: "back-out", fade: true }]
    });

    const payload = {
      output_format: "mp4",
      width: 1080,
      height: 1920,
      duration: 30,
      elements
    };

    const response = await fetch("https://api.creatomate.com/v1/renders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Creatomate error:", err);
      return res.status(502).json({ error: "Assembly failed to start", detail: err });
    }

    const renders = await response.json();
    const renderId = Array.isArray(renders) ? renders[0].id : renders.id;

    const result = await pollRender(renderId, apiKey);
    res.json({ ok: result.ok, render_id: renderId, ...result });

  } catch (err) {
    console.error("Assembly route error:", err);
    res.status(500).json({ error: "Internal error", detail: err.message });
  }
});

export default router;
