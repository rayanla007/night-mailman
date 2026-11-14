#!/usr/bin/env bash
# Downloads the offline Piper voice "en-us-ryan-high" (MIT) from the Piper GitHub release.
set -euo pipefail
cd "$(dirname "$0")"; mkdir -p piper; cd piper
pip install piper-tts scipy >/dev/null
curl -sSL -o voice.tgz https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-ryan-high.tar.gz
tar xzf voice.tgz && rm voice.tgz
ls -la
