"""Paint-only masks for the configurator: the body colour, without glass,
tyres, rims or lights. The garage recolours the photo only inside the mask.

Usage (needs Pillow and numpy):  python scripts/make_paint_masks.py
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
CARS = os.path.join(HERE, "..", "public", "media", "cars")
src = out = sys.argv[1] if len(sys.argv) > 1 else CARS

def hsv(a):
    rgb = a[..., :3].astype(np.float32) / 255
    mx = rgb.max(-1); mn = rgb.min(-1); d = np.maximum(mx - mn, 1e-6)
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, s, mx

def hue_near(h, c, w):
    return np.abs(((h - c + 180) % 360) - 180) < w

RULES = {
    # colourful paint: pick the paint hue
    '911-carrera': lambda h, s, v: hue_near(h, 48, 22) & (s > 0.35) & (v > 0.3),
    '718-boxster': lambda h, s, v: hue_near(h, 208, 25) & (s > 0.35) & (v > 0.18),
    # white paint: bright and nearly colourless
    'taycan': lambda h, s, v: (s < 0.16) & (v > 0.62),
    # grey-blue paint: bluish, mid brightness
    'cayenne': lambda h, s, v: hue_near(h, 208, 30) & (s > 0.12) & (v > 0.2) & (v < 0.85),
}

for name, rule in RULES.items():
    a = np.array(Image.open(os.path.join(src, name + '.webp')).convert('RGBA'))
    h, s, v = hsv(a)
    m = rule(h, s, v) & (a[..., 3] > 200)
    img = Image.fromarray((m * 255).astype(np.uint8))
    # close small gaps (reflections), drop specks, soften the edge
    img = img.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    img = img.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    img = img.filter(ImageFilter.GaussianBlur(1.2))
    mask = Image.new('LA', img.size, (0, 0)); mask.putalpha(img)
    mask.save(os.path.join(out, name + '-mask.webp'), quality=75)
    print(name, round(float(m.mean()), 3))
