"""Original procedural score + extra SFX for The Night Mailman (no samples, no borrowed audio).

Stems (each a full-length mono array at SR):
  day     bouncy 107 BPM marimba/bass/clap groove in C major (the bright TikTok-story bed)
  box     slow music-box melody in A minor (night)
  creepy  the same music box, detuned (morning "something is wrong")
  tense   low pizzicato ticks, minor
  pulse   140 BPM chase ostinato + toms
  heart   heartbeat
  pad     warm relief chord swell
  drone   low drone
"""
import numpy as np
from scipy import signal

SR = 48000
rng = np.random.default_rng(11)


def midi(n): return 440.0 * 2 ** ((n - 69) / 12)


def lp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def bp(x, lo, hi, o=2): b, a = signal.butter(o, [lo / (SR / 2), hi / (SR / 2)], 'band'); return signal.lfilter(b, a, x)


def env(n, a=0.003, d=0.2):
    t = np.arange(n) / SR; e = np.exp(-t / d); na = max(1, int(a * SR)); e[:na] *= np.linspace(0, 1, na); return e


def place(buf, t, x, g=1.0):
    k = int(t * SR)
    if k >= len(buf) or k + len(x) <= 0: return
    if k < 0: x = x[-k:]; k = 0
    n = min(len(x), len(buf) - k); buf[k:k + n] += x[:n] * g


def reverb(x, secs=1.4, mix=0.25):
    n = int(secs * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / (secs / 4)); ir = lp(ir, 5000); ir /= np.sqrt((ir ** 2).sum())
    wet = signal.fftconvolve(x, ir)[:len(x)]
    return x * (1 - mix) + wet * mix * 1.5


# ---------- instruments ----------
def marimba(f, d=0.35):
    n = int(d * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.18) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / 0.03) + 0.1 * np.sin(2 * np.pi * f * 10 * t) * np.exp(-t / 0.01)
    return x * env(n, 0.002, 10)


def bell(f, d=1.8, detune=0.0):
    n = int(d * SR); t = np.arange(n) / SR; f = f * 2 ** (detune / 1200)
    x = (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.9) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.35)
         + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.12) + 0.15 * np.sin(2 * np.pi * f * 2.0 * t + 0.5) * np.exp(-t / 0.6))
    return x * env(n, 0.001, 10)


def pluck_bass(f, d=0.26):
    n = int(d * SR); t = np.arange(n) / SR
    saw = 2 * ((f * t) % 1) - 1
    return lp(saw, 900) * env(n, 0.003, 0.12) + 0.6 * np.sin(2 * np.pi * f * t) * env(n, 0.003, 0.2)


def kick():
    n = int(0.18 * SR); t = np.arange(n) / SR; f = 50 + 90 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.09)


def clap():
    n = int(0.16 * SR); x = bp(rng.standard_normal(n), 900, 4000)
    e = np.zeros(n)
    for o in (0, 0.012, 0.024): k = int(o * SR); e[k:] += env(n - k, 0.0005, 0.03 if o < 0.02 else 0.08)
    return x * e * 0.7


def hat(open_=False):
    n = int((0.12 if open_ else 0.04) * SR); return hp(rng.standard_normal(n), 7000) * env(n, 0.0005, 0.05 if open_ else 0.012) * 0.35


def tom(f=90):
    n = int(0.3 * SR); t = np.arange(n) / SR; fr = f * (1 + 0.6 * np.exp(-t / 0.04))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(n, 0.001, 0.14)


def pizz(f):
    n = int(0.25 * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.3 for k in range(1, 7))
    return lp(x, 1800) * env(n, 0.002, 0.07)


