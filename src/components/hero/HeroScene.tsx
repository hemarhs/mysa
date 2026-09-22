"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import type { SceneTier } from "@/lib/motion";

/* ==========================================================================
   The hero, as an actual three-dimensional scene.
   --------------------------------------------------------------------------
   The photograph is not an <img> sitting behind the type. It is a textured
   surface inside a WebGL scene, driven by a depth map.

   Two things make it read as space rather than as a picture:

   1. DEPTH PARALLAX. A greyscale depth map accompanies the photograph. In
      the fragment stage the sampling coordinate is displaced by
      (depth − mid) × pointer, so the cup, the bed of beans and the dark air
      behind them all shift by different amounts as the cursor moves. That
      differential is what the eye reads as depth; a whole image sliding as
      one piece is what the eye reads as a sticker.

      It is done in the fragment stage rather than by displacing vertices.
      Vertex displacement tears a silhouette apart wherever depth changes
      abruptly — exactly where the cup meets the black behind it, which is
      the one edge in this frame that has to hold.

   2. LUMINANCE KEYING. The photograph's background is near-black, and so is
      the page. The shader fades alpha out as luminance falls, so the frame
      has no edge at all: the lit cup and the lit beans are simply present in
      the page, and the dark parts *are* the page. This is what removes the
      "photo pasted on top" quality — there is no rectangle left to see.

   Nothing else is in the frame. An earlier pass added instanced beans, steam
   plumes and gold dust in front of the cup; they cluttered a photograph that
   already has its own splash and bed of grounds, and — being the only thing
   the flat first paint could not show — they were also what made the
   handover to WebGL visible on reload.

   The depth map is generated offline (see scripts/build-hero-depth.py) and
   ships as a 32KB PNG. There is no model to load at runtime.
   ========================================================================== */

const PHOTO_URL = "/images/hero-cup.jpg";
const DEPTH_URL = "/images/hero-cup-depth.png";
/** The source photograph is 2:3 portrait. */
const PHOTO_ASPECT = 1400 / 2100;

/**
 * The fraction of the viewport width the plate occupies on a wide screen.
 *
 * This number is shared with the CSS fallback in HeroStage (`md:w-[64%]`) and
 * it has to stay shared. When the two disagreed, `object-fit: cover` and the
 * shader's cover maths cropped the photograph to different rectangles, and the
 * handover from the flat image to the scene showed the cup visibly jump in
 * size and position — the "two interfaces colliding" on every reload.
 *
 * With one width, both paths compute the same crop and the crossfade is
 * invisible.
 */
const PLATE_WIDTH = 0.64;
/** Right-aligned: the plate's centre sits this far across the viewport. */
const PLATE_CENTRE = 1 - PLATE_WIDTH / 2;
/** Matches `object-position: 58%` vertically on the CSS fallback. */
const PLATE_FOCUS_Y = -0.028;

/* --------------------------------------------------------------------------
   The depth-parallax surface
   -------------------------------------------------------------------------- */

const PLATE_VERTEX = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PLATE_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform sampler2D uPhoto;
  uniform sampler2D uDepth;
  uniform vec2 uPointer;     // −1…1, already smoothed
  uniform float uTime;
  uniform float uPlaneAspect;
  uniform float uPhotoAspect;
  uniform vec2 uFocus;       // which part of the photo to keep in frame
  uniform float uStrength;   // parallax amount, in UV units
  uniform float uZoom;

  varying vec2 vUv;

  /* Object-fit: cover, in UV space. Doing the fit here rather than by
     resizing the plane means the scene stays correct at every viewport
     aspect without any JavaScript re-layout. */
  vec2 coverUv(vec2 uv) {
    vec2 scaled = uv;
    float ratio = uPlaneAspect / uPhotoAspect;

    if (ratio > 1.0) {
      scaled.y = (uv.y - 0.5) / ratio + 0.5;
    } else {
      scaled.x = (uv.x - 0.5) * ratio + 0.5;
    }

    // A slow breath, so the frame is never completely still.
    float breathe = 1.0 + sin(uTime * 0.12) * 0.012;
    scaled = (scaled - 0.5) / (uZoom * breathe) + 0.5;

    return scaled + uFocus;
  }

  void main() {
    vec2 base = coverUv(vUv);

    // First pass: read depth at the unshifted position.
    float d0 = texture2D(uDepth, clamp(base, 0.0, 1.0)).r;

    // Displace, then re-read depth at the displaced position and displace
    // again. Two iterations is enough to stop the near layer smearing over
    // the far one at the silhouette, and costs one extra texture fetch.
    vec2 shift = (d0 - 0.45) * uStrength * uPointer;
    float d1 = texture2D(uDepth, clamp(base + shift, 0.0, 1.0)).r;
    vec2 finalShift = (d1 - 0.45) * uStrength * uPointer;

    vec2 uv = base + finalShift;

    // Outside the photograph entirely: nothing to draw.
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      discard;
    }

    vec4 photo = texture2D(uPhoto, uv);
    float depth = texture2D(uDepth, uv).r;

    float lum = dot(photo.rgb, vec3(0.2126, 0.7152, 0.0722));

    /* Luminance key. The photograph's ground is near-black and so is the
       page, so fading alpha with luminance dissolves the frame's edge
       completely. The curve is deliberately gentle: a hard cut would leave a
       crunchy matte around the beans. */
    float alpha = smoothstep(0.012, 0.16, lum);

    // Feather the outer few percent as well, so the plane cannot show a
    // straight edge even where the photograph happens to be bright.
    vec2 edge = smoothstep(vec2(0.0), vec2(0.07), uv) *
                smoothstep(vec2(0.0), vec2(0.07), 1.0 - uv);
    alpha *= edge.x * edge.y;

    vec3 color = photo.rgb;

    // Warm the near field and cool the far field very slightly — the same
    // trick a colourist uses to separate a subject from its background.
    color = mix(color * vec3(0.94, 0.95, 1.0), color * vec3(1.06, 1.01, 0.95), depth);

    // A brass sheen that travels with the pointer across the near surfaces.
    float sheen = exp(-pow(distance(uv, vec2(0.5 + uPointer.x * 0.12, 0.62 + uPointer.y * 0.08)), 2.0) * 9.0);
    color += vec3(0.79, 0.63, 0.36) * sheen * depth * 0.09;

    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

