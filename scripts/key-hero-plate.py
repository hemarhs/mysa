"""
Prepares the hero photograph so that the flat <img> and the WebGL scene show
exactly the same picture.

Two passes, both idempotent, both run against public/images/hero-cup.jpg:

1. CLEAR THE AIR. The stock photograph has a steam plume and a shower of
   beans suspended above the cup. They were not wanted: they clutter the
   frame, they are the busiest thing on a page that is meant to read as calm,
   and they sat directly behind the headline. Everything above the splash is
   faded into the page colour over a soft ramp, so the cup keeps its splash
   and its bed of grounds and the air above it is simply air.

2. LUMINANCE KEY. The WebGL hero fades each pixel out as its luminance falls,
   which is what removes the photograph's rectangle — the dark parts of the
   picture *are* the page. The flat <img> cannot do that per pixel, so the
   same curve is baked in here. The shader still runs its key on top; on an
   already-keyed image that is very nearly a no-op.

       alpha = smoothstep(0.012, 0.16, luminance)
       out   = void * (1 - alpha) + pixel * alpha

Run:  python3 scripts/key-hero-plate.py
"""

from PIL import Image, ImageFilter
import numpy as np

SRC = "public/images/hero-cup.jpg"

# --color-void, the page behind the hero.
VOID = np.array([0x12, 0x0B, 0x07], dtype=np.float32)

# Must match PLATE_FRAGMENT in src/components/hero/HeroScene.tsx.
LO, HI = 0.012, 0.16

# Height fractions. Above KEEP_BELOW the frame is cleared; the ramp between
# the two is what stops the clearing from showing as a horizontal seam.
CLEAR_ABOVE = 0.452   # fully cleared at and above this line
KEEP_BELOW = 0.503    # untouched at and below this line (just over the splash)


def smoothstep(lo, hi, x):
    t = np.clip((x - lo) / (hi - lo), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


img = Image.open(SRC).convert("RGB")
w, h = img.size
a = np.asarray(img, dtype=np.float32)

# --- 1. clear the air -----------------------------------------------------
rows = np.arange(h, dtype=np.float32) / h
keep = smoothstep(CLEAR_ABOVE, KEEP_BELOW, rows)[:, None, None]
a = VOID * (1.0 - keep) + a * keep

# The ramp is smooth but the photograph's own grain is not, so a light blur
# across the transition band keeps it from reading as a gradient bar.
band = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
blurred = np.asarray(band.filter(ImageFilter.GaussianBlur(9)), dtype=np.float32)
edge = (smoothstep(CLEAR_ABOVE - 0.03, CLEAR_ABOVE + 0.03, rows)
        * (1.0 - smoothstep(KEEP_BELOW - 0.02, KEEP_BELOW + 0.04, rows)))[:, None, None]
a = a * (1.0 - edge) + blurred * edge

# --- 2. luminance key -----------------------------------------------------
lum = (a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722) / 255.0
alpha = smoothstep(LO, HI, lum)[..., None]
a = VOID * (1.0 - alpha) + a * alpha

Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(
    SRC, quality=88, optimize=True, progressive=True
)
print(f"prepared {SRC}: {w}x{h}")