# ---------- stems ----------
def day_stem(N, bpm=107):
    out = np.zeros(N); beat = 60 / bpm; e8 = beat / 2; bar = beat * 4
    chords = [(48, [60, 64, 67]), (45, [57, 60, 64]), (41, [53, 57, 60]), (43, [55, 59, 62])]  # C Am F G
    mel = [  # 8 eighths per bar, midi or None
        [72, None, 76, 74, 72, None, 67, 69], [72, None, 69, 67, 64, None, 67, None],
        [69, None, 72, 74, 76, 74, 72, None], [74, None, 71, 72, 74, None, 79, None]]
    bars = int(N / SR / bar) + 2
    for b in range(bars):
        t0 = b * bar; root, tri = chords[b % 4]; m = mel[b % 4]
        for q in range(4):
            if q in (0, 2): place(out, t0 + q * beat, kick(), 0.9)
            if q in (1, 3): place(out, t0 + q * beat, clap(), 0.55)
        for e in range(8):
            place(out, t0 + e * e8, hat(e % 2 == 1), 0.5 if e % 2 else 0.3)
            bn = root + (12 if e in (2, 6) else 0)
            if e in (0, 2, 3, 4, 6): place(out, t0 + e * e8, pluck_bass(midi(bn)), 0.5)
            if m[e] is not None: place(out, t0 + e * e8, marimba(midi(m[e])), 0.42)
            if e in (1, 5): [place(out, t0 + e * e8, marimba(midi(n), 0.2), 0.12) for n in tri]
    return reverb(out, 0.9, 0.18)


def box_stem(N, detune=0.0, bpm=76, notes=None):
    out = np.zeros(N); beat = 60 / bpm
    notes = notes or [81, 84, 88, 86, 84, 81, 79, 81, 76, None, 77, 76, 74, 76, 72, None]
    t = 0.0; i = 0
    while t < N / SR:
        n = notes[i % len(notes)]
        if n is not None:
            dt = detune * (1 if i % 2 else -1) + (rng.uniform(-8, 8) if detune else 0)
            place(out, t, bell(midi(n), detune=dt), 0.35)
            if i % 4 == 0: place(out, t, bell(midi(n - 24), 2.5, dt), 0.18)
        t += beat / 2 * (1 + (0.04 * np.sin(i) if detune else 0)); i += 1
    return reverb(out, 2.0, 0.35)


def tense_stem(N, bpm=92):
    out = np.zeros(N); beat = 60 / bpm; seq = [45, 45, 48, 45, 44, 45, 52, 51]
    for i in range(int(N / SR / beat) + 1): place(out, i * beat, pizz(midi(seq[i % 8])), 0.6)
    return reverb(out, 1.2, 0.25)


def pulse_stem(N, bpm=140):
    out = np.zeros(N); e8 = 60 / bpm / 2
    for i in range(int(N / SR / e8) + 1):
        place(out, i * e8, pluck_bass(midi(33 + (12 if i % 8 == 7 else 0)), 0.2), 0.7)
        if i % 4 == 0: place(out, i * e8, tom(80), 0.8)
        if i % 8 == 6: place(out, i * e8, tom(120), 0.5)
    return out


def heart_stem(N, every=0.85):
    out = np.zeros(N)
    for i in range(int(N / SR / every) + 1):
        place(out, i * every, tom(48), 0.9); place(out, i * every + 0.18, tom(44), 0.6)
    return lp(out, 300)


def pad_stem(N):
    T = np.arange(N) / SR; x = np.zeros(N)
    for n in (48, 55, 60, 64, 67):
        f = midi(n); x += sum(np.sin(2 * np.pi * f * (1 + d) * T) for d in (-0.003, 0, 0.003)) / 3
    return lp(x, 1500) / 5


def drone_stem(N):
    T = np.arange(N) / SR
    d = (np.sin(2 * np.pi * 55 * T) + 0.8 * np.sin(2 * np.pi * 55.4 * T + 1) + 0.45 * np.sin(2 * np.pi * 82.4 * T) + 0.25 * np.sin(2 * np.pi * 110.3 * T))
    d *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.11 * T)
    d += lp(rng.standard_normal(N), 180, 2) * 1.8
    return d / np.abs(d).max()