/**
 * Loads and configures the two textures this scene owns.
 *
 * Deliberately not `useLoader`: that hook hands back cached textures owned by
 * the loader, and configuring them means mutating a value this component did
 * not create — which the React compiler is right to object to, and which
 * would also leak settings into any other component that loaded the same URL.
 * Loading them here makes ownership unambiguous, including disposal.
 */
function useHeroTextures() {
  const [textures, setTextures] = useState<{
    photo: THREE.Texture;
    depth: THREE.Texture;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();

    const load = (url: string) =>
      new Promise<THREE.Texture>((resolve, reject) =>
        loader.load(url, resolve, undefined, reject)
      );

    Promise.all([load(PHOTO_URL), load(DEPTH_URL)])
      .then(([photo, depth]) => {
        if (cancelled) {
          photo.dispose();
          depth.dispose();
          return;
        }

        for (const texture of [photo, depth]) {
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.generateMipmaps = false;
        }

        photo.colorSpace = THREE.SRGBColorSpace;
        // The depth map is data, not a picture — reading it through the sRGB
        // transfer function would bend every distance in the scene.
        depth.colorSpace = THREE.NoColorSpace;

        setTextures({ photo, depth });
      })
      .catch((error) => {
        // The flat <img> underneath is still on screen, so a failed texture
        // load costs the 3D effect and nothing else.
        console.warn("[mysa] hero textures unavailable:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!textures) return;
    return () => {
      textures.photo.dispose();
      textures.depth.dispose();
    };
  }, [textures]);

  return textures;
}

function DepthPlate({ pointer, tier }: { pointer: React.RefObject<THREE.Vector2>; tier: SceneTier }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const viewport = useThree((state) => state.viewport);
  const size = useThree((state) => state.size);
  const textures = useHeroTextures();

  const photo = textures?.photo ?? null;
  const depth = textures?.depth ?? null;

  const uniforms = useMemo(
    () => ({
      uPhoto: { value: photo },
      uDepth: { value: depth },
      uPointer: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uPlaneAspect: { value: 1 },
      uPhotoAspect: { value: PHOTO_ASPECT },
      // Slides the visible window down the photograph so the cup and the
      // bed of beans are in frame and the empty black above them is not.
      uFocus: { value: new THREE.Vector2(0.0, PLATE_FOCUS_Y) },
      uStrength: { value: tier === "full" ? 0.125 : 0.08 },
      // No extra zoom: `cover` against a plane of the same shape as the CSS
      // box already produces the same crop.
      uZoom: { value: 1.0 },
    }),
    [photo, depth, tier]
  );

  useFrame((state, delta) => {
    const mat = material.current;
    if (!mat) return;

    mat.uniforms.uTime.value += delta;
    // The shader's `cover` fit needs the *plane's* aspect, not the canvas's.
    // The breakpoint is in CSS pixels so that it matches Tailwind's `md`
    // exactly — the CSS fallback switches to the narrow layout at the same
    // width, and a mismatch here would reintroduce the crop jump.
    const wideNow = state.size.width >= 768;
    const planeW = state.viewport.width * (wideNow ? PLATE_WIDTH : 1);
    mat.uniforms.uPlaneAspect.value = planeW / state.viewport.height;

    const target = pointer.current;
    if (target) {
      // Heavily damped. The parallax should feel like the scene has weight,
      // not like it is glued to the cursor.
      mat.uniforms.uPointer.value.lerp(target, 0.035);
    }
  });

  // Nothing to draw until both textures have arrived; the flat image is
  // still visible underneath until the handover.
  if (!photo || !depth) return null;

  /* The plate occupies the same rectangle as the CSS fallback: right-aligned,
     PLATE_WIDTH of the viewport on a wide screen, full width on a narrow one.

     Sizing the plane to the whole viewport was the first attempt, and it
     stretched a 2:3 portrait across a 16:9 frame: `cover` then cropped to the
     middle 40% of the photograph and arrived as an enormous close-up of the
     rim. The plane has to be the shape of the hole it is filling before
     `cover` means anything sensible. */
  const wide = size.width >= 768;
  const planeWidth = viewport.width * (wide ? PLATE_WIDTH : 1);
  const planeX = wide ? viewport.width * (PLATE_CENTRE - 0.5) : 0;

  return (
    <mesh position={[planeX, 0, 0]}>
      <planeGeometry args={[planeWidth, viewport.height, 1, 1]} />
      <shaderMaterial
        ref={material}
        vertexShader={PLATE_VERTEX}
        fragmentShader={PLATE_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/* --------------------------------------------------------------------------
   Camera
   -------------------------------------------------------------------------- */

/**
 * A slow dolly and orbit driven by the pointer.
 *
 * This is the other half of the 3D read. Parallax inside the photograph says
 * "this image has depth"; moving the camera through the scene says "you are
 * looking into a space". The movement is a couple of degrees, damped hard,
 * and it always returns to centre.
 */
function CameraRig({ pointer }: { pointer: React.RefObject<THREE.Vector2> }) {
  useFrame((state, delta) => {
    const target = pointer.current;
    if (!target) return;

    // Taken from the frame state rather than destructured from useThree() in
    // render: the camera is an object this component animates, not a value it
    // reads, and reaching for it here keeps that honest.
    const camera = state.camera;

    const tx = target.x * 0.33;
    const ty = target.y * 0.22;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, tx, 1.6, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, ty, 1.6, delta);
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      5 - Math.abs(target.y) * 0.12 + Math.sin(state.clock.elapsedTime * 0.14) * 0.05,
      1.2,
      delta
    );
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* --------------------------------------------------------------------------
   Plumbing
   -------------------------------------------------------------------------- */

function usePointerTracking() {
  const pointer = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (event: PointerEvent) => {
      pointer.current.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -((event.clientY / window.innerHeight) * 2 - 1)
      );
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return pointer;
}

/**
 * Pauses the render loop whenever the canvas is off-screen or the tab is in
 * the background, and releases the WebGL context on unmount.
 *
 * The single most valuable thing in the file for battery life: a hero canvas
 * that keeps rendering while the visitor reads the menu three screens down is
 * pure waste, and it is invisible in testing because everything still looks
 * right.
 */
function RenderGate({ active }: { active: boolean }) {
  const setFrameloop = useThree((state) => state.setFrameloop);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    setFrameloop(active ? "always" : "never");
  }, [active, setFrameloop]);

  useEffect(() => {
    return () => {
      gl.setAnimationLoop(null);
      gl.dispose();
    };
  }, [gl]);

  return null;
}

export default function HeroScene({ tier }: { tier: SceneTier }) {
  const pointer = usePointerTracking();
  const hostRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let onScreen = true;
    let tabVisible = document.visibilityState === "visible";
    const sync = () => setActive(onScreen && tabVisible);

    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => {
              onScreen = entry.isIntersecting;
              sync();
            },
            { rootMargin: "80px" }
          )
        : null;

    observer?.observe(host);

    const onVisibility = () => {
      tabVisible = document.visibilityState === "visible";
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const full = tier === "full";

  return (
    <div ref={hostRef} className="absolute inset-0">
      <Canvas
        // Hard ceiling of 2, lower on the lite tier. A 3× device pixel ratio
        // quadruples the fragment cost of the parallax shader for a
        // difference nobody can see.
        dpr={[1, full ? 2 : 1.4]}
        gl={{
          antialias: full,
          alpha: true,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        }}
        camera={{ position: [0, 0, 5], fov: 42, near: 0.1, far: 30 }}
        style={{ background: "transparent" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.06;
        }}
      >
        <Suspense fallback={null}>
          <RenderGate active={active} />
          <CameraRig pointer={pointer} />

          {/* No lights: the plate is a ShaderMaterial and does its own
              grading, so lamps in the scene would cost uniforms and change
              nothing on screen. */}

          {/* The photograph, and nothing in front of it.
              An earlier pass threw instanced beans and steam plumes across
              the cup. They read as clutter over a picture that already has
              its own splash and grounds, and they were the one thing that
              differed between the flat first paint and the WebGL scene — so
              removing them also makes the handover invisible. The depth
              displacement, the parallax and the brass sheen are what make
              this three-dimensional; the confetti never was. */}
          <DepthPlate pointer={pointer} tier={tier} />
        </Suspense>
      </Canvas>
    </div>
  );
}
