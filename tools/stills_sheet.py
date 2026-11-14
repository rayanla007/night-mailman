#!/usr/bin/env python3
"""Stills sheet: one mid-shot frame per shot, numbered, with its voice line. -> out/stills.jpg"""
import json, os
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAG = os.environ.get('TAG', '')
BD = 'build' + ('_' + TAG if TAG else ''); OD = 'out' + ('/' + TAG if TAG else '')
script = json.load(open(os.path.join(ROOT, BD, 'script.json')))
timing = json.load(open(os.path.join(ROOT, BD, 'timing.json')))
cols, tw = 6, 300; th = int(tw * 16 / 9); lab = 70; pad = 10
rows = (len(script) + cols - 1) // cols
W, H = cols * (tw + pad) + pad, rows * (th + lab + pad) + pad + 90
sheet = Image.new('RGB', (W, H), (10, 12, 26)); d = ImageDraw.Draw(sheet)
F = lambda s: ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', s)
d.text((pad, 20), (os.environ.get('TITLE') or 'THE NIGHT MAILMAN') + '  -  stills sheet (mid-frame of every shot)', fill=(255, 210, 120), font=F(36))
for i, s in enumerate(script):
    im = Image.open(os.path.join(ROOT, f'{BD}/stills/shot{i + 1:02d}.jpg')).convert('RGB').resize((tw, th), Image.LANCZOS)
    x = pad + (i % cols) * (tw + pad); y = 90 + pad + (i // cols) * (th + lab + pad)
    sheet.paste(im, (x, y))
    st = timing['shots'][i]
    d.text((x, y + th + 4), f"{i + 1:02d}   {st['start']:.1f}s  ({st['dur']:.1f}s)", fill=(255, 255, 255), font=F(18))
    line = s['vo'] or '(no words)'
    words, cur, lines = line.split(), '', []
    for w in words:
        if len(cur + ' ' + w) > 34: lines.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
    lines.append(cur)
    for k, l in enumerate(lines[:2]): d.text((x, y + th + 26 + k * 20), l, fill=(170, 185, 230), font=F(15))
sheet.save(os.path.join(ROOT, OD, 'stills.jpg'), quality=90)
print('wrote out/stills.jpg', sheet.size)