def norm(x, peak=1.0): return x / (np.abs(x).max() + 1e-9) * peak


# mood -> stem gains
MOODS = {
    'day':    {'day': 0.55},
    'tense':  {'tense': 0.5, 'drone': 0.25},
    'night':  {'box': 0.45, 'drone': 0.18},
    'dread':  {'drone': 0.4, 'heart': 0.5},
    'chase':  {'pulse': 0.55, 'drone': 0.3, 'heart': 0.3},
    'relief': {'pad': 0.5, 'box': 0.2},
    'creepy': {'creepy': 0.45, 'drone': 0.1},
    'outro':  {'box': 0.45, 'drone': 0.35},
    'none':   {},
}


def score(N, starts, durs, moods, xfade=0.12):
    stems = {
        'day': norm(day_stem(N)), 'box': norm(box_stem(N)), 'creepy': norm(box_stem(N, detune=35, bpm=70, notes=[72, 76, 79, 76, 72, 74, 76, None])),
        'tense': norm(tense_stem(N)), 'pulse': norm(pulse_stem(N)), 'heart': norm(heart_stem(N)), 'pad': norm(pad_stem(N)), 'drone': norm(drone_stem(N)),
    }
    out = np.zeros(N); k = int(xfade * SR)
    for name, x in stems.items():
        g = np.zeros(N)
        for s, d, m in zip(starts, durs, moods):
            g[int(s * SR):int((s + d) * SR)] = MOODS.get(m, {}).get(name, 0.0)
        g = np.convolve(g, np.ones(k) / k, mode='same')
        out += x * g
    return out


# ---------- extra sound effects ----------
def growl(d=1.5, soft=False):
    n = int(d * SR); t = np.arange(n) / SR
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 23 * t + 2 * np.sin(2 * np.pi * 3 * t))
    x = bp(rng.standard_normal(n), 70, 400) * am + 0.5 * np.sin(2 * np.pi * 85 * t) * am
    e = np.clip(t / 0.15, 0, 1) * np.clip((d - t) / 0.25, 0, 1)
    return x * e * (0.5 if soft else 1.0)


def creak(d=1.2, short=False):
    d = 0.5 if short else d; n = int(d * SR); t = np.arange(n) / SR
    f = 180 + 120 * np.sin(2 * np.pi * 0.6 * t / d) + 30 * np.sin(2 * np.pi * 9 * t)
    ph = np.cumsum(f) / SR; x = 2 * ((ph) % 1) - 1
    x = bp(x, 300, 2500) * (0.5 + 0.5 * (np.sin(2 * np.pi * 37 * t) > 0))
    return x * np.clip(t / 0.05, 0, 1) * np.clip((d - t) / 0.1, 0, 1) * 0.5


def buzz(d=1.6):
    n = int(d * SR); t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * 60 * t)) * 0.3 + 0.2 * np.sin(2 * np.pi * 120 * t)
    gate = (np.sin(2 * np.pi * 7 * t + 3 * np.sin(2 * np.pi * 1.3 * t)) > -0.2).astype(float)
    return lp(x, 2000) * gate * np.clip((d - t) / 0.2, 0, 1) * 0.45


def boom():
    n = int(1.6 * SR); t = np.arange(n) / SR; f = 38 + 50 * np.exp(-t / 0.08)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.6) + lp(rng.standard_normal(n), 200) * np.exp(-t / 0.3) * 0.8
    return x * 0.9


def pop():
    n = int(0.12 * SR); t = np.arange(n) / SR; f = 600 * np.exp(-t / 0.03) + 300
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.04) * 0.6


# ---------- v3 additions ----------
def heroic_stem(N):
    return day_stem(N, bpm=128)


