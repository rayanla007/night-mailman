#!/usr/bin/env bash
# Full pipeline: shot list -> voice/sfx/timing -> frames -> final.mp4 + stills sheet
set -euo pipefail
cd "$(dirname "$0")"
[ -d node_modules ] || npm install
[ -f tools/piper/en-us-ryan-high.onnx ] || bash tools/get_voice.sh || echo "No TTS voice: building with a silent voice track."
node tools/export_script.mjs
python3 tools/build_audio.py
node tools/render.mjs video                       # build/video.mp4 (silent)
ffmpeg -y -loglevel error -i build/video.mp4 -i build/mix.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out/final.mp4
node tools/render.mjs stills                      # build/stills/shotNN.jpg
python3 tools/stills_sheet.py                     # out/stills.jpg
echo "done: out/final.mp4  out/stills.jpg  out/voiceover.txt  out/captions.srt"
