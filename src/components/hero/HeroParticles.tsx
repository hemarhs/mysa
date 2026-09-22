"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import type { SceneTier } from "@/lib/motion";

/* ==========================================================================
   The live layer over the hero photograph.
   --------------------------------------------------------------------------
   Three things the still cannot do on its own:

     • beans that keep falling, tumbling, and passing in front of and behind
       the cup, with the far ones smaller, dimmer and softer;
     • steam that keeps rising off the surface, sampled from a noise field so
       it never loops visibly;
     • gold dust that drifts and leans toward the cursor.

   All of it is procedural — no textures to download, no model to fetch. The
   whole scene is two shader materials and one instanced mesh, which is about
   as cheap as WebGL gets while still looking like something.

   Palette discipline holds here too: beans are Espresso and Mocha, the steam
   is Latte, the dust is Brass Gold. Nothing outside the brand tones.
   ========================================================================== */

const ESPRESSO = "#1c120d";
const MOCHA = "#6b4531";
const LATTE = "#d9c2a3";
const GOLD = "#c9a15b";

/* --------------------------------------------------------------------------
   Falling beans
   -------------------------------------------------------------------------- */

type Bean = {
  x: number;
  z: number;
  /** Where in its fall this bean starts, 0–1. */
  offset: number;
  speed: number;
  spin: THREE.Vector3;
  tilt: THREE.Euler;
  scale: number;
  sway: number;
  phase: number;
};

/**
 * Deterministic swarm.
 *
 * `Math.random()` during render would give a different set of beans on every
 * re-render — and a different one on the server than the client, if this ever
 * moved out of a client-only chunk.
 */
function makeBeans(count: number, seed: number): Bean[] {
  let state = seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };

  return Array.from({ length: count }, () => {
    const z = -3.2 + random() * 4.4;
    // Depth of field, faked honestly: further back means smaller, slower and
    // dimmer. A real DOF pass costs a full post-processing chain, which is a
    // poor trade for background flourish on a café homepage.
    const distance = THREE.MathUtils.mapLinear(z, -3.2, 1.2, 0.42, 1.1);

    return {
      x: (random() - 0.5) * 6.4,
      z,
      offset: random(),
      speed: (0.1 + random() * 0.16) * distance,
      spin: new THREE.Vector3(
        (random() - 0.5) * 1.5,
        (random() - 0.5) * 2.1,
        (random() - 0.5) * 1.3
      ),
      tilt: new THREE.Euler(random() * Math.PI, random() * Math.PI, random() * Math.PI),
      scale: (0.052 + random() * 0.05) * distance,
      sway: 0.12 + random() * 0.26,
      phase: random() * Math.PI * 2,
    };
  });
}

const TOP = 3.4;
const BOTTOM = -2.6;

function FallingBeans({ count, pointer }: { count: number; pointer: React.RefObject<THREE.Vector2> }) {
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

      // A looping fall: progress wraps at 1 and the bean reappears at the top.
      const progress = (bean.offset + t * bean.speed) % 1;
      const y = TOP - progress * (TOP - BOTTOM);

      dummy.position.set(
        bean.x + Math.sin(t * 0.5 + bean.phase) * bean.sway + lean * 0.18,
        y,
        bean.z
      );
      dummy.rotation.set(
        bean.tilt.x + t * bean.spin.x,
        bean.tilt.y + t * bean.spin.y,
        bean.tilt.z + t * bean.spin.z
      );
      // A bean is a squashed ellipsoid — a sphere reads as a bean only once
      // it is clearly not a sphere.
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
        roughness={0.55}
        metalness={0.08}
        emissive={MOCHA}
        emissiveIntensity={0.14}
      />
    </instancedMesh>
  );
}

/* --------------------------------------------------------------------------
   Steam
   --------------------------------------------------------------------------
   Camera-facing planes with an fBm noise shader scrolling downward, which
   reads as the plume rising. Billboarded in the vertex stage rather than with
   a Sprite, because a Sprite cannot take a custom shader without losing its
   billboarding.
   -------------------------------------------------------------------------- */

