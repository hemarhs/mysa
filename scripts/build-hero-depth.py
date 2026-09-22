#!/usr/bin/env python3
"""
Generate the depth map that drives the hero's 3D parallax.

    python3 scripts/build-hero-depth.py [source.jpg]

Writes public/images/hero-cup-depth.png — a greyscale map where white is
near and black is far. `HeroScene` samples it in the fragment shader to
displace the photograph by layer, which is what makes the cup stand in front
of the bed of beans when the cursor moves.

Why this rather than a monocular depth network: the hero is one photograph,
shot dark with a single lit subject, and it never changes. A 400MB model is a
lot of dependency to carry for one 32KB asset that is regenerated only when
the photograph is replaced. What the shader needs is not metric depth, it is
a smooth, plausible *ordering* of layers — and for a lit subject on a black
ground, three cues give that directly:

    luminance   the cup is the brightest thing in frame, the air is black
    ground      the bed of beans runs along the bottom, nearest the camera
    subject     a soft ellipse over the cup, so it separates from the bed

If you swap in a photograph with a different composition, adjust FOCUS below
(and the weights, if it is lit differently). Check the result by eye: it
should look like a soft, blurry version of the scene with the near things
bright — not like an edge-detected cutout. Crisp edges tear under parallax.

Requires Pillow and NumPy: pip install pillow numpy
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public" / "images" / "hero-cup.jpg"
TARGET = ROOT / "public" / "images" / "hero-cup-depth.png"

# Output size. The map is sampled as a smooth field, so it needs far less
# resolution than the photograph; 512×768 is already more than the parallax
# can resolve.
WIDTH, HEIGHT = 512, 768

# Where the subject sits in the frame, as (x, y) in 0–1, and how large it is.
FOCUS = (0.52, 0.68)
FOCUS_SIZE = (0.34, 0.24)

# How much each cue contributes.
W_LUMINANCE = 0.52
W_GROUND = 0.26
W_SUBJECT = 0.34


def build(source: Path, target: Path) -> None:
    image = Image.open(source).convert("RGB").resize((WIDTH, HEIGHT), Image.LANCZOS)

    # --- Luminance, blurred hard ---------------------------------------
    # A per-pixel matte would tear the image apart when it parallaxes. What
    # is wanted is a smooth depth *field*, so the luminance is blurred at a
    # radius of a few percent of the frame before it is used at all.
    grey = image.convert("L").filter(ImageFilter.GaussianBlur(radius=WIDTH * 0.035))
    lum = np.asarray(grey, dtype=np.float32) / 255.0
    lum = (lum - lum.min()) / max(1e-6, lum.max() - lum.min())
    lum = np.power(lum, 0.75)  # lift the midtones

    # --- Ground plane ---------------------------------------------------
    ys = np.linspace(0.0, 1.0, HEIGHT, dtype=np.float32)[:, None]
    ground = np.repeat(np.clip((ys - 0.42) / 0.58, 0.0, 1.0) ** 1.25, WIDTH, axis=1)

    # --- Subject --------------------------------------------------------
    xs = np.linspace(0.0, 1.0, WIDTH, dtype=np.float32)[None, :]
    subject = np.exp(
        -(
            ((xs - FOCUS[0]) / FOCUS_SIZE[0]) ** 2
            + ((ys - FOCUS[1]) / FOCUS_SIZE[1]) ** 2
        )
        * 2.2
    )

    depth = W_LUMINANCE * lum + W_GROUND * ground + W_SUBJECT * subject
    depth = np.clip(depth, 0.0, 1.0)
    depth = (depth - depth.min()) / max(1e-6, depth.max() - depth.min())

    out = Image.fromarray((depth * 255).astype("uint8")).filter(
        ImageFilter.GaussianBlur(radius=4)
    )
    out.save(target, optimize=True)
    print(f"wrote {target.relative_to(ROOT)} ({out.size[0]}×{out.size[1]})")


if __name__ == "__main__":
    src = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else SOURCE
    if not src.exists():
        raise SystemExit(f"source image not found: {src}")
    build(src, TARGET)
