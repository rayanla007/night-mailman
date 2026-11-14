#!/usr/bin/env python3
"""Voiceover (Piper TTS), word timings, sound design and mix for The Night Mailman.

Reads build/script.json (from tools/export_script.mjs). Writes:
  build/timing.json      shot start/durations + word-level caption timings (used by the renderer)
  build/mix.wav          final soundtrack (voice + drone + sfx)
  out/voiceover.wav      voice only
  out/voiceover.txt      each line with its start time
  out/captions.srt       line-level subtitles
  out/captions_words.srt one-word-at-a-time subtitles
"""
import json, os, re, subprocess, sys, tempfile
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import music as MU
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAG = os.environ.get('TAG', '')
B = lambda *p: os.path.join(ROOT, 'build' + ('_' + TAG if TAG else ''), *p)
O = lambda *p: os.path.join(ROOT, 'out' + ('/' + TAG if TAG else ''), *p)
os.makedirs(B(), exist_ok=True); os.makedirs(O(), exist_ok=True)
SR = 48000
TARGET = float(os.environ.get('TARGET_SECONDS', 78.0))
LEAD, TAIL, MIN_SHOT = 0.06, 0.24, float(os.environ.get('MIN_SHOT', 1.1))
rng = np.random.default_rng(7)

script = json.load(open(B('script.json')))
BED_ONLY = '--bed-only' in sys.argv  # music + SFX only, reusing build/timing.json -> out/no_voice.wav

# ---------------- voice ----------------
MODEL = os.path.join(ROOT, 'tools/piper', os.environ.get('VOICE', 'en-us-lessac-medium') + '.onnx')
voice = None
if os.path.exists(MODEL):
    from piper import PiperVoice, SynthesisConfig
    voice = PiperVoice.load(MODEL, config_path=MODEL + '.json')
else:
    print('!! Piper voice not found (run tools/get_voice.sh). Building silent voice track with estimated timings.')


