# VibeForge — Unified Video Generation Studio

Auto-generate engaging 30-second shorts and videos end-to-end using AI.

## Folder Structure

```
kidsshorts-ai/
├── backend/
│   ├── routes/
│   │   ├── story.js        ← Claude API (Anthropic)
│   │   ├── voice.js        ← ElevenLabs TTS
│   │   ├── thumbnail.js    ← OpenAI DALL-E 3
│   │   ├── video.js        ← Runway Gen-3
│   │   ├── assemble.js     ← Creatomate
│   │   └── health.js       ← API key validation
│   ├── server.js           ← Express app (serves frontend + API)
│   ├── package.json
│   └── .env.example        ← Copy to .env and fill keys
├── frontend/
│   └── public/
│       └── index.html      ← Full studio UI
└── README.md
```

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Add your API keys

```bash
cp .env.example .env
# Edit .env and fill in your keys
```

| Key | Where to get it | Required |
|-----|-----------------|----------|
| `ANTHROPIC_API_KEY` | console.anthropic.com | ✅ Yes |
| `ELEVENLABS_API_KEY` | elevenlabs.io/api | ✅ Yes |
| `OPENAI_API_KEY` | platform.openai.com | For thumbnails |
| `RUNWAY_API_KEY` | app.runwayml.com/settings | For video clips |
| `CREATOMATE_API_KEY` | creatomate.com/dashboard | For final MP4 |

### 3. Run the server

```bash
cd backend
npm start
# or for dev with auto-reload:
npm run dev
```

Open: http://localhost:3000

## What Each Step Generates

| Step | API | Output | Real? |
|------|-----|--------|-------|
| 1. Story | Claude (Anthropic) | Title, story, 6 scene prompts, voice script, tags | ✅ Real |
| 2. Voiceover | ElevenLabs | MP3 audio, playable in browser | ✅ Real |
| 3. Thumbnail | DALL-E 3 | 1024×1792 character image | ✅ Real |
| 4. Video Clips | Runway Gen-3 | 6 × 5-second MP4 clips | ✅ Real (slow, ~15 min) |
| 5. Assembly | Creatomate | Final 1080×1920 MP4 with audio | ✅ Real |

## Cost Per Video (approximate)

| Service | Cost |
|---------|------|
| Claude (story) | ~$0.001 |
| ElevenLabs (voice) | ~$0.02 |
| DALL-E 3 (thumbnail) | ~$0.04 |
| Runway Gen-3 (6 clips) | ~$0.48 |
| Creatomate (assembly) | ~$0.50 |
| **Total** | **~$1.04–$3** |

## Demo Mode

You can demo the product with only `ANTHROPIC_API_KEY` + `ELEVENLABS_API_KEY` to show:
- Live story generation
- Real playable voiceover audio
- All 6 scene prompts ready for Runway

Toggle off "Video Clips" and "Assembly" in the Pipeline Options on the Generator page.
