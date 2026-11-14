// Headless renderer: serves the repo, drives engine/index.html in Chromium (SwiftShader WebGL),
// and pipes JPEG frames into ffmpeg.
//   node tools/render.mjs video            -> build/video.mp4 (no audio)
//   node tools/render.mjs check [shots]    -> out/check/shotNN_{a,b,c}.jpg (start/mid/end of each shot)
//   node tools/render.mjs stills           -> build/stills/NN.jpg (mid frame of every shot)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const mode = process.argv[2] || 'video';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
page.on('pageerror', e => console.log('[pageerror]', e.message));
const TAG = process.env.TAG || '';
const BUILD = 'build' + (TAG ? '_' + TAG : '');
const qs = TAG ? `?shots=${process.env.SHOTS || 'shots_' + TAG + '.js'}&timing=${BUILD}/timing.json` : '';
await page.goto(`http://127.0.0.1:${port}/engine/index.html${qs}`);
await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 120000 });
const err = await page.evaluate(() => window.__error);
if (err) { console.error(err); process.exit(1); }
const b64 = s => Buffer.from(s.slice(s.indexOf(',') + 1), 'base64');

if (mode === 'video') {
  const n = await page.evaluate(() => window.__frameCount);
  const start = Number(process.argv[3] || 0), end = Number(process.argv[4] || n);
  const outFile = process.argv[5] || path.join(ROOT, 'build/video.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', '30', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = start; f < end; f++) {
    const d = await page.evaluate(([f, c]) => window.renderFrameJpeg(f, c), [f, !process.env.NO_CAPTIONS]);
    if (!ff.stdin.write(b64(d))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 30 === 0) console.log(`frame ${f}/${end}  ${((Date.now() - t0) / 1000 / (f - start + 1)).toFixed(2)}s/frame`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log('wrote', outFile);
} else if (mode === 'both') {
  // captioned -> build/video.mp4, clean -> build/video_clean.mp4 from a single render pass
  const n = await page.evaluate(() => window.__frameCount);
  const mk = file => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', '30', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffA = mk(path.join(ROOT, BUILD, 'video.mp4')), ffB = mk(path.join(ROOT, BUILD, 'video_clean.mp4'));
  const t0 = Date.now();
  for (let f = 0; f < n; f++) {
    const [clean, cap] = await page.evaluate(f => window.renderFrameBoth(f), f);
    if (!ffA.stdin.write(b64(cap))) await new Promise(r => ffA.stdin.once('drain', r));
    if (!ffB.stdin.write(b64(clean))) await new Promise(r => ffB.stdin.once('drain', r));
    if (f % 60 === 0) console.log(`frame ${f}/${n}  ${((Date.now() - t0) / 1000 / (f + 1)).toFixed(2)}s/frame`);
  }
  ffA.stdin.end(); ffB.stdin.end(); await Promise.all([ffA, ffB].map(p => new Promise(r => p.on('close', r))));
  console.log('wrote build/video.mp4 and build/video_clean.mp4');
} else {
  const shots = await page.evaluate(b => fetch('/' + b + '/timing.json').then(r => r.json()).then(t => t.shots.length), BUILD);
  const only = (process.argv[3] || '').split(',').filter(Boolean).map(Number);
  const dir = path.join(ROOT, mode === 'check' ? 'out/' + (TAG ? TAG + '/' : '') + 'check' : BUILD + '/stills');
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < shots; i++) {
    if (only.length && !only.includes(i + 1)) continue;
    const us = mode === 'check' ? [['a', 0.03], ['b', 0.5], ['c', 0.97]] : [['', 0.55]];
    for (const [tag, u] of us) {
      const d = await page.evaluate(([i, u]) => window.renderShotAt(i, u), [i, u]);
      fs.writeFileSync(path.join(dir, `shot${String(i + 1).padStart(2, '0')}${tag}.jpg`), b64(d));
    }
    console.log('shot', i + 1);
  }
}
await browser.close(); server.close();
