import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { title, characters, genre, style = "3D Pixar cartoon" } = req.body;

    if (!title) return res.status(400).json({ error: "title is required" });

    const charList = (characters || []).slice(0, 2).join(" and ");
    const prompt = `YouTube Shorts thumbnail for a kids video. ${style} style. Ultra vibrant saturated colors. 
Title text: "${title}" in large bold bubbly letters at the top or bottom.
Characters: ${charList || "cute cartoon characters"} in the center, expressive joyful faces, looking at viewer.
Genre mood: ${genre || "fun adventure"}.
Background: bright colorful scene matching the story.
Style: Pixar-quality 3D render, extreme vibrancy, soft cel-shading, high contrast, 9:16 vertical format.
No watermarks. No text other than the title. Professional kids content thumbnail.`;

    const apiKey = req.headers["x-openai-key"] || process.env.OPENAI_API_KEY;
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1792",
        quality: "standard",
        style: "vivid"
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI error:", err);
      return res.status(502).json({ error: "Thumbnail generation failed", detail: err });
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;
    const revisedPrompt = data.data[0].revised_prompt;

    res.json({ ok: true, url: imageUrl, revised_prompt: revisedPrompt });

  } catch (err) {
    console.error("Thumbnail route error:", err);
    res.status(500).json({ error: "Internal error", detail: err.message });
  }
});

export default router;
