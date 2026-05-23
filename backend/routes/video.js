import express from "express";
import RunwayML from "@runwayml/sdk";
import "dotenv/config";

const router = express.Router();

async function generateSceneVideo(client, scenePrompt, style) {
  const fullPrompt = `${scenePrompt}. ${style}. Kids animation, vertical 9:16, smooth motion, bright lighting.`;
  console.log(`[VIDEO] [SYNC] Starting sync video generation for prompt: "${fullPrompt.slice(0, 50)}..."`);

  const task = await client.textToVideo
    .create({
      model: "veo3.1",
      promptText: fullPrompt,
      ratio: "720:1280",  // portrait 9:16 for YouTube Shorts
      duration: 8,
    })
    .waitForTaskOutput();

  console.log(`[VIDEO] [SYNC] Succeeded! Output URL: ${task.output?.[0]}`);
  return { ok: true, url: task.output?.[0] };
}

router.post("/", async (req, res) => {
  try {
    const { scenes, style = "3D Pixar cartoon, ultra vibrant", async = false } = req.body;

    console.log(`[VIDEO] Received video generation request. Scenes count: ${scenes?.length}, style: "${style}", async: ${async}`);

    if (!scenes?.length) {
      console.warn(`[VIDEO] [400] Rejected: scenes array is empty`);
      return res.status(400).json({ error: "scenes array is required" });
    }

    const apiKey = req.headers["x-runway-key"] || process.env.RUNWAY_API_KEY;
    if (!apiKey) {
      console.error(`[VIDEO] [503] Runway API Key not configured!`);
      return res.status(503).json({ error: "RUNWAY_API_KEY not configured" });
    }

    console.log(`[VIDEO] Authenticated with Runway key: ${apiKey.slice(0, 10)}...`);
    const client = new RunwayML({ apiKey });

    if (async) {
      console.log("⚡ [VIDEO] Starting Runway video tasks asynchronously...");
      const results = await Promise.all(
        scenes.map(async (scenePrompt, i) => {
          const fullPrompt = `${scenePrompt}. ${style}. Kids animation, vertical 9:16, smooth motion, bright lighting.`;
          try {
            console.log(`[VIDEO] [ASYNC] Submitting Scene ${i + 1}/${scenes.length} to Runway...`);
            const task = await client.textToVideo.create({
              model: "veo3.1",
              promptText: fullPrompt,
              ratio: "720:1280",  // portrait 9:16 for YouTube Shorts
              duration: 8,
            });
            console.log(`[VIDEO] [ASYNC] Scene ${i + 1} task created successfully. Task ID: ${task.id}`);
            return { scene: i + 1, ok: true, taskId: task.id };
          } catch (err) {
            console.error(`❌ [VIDEO] [ASYNC] Failed to submit Scene ${i + 1}:`, err.message);
            if (err.error) console.error(`[VIDEO] Runway Details:`, JSON.stringify(err.error));
            return { scene: i + 1, ok: false, error: err.message, runwayDetail: err.error };
          }
        })
      );

      const allOk = results.every(r => r.ok);
      console.log(`[VIDEO] [ASYNC] Submission batch finished. Successfully submitted: ${results.filter(r => r.ok).length}/${scenes.length}`);
      return res.json({ ok: allOk, async: true, tasks: results });
    }

    // Run all scenes in parallel synchronously (fallback mode)
    console.log(`[VIDEO] [SYNC] Running parallel sync generations...`);
    const results = await Promise.all(
      scenes.map(async (scenePrompt, i) => {
        try {
          const result = await generateSceneVideo(client, scenePrompt, style);
          return { scene: i + 1, ...result };
        } catch (err) {
          console.error(`❌ [VIDEO] [SYNC] Failed for Scene ${i + 1}:`, err.message);
          if (err.error) console.error(`[VIDEO] Runway Details:`, JSON.stringify(err.error));
          return { scene: i + 1, ok: false, error: err.message, runwayDetail: err.error };
        }
      })
    );

    const allOk = results.every(r => r.ok);
    console.log(`[VIDEO] [SYNC] Complete. Successfully completed: ${results.filter(r => r.ok).length}/${scenes.length}`);
    res.json({ ok: allOk, scenes: results });

  } catch (err) {
    console.error("❌ Video route general error:", err);
    res.status(500).json({ error: "Internal error", detail: err.message });
  }
});

// Check single task status
router.get("/task/:taskId", async (req, res) => {
  try {
    const apiKey = req.headers["x-runway-key"] || process.env.RUNWAY_API_KEY;
    if (!apiKey) {
      console.error(`[VIDEO/TASK] Runway API Key not configured!`);
      return res.status(503).json({ error: "RUNWAY_API_KEY not configured" });
    }

    const client = new RunwayML({ apiKey });
    console.log(`[VIDEO/TASK] Fetching status for task ID: ${req.params.taskId}`);
    const task = await client.tasks.retrieve(req.params.taskId);
    console.log(`[VIDEO/TASK] Status for ${req.params.taskId}: ${task.status}`);
    res.json(task);
  } catch (err) {
    console.error(`❌ [VIDEO/TASK] Error fetching status for ${req.params.taskId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;