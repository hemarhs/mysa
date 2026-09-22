"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import type { SceneTier } from "@/lib/motion";

/* ==========================================================================
   The hero, as an actual three-dimensional scene.
   --------------------------------------------------------------------------
   The photograph is not an <img> sitting behind the type. It is a textured
   surface inside a WebGL scene, driven by a depth map, with real geometry
   flying in front of it and behind it.

   Three things make it read as space rather than as a picture:

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

   3. REAL GEOMETRY IN THE SAME SPACE. The falling beans, the steam and the
      gold dust are lit, depth-sorted meshes at various z. Some pass in front
      of the cup, some behind it. They share the camera, so when the pointer
      moves everything reorganises as one scene.

   The depth map is generated offline (see scripts/build-hero-depth.py) and
   ships as a 32KB PNG. There is no model to load at runtime.
   ========================================================================== */

const ESPRESSO = "#1c120d";
const MOCHA = "#6b4531";
const LATTE = "#d9c2a3";
const GOLD = "#c9a15b";

const PHOTO_URL = "/images/hero-cup.jpg";
const DEPTH_URL = "/images/hero-cup-depth.png";
/** The source photograph is 2:3 portrait. */
const PHOTO_ASPECT = 1400 / 2100;

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
      uFocus: { value: new THREE.Vector2(0.0, -0.11) },
      uStrength: { value: tier === "full" ? 0.125 : 0.08 },
      uZoom: { value: 1.02 },
    }),
    [photo, depth, tier]
  );

  useFrame((state, delta) => {
    const mat = material.current;
    if (!mat) return;

    mat.uniforms.uTime.value += delta;
    // The shader's `cover` fit needs the *plane's* aspect, not the canvas's.
    const wideNow = state.viewport.width / state.viewport.height > 1.1;
    const planeW = state.viewport.width * (wideNow ? 0.68 : 1);
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

  /* The plate occupies the right two-thirds on a wide screen and the whole
     frame on a narrow one — the same composition as the CSS fallback, and
     the same one the type is laid out against.

     Sizing the plane to the *viewport* instead was the first attempt, and it
     stretched a 2:3 portrait across a 16:9 frame: `cover` then had to crop to
     the middle 40% of the photograph, which arrived as an enormous close-up
     of the rim. The plane has to be roughly the shape of the hole it is
     filling before `cover` means anything sensible. */
  const wide = viewport.width / viewport.height > 1.1;
  const planeWidth = viewport.width * (wide ? 0.68 : 1);
  const planeX = wide ? viewport.width * 0.16 : 0;

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
   Falling beans — real meshes, in front of and behind the plate
   -------------------------------------------------------------------------- */

type Bean = {
  x: number;
  z: number;
  offset: number;
  speed: number;
  spin: THREE.Vector3;
  tilt: THREE.Euler;
  scale: number;
  sway: number;
  phase: number;
};

function makeBeans(count: number, seed: number): Bean[] {
  let state = seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };

  return Array.from({ length: count }, (_, i) => {
    // Half the swarm falls in front of the plate, half behind it. That is
    // what sells the photograph as being *in* the scene rather than behind
    // a layer of decoration.
    const front = i % 2 === 0;
    const z = front ? 0.35 + random() * 1.5 : -2.4 - random() * 1.4;
    const distance = THREE.MathUtils.mapLinear(z, -3.8, 1.85, 0.4, 1.15);

    return {
      x: (random() - 0.5) * 5.6,
      z,
      offset: random(),
      speed: (0.09 + random() * 0.15) * distance,
      spin: new THREE.Vector3(
        (random() - 0.5) * 1.6,
        (random() - 0.5) * 2.2,
        (random() - 0.5) * 1.4
      ),
      tilt: new THREE.Euler(random() * Math.PI, random() * Math.PI, random() * Math.PI),
      scale: (0.05 + random() * 0.05) * distance,
      sway: 0.1 + random() * 0.28,
      phase: random() * Math.PI * 2,
    };
  });
}

const TOP = 2.6;
const BOTTOM = -2.4;

function FallingBeans({
  count,
  pointer,
}: {
  count: number;
  pointer: React.RefObject<THREE.Vector2>;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const beans = useMemo(() => makeBeans(count, 20260922), [count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const instanced = mesh.current;
    if (!instanced) return;

    const t = state.clock.elapsedTime;
    const lean = pointer.current?.x ?? 0;

    for (let i = 0; i < beans.length; i += 1) {
      const bean = beans[i];
      const progress = (bean.offset + t * bean.speed) % 1;
      const y = TOP - progress * (TOP - BOTTOM);

      // Nearer beans parallax further — the same rule the plate follows, so
      // the two layers agree.
      const parallax = lean * (0.32 + bean.z * 0.12);

      dummy.position.set(
        bean.x + Math.sin(t * 0.5 + bean.phase) * bean.sway + parallax,
        y,
        bean.z
      );
      dummy.rotation.set(
        bean.tilt.x + t * bean.spin.x,
        bean.tilt.y + t * bean.spin.y,
        bean.tilt.z + t * bean.spin.z
      );
      dummy.scale.set(bean.scale, bean.scale * 0.68, bean.scale * 0.56);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    }

    instanced.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 14, 10]} />
      <meshStandardMaterial
        color={ESPRESSO}
        roughness={0.52}
        metalness={0.1}
        emissive={MOCHA}
        emissiveIntensity={0.16}
      />
    </instancedMesh>
  );
}

/* --------------------------------------------------------------------------
   Steam
   -------------------------------------------------------------------------- */

const STEAM_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uPhase;
  varying vec2 vUv;

  void main() {
    vUv = uv;

    vec3 pos = position;
    float lift = uv.y;
    pos.x += sin(uTime * 0.5 + uPhase + lift * 3.2) * 0.18 * lift;

    vec4 centre = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec4 mvPosition = centre + vec4(pos.x, pos.y, 0.0, 0.0);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const STEAM_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uPhase;
  uniform vec3 uColor;
  uniform float uOpacity;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 p = vec2(vUv.x * 2.2, vUv.y * 1.5 - uTime * 0.12 + uPhase);
    float n = fbm(p);

    float width = mix(0.28, 0.95, vUv.y);
    float column = 1.0 - smoothstep(0.0, width, abs(vUv.x - 0.5) * 2.0);
    float rise = smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.22, 0.95, vUv.y));

    float alpha = column * rise * smoothstep(0.42, 0.9, n) * uOpacity;

    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