def siren(d=1.6):
    n = int(d * SR); t = np.arange(n) / SR
    f = 620 + 260 * np.sin(2 * np.pi * 1.6 * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(2 * np.pi * np.cumsum(f * 2) / SR)
    return lp(x, 3000) * np.clip(t / 0.08, 0, 1) * np.clip((d - t) / 0.2, 0, 1) * 0.45


def thuds(n=7, spread=0.5):
    out = np.zeros(int((spread + 0.6) * SR))
    for k in range(n): place(out, rng.uniform(0, spread), tom(rng.uniform(45, 80)), rng.uniform(0.4, 0.9))
    return lp(out, 900)


def ratchet():
    out = np.zeros(int(0.5 * SR))
    for k in range(6): place(out, k * 0.05, hp(rng.standard_normal(int(0.02 * SR)), 1500) * env(int(0.02 * SR), 0.0005, 0.006), 0.6)
    place(out, 0.32, tom(140), 0.5)
    return out


def ticktock(d=2.0):
    out = np.zeros(int(d * SR))
    for k in range(int(d / 0.5)):
        n = int(0.05 * SR); t = np.arange(n) / SR
        place(out, k * 0.5, np.sin(2 * np.pi * (2400 if k % 2 else 1700) * t) * env(n, 0.0005, 0.01), 0.5)
    return out


def clunk():
    return lp(tom(70) + 0.6 * bp(rng.standard_normal(int(0.3 * SR)), 300, 2000) * env(int(0.3 * SR), 0.001, 0.05), 2500)


def rumble(d=2.5):
    n = int(d * SR); t = np.arange(n) / SR
    return lp(rng.standard_normal(n), 120) * 3 * np.clip(t / 0.4, 0, 1) * np.clip((d - t) / 0.4, 0, 1)


def bark():
    out = np.zeros(int(0.5 * SR))
    for k in range(2):
        n = int(0.12 * SR); t = np.arange(n) / SR; f = 520 - 900 * t
        x = (2 * ((np.cumsum(f) / SR) % 1) - 1); x = bp(x, 300, 2500) * env(n, 0.003, 0.05)
        place(out, k * 0.2, x, 0.8)
    return out


def alarm(d=1.4):
    n = int(d * SR); t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * 880 * t)) * (np.sin(2 * np.pi * 4 * t) > 0)
    return lp(x, 2500) * 0.25


def splash():
    n = int(1.0 * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 400, 6000) * np.exp(-t / 0.25) * 0.8 + lp(tom(60), 400) * 0.6 * np.pad(np.ones(1), (0, n - 1))[:n] if False else bp(rng.standard_normal(n), 400, 6000) * np.exp(-t / 0.25) * 0.8


MOODS['heroic'] = {'heroic': 0.55}
_score_orig = score


def score(N, starts, durs, moods, xfade=0.12):  # noqa: F811  (adds the heroic stem)
    out = _score_orig(N, starts, durs, moods, xfade)
    if 'heroic' in moods:
        x = norm(heroic_stem(N)); g = np.zeros(N); k = int(xfade * SR)
        for s, d, m in zip(starts, durs, moods): g[int(s * SR):int((s + d) * SR)] = 0.55 if m == 'heroic' else 0
        out += x * np.convolve(g, np.ones(k) / k, mode='same')
    return out


def knock():
    out = np.zeros(int(1.0 * SR))
    for tt in [0, 0.18, 0.36]:
        th = tom(110) * 0.8; n = int(0.08 * SR); th[:n] += bp(rng.standard_normal(n), 300, 2500) * env(n, 0.0005, 0.02) * 0.6
        place(out, tt, lp(th, 3000), 0.9)
    return out


def crickets(d=2.0):
    n = int(d * SR); t = np.arange(n) / SR
    chirp = np.sin(2 * np.pi * 4300 * t) * (np.sin(2 * np.pi * 30 * t) > 0.3) * (np.sin(2 * np.pi * 1.6 * t) > 0)
    return chirp * 0.12
