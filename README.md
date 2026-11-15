# The Night Mailman

A 60-second vertical (1080x1920, 30 fps) blocky-character horror short, made with a small
Three.js animation engine that renders headlessly in Chromium (Playwright) and is stitched with ffmpeg.

**Outputs** (in `out/`)
- `final.mp4`: the finished short (H.264 + AAC)
- `stills.jpg`: one frame from each of the 30 shots, numbered, with its line
- `voiceover.txt`: every line with its start time ([W] = whispered)
- `captions.srt`: line-level subtitles. `captions_words.srt` has one word per subtitle.
- `voiceover.wav`: the voice track on its own

Style rules: [`style-rules.md`](style-rules.md).

## Build

```bash
bash build.sh        # npm install, voice download, audio, render, mux, stills sheet (~15 min on 4 CPUs)
```

Steps, if you want to run them one at a time:

| step | command | output |
|---|---|---|
| export the script | `node tools/export_script.mjs` | `build/script.json` |
| voice, word timing, SFX, mix | `python3 tools/build_audio.py` | `build/timing.json`, `build/mix.wav`, `out/voiceover.*`, `out/captions*.srt` |
| check frames | `node tools/render.mjs check [1,5,9]` | `out/check/shotNN{a,b,c}.jpg` (start/middle/end of each shot) |
| render | `node tools/render.mjs video` | `build/video.mp4` |
| stills | `node tools/render.mjs stills && python3 tools/stills_sheet.py` | `out/stills.jpg` |

Requirements: Node 18+, Python 3 with numpy, scipy and pillow, and ffmpeg. The voice is [Piper](https://github.com/rhasspy/piper),
an offline neural TTS: `tools/get_voice.sh` installs `piper-tts` and downloads the `en-us-ryan-high` voice.
Without it, `build_audio.py` still writes timings and the music/SFX bed, with no voice.

## Editing the film: `shots.js`

Each shot has a voice line, a set, a lighting preset, a camera move, and optional `setup` / `update`
functions that pose the characters. Shot length comes from the voice line, so if you change a line the
cut moves with it (use `dur:` to fix a length, or `extra:` to hold a shot for longer).

```js
{ vo: 'Light the lamp. Hurry.', set: 'bedroom', light: 'interiorDark',
  sfx: [{ type: 'click', at: 'u0.5' }, { type: 'chime', at: 'u0.5' }],
  setup(W) { W.put(W.chars.mia, [0.3, 0, -1.9], Math.PI); },
  update(W, t, u) { W.reach(W.chars.mia, 'R', [0.7, 0.72, -2.53]); W.props.lamp.setOn(u > 0.5 ? 1 : 0); },
  cam: { from: { pos: [1.75, 1, -1.35], look: [0.62, 0.72, -2.55], fov: 40 },
         to:   { pos: [1.9, 1.1, -1.2],  look: [0.62, 0.74, -2.55], fov: 42 }, ease: 'inOut', sway: 0.8 } }
```

- **Camera** (`engine/camera.js`): `pos`, `look`, `fov` (or `zoom`), `roll`, moved from `from` to `to`
  with an ease (`linear`, `in`, `out`, `inOut`, `snap`, `expoOut`). `sway` is handheld wobble in degrees.
  `cam` can also be a function `(t, u, W) => spec`, which is how the tracking shot works.
- **Characters** (`engine/character.js`): `makeCharacter({ skin, shirt, pants, hair, hairColor, scale, proportions, silhouette })`
  builds an R15-style rig (15 parts). It has `setPose({joint: [x,y,z]})`, `setFace('smile'|'creepy'|...)`,
  `reach(side, worldPoint)` (two-bone IK), and `attach(prop, joint)`.
- **World** (`engine/world.js`, `engine/props.js`): the town (main street with controllable lit and unlit windows, plus a
  merged background town), a bedroom, a hallway, and props: lamp, clock, envelope, letter, doors, sign, lantern, mail sack, curtains.
  Lighting presets: `night`, `dusk`, `interiorNight`, `interiorDark`, `morning`, `townFinal`.
- **SFX types**: `tick`, `click`, `slide`, `steps`, `run`, `chime`, `whoosh`, `wind`, `silence`.
  `at` is seconds into the shot, `'u0.5'` (a fraction of the shot), or `'end-0.5'`.

## Clip packs (stories 01–10)

One clean clip per script line (no captions, voice or music), with extra length to trim to your own voiceover.

| story | shot list | kit file |
|---|---|---|
| 01 Battery Town … 05 Floor Zero | `shots_s01.js` … `shots_s05.js` | `engine/v5.js` |
| 06 Pet Rain | `shots_s06.js` | `engine/v6.js` (yard, falling pets, Pebble) |
| 07 Shadow Shift | `shots_s07.js` | `engine/v7.js` (shadow crew, factory) |
| 08 Name Swap | `shots_s08.js` | `engine/v8.js` (name tags, library, cemetery, dusty room) |
| 09 Upside-Down Friday | `shots_s09.js` | `engine/v9.js` (flip props, cloud arms, windmill) |
| 10 Lost & Found | `shots_s10.js` | `engine/v10.js` (warehouse aisle, sleeping kids) |

```
SHOTS=shots_s06.js TAG=s06 node tools/export_script.mjs
NO_TTS=1 NO_MUSIC=1 EST_WPS=2.45 MIN_SHOT=1.8 TAG=s06 python3 tools/build_audio.py
TAG=s06 SHOTS=shots_s06.js QS=rs=0.667 node tools/render.mjs clips   # -> out/s06/clips/NN.mp4 (resumes if interrupted)
QS=rs=0.5 TAG=s06 SHOTS=shots_s06.js node tools/render.mjs check 3,7  # quick preview frames
```