def tts(text, ls):
    chunks = list(voice.synthesize(text, SynthesisConfig(length_scale=ls, noise_scale=0.6, noise_w_scale=0.7)))
    a = np.concatenate([c.audio_float_array for c in chunks]).astype(np.float64)
    sr = chunks[0].sample_rate  # 22050
    g = np.gcd(SR, sr)
    return signal.resample_poly(a, SR // g, sr // g)


def env_rms(a, win=0.02):
    n = int(SR * win)
    return np.sqrt(np.convolve(a * a, np.ones(n) / n, mode='same'))


def trim(a, thr=0.012):
    e = env_rms(a); idx = np.where(e > thr)[0]
    if len(idx) == 0: return a
    s, t = max(0, idx[0] - int(0.01 * SR)), min(len(a), idx[-1] + int(0.03 * SR))
    return a[s:t]


def whisperize(a):
    """Random-phase STFT resynthesis keeps the formants but removes the pitch -> whisper."""
    f, t, Z = signal.stft(a, SR, nperseg=512, noverlap=384)
    mag = np.abs(Z)
    ph = rng.uniform(-np.pi, np.pi, Z.shape)
    _, w = signal.istft(mag * np.exp(1j * ph), SR, nperseg=512, noverlap=384)
    w = w[:len(a)]
    b, a2 = signal.butter(2, 300 / (SR / 2), 'high'); w = signal.lfilter(b, a2, w)
    w = w / (np.abs(w).max() + 1e-9) * 0.9
    dry = signal.lfilter(*signal.butter(2, 1200 / (SR / 2), 'high'), a)
    out = 0.78 * w + 0.35 * dry / (np.abs(dry).max() + 1e-9)
    return out / (np.abs(out).max() + 1e-9) * 0.75


def synth_all(ls):
    lines = []
    for s in script:
        if not s['vo'] or voice is None: lines.append(None); continue
        a = trim(tts(s['tts'], ls))
        lines.append(a)
    return lines


def durations(lines, est_wps=float(os.environ.get('EST_WPS', 3.3))):
    ds = []
    for s, a in zip(script, lines):
        if s['dur']: ds.append(float(s['dur'])); continue
        if a is not None: L = len(a) / SR
        elif s['vo']: L = len(s['vo'].split()) / est_wps
        else: L = 0
        ds.append(max(MIN_SHOT, LEAD + L + TAIL) + s['extra'])
    return ds


# choose a speaking rate so the film lands on ~60 s
if BED_ONLY or os.environ.get('NO_TTS') == '1': voice = None  # NO_TTS=1: clip mode, durations estimated from the text
VOICE_FILE = os.environ.get('VOICE_FILE')  # your own recorded narration (one file, a pause between lines)
if VOICE_FILE and not BED_ONLY:
    import align_dtw
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', VOICE_FILE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    rec = np.frombuffer(raw, np.float32).astype(np.float64)
    spoken = [s for s in script if s['vo']]
    if os.environ.get('ALIGN_FROM'):  # reuse a previous cut list (same timeline, e.g. a different pitch treatment)
        segs = [tuple(map(float, l.split()[:2])) for l in open(os.environ['ALIGN_FROM']) if l.strip()]
    else:
        segs = align_dtw.align(rec, SR, [s['tts'] for s in spoken], os.path.join(ROOT, 'tools/piper/en-us-ryan-high.onnx'))
    it = iter(segs); lines = []
    for s in script:
        if not s['vo']: lines.append(None); continue
        a0, a1 = next(it); lines.append(rec[int(a0 * SR):int(a1 * SR)].copy())
        s['whisper'] = False  # keep the recorded performance as-is
    ls = 'recorded'; print('aligned', len(segs), 'lines from', VOICE_FILE)
    with open(B('voice_alignment.txt'), 'w') as f:
        for s, (a0, a1) in zip(spoken, segs): f.write(f"{a0:8.2f} {a1:8.2f}  {s['vo']}\n")
    voice = None
elif voice is not None:
    lo, hi = 0.7, 1.05; best = None
    for _ in range(7):
        mid = (lo + hi) / 2
        lines = synth_all(mid); tot = sum(durations(lines))
        best = (mid, lines, tot)
        print(f'length_scale {mid:.3f} -> {tot:.2f}s')
        if tot > TARGET: hi = mid
        else: lo = mid
        if abs(tot - TARGET) < 0.35: break
    ls, lines, tot = best
elif not VOICE_FILE or BED_ONLY:
    lines = [None] * len(script); ls = None

durs = durations(lines)
# snap to whole frames
durs = [round(d * 30) / 30 for d in durs]
starts = list(np.cumsum([0] + durs[:-1]))
total = float(sum(durs))
KEEP_TIMING = BED_ONLY or os.environ.get('KEEP_TIMING') == '1'  # reuse build/timing.json (video already rendered)
if KEEP_TIMING:
    _t = json.load(open(B('timing.json')))
    durs = [x['dur'] for x in _t['shots']]; starts = [x['start'] for x in _t['shots']]; total = _t['total']
print(f'total {total:.2f}s  (length_scale={ls})')

# ---------------- word timing ----------------
def syl(w):
    w = w.lower()
    if re.search(r'\d', w): return 4
    w = re.sub(r'[^a-z]', '', w)
    if not w: return 1
    n = len(re.findall(r'[aeiouy]+', w))
    if w.endswith('e') and n > 1 and not w.endswith('le'): n -= 1
    return max(1, n)


def voiced_segments(a, gap=0.085, thr=0.02):
    e = env_rms(a, 0.015) > thr
    segs, i, n = [], 0, len(a)
    while i < n:
        if e[i]:
            j = i
            while j < n and (e[j] or (j + int(gap * SR) < n and e[j:j + int(gap * SR)].any())): j += 1
            segs.append((i / SR, j / SR)); i = j
        else: i += 1
    return segs


def word_times(text, a, t0):
    words = text.split()
    L = len(a) / SR if a is not None else len(words) / 3.3
    groups, cur = [], []
    for w in words:
        cur.append(w)
        if re.search(r'[,.;:!?…]$', w) and w is not words[-1]: groups.append(cur); cur = []
    if cur: groups.append(cur)
    segs = voiced_segments(a) if a is not None else []
    out = []
    if a is not None and len(segs) == len(groups) and len(groups) > 1:
        spans = segs
    else:
        tot = sum(sum(syl(w) for w in g) for g in groups)
        spans, acc = [], 0
        for g in groups:
            k = sum(syl(w) for w in g) / tot
            spans.append((acc * L, (acc + k) * L)); acc += k
    for g, (s0, s1) in zip(groups, spans):
        ws = [syl(w) + 0.6 for w in g]; tot = sum(ws); acc = s0
        for w, k in zip(g, ws):
            d = (s1 - s0) * k / tot
            out.append({'text': w, 'start': t0 + acc, 'end': t0 + acc + d}); acc += d
    return out


words, vo_track = [], np.zeros(int(total * SR) + SR)
line_info = []
for i, (s, a) in enumerate(zip(script, lines)):
    if not s['vo']: continue
    t0 = starts[i] + LEAD
    if a is not None and s['whisper']: a = whisperize(a)
    if a is not None:
        a = a / (np.abs(a).max() + 1e-9) * (0.62 if s['whisper'] else 0.8)
        k = int(t0 * SR); vo_track[k:k + len(a)] += a[:len(vo_track) - k]
    ws = word_times(s['vo'], a, t0)
    shot_end = starts[i] + durs[i]
    for j, w in enumerate(ws):
        w['end'] = ws[j + 1]['start'] if j + 1 < len(ws) else min(shot_end - 0.02, w['end'] + 0.25)
        w['shot'] = i + 1
    # readability: every word at least MIN_WORD on screen (may lag the voice slightly, never past the shot)
    MINW = 0.2
    avail = shot_end - 0.02 - ws[0]['start']
    if any(w['end'] - w['start'] < MINW for w in ws):
        lens = [max(MINW, w['end'] - w['start']) for w in ws]
        if sum(lens) > avail: lens = [avail / len(ws)] * len(ws)
        acc = ws[0]['start']
        for w, d in zip(ws, lens): w['start'] = acc; w['end'] = acc + d; acc += d
    words += ws
    line_info.append((i + 1, s['vo'], t0, ws[-1]['end'], s['whisper']))

# enforce minimum on-screen time per word
MIN_WORD = 0.18
fast = [w for w in words if w['end'] - w['start'] < MIN_WORD]
for w in words:
    w['start'] = round(w['start'], 3); w['end'] = round(w['end'], 3)

if not KEEP_TIMING: json.dump({'fps': 30, 'total': total, 'lengthScale': ls,
           'shots': [{'n': i + 1, 'start': round(float(starts[i]), 4), 'dur': durs[i]} for i in range(len(durs))],
           'words': words}, open(B('timing.json'), 'w'), indent=1)

# ---------------- sound design ----------------
N = len(vo_track); T = np.arange(N) / SR
mix_sfx = np.zeros(N); drone = np.zeros(N)


def at_time(i, at):
    if isinstance(at, str):
        if at.startswith('u'): return starts[i] + float(at[1:]) * durs[i]
        if at.startswith('end'): return starts[i] + durs[i] + float(at[3:] or 0)
    return starts[i] + float(at)


def add(buf, t, a, gain=1.0):
    k = int(t * SR)
    if k >= len(buf): return
    n = min(len(a), len(buf) - k); buf[k:k + n] += a[:n] * gain


def adsr(n, a=0.005, r=0.2):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    tt = np.arange(n) / SR; e *= np.exp(-tt / r)
    return e


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band'); return signal.lfilter(b, a, x)


def lp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), 'low'); return signal.lfilter(b, a, x)


