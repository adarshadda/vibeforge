import express from "express";
import fetch from "node-fetch";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";  
const router = express.Router();

// 🎭 Character presets
const CHAR_PROMPTS = {
  Mia:   "3D cartoon girl, dark pigtails, red polka-dot dress, big round eyes, warm skin tone, bright smile, Pixar style, vibrant colors, soft lighting",
  Coco:  "3D cartoon monkey, big brown expressive eyes, yellow banana necklace, playful grin, soft brown fur, Pixar style, saturated colors",
  Bruno: "3D cartoon bear, round ears, blue striped shirt, gentle expression, warm brown fur, Pixar style, friendly look",
  Felix: "3D cartoon fox, orange fur, white chest, clever expression, bushy tail, Pixar style, warm tones",
  Pip:   "3D cartoon frog, bright green, big yellow eyes, tiny backpack, cheeky smile, Pixar style, vivid colors",
  Robo:  "3D cartoon robot, round head, blue LED eyes, small antenna, friendly face display, Pixar style, metallic with colorful accents",
  Zara:  "3D cartoon girl, braided hair with stars, purple spacesuit, bright smile, Pixar style, galaxy colors",
  Luna:  "3D cartoon unicorn, pastel pink mane, sparkly horn, big violet eyes, Pixar style, magical glitter"
};

// 🚀 Anthropic generator
async function generateWithAnthropic(key, prompt) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1800,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API failed:", errText);
      return null;
    }

    const data = await response.json();
    return data.content?.[0]?.text || null;
  } catch (err) {
    console.error("Anthropic failed:", err.message);
    return null;
  }
}

// 🚀 Gemini generator
async function generateWithGemini(key, prompt) {
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (err) {
    console.error("Gemini failed:", err.message);
    return null;
  }
}

// 🔁 OpenRouter fallback
async function generateWithOpenRouter(key, prompt) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1800
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;

  } catch (err) {
    console.error("OpenRouter failed:", err.message);
    return null;
  }
}

// 📌 Main route
router.post("/", async (req, res) => {
  try {
    const { genre, characters, moral, style = "3D Pixar cartoon" } = req.body;

    if (!characters?.length) {
      return res.status(400).json({ error: "At least one character is required" });
    }

    const charDesc = characters
      .map(c => `${c}: ${CHAR_PROMPTS[c] || c}`)
      .join("\n");

    const prompt = `
You are a creative director for a kids YouTube Shorts channel. Generate a complete 30-second video package.

Genre: ${genre}
Characters: ${characters.join(", ")}
Moral/Lesson: ${moral || "auto-select an appropriate lesson for kids"}
Visual Style: ${style}

Character Visual Descriptions (inject into EVERY scene prompt):
${charDesc}

Return ONLY raw JSON. No explanation. No markdown.

{
  "title": "emoji + catchy title under 60 chars",
  "story": "2-3 sentence story arc describing the full 30-second journey",
  "scenes": [
    "Scene 1 [0-5s]: ...",
    "Scene 2 [5-10s]: ...",
    "Scene 3 [10-15s]: ...",
    "Scene 4 [15-20s]: ...",
    "Scene 5 [20-25s]: ...",
    "Scene 6 [25-30s]: wide joyful shot showing the lesson learned"
  ],
  "voice": "Energetic 30s voiceover with CAPS + [sound cues], max 80 words",
  "description": "3 sentence SEO-friendly description",
  "tags": ["8-12 tags"],
  "moral": "Lesson in one sentence"
}
`;

    // Resolve API keys (headers take precedence over environment variables)
    const geminiKey = req.headers["x-gemini-key"] || process.env.GEMINI_API_KEY;
    const anthropicKey = req.headers["x-anthropic-key"] || process.env.ANTHROPIC_API_KEY;
    const openrouterKey = req.headers["x-openrouter-key"] || process.env.OPENROUTER_API_KEY;

    console.log(`[STORY] Active keys found: Claude (Anthropic): ${!!anthropicKey}, Gemini: ${!!geminiKey}, OpenRouter: ${!!openrouterKey}`);

    let content = null;

    // 🔥 Try Anthropic first if key is present
    if (anthropicKey) {
      console.log("🔥 [STORY] Trying Anthropic Claude model 'claude-3-5-sonnet-20241022'...");
      content = await generateWithAnthropic(anthropicKey, prompt);
      if (content) {
        console.log("✅ [STORY] Anthropic Claude successfully generated the story!");
      } else {
        console.warn("⚠️ [STORY] Anthropic Claude generation failed.");
      }
    }

    // 🔁 Try Gemini next
    if (!content && geminiKey) {
      console.log("🔥 [STORY] Trying Google Gemini model 'gemini-2.5-flash-lite'...");
      content = await generateWithGemini(geminiKey, prompt);
      if (content) {
        console.log("✅ [STORY] Google Gemini successfully generated the story!");
      } else {
        console.warn("⚠️ [STORY] Google Gemini generation failed.");
      }
    }

    // 🔁 Try OpenRouter last
    if (!content && openrouterKey) {
      console.log("🔥 [STORY] Trying OpenRouter fallback model 'openai/gpt-4o-mini'...");
      content = await generateWithOpenRouter(openrouterKey, prompt);
      if (content) {
        console.log("✅ [STORY] OpenRouter successfully generated the story!");
      } else {
        console.warn("⚠️ [STORY] OpenRouter generation failed.");
      }
    }

    if (!content) {
      console.error("❌ [STORY] All LLM story generation providers failed or no keys were supplied.");
      return res.status(502).json({ error: "All AI providers failed or no keys configured" });
    }

    // 🧼 Parse JSON
    let parsed;
    try {
      const cleaned = content.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
      console.log(`[STORY] Story JSON parsed successfully. Title: "${parsed.title}"`);
    } catch (parseErr) {
      console.error("❌ [STORY] Failed to parse JSON response from LLM:", parseErr.message);
      console.error("[STORY] Raw LLM content:", content);
      return res.status(500).json({
        error: "Failed to parse JSON",
        raw: content
      });
    }

    res.json({ ok: true, ...parsed });

  } catch (err) {
    console.error("❌ [STORY] Route general error:", err);
    res.status(500).json({ error: "Internal error", detail: err.message });
  }
});

export default router;