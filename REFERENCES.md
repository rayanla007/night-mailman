# Reference style & workflow (read this before making the next story)

## Reference accounts
- **jexario** (TikTok): posts the target style of blocky animated story videos. Ask the user to upload a few
  downloaded videos, because TikTok can't be streamed or downloaded from the cloud session. Study them with
  `ffmpeg -vf fps=1.5,scale=150:-1` contact sheets plus audio stats, as was done for the six examples in this project.

## What the reference videos have in common (learned from 6 examples)
- 2:15–2:30 long, a new shot every 1–1.5 s; first line is a "This town…" high-concept hook over a wide aerial shot.
- The story escalates through many locations: normal life → weird rule → disaster → kid hero finds the fix → twist ending.
- Bright, high-key, saturated look (even at night); crowds; giant objects; in-world signs, billboards and countdown clocks.
- Huge expressive face close-ups (round eyes, tears, sweat drops); first-person kid narrator with family and named characters.
- One-word yellow captions with a thick black outline in the lower third; game-style HUD (counters, warning badges, name tags).

## Voice workflow the user wants
1. Claude writes the script **one line per shot** (numbers spelled out) → the user generates it in ElevenLabs with **Adam**.
2. Apply **1.2x speed with pitch rising with speed (CapCut-style)**: `ffmpeg -af "asetrate=44100*1.2,aresample=44100"`.
3. Sync: `TAG=xx VOICE_FILE=voice/<file>.wav python3 tools/build_audio.py` (DTW alignment in tools/align_dtw.py),
   check `build_xx/voice_alignment.txt`, then `TAG=xx SHOTS=shots_xx.js node tools/render.mjs both`.
- The narrator is a boy (the user narrates as a boy, e.g. "Ryan").