def tick(soft=False):
    n = int(0.06 * SR); tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 3100 * tt) * 0.6 + bp(rng.standard_normal(n), 2000, 7000) * 0.5) * adsr(n, 0.0005, 0.008)
    return x * (0.35 if soft else 0.8)


def click():
    n = int(0.05 * SR); x = bp(rng.standard_normal(n), 1500, 6000) * adsr(n, 0.0003, 0.006)
    return x * 0.9


def slide(d):
    n = int(d * SR); tt = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 1800, 6500, 2) * 0.6 + bp(rng.standard_normal(n), 300, 900) * 0.25
    env = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 0.7 * (0.7 + 0.3 * np.sin(2 * np.pi * 9 * tt))
    return x * env * 0.9


def step(heavy=True):
    n = int(0.35 * SR); tt = np.arange(n) / SR
    f = 55 if heavy else 90
    thump = np.sin(2 * np.pi * f * tt * (1 - 0.4 * tt)) * adsr(n, 0.002, 0.07 if heavy else 0.05)
    scuff = bp(rng.standard_normal(n), 400, 2500) * adsr(n, 0.001, 0.02)
    x = thump * 1.2 + scuff * (0.25 if heavy else 0.45)
    return lp(x, 2500) * (1.0 if heavy else 0.7)


