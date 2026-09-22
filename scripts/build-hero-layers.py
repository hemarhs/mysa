"""
Cuts the hero photograph into the layers the page animates.

The brief was: use this photograph, take the black background off it, and let
the beans pour slowly from above while the cup steams. A photograph cannot do
that — everything in it happened in one thousandth of a second and then
stopped. So the frame is taken apart into the pieces that should move and the
piece that should not, and the scene puts them back together with time in
between.

Inputs
    scripts/source/hero-source.jpg      the original, 4000x6000

Outputs
    public/images/hero-cup.webp         the cup, its splash and its bed of
                                        grounds. Alpha, no background: the
                                        black of the photograph becomes the
                                        black of the page, so there is no
                                        rectangle anywhere on the hero.
    public/images/hero-cup-depth.png    greyscale depth for the parallax
    public/images/hero-bean-N.png       one airborne bean each, cut out at
                                        full resolution, alpha
    public/images/hero-steam.png        the plume, as a soft alpha field

How the cuts are made
    The background is very close to black, so LUMINANCE is the matte: alpha
    rises with brightness over a gentle curve. Gentle on purpose — a hard
    threshold leaves a crunchy edge around every bean.

    Above the cup rim the frame contains two different things, and saturation
    separates them cleanly. Roasted coffee is strongly warm (high saturation);
    steam is water vapour lit by the same lamp and has almost none. So:
    saturated blobs of a plausible size and solidity are beans, and what is
    left up there, once the beans are removed, is steam.

Run:  python3 scripts/build-hero-layers.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "scripts" / "source" / "hero-source.jpg"
OUT = ROOT / "public" / "images"

# The plate ships at this size; the source is far larger than any viewport.
PLATE = (1400, 2100)

# Row (in PLATE space) where the ceramic rim begins. Everything above it is
# air: beans and steam. Measured from the photograph, not guessed — the row
# profile jumps from ~15 bright pixels to ~360 across this line.
RIM_Y = 1120

# Luminance matte. Below LO the pixel is background, above HI it is subject.
KEY_LO, KEY_HI = 0.012, 0.16

# What counts as a bean.
#
# Selected by shape rather than by component id, because ids shift the moment
# anything upstream changes and a hardcoded list then silently cuts out the
# wrong things. The air above this cup also holds coffee droplets, a motion
# streak and a scatter of specks; all of them pass "warm and lit" and none of
# them should be tumbling down a hero. A bean is a solid, roughly oval blob of
# a plausible size, so that is what is asked for.
BEAN_MIN_AREA = 600
BEAN_MAX_AREA = 6000
BEAN_MIN_SIDE = 28
BEAN_MAX_SIDE = 130
BEAN_MIN_FILL = 0.45      # area / bounding box — rejects streaks and splashes
BEAN_ASPECT = (0.45, 2.2)
BEAN_MIN_LUM = 0.10       # mean luminance inside the blob; rejects silhouettes
MAX_BEANS = 8


def smoothstep(lo, hi, x):
    t = np.clip((x - lo) / (hi - lo), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def luminance(rgb):
    return (rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722) / 255.0


def saturation(rgb):
    mx = rgb.max(axis=2)
    mn = rgb.min(axis=2)
    return np.where(mx > 2, (mx - mn) / np.maximum(mx, 1), 0)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    full = Image.open(SOURCE).convert("RGB")
    plate_img = full.resize(PLATE, Image.LANCZOS)
    plate = np.asarray(plate_img, dtype=np.float32)
    h, w, _ = plate.shape
    scale = full.size[0] / w  # PLATE space -> source space

    lum = luminance(plate)
    sat = saturation(plate)

    # ---- find the airborne beans ----------------------------------------
    air = np.zeros((h, w), bool)
    air[:RIM_Y] = True

    warm = air & (lum > 0.045) & (sat > 0.35)
    warm = ndimage.binary_fill_holes(ndimage.binary_closing(warm, np.ones((5, 5))))
    labels, count = ndimage.label(warm)
    boxes = ndimage.find_objects(labels)

    areas = ndimage.sum(warm, labels, range(1, count + 1))

    candidates = []
    for component in range(1, count + 1):
        area = float(areas[component - 1])
        if not BEAN_MIN_AREA <= area <= BEAN_MAX_AREA:
            continue
        box = boxes[component - 1]
        bh = box[0].stop - box[0].start
        bw = box[1].stop - box[1].start
        if not (BEAN_MIN_SIDE <= bh <= BEAN_MAX_SIDE and BEAN_MIN_SIDE <= bw <= BEAN_MAX_SIDE):
            continue
        if area / (bh * bw) < BEAN_MIN_FILL:
            continue
        aspect = bw / bh
        if not BEAN_ASPECT[0] <= aspect <= BEAN_ASPECT[1]:
            continue
        inside = labels[box] == component
        brightness = float(lum[box][inside].mean())
        if brightness < BEAN_MIN_LUM:
            continue
        candidates.append((brightness, component, box))

    # Brightest first: those are the beans nearest the lamp, and they are the
    # ones that survive being scaled up in front of the camera.
    candidates.sort(reverse=True)

    bean_mask = np.zeros((h, w), bool)
    written = 0

    for _, component, box in candidates[:MAX_BEANS]:
        bean_mask |= labels == component

        # Cut the bean from the full-resolution original rather than from the
        # downscaled plate: these sprites are drawn large and close to the
        # camera, where the plate's own resampling would show.
        pad = 6
        y0 = max(0, box[0].start - pad)
        y1 = min(h, box[0].stop + pad)
        x0 = max(0, box[1].start - pad)
        x1 = min(w, box[1].stop + pad)

        hi_box = (
            int(x0 * scale),
            int(y0 * scale),
            int(x1 * scale),
            int(y1 * scale),
        )
        hi = np.asarray(full.crop(hi_box), dtype=np.float32)

        # The matte comes from the crop's own luminance, so a bean that was
        # caught mid-blur keeps its blur instead of being cut to a hard shape.
        alpha = smoothstep(0.02, 0.22, luminance(hi))
        alpha = ndimage.gaussian_filter(alpha, 2.0)

        sprite = Image.fromarray(
            np.dstack([hi.astype(np.uint8), (alpha * 255).astype(np.uint8)]), "RGBA"
        )
        # 256px is more than any bean occupies on a 1920 viewport.
        sprite.thumbnail((256, 256), Image.LANCZOS)
        sprite.save(OUT / f"hero-bean-{written}.png", optimize=True)
        written += 1

    # ---- the steam -------------------------------------------------------
    # What is left in the air once the beans are out, filtered to the cool,
    # unsaturated pixels that vapour actually is.
    #
    # Stopping short of the rim matters: the splash inside the cup is bright
    # and barely saturated, so it passes every test steam passes. Left in, it
    # becomes a solid white lump at the bottom of the texture, and the plume
    # reads as a cut-out cloud rather than vapour.
    column = np.zeros((h, w), bool)
    column[: RIM_Y - 130] = True
    steam = column & (~ndimage.binary_dilation(bean_mask, np.ones((25, 25)))) & (sat < 0.34)
    field = lum * steam

    # The plume is a diffuse thing photographed against black; treating it as
    # a soft field rather than a shape is what keeps it from looking cut out.
    # The gamma is well above 1 on purpose — it pushes the mid greys down and
    # leaves only the brightest filaments, which is all vapour ever is.
    field = ndimage.gaussian_filter(field, 7.0)
    field = np.clip((field - 0.02) / 0.30, 0, 1) ** 1.6
    field *= 0.72

    # Trim to where the plume actually is, so the texture is not mostly empty.
    ys, xs = np.nonzero(field > 0.06)
    if len(ys):
        sy0, sy1 = max(0, ys.min() - 20), min(h, ys.max() + 20)
        sx0, sx1 = max(0, xs.min() - 20), min(w, xs.max() + 20)
    else:  # pragma: no cover - the photograph has a plume
        sy0, sy1, sx0, sx1 = 0, RIM_Y, 0, w

    crop = field[sy0:sy1, sx0:sx1]
    tint = np.zeros((*crop.shape, 4), dtype=np.uint8)
    tint[..., 0] = 236
    tint[..., 1] = 236
    tint[..., 2] = 230
    tint[..., 3] = (crop * 255).astype(np.uint8)
    steam_img = Image.fromarray(tint, "RGBA").filter(ImageFilter.GaussianBlur(1.5))
    steam_img.thumbnail((512, 768), Image.LANCZOS)
    steam_img.save(OUT / "hero-steam.png", optimize=True)

    # ---- the plate -------------------------------------------------------
    # The cup, the splash and the grounds, with the air emptied out (its
    # contents are now sprites) and the background turned to alpha.
    keep = smoothstep(0.452, 0.503, np.arange(h, dtype=np.float32) / h)[:, None]
    body = plate * keep[..., None]

    body_blur = np.asarray(
        Image.fromarray(np.clip(body, 0, 255).astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(9)
        ),
        dtype=np.float32,
    )
    seam = (
        smoothstep(0.42, 0.48, np.arange(h, dtype=np.float32) / h)
        * (1.0 - smoothstep(0.483, 0.543, np.arange(h, dtype=np.float32) / h))
    )[:, None, None]
    body = body * (1.0 - seam) + body_blur * seam

    alpha = smoothstep(KEY_LO, KEY_HI, luminance(body))
    # Feather the outer edge so the plane can never show a straight border.
    ramp_x = smoothstep(0.0, 0.05, np.linspace(0, 1, w)) * smoothstep(
        0.0, 0.05, np.linspace(1, 0, w)
    )
    ramp_y = smoothstep(0.0, 0.03, np.linspace(0, 1, h)) * smoothstep(
        0.0, 0.03, np.linspace(1, 0, h)
    )
    alpha *= ramp_y[:, None] * ramp_x[None, :]

    # WebP, not PNG: this is the page's Largest Contentful Paint and it needs
    # an alpha channel, which rules out JPEG. The same picture as a PNG is
    # 1.7MB.
    Image.fromarray(
        np.dstack([np.clip(body, 0, 255).astype(np.uint8), (alpha * 255).astype(np.uint8)]),
        "RGBA",
    ).save(OUT / "hero-cup.webp", quality=86, method=6)

    # ---- depth -----------------------------------------------------------
    # Luminance, heavily blurred, plus a ground ramp: near enough for a
    # parallax displacement of a few UV units, and 25KB instead of a model.
    small = np.asarray(
        Image.fromarray(np.clip(body, 0, 255).astype(np.uint8))
        .convert("L")
        .resize((512, 768), Image.LANCZOS),
        dtype=np.float32,
    ) / 255.0
    depth = ndimage.gaussian_filter(small, 14.0)
    ground = np.linspace(0.18, 0.62, depth.shape[0])[:, None]
    depth = np.clip(depth * 0.62 + ground * 0.55, 0, 1)
    Image.fromarray((depth * 255).astype(np.uint8), "L").save(
        OUT / "hero-cup-depth.png", optimize=True
    )

    print(f"plate, depth, steam and {written} bean sprites written to {OUT}")


if __name__ == "__main__":
    main()
