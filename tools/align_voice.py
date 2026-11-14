"""Split one recorded narration (e.g. an ElevenLabs file) into the script's lines.

Uses the pauses between lines: every silent run is a candidate cut, and dynamic programming picks
exactly (lines-1) cuts whose positions best match where each line *should* end (by text length),
preferring longer pauses. Returns [(start_s, end_s), ...] per line.
"""
import numpy as np


def rms_env(a, sr, win=0.02):
    n = max(1, int(sr * win)); return np.sqrt(np.convolve(a * a, np.ones(n) / n, mode='same'))


def silent_runs(a, sr, thr, min_len):
    e = rms_env(a, sr) < thr; runs = []; i = 0; N = len(e)
    while i < N:
        if e[i]:
            j = i
            while j < N and e[j]: j += 1
            if (j - i) / sr >= min_len: runs.append((i / sr, j / sr))
            i = j
        else: i += 1
    return runs


def align(a, sr, texts):
    K = len(texts)
    peak = np.abs(a).max() + 1e-9; a = a / peak
    env = rms_env(a, sr); voiced = np.where(env > 0.03)[0]
    t0, t1 = voiced[0] / sr, voiced[-1] / sr
    for thr, ml in [(0.02, 0.18), (0.025, 0.12), (0.035, 0.08), (0.05, 0.05)]:
        cands = [(s, e) for s, e in silent_runs(a, sr, thr, ml) if s > t0 + 0.05 and e < t1 - 0.05]
        if len(cands) >= K - 1: break
    if len(cands) < K - 1: raise SystemExit(f'only found {len(cands)} pauses for {K} lines: leave a clear pause between lines')
    w = np.array([max(4, len(t)) for t in texts], float); cum = np.cumsum(w)[:-1] / w.sum()
    T = t1 - t0; expect = t0 + cum * T
    mid = np.array([(s + e) / 2 for s, e in cands]); plen = np.array([e - s for s, e in cands])
    n = len(cands); INF = 1e18
    cost = np.full((K - 1, n), INF); back = np.zeros((K - 1, n), int)
    c = lambda k, j: abs(mid[j] - expect[k]) / T * 40 - np.log(plen[j] + 0.02) * 1.5
    for j in range(n): cost[0, j] = c(0, j)
    for k in range(1, K - 1):
        best, bi = INF, -1
        for j in range(n):
            if j - 1 >= 0 and cost[k - 1, j - 1] < best: best, bi = cost[k - 1, j - 1], j - 1
            if bi >= 0: cost[k, j] = best + c(k, j); back[k, j] = bi
    j = int(np.argmin(cost[K - 2])); picks = [j]
    for k in range(K - 2, 0, -1): j = back[k, j]; picks.append(j)
    picks = picks[::-1]
    bounds = [t0] + [mid[p] for p in picks] + [t1]
    segs = []
    for i in range(K):
        s, e = bounds[i], bounds[i + 1]
        if i > 0: s = cands[picks[i - 1]][1] - 0.02
        if i < K - 1: e = cands[picks[i]][0] + 0.03
        segs.append((max(0, s), e))
    return segs