def chime():
    n = int(2.6 * SR); tt = np.arange(n) / SR; x = np.zeros(n)
    for f0, g in [(880, 1.0), (1318.5, 0.6), (1760, 0.45)]:
        for ratio, pg, dec in [(1, 1, 1.4), (2.76, 0.35, 0.5), (5.4, 0.18, 0.25)]:
            x += g * pg * np.sin(2 * np.pi * f0 * ratio * tt) * np.exp(-tt / dec)
    pad = np.sin(2 * np.pi * 220 * tt) * 0.25 + np.sin(2 * np.pi * 330 * tt) * 0.15
    pad *= np.clip(tt / 0.25, 0, 1) * np.exp(-tt / 1.2)
    x = x * adsr(n, 0.002, 10) + pad
    return x / np.abs(x).max() * 0.55


def whoosh(low=False):
    d = 0.6; n = int(d * SR); tt = np.arange(n) / SR
    x = rng.standard_normal(n)
    x = bp(x, 150 if low else 400, 1200 if low else 4000)
    env = np.sin(np.pi * tt / d) ** 2
    return x * env * 0.35


def wind(d):
    n = int(d * SR); tt = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 250, 1400) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.8 * tt))
    env = np.clip(tt / 0.2, 0, 1) * np.clip((d - tt) / 0.3, 0, 1)
    return x * env * 0.4


mutes = []
for i, s in enumerate(script):
    for fx in s['sfx']:
        t = at_time(i, fx.get('at', 0)); ty = fx['type']
        if ty == 'tick':
            for k in range(fx.get('n', 1)): add(mix_sfx, t + k * fx.get('every', 0.5), tick(fx.get('soft')))
        elif ty == 'click': add(mix_sfx, t, click())
        elif ty == 'slide': add(mix_sfx, t, slide(fx.get('dur', 0.8)))
        elif ty == 'steps':
            for k in range(fx.get('n', 3)):
                g = (1 - k / fx.get('n', 3) * 0.6) if fx.get('fade') else 1.0
                add(mix_sfx, t + k * fx.get('every', 0.4), step(True), g)
        elif ty == 'run':
            for k in range(fx.get('n', 6)): add(mix_sfx, t + k * fx.get('every', 0.25), step(False), 0.8)
        elif ty == 'chime': add(mix_sfx, t, chime())
        elif ty == 'whoosh': add(mix_sfx, t, whoosh(fx.get('low')))
        elif ty == 'wind': add(mix_sfx, t, wind(fx.get('dur', 2)))
        elif ty == 'growl': add(mix_sfx, t, MU.growl(fx.get('dur', 1.5), fx.get('soft')), 0.9)
        elif ty == 'creak': add(mix_sfx, t, MU.creak(short=fx.get('short')))
        elif ty == 'buzz': add(mix_sfx, t, MU.buzz(fx.get('dur', 1.6)))
        elif ty == 'boom': add(mix_sfx, t, MU.boom(), 0.8)
        elif ty == 'pop': add(mix_sfx, t, MU.pop())
        elif ty == 'siren': add(mix_sfx, t, MU.siren(fx.get('dur', 1.6)))
        elif ty == 'thuds': add(mix_sfx, t, MU.thuds())
        elif ty == 'ratchet':
            for k in range(fx.get('n', 1)): add(mix_sfx, t + k * fx.get('every', 0.6), MU.ratchet())
        elif ty == 'ticktock': add(mix_sfx, t, MU.ticktock(fx.get('dur', 2.0)))
        elif ty == 'clunk': add(mix_sfx, t, MU.clunk())
        elif ty == 'rumble': add(mix_sfx, t, MU.rumble(fx.get('dur', 2.5)))
        elif ty == 'bark': add(mix_sfx, t, MU.bark())
        elif ty == 'alarm': add(mix_sfx, t, MU.alarm(fx.get('dur', 1.4)))
        elif ty == 'splash': add(mix_sfx, t, MU.splash())
        elif ty == 'knock': add(mix_sfx, t, MU.knock())
        elif ty == 'crickets': add(mix_sfx, t, MU.crickets(fx.get('dur', 2.0)))
        elif ty == 'silence': mutes.append((t, t + fx.get('dur', 0.5)))

