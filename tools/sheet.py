#!/usr/bin/env python3
"""Contact sheet: python3 tools/sheet.py OUT.jpg COLS THUMB_W img1 img2 ... (labels = file names)"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
out, cols, tw = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
files = sys.argv[4:]
th = int(tw * 16 / 9); pad = 6; lab = 28
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (tw + pad) + pad, rows * (th + lab + pad) + pad), (12, 12, 20))
d = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', 20)
except Exception: font = ImageFont.load_default()
for k, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS)
    x = pad + (k % cols) * (tw + pad); y = pad + (k // cols) * (th + lab + pad)
    sheet.paste(im, (x, y + lab)); d.text((x + 4, y + 3), os.path.splitext(os.path.basename(f))[0], fill=(255, 255, 255), font=font)
sheet.save(out, quality=88)
