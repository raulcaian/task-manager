"""Pre-render every car in every paint colour for the configurator.

Recolouring in the browser with blend modes tinted glass, tyres and rims
and looked flat on white cars. Instead, for each car photo this script
1. finds the painted body: the paint's own hue/brightness, then keeps only
   the largest connected area (so glass reflections, rims and tyres drop
   out) and fills small holes (badges, handles);
2. repaints it: the photo's brightness becomes the light and shadow of the
   new colour (worked out in linear light), and the brightest reflections
   are kept so the paint still looks glossy;
3. writes <slug>-<paint>.webp next to the original.

Usage (needs numpy, Pillow and opencv-python):
    python scripts/make_paint_variants.py
"""
import os

import cv2
import numpy as np
from PIL import Image

CARS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "media", "cars")

# Same colours as the paints table (seed_data.json); file names use the lower-case name.
PAINTS = {"red": "#b3121b", "blue": "#1f4fa3", "green": "#2f5d3a", "silver": "#a9adb3", "black": "#1a1b1d"}


def hsv(rgba):
    rgb = rgba[..., :3].astype(np.float32) / 255
    mx, mn = rgb.max(-1), rgb.min(-1)
    delta = np.maximum(mx - mn, 1e-6)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    hue = np.where(mx == r, ((g - b) / delta) % 6, np.where(mx == g, (b - r) / delta + 2, (r - g) / delta + 4)) * 60
    return hue, sat, mx


def near(hue, centre, width):
    return np.abs(((hue - centre + 180) % 360) - 180) < width


# What the original paint of each photo looks like.
BODY_COLOUR = {
    "911-carrera": lambda h, s, v: near(h, 48, 22) & (s > 0.35) & (v > 0.3),   # yellow
    "718-boxster": lambda h, s, v: near(h, 208, 25) & (s > 0.35) & (v > 0.18),  # blue
    "taycan": lambda h, s, v: (s < 0.16) & (v > 0.62),                          # white
    "cayenne": lambda h, s, v: near(h, 208, 28) & (s > 0.17) & (v > 0.22) & (v < 0.85),  # grey-blue
}


def body_mask(slug, rgba):
    h, s, v = hsv(rgba)
    mask = (BODY_COLOUR[slug](h, s, v) & (rgba[..., 3] > 200)).astype(np.uint8)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    opened = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)  # break thin bridges to rims/glass
    count, labels, stats, _ = cv2.connectedComponentsWithStats(opened, 8)
    body = (labels == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
    body = cv2.dilate(body, kernel) & mask  # grow back, only onto paint
    holes = (1 - body).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(holes, 8)
    for i in range(1, count):
        if stats[i, cv2.CC_STAT_AREA] < body.size * 0.0015:
            body[labels == i] = 1
    body = cv2.morphologyEx(body, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    return cv2.GaussianBlur(body.astype(np.float32), (0, 0), 1.2)


def to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def to_srgb(c):
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(np.clip(c, 0, None), 1 / 2.4) - 0.055)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def repaint(rgba, mask, hex_colour):
    rgb = rgba[..., :3].astype(np.float32) / 255
    luma = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    lo, hi = np.percentile(luma[mask > 0.5], [3, 97])
    light = np.clip((luma - lo) / max(hi - lo, 1e-3), 0, 1)       # 0 = shadow, 1 = highlight
    colour = to_linear(np.array([int(hex_colour[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255)
    painted = colour * (0.22 + 1.15 * light ** 1.15)[..., None]
    gloss = smoothstep(0.80, 1.0, light)[..., None] * 0.55
    painted = np.clip(to_srgb(painted * (1 - gloss) + 0.8 * gloss), 0, 1)
    out = rgb * (1 - mask[..., None]) + painted * mask[..., None]
    return np.dstack([(out * 255).round().astype(np.uint8), rgba[..., 3]])


def main():
    for slug in BODY_COLOUR:
        rgba = np.array(Image.open(os.path.join(CARS_DIR, f"{slug}.webp")).convert("RGBA"))
        mask = body_mask(slug, rgba)
        for name, hex_colour in PAINTS.items():
            path = os.path.join(CARS_DIR, f"{slug}-{name}.webp")
            Image.fromarray(repaint(rgba, mask, hex_colour)).save(path, quality=86, method=6)
            print("wrote", os.path.relpath(path))


if __name__ == "__main__":
    main()
