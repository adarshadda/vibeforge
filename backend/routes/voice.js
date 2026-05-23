import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// Default voice IDs (child-friendly / narrator voices)
const VOICE_PRESETS = {
  "cheerful-child":  "EXAVITQu4vr4xnSDxMaL", // Sarah — bright, energetic
  "warm-storyteller": "21m00Tcm4TlvDq8ikWAM", // Rachel — warm, clear
  "energetic-host":  "AZnzlk1XvdvUeBnXmlld"  // Domi — upbeat, fun
};

router.post("/", async (req, res) => {
  try {
    const { text, voicePreset = "cheerful-child", speed = 1.0 } = req.body;

    if (!text) return res.status(400).json({ error: "text is required" });

    const voiceId = process.env.ELEVENLABS_VOICE_ID || VOICE_PRESETS[voicePreset] || VOICE_PRESETS["cheerful-child"];
    const apiKey = req.headers["x-elevenlabs-key"] || process.env.ELEVENLABS_API_KEY;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2",
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.82,
            style: 0.35,
            use_speaker_boost: true,
            speed
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("ElevenLabs error:", err);
      return res.status(502).json({ error: "Voice generation failed", detail: err });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", "inline; filename=voiceover.mp3");
    res.send(Buffer.from(audioBuffer));

  } catch (err) {
    console.error("Voice route error:", err);
    res.status(500).json({ error: "Internal error", detail: err.message });
  }
});

export default router;
