// Dump the voice/sfx/duration fields of shots.js to build/script.json for the audio builder.
import fs from 'node:fs';
import { shots } from '../shots.js';
fs.mkdirSync('build', { recursive: true });
const out = shots.map((s, i) => ({ n: i + 1, vo: s.vo || '', tts: s.tts || s.vo || '', whisper: !!s.whisper, dur: s.dur ?? null, extra: s.extra ?? 0, sfx: s.sfx || [] }));
fs.writeFileSync('build/script.json', JSON.stringify(out, null, 1));
console.log('script.json:', out.length, 'shots');
