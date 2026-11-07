# -*- coding: utf-8 -*-
"""Generate the local artwork used by the BioAI 2026 site.

No network access is required. Run with the bundled Python runtime:
    python scripts/make_assets.py
"""
from __future__ import annotations

import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "img")
os.makedirs(IMG, exist_ok=True)

FONT_BD = r"C:\Windows\Fonts\msyhbd.ttc"
FONT_RG = r"C:\Windows\Fonts\msyh.ttc"
FONT_MONO = r"C:\Windows\Fonts\consola.ttf"
FONT_MONO_BD = r"C:\Windows\Fonts\consolab.ttf"

INK = (5, 13, 10)
INK_2 = (10, 25, 19)
PAPER = (243, 240, 232)
ACID = (216, 255, 95)
JADE = (53, 224, 176)
CORAL = (232, 106, 74)
MIST = (141, 171, 160)


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


def radial_array(w: int, h: int) -> np.ndarray:
    """Soft, layered colour field used as the base of the artwork."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    x = xx / w
    y = yy / h

    def glow(cx, cy, radius, strength):
        d = np.sqrt(((x - cx) * 1.15) ** 2 + (y - cy) ** 2)
        return np.exp(-(d / radius) ** 2) * strength

    base = np.zeros((h, w, 3), np.float32)
    base[:] = np.array(INK, np.float32)
    # Deep green pool, upper right.
    g1 = glow(0.68, 0.30, 0.42, 1.0)[..., None]
    base += g1 * np.array((9, 48, 35), np.float32)
    # Teal breath, lower left.
    g2 = glow(0.18, 0.82, 0.40, 1.0)[..., None]
    base += g2 * np.array((4, 31, 25), np.float32)
    # Warm ember behind the coral orb.
    g3 = glow(0.22, 0.68, 0.13, 1.0)[..., None]
    base += g3 * np.array((42, 14, 8), np.float32)
    # Gentle vertical falloff.
    base *= (0.92 - 0.22 * y)[..., None]
    return np.clip(base, 0, 255)


def flow_art(w: int, h: int, seed: int = 7) -> Image.Image:
    random.seed(seed)
    np.random.seed(seed)

    arr = radial_array(w, h).astype(np.uint8)
    base = Image.fromarray(arr, "RGB").convert("RGBA")

    # --- faint measurement grid ---------------------------------------------
    grid = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    step = 58
    for x in range(0, w, step):
        gd.line((x, 0, x, h), fill=(*PAPER, 7), width=1)
    for y in range(0, h, step):
        gd.line((0, y, w, y), fill=(*PAPER, 7), width=1)
    for x in range(0, w, step):
        for y in range(0, h, step):
            gd.ellipse((x - 1, y - 1, x + 1, y + 1), fill=(*ACID, 26))
    base = Image.alpha_composite(base, grid)

    # --- flowing filament field --------------------------------------------
    flow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fd = ImageDraw.Draw(flow)
    palette = [ACID, JADE, MIST, PAPER, JADE, ACID]
    for i in range(78):
        x = random.uniform(-40, w + 40)
        y = random.uniform(-40, h + 40)
        pts = []
        for _ in range(random.randint(45, 150)):
            angle = (
                2.15 * math.sin(x * 0.0042)
                + 1.55 * math.cos(y * 0.0034)
                + 0.75 * math.sin((x + y) * 0.0018)
                + random.uniform(-0.10, 0.10)
            )
            x += math.cos(angle) * 3.4
            y += math.sin(angle) * 3.4
            pts.append((x, y))
            if not (-80 < x < w + 80 and -80 < y < h + 80):
                break
        if len(pts) > 2:
            c = random.choice(palette)
            alpha = random.randint(14, 44)
            fd.line(pts, fill=(*c, alpha), width=random.choice((1, 1, 1, 2)), joint="curve")
    base = Image.alpha_composite(base, flow)

    # --- cell-like contours -------------------------------------------------
    cells = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cells)
    for i in range(42):
        cx = random.uniform(0.06, 0.94) * w
        cy = random.uniform(0.05, 0.95) * h
        rx = random.uniform(18, 118)
        ry = rx * random.uniform(0.55, 1.5)
        c = random.choice([ACID, JADE, PAPER, CORAL])
        cd.ellipse(
            (cx - rx, cy - ry, cx + rx, cy + ry),
            fill=(*c, random.randint(3, 9)),
            outline=(*c, random.randint(16, 35)),
            width=1,
        )
        if random.random() > 0.45:
            cd.ellipse(
                (cx - rx * 0.58, cy - ry * 0.58, cx + rx * 0.58, cy + ry * 0.58),
                outline=(*c, random.randint(10, 22)),
                width=1,
            )
        # a few dividing lines
        if random.random() > 0.72:
            cd.line(
                (cx - rx * 0.8, cy, cx + rx * 0.8, cy),
                fill=(*c, 12),
                width=1,
            )
    base = Image.alpha_composite(base, cells)

    # --- central double helix ----------------------------------------------
    helix_glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hg = ImageDraw.Draw(helix_glow)
    helix = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hd = ImageDraw.Draw(helix)

    cx0 = w * 0.655
    amp = w * 0.115
    top, bottom = -20, h + 20
    step = 11
    strand_a, strand_b = [], []
    phase = 0.28
    for y in range(int(top), int(bottom), step):
        t = y * 0.0165 + phase
        za = math.cos(t)
        zb = math.cos(t + math.pi)
        xa = cx0 + math.sin(t) * amp
        xb = cx0 + math.sin(t + math.pi) * amp
        strand_a.append((xa, y, za))
        strand_b.append((xb, y, zb))

    # Connecting rungs, stronger when they face the viewer.
    for i in range(0, len(strand_a), 3):
        xa, y, za = strand_a[i]
        xb, _, zb = strand_b[i]
        depth = max(0.0, (za + zb) * 0.5 + 0.5)
        alpha = int(10 + 34 * (1 - depth))
        hd.line((xa, y, xb, y), fill=(*PAPER, alpha), width=1)
        if i % 9 == 0:
            hg.line((xa, y, xb, y), fill=(*JADE, int(10 + 22 * depth)), width=2)

    # Backbones.
    hd.line([(x, y) for x, y, _ in strand_a], fill=(*JADE, 34), width=2)
    hd.line([(x, y) for x, y, _ in strand_b], fill=(*ACID, 34), width=2)

    # Nucleobases.
    for strand, warm in ((strand_a, False), (strand_b, True)):
        for x, y, z in strand:
            depth = (z + 1) * 0.5
            r = 1.4 + 3.8 * depth
            color = JADE if not warm else ACID
            a = int(45 + 185 * depth)
            hd.ellipse((x - r, y - r, x + r, y + r), fill=(*color, a))
            if depth > 0.62:
                hr = r * 4.2
                hg.ellipse((x - hr, y - hr, x + hr, y + hr), fill=(*color, int(18 * depth)))

    helix_glow = helix_glow.filter(ImageFilter.GaussianBlur(11))
    base = Image.alpha_composite(base, helix_glow)
    base = Image.alpha_composite(base, helix)

    # --- coral orb / specimen ----------------------------------------------
    orb_x, orb_y, orb_r = w * 0.225, h * 0.692, w * 0.072
    orb_glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    og = ImageDraw.Draw(orb_glow)
    og.ellipse(
        (orb_x - orb_r * 2.4, orb_y - orb_r * 2.4, orb_x + orb_r * 2.4, orb_y + orb_r * 2.4),
        fill=(*CORAL, 80),
    )
    orb_glow = orb_glow.filter(ImageFilter.GaussianBlur(46))
    base = Image.alpha_composite(base, orb_glow)

    orb = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(orb)
    od.ellipse((orb_x - orb_r, orb_y - orb_r, orb_x + orb_r, orb_y + orb_r), fill=(*CORAL, 226))
    od.ellipse(
        (orb_x - orb_r * 0.72, orb_y - orb_r * 0.72, orb_x + orb_r * 0.72, orb_y + orb_r * 0.72),
        fill=(*CORAL, 120),
    )
    od.arc(
        (orb_x - orb_r * 1.55, orb_y - orb_r * 1.55, orb_x + orb_r * 1.55, orb_y + orb_r * 1.55),
        198,
        348,
        fill=(*ACID, 150),
        width=2,
    )
    od.arc(
        (orb_x - orb_r * 1.95, orb_y - orb_r * 1.95, orb_x + orb_r * 1.95, orb_y + orb_r * 1.95),
        12,
        154,
        fill=(*PAPER, 55),
        width=1,
    )
    base = Image.alpha_composite(base, orb)

    # crosshair / measurement marks around the orb
    marks = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    md = ImageDraw.Draw(marks)
    md.line((orb_x - orb_r * 2.6, orb_y, orb_x - orb_r * 1.75, orb_y), fill=(*PAPER, 60), width=1)
    md.line((orb_x + orb_r * 1.75, orb_y, orb_x + orb_r * 2.6, orb_y), fill=(*PAPER, 60), width=1)
    md.line((orb_x, orb_y - orb_r * 2.6, orb_x, orb_y - orb_r * 1.75), fill=(*PAPER, 60), width=1)
    md.line((orb_x, orb_y + orb_r * 1.75, orb_x, orb_y + orb_r * 2.6), fill=(*PAPER, 60), width=1)
    base = Image.alpha_composite(base, marks)

    # --- grain + vignette ---------------------------------------------------
    rgb = np.array(base.convert("RGB"), dtype=np.float32)
    rng = np.random.default_rng(seed + 3)
    grain = rng.normal(0.0, 6.0, (h, w, 1)).repeat(3, axis=2)
    rgb = np.clip(rgb + grain, 0, 255)

    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    nx = (xx / w - 0.5) * 2
    ny = (yy / h - 0.5) * 2
    vig = np.clip(1.14 - 0.35 * (nx**2 + ny**2), 0.58, 1.0)[..., None]
    rgb = np.clip(rgb * vig, 0, 255)

    return Image.fromarray(rgb.astype(np.uint8), "RGB")


def draw_tracked(draw: ImageDraw.ImageDraw, xy, text, fnt, fill, tracking=0):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + tracking
    return x


def og_cover(w=1200, h=630) -> Image.Image:
    art = flow_art(w, h, seed=19).convert("RGBA")
    # Darken the left side so type remains crisp.
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for i in range(w // 2):
        a = int(225 * (1 - i / (w * 0.60)) ** 1.55)
        od.line((i, 0, i, h), fill=(*INK, a))
    art = Image.alpha_composite(art, overlay)

    d = ImageDraw.Draw(art)
    # Top rule
    d.rectangle((72, 72, 96, 78), fill=(*ACID, 255))
    draw_tracked(d, (112, 64), "BIO × AI  /  SYMPOSIUM 2026", font(FONT_MONO_BD, 20), (*ACID, 255), 1.6)

    f_title = font(FONT_BD, 88)
    draw_tracked(d, (70, 150), "生物 ×", f_title, (*PAPER, 255), -2)
    draw_tracked(d, (70, 252), "人工智能", f_title, (*PAPER, 255), -2)

    f_sym = font(FONT_BD, 40)
    draw_tracked(d, (74, 372), "研 讨 会", f_sym, (*JADE, 255), 4)
    d.text((74, 446), "BIOLOGICAL & ARTIFICIAL INTELLIGENCE", font=font(FONT_MONO, 19), fill=(*MIST, 255))

    d.line((74, 500, 688, 500), fill=(*PAPER, 55), width=1)
    d.text((74, 524), "2026.12.12  /  上海 · 张江", font=font(FONT_RG, 25), fill=(*PAPER, 240))
    d.text((74, 564), "线下 + 线上  ·  跨学科对话", font=font(FONT_RG, 19), fill=(*MIST, 230))

    # Corner registration marks
    for x, y, sx, sy in ((42, 42, 1, 1), (w - 42, 42, -1, 1), (42, h - 42, 1, -1), (w - 42, h - 42, -1, -1)):
        d.line((x, y, x + 18 * sx, y), fill=(*PAPER, 100), width=1)
        d.line((x, y, x, y + 18 * sy), fill=(*PAPER, 100), width=1)

    return art.convert("RGB")


def icon(size=512) -> Image.Image:
    scale = 4
    s = size * scale
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    radius = int(s * 0.22)
    d.rounded_rectangle((0, 0, s - 1, s - 1), radius=radius, fill=(*INK, 255))
    # subtle ring
    d.rounded_rectangle(
        (int(s * 0.045), int(s * 0.045), int(s * 0.955), int(s * 0.955)),
        radius=int(radius * 0.9),
        outline=(*JADE, 55),
        width=max(2, int(s * 0.006)),
    )
    # helix
    cx, amp = s * 0.5, s * 0.19
    pts_a, pts_b = [], []
    for i in range(0, 101):
        y = s * 0.16 + (s * 0.68) * i / 100
        t = i / 100 * math.pi * 6.4
        pts_a.append((cx + math.sin(t) * amp, y))
        pts_b.append((cx - math.sin(t) * amp, y))
    lw = max(3, int(s * 0.014))
    d.line(pts_a, fill=(*JADE, 255), width=lw, joint="curve")
    d.line(pts_b, fill=(*ACID, 255), width=lw, joint="curve")
    for i in range(0, 101, 6):
        xa, y = pts_a[i]
        xb, _ = pts_b[i]
        d.line((xa, y, xb, y), fill=(*PAPER, 90), width=max(2, int(s * 0.005)))
        r = s * 0.018
        d.ellipse((xa - r, y - r, xa + r, y + r), fill=(*JADE, 255))
        d.ellipse((xb - r, y - r, xb + r, y + r), fill=(*ACID, 255))
    # four corner dots
    r = s * 0.011
    for x, y in ((s * 0.16, s * 0.16), (s * 0.84, s * 0.16), (s * 0.16, s * 0.84), (s * 0.84, s * 0.84)):
        d.ellipse((x - r, y - r, x + r, y + r), fill=(*PAPER, 170))
    return im.resize((size, size), Image.LANCZOS)


def main() -> None:
    cover = flow_art(1400, 1750, seed=7)
    cover.save(os.path.join(IMG, "about-art.webp"), "WEBP", quality=84, method=6)
    cover.save(os.path.join(IMG, "about-art.jpg"), "JPEG", quality=88, optimize=True, progressive=True)

    og = og_cover()
    og.save(os.path.join(IMG, "og-cover.png"), "PNG", optimize=True)
    og.save(os.path.join(IMG, "og-cover.jpg"), "JPEG", quality=90, optimize=True, progressive=True)

    ic = icon(512)
    ic.save(os.path.join(IMG, "icon-512.png"), "PNG", optimize=True)
    ic.resize((192, 192), Image.LANCZOS).save(os.path.join(IMG, "icon-192.png"), "PNG", optimize=True)
    ic.resize((180, 180), Image.LANCZOS).save(os.path.join(IMG, "apple-touch-icon.png"), "PNG", optimize=True)

    print("wrote:", ", ".join(sorted(os.listdir(IMG))))


if __name__ == "__main__":
    main()
