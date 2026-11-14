"""Forced alignment without a speech recogniser.

1. Synthesise a reference reading of every line with the offline Piper voice (so each line's start/end is known).
2. Dynamic-time-warp the reference's MFCCs against the user's recording (same words, different voice).
3. Map every line boundary through the warping path and snap it to the nearest pause in the recording.
"""
import numpy as np, librosa
from piper import PiperVoice, SynthesisConfig

HOP = 0.02


def feats(a, sr):
    m = librosa.feature.mfcc(y=a.astype(np.float32), sr=sr, n_mfcc=20, hop_length=int(sr * HOP), n_fft=int(sr * 0.05))[1:]
    m = (m - m.mean(1, keepdims=True)) / (m.std(1, keepdims=True) + 1e-6)
    return m


def align(rec, sr, texts, model):
    v = PiperVoice.load(model, config_path=model + '.json')
    ref, bounds, rsr = [], [], None
    for t in texts:
        ch = list(v.synthesize(t, SynthesisConfig(length_scale=0.85))); a = np.concatenate([c.audio_float_array for c in ch]); rsr = ch[0].sample_rate
        e = np.abs(a) > 0.02; idx = np.where(e)[0]; a = a[max(0, idx[0] - 200): idx[-1] + 400] if len(idx) else a
        start = sum(len(x) for x in ref) / rsr; ref.append(a); bounds.append((start, start + len(a) / rsr)); ref.append(np.zeros(int(rsr * 0.3)))
    ref = np.concatenate(ref)
    ref = librosa.resample(ref.astype(np.float32), orig_sr=rsr, target_sr=sr)
    F1, F2 = feats(ref, sr), feats(rec, sr)
    D, wp = librosa.sequence.dtw(X=F1, Y=F2, metric='cosine', subseq=False)
    wp = wp[::-1]
    def mapt(t):  # reference time -> recording time
        f = int(round(t / HOP)); k = np.searchsorted(wp[:, 0], f); k = min(k, len(wp) - 1); return wp[k, 1] * HOP
    # pauses in the recording for snapping
    env = np.sqrt(np.convolve(rec ** 2, np.ones(int(sr * 0.02)) / int(sr * 0.02), mode='same'))
    quiet = env < 0.03 * env.max()
    segs = []
    for (s, e) in bounds:
        segs.append([mapt(s), mapt(e)])
    def snap(t, direction):
        i = int(t * sr); r = int(0.25 * sr)
        lo, hi = max(0, i - r), min(len(rec), i + r)
        q = np.where(quiet[lo:hi])[0]
        if len(q) == 0: return t
        j = q[np.argmin(np.abs(q - (i - lo)))] + lo
        return j / sr
    out = []
    for k, (s, e) in enumerate(segs):
        s2 = snap(s, -1); e2 = snap(e, 1)
        if e2 - s2 < 0.25: s2, e2 = s, e
        out.append((max(0, s2 - 0.03), min(len(rec) / sr, e2 + 0.05)))
    # make segments monotonic / non-overlapping
    for k in range(1, len(out)):
        if out[k][0] < out[k - 1][1]: m = (out[k][0] + out[k - 1][1]) / 2; out[k - 1] = (out[k - 1][0], m); out[k] = (m, out[k][1])
    return out