function SteamPlume({
  offset,
  phase,
  size,
  opacity,
}: {
  offset: [number, number, number];
  phase: number;
  size: [number, number];
  opacity: number;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPhase: { value: phase },
      uColor: { value: new THREE.Color(LATTE) },
      uOpacity: { value: opacity },
    }),
    [phase, opacity]
  );

  useFrame((_, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
  });

  return (
    <mesh position={offset} renderOrder={3}>
      <planeGeometry args={[size[0], size[1], 1, 20]} />
      <shaderMaterial
        ref={material}
        vertexShader={STEAM_VERTEX}
        fragmentShader={STEAM_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* --------------------------------------------------------------------------
   Gold dust
   -------------------------------------------------------------------------- */

function useDotTexture() {
  const texture = useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.3, "rgba(255,255,255,0.5)");
      g.addColorStop(0.65, "rgba(255,255,255,0.1)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }

    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  // Created here, disposed here. A CanvasTexture that outlives its scene is a
  // small but real GPU leak.
  useEffect(() => () => texture.dispose(), [texture]);

  return texture;
}

function GoldDust({ count, pointer }: { count: number; pointer: React.RefObject<THREE.Vector2> }) {
  const points = useRef<THREE.Points>(null);
  const map = useDotTexture();

  const { positions, drifts } = useMemo(() => {
    let state = 8675309 >>> 0;
    const random = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };

    const positions = new Float32Array(count * 3);
    const drifts = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (random() - 0.5) * 7.5;
      positions[i * 3 + 1] = (random() - 0.5) * 4.4;
      positions[i * 3 + 2] = -1.8 + random() * 3.2;

      drifts[i * 3] = 0.02 + random() * 0.05;
      drifts[i * 3 + 1] = 0.014 + random() * 0.04;
      drifts[i * 3 + 2] = random() * Math.PI * 2;
    }

    return { positions, drifts };
  }, [count]);

  useFrame((state) => {
    const node = points.current;
    if (!node) return;

    const t = state.clock.elapsedTime;
    const attr = node.geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = attr.array as Float32Array;

    for (let i = 0; i < count; i += 1) {
      const phase = drifts[i * 3 + 2];
      array[i * 3] = positions[i * 3] + Math.sin(t * drifts[i * 3] + phase) * 0.55;
      array[i * 3 + 1] = positions[i * 3 + 1] + Math.cos(t * drifts[i * 3 + 1] + phase) * 0.42;
    }

    attr.needsUpdate = true;

    const target = pointer.current;
    if (target) {
      node.position.x += (target.x * 0.4 - node.position.x) * 0.02;
      node.position.y += (target.y * 0.26 - node.position.y) * 0.02;
    }
  });

  return (
    <points ref={points} frustumCulled={false} renderOrder={4}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={map}
        color={GOLD}
        size={0.07}
        sizeAttenuation
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
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

          {/* Lighting matched to the photograph: warm key from upper right,
              brass rim from behind, almost no fill. */}
          <ambientLight intensity={0.4} color={MOCHA} />
          <directionalLight position={[3, 4, 3]} intensity={1.7} color="#ffdcae" />
          <directionalLight position={[-3, 1.5, -2]} intensity={2.3} color={GOLD} />

          <DepthPlate pointer={pointer} tier={tier} />

          <group position={[0.9, 0, 0]}>
            <FallingBeans count={full ? 28 : 12} pointer={pointer} />

            <SteamPlume offset={[-0.08, 0.95, 0.6]} phase={0} size={[1.0, 2.0]} opacity={0.5} />
            <SteamPlume offset={[0.2, 1.15, 0.45]} phase={2.1} size={[0.8, 2.3]} opacity={0.36} />
            {full ? (
              <SteamPlume offset={[0.04, 0.85, 0.8]} phase={4.3} size={[1.2, 1.8]} opacity={0.26} />
            ) : null}
          </group>

          <GoldDust count={full ? 90 : 40} pointer={pointer} />
        </Suspense>
      </Canvas>
    </div>
  );
}