const STEAM_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uPhase;
  varying vec2 vUv;

  void main() {
    vUv = uv;

    vec3 pos = position;
    float lift = uv.y;
    pos.x += sin(uTime * 0.5 + uPhase + lift * 3.2) * 0.16 * lift;

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
    // Scrolling the field downward makes the plume appear to rise.
    vec2 p = vec2(vUv.x * 2.2, vUv.y * 1.5 - uTime * 0.13 + uPhase);
    float n = fbm(p);

    // Narrow at the surface, wide at the top.
    float width = mix(0.3, 0.95, vUv.y);
    float column = 1.0 - smoothstep(0.0, width, abs(vUv.x - 0.5) * 2.0);

    // Fade in off the liquid and out before the top edge.
    float rise = smoothstep(0.0, 0.2, vUv.y) * (1.0 - smoothstep(0.25, 0.95, vUv.y));

    float alpha = column * rise * smoothstep(0.4, 0.88, n) * uOpacity;

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
    <mesh position={offset} renderOrder={2}>
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
   --------------------------------------------------------------------------
   A Points cloud with a soft round sprite drawn once into a canvas. Additive,
   depth-write off, and it leans toward the cursor — the one element in the
   scene that acknowledges the visitor directly.
   -------------------------------------------------------------------------- */

function useDotTexture() {
  return useMemo(() => {
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

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
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
      positions[i * 3] = (random() - 0.5) * 8;
      positions[i * 3 + 1] = (random() - 0.5) * 4.6;
      positions[i * 3 + 2] = -2.6 + random() * 3.4;

      drifts[i * 3] = 0.02 + random() * 0.05;
      drifts[i * 3 + 1] = 0.014 + random() * 0.04;
      drifts[i * 3 + 2] = random() * Math.PI * 2;
    }

    return { positions, drifts };
  }, [count]);

  // The texture is created here, so it is disposed here. A CanvasTexture that
  // outlives its scene is a small but real GPU leak.
  useEffect(() => () => map.dispose(), [map]);

  useFrame((state) => {
    const node = points.current;
    if (!node) return;

    const t = state.clock.elapsedTime;
    const attr = node.geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = attr.array as Float32Array;

    for (let i = 0; i < count; i += 1) {
      const px = positions[i * 3];
      const py = positions[i * 3 + 1];
      const phase = drifts[i * 3 + 2];

      array[i * 3] = px + Math.sin(t * drifts[i * 3] + phase) * 0.55;
      array[i * 3 + 1] = py + Math.cos(t * drifts[i * 3 + 1] + phase) * 0.42;
    }

    attr.needsUpdate = true;

    // A whole-cloud lean toward the cursor, eased so it drifts rather than
    // tracks.
    const target = pointer.current;
    if (target) {
      node.position.x += (target.x * 0.28 - node.position.x) * 0.02;
      node.position.y += (target.y * 0.18 - node.position.y) * 0.02;
    }
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={map}
        color={GOLD}
        size={0.075}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* --------------------------------------------------------------------------
   Plumbing
   -------------------------------------------------------------------------- */

/**
 * Tracks the pointer in normalised space outside React state.
 *
 * `state.pointer` from R3F only updates while the cursor is over the canvas.
 * This canvas sits behind the headline and the CTAs, so half the hero's
 * pointer movement would never reach it — this listens on the window instead.
 */
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
 * This is the single most valuable thing in the file for battery life: a hero
 * canvas that keeps rendering while the visitor reads the menu three screens
 * down is pure waste, and it is invisible in testing because everything still
 * looks right.
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

export default function HeroParticles({ tier }: { tier: SceneTier }) {
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
        // Capped at 2 as a hard ceiling, lower on the lite tier. A 3× device
        // pixel ratio quadruples the fragment cost for a difference nobody can
        // see on drifting particles.
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
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Suspense fallback={null}>
          <RenderGate active={active} />

          {/* Lighting that matches the photograph: a warm key from upper
              right, a brass rim from behind, and almost no fill. */}
          <ambientLight intensity={0.35} color={MOCHA} />
          <directionalLight position={[3, 4, 3]} intensity={1.6} color="#ffdcae" />
          <directionalLight position={[-3, 1.5, -2]} intensity={2.2} color={GOLD} />

          {/* The beans sit slightly right of centre, over the cup. */}
          <group position={[1.15, 0, 0]}>
            <FallingBeans count={full ? 26 : 12} pointer={pointer} />

            <SteamPlume
              offset={[-0.1, 1.05, 0.4]}
              phase={0}
              size={[1.0, 2.0]}
              opacity={0.55}
            />
            <SteamPlume
              offset={[0.18, 1.25, 0.2]}
              phase={2.1}
              size={[0.8, 2.3]}
              opacity={0.4}
            />
            {full ? (
              <SteamPlume
                offset={[0.02, 0.95, 0.6]}
                phase={4.3}
                size={[1.2, 1.8]}
                opacity={0.28}
              />
            ) : null}
          </group>

          <GoldDust count={full ? 90 : 40} pointer={pointer} />
        </Suspense>
      </Canvas>
    </div>
  );
}