# original score: per-shot moods crossfaded (see tools/music.py)
music = MU.score(N, starts, durs, [x.get('music', 'none') for x in script])
fade = np.clip(T / 0.3, 0, 1) * np.clip((total - T) / 0.8, 0, 1)
MUSIC_GAIN = 0.0 if os.environ.get('NO_MUSIC') == '1' else 0.5  # NO_MUSIC=1: voice + sound effects only
bed_mix = music * MUSIC_GAIN * fade + mix_sfx * 0.85

# hard silence windows (everything off, including voice)
for t0, t1 in mutes:
    k0, k1 = int(t0 * SR), int(t1 * SR)
    ramp = int(0.02 * SR)
    g = np.ones(N); g[k0:k1] = 0
    g[max(0, k0 - ramp):k0] = np.linspace(1, 0, k0 - max(0, k0 - ramp))
    bed_mix *= g; vo_track *= g

# light ducking of the bed under the voice
venv = np.convolve(np.abs(vo_track), np.ones(int(0.1 * SR)) / int(0.1 * SR), mode='same')
duck = 1 - 0.45 * np.clip(venv / 0.06, 0, 1)
mix = vo_track * 1.0 + bed_mix * duck
mix = mix[:int(total * SR)]
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
peak = np.abs(mix).max(); mix = mix / peak * 0.93


def wav(path, x):
    import wave
    x16 = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(x16.tobytes())


if BED_ONLY:
    wav(O('no_voice.wav'), mix / (np.abs(mix).max() + 1e-9) * 0.7); print('wrote out/no_voice.wav'); sys.exit(0)
wav(B('mix.wav'), mix)
wav(O('voiceover.wav'), vo_track[:int(total * SR)] / (np.abs(vo_track).max() + 1e-9) * 0.9)


def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f'{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}'.replace(',1000', ',999')


with open(O('voiceover.txt'), 'w') as f:
    f.write('THE NIGHT MAILMAN - voiceover script\n')
    f.write(f'Total length {total:.2f}s. Times are when each line starts. [W] = whisper.\n\n')
    for i, (s, st, d) in enumerate(zip(script, starts, durs)):
        tag = ' [W]' if s['whisper'] else ''
        f.write(f"{i + 1:2d}  {st:6.2f}s  (shot {d:.2f}s){tag}  {s['vo'] or '(no words)'}\n")
with open(O('captions.srt'), 'w') as f:
    for k, (n, text, t0, t1, wh) in enumerate(line_info, 1):
        f.write(f'{k}\n{ts(t0)} --> {ts(t1)}\n{text}\n\n')
with open(O('captions_words.srt'), 'w') as f:
    for k, w in enumerate(words, 1):
        f.write(f"{k}\n{ts(w['start'])} --> {ts(w['end'])}\n{w['text']}\n\n")

print(f'{len(words)} caption words; shortest {min(w["end"] - w["start"] for w in words):.3f}s')
if fast: print('words under %.2fs:' % MIN_WORD, [(w['text'], round(w['end'] - w['start'], 3)) for w in fast])
