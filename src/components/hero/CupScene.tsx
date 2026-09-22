"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import type { SceneTier } from "@/lib/motion";

/* ==========================================================================
   The hero object: a cup of coffee on a saucer, under a warm studio lamp.
   --------------------------------------------------------------------------
   Everything here is procedural. There is no .glb to download, no texture to
   fetch, and no environment HDR pulled from a CDN — the studio lighting is
   built from drei `Lightformer` planes rendered into a cube map once, at
   mount. That matters for more than page weight: an asset fetched from a
   third party at runtime is one more thing that can be slow, blocked, or
   simply gone on the morning you show the site to someone.

   Palette discipline holds in 3D as well. Ceramic is Cream, the liquid is
   Espresso with a Latte crema, the rim light is Brass Gold and the fill is
   Mocha. Nothing in this file is outside the brand tones.
   ========================================================================== */

const CERAMIC = "#f5ecdd";
const CERAMIC_SHADOW = "#d9c2a3";
const LIQUID_DEEP = "#1c120d";
const CREMA = "#d9c2a3";
const GOLD = "#c9a15b";
const MOCHA = "#6b4531";

/* --------------------------------------------------------------------------
   Geometry
   -------------------------------------------------------------------------- */

/**
 * Samples a control polygon into a smooth curve before lathing it.
 *
 * Lathing the control points directly is what produced the faceted, "bent
 * tin" silhouette in the first cut: the lathe interpolates *around* the axis
 * but not *along* the profile, so a ten-point profile gives nine flat bands
 * however many radial segments you ask for. Sampling a spline first fixes the
 * shading for free, because the vertex normals then follow a real curve.
 */
function lathe(points: THREE.Vector2[], radial: number, samples = 64) {
  const curve = new THREE.SplineCurve(points);
  const geometry = new THREE.LatheGeometry(curve.getPoints(samples), radial);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * The cup, as a single lathed profile that goes up the outside, over the rim
 * and back down the inside. Modelling the wall thickness rather than using a
 * one-sided surface is what stops the rim reading as paper when the light
 * grazes it.
 */
function useCupGeometry(segments: number) {
  return useMemo(() => {
    const profile: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.46, 0.0),
      new THREE.Vector2(0.5, 0.012),
      new THREE.Vector2(0.52, 0.045),
      new THREE.Vector2(0.5, 0.07),
      new THREE.Vector2(0.53, 0.1),
      new THREE.Vector2(0.62, 0.3),
      new THREE.Vector2(0.71, 0.56),
      new THREE.Vector2(0.775, 0.78),
      new THREE.Vector2(0.79, 0.825),
      // over the rim
      new THREE.Vector2(0.772, 0.832),
      new THREE.Vector2(0.756, 0.822),
      // and back down the inside
      new THREE.Vector2(0.69, 0.56),
      new THREE.Vector2(0.6, 0.3),
      new THREE.Vector2(0.51, 0.1),
      new THREE.Vector2(0.48, 0.075),
      new THREE.Vector2(0.0, 0.075),
    ];

    return lathe(profile, segments, 80);
  }, [segments]);
}

/** The saucer: a shallow dish with a raised lip, also lathed. */
function useSaucerGeometry(segments: number) {
  return useMemo(() => {
    const profile: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.44, 0.0),
      new THREE.Vector2(0.5, 0.004),
      // the well the cup's foot sits in
      new THREE.Vector2(0.56, 0.026),
      new THREE.Vector2(0.72, 0.04),
      new THREE.Vector2(0.95, 0.062),
      new THREE.Vector2(1.1, 0.098),
      new THREE.Vector2(1.16, 0.132),
      new THREE.Vector2(1.175, 0.15),
      // over the lip and back underneath
      new THREE.Vector2(1.16, 0.158),
      new THREE.Vector2(1.08, 0.116),
      new THREE.Vector2(0.9, 0.078),
      new THREE.Vector2(0.62, 0.05),
      new THREE.Vector2(0.5, 0.04),
      new THREE.Vector2(0.46, 0.03),
      new THREE.Vector2(0.0, 0.028),
    ];

    return lathe(profile, segments, 72);
  }, [segments]);
}

/* --------------------------------------------------------------------------
   The liquid surface
   --------------------------------------------------------------------------
   A disc with a small shader on it. Three things are happening: a very slow
   swirl in the crema, a tight specular glint that answers the key light, and
   a soft crema ring where the coffee meets the ceramic. All of it is done in
   the fragment stage — the geometry is sixty-odd triangles.
   -------------------------------------------------------------------------- */

const LIQUID_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPos;

  void main() {
    vUv = uv;
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const LIQUID_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uCrema;
  uniform vec3 uGold;
  uniform vec2 uPointer;

  varying vec2 vUv;
  varying vec3 vPos;

  // Cheap value noise — two octaves is plenty for crema marbling.
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

  void main() {
    vec2 centred = vUv * 2.0 - 1.0;
    float r = length(centred);

    // Slow rotation, so the crema drifts rather than scrolls.
    float angle = uTime * 0.06;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec2 swirl = rot * centred;

    float marble = noise(swirl * 3.2 + uTime * 0.05);
    marble += noise(swirl * 7.4 - uTime * 0.03) * 0.5;
    marble /= 1.5;

    vec3 color = mix(uDeep, uCrema, smoothstep(0.42, 0.95, marble) * 0.32);

    // Crema ring: the coffee is always slightly paler where it meets the wall.
    float ring = smoothstep(0.66, 0.99, r);
    color = mix(color, uCrema, ring * 0.55);

    // The key light's reflection, drifting with the pointer.
    vec2 glint = centred - vec2(0.26 + uPointer.x * 0.2, 0.3 + uPointer.y * 0.14);
    float spec = exp(-dot(glint, glint) * 42.0);
    color += uGold * spec * 0.42;

    // A second, broader sheen across the whole surface. Kept low: a wide
    // white hotspot on the liquid is the single fastest way to make a
    // procedural cup look like a render rather than a photograph.
    vec2 broad = centred - vec2(-0.18, -0.26);
    float sheen = exp(-dot(broad, broad) * 2.6);
    color += uGold * sheen * 0.06;

    // Soft edge so the disc never shows a hard rim against the ceramic.
    float alpha = 1.0 - smoothstep(0.985, 1.0, r);

    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

function LiquidSurface({ pointer }: { pointer: React.RefObject<THREE.Vector2> }) {
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(LIQUID_DEEP) },
      uCrema: { value: new THREE.Color(CREMA) },
      uGold: { value: new THREE.Color(GOLD) },
      uPointer: { value: new THREE.Vector2() },
    }),
    []
  );

  useFrame((_, delta) => {
    const mat = material.current;
    if (!mat) return;
    mat.uniforms.uTime.value += delta;
    if (pointer.current) {
      mat.uniforms.uPointer.value.lerp(pointer.current, 0.03);
    }
  });

  return (
    <mesh position={[0, 0.745, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.7, 72]} />
      <shaderMaterial
        ref={material}
        vertexShader={LIQUID_VERTEX}
        fragmentShader={LIQUID_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/* --------------------------------------------------------------------------
   Steam
   --------------------------------------------------------------------------
   Three camera-facing planes with a noise shader. Billboarded in the vertex
   stage rather than with a Sprite, because a sprite cannot be given a custom
   shader without losing its billboarding.
   -------------------------------------------------------------------------- */

const STEAM_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uPhase;
  varying vec2 vUv;

  void main() {
    vUv = uv;

    vec3 pos = position;
    // A gentle lateral sway, stronger further up the plume.
    float lift = uv.y;
    pos.x += sin(uTime * 0.6 + uPhase + lift * 3.0) * 0.12 * lift;

    // Billboard: take the instance position from the model matrix, then
    // rebuild the offset in view space so the plane always faces the camera.
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
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // Scroll the noise field downward so the plume appears to rise.
    vec2 p = vec2(vUv.x * 2.4, vUv.y * 1.6 - uTime * 0.16 + uPhase);
    float n = fbm(p);

    // Narrow at the spout, wide at the top.
    float width = mix(0.36, 0.95, vUv.y);
    float column = 1.0 - smoothstep(0.0, width, abs(vUv.x - 0.5) * 2.0);

    // Fade in off the surface and out at the top.
    float rise = smoothstep(0.0, 0.26, vUv.y) * (1.0 - smoothstep(0.3, 0.92, vUv.y));

    float alpha = column * rise * smoothstep(0.38, 0.86, n) * uOpacity;

    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

function SteamPlume({
  offset,
  phase,
  scale,
  opacity,
}: {
  offset: [number, number, number];
  phase: number;
  scale: [number, number];
  opacity: number;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPhase: { value: phase },
      uColor: { value: new THREE.Color(CREMA) },
      uOpacity: { value: opacity },
    }),
    [phase, opacity]
  );

  useFrame((_, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
  });

  return (
    <mesh position={offset} renderOrder={2}>
      <planeGeometry args={[scale[0], scale[1], 1, 24]} />
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
   Floating beans
   --------------------------------------------------------------------------
   One InstancedMesh: a single draw call for the whole swarm. Beans further
   from the camera are scaled down and dimmed, which stands in for depth of
   field — a real DOF pass means a full post-processing chain, and paying
   three render targets for a background flourish is not a good trade on a
   café homepage.
   -------------------------------------------------------------------------- */

type Bean = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  spin: THREE.Vector3;
  drift: number;
  phase: number;
  scale: number;
};

function makeBeans(count: number, seed: number): Bean[] {
  // Deterministic: Math.random() during render would give a different swarm
  // on the server and the client, and a different one on every re-render.
  let state = seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };

  return Array.from({ length: count }, () => {
    const depth = -3.4 + random() * 4.2;
    // Further back = smaller and slower, which reads as distance.
    const distance = THREE.MathUtils.mapLinear(depth, -3.4, 0.8, 0.45, 1.05);

    return {
      position: new THREE.Vector3(
        (random() - 0.5) * 7.2,
        -0.8 + random() * 3.4,
        depth
      ),
      rotation: new THREE.Euler(
        random() * Math.PI,
        random() * Math.PI,
        random() * Math.PI
      ),
      spin: new THREE.Vector3(
        (random() - 0.5) * 0.22,
        (random() - 0.5) * 0.3,
        (random() - 0.5) * 0.18
      ),
      drift: 0.05 + random() * 0.12,
      phase: random() * Math.PI * 2,
      scale: (0.032 + random() * 0.03) * distance,
    };
  });
}

function Beans({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const beans = useMemo(() => makeBeans(count, 20260922), [count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const instanced = mesh.current;
    if (!instanced) return;

    const t = state.clock.elapsedTime;

    for (let i = 0; i < beans.length; i += 1) {
      const bean = beans[i];

      dummy.position.set(
        bean.position.x + Math.sin(t * bean.drift + bean.phase) * 0.5,
        bean.position.y + Math.cos(t * bean.drift * 0.8 + bean.phase) * 0.38,
        bean.position.z
      );
      dummy.rotation.set(
        bean.rotation.x + t * bean.spin.x,
        bean.rotation.y + t * bean.spin.y,
        bean.rotation.z + t * bean.spin.z
      );
      // Squashed on two axes: a sphere reads as a bean only once it is
      // clearly not a sphere.
      dummy.scale.set(bean.scale, bean.scale * 0.66, bean.scale * 0.56);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    }

    instanced.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      {/* A sphere squashed on two axes reads convincingly as a coffee bean at
          this size, and costs a fraction of a lathed or imported one. */}
      <sphereGeometry args={[1, 14, 10]} />
      <meshStandardMaterial
        color={LIQUID_DEEP}
        roughness={0.62}
        metalness={0.05}
        emissive={MOCHA}
        emissiveIntensity={0.08}
      />
    </instancedMesh>
  );
}

/* --------------------------------------------------------------------------
   The assembly
   -------------------------------------------------------------------------- */

function CupGroup({ tier, pointer }: { tier: SceneTier; pointer: React.RefObject<THREE.Vector2> }) {
  const group = useRef<THREE.Group>(null);
  const segments = tier === "full" ? 96 : 48;

  const cup = useCupGeometry(segments);
  const saucer = useSaucerGeometry(segments);

  // Lathe geometries are created here rather than by a hook inside a
  // component that might unmount independently, so disposal is unambiguous.
  useEffect(() => {
    return () => {
      cup.dispose();
      saucer.dispose();
    };
  }, [cup, saucer]);

  useFrame((state, delta) => {
    const node = group.current;
    if (!node) return;

    // A slow, constant turn, plus a small tilt toward the pointer. Both are
    // eased, so nothing snaps when the mouse jumps across the viewport.
    node.rotation.y += delta * 0.085;

    const target = pointer.current;
    if (target) {
      const tiltX = THREE.MathUtils.clamp(-target.y * 0.16, -0.2, 0.2);
      const tiltZ = THREE.MathUtils.clamp(target.x * 0.1, -0.14, 0.14);
      node.rotation.x = THREE.MathUtils.damp(node.rotation.x, tiltX, 2.2, delta);
      node.rotation.z = THREE.MathUtils.damp(node.rotation.z, tiltZ, 2.2, delta);
      node.position.x = THREE.MathUtils.damp(
        node.position.x,
        1.42 + target.x * 0.1,
        2.5,
        delta
      );
    }

    // A barely-there breathing motion. Without it the object looks pinned.
    node.position.y =
      -0.62 + Math.sin(state.clock.elapsedTime * 0.5) * 0.026;
  });

  return (
    <group ref={group} position={[1.42, -0.62, 0]} scale={0.95}>
      {/* Saucer */}
      <mesh geometry={saucer} position={[0, -0.02, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={CERAMIC_SHADOW}
          roughness={0.38}
          metalness={0}
          clearcoat={0.85}
          clearcoatRoughness={0.22}
          sheen={0.35}
          sheenColor={CERAMIC_SHADOW}
        />
      </mesh>

      {/* Cup */}
      <mesh geometry={cup} position={[0, 0.06, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={CERAMIC}
          roughness={0.32}
          metalness={0}
          clearcoat={0.9}
          clearcoatRoughness={0.18}
          sheen={0.4}
          sheenColor={CERAMIC_SHADOW}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Handle */}
      <mesh position={[0.72, 0.46, 0]} rotation={[0, 0, -0.22]} castShadow>
        <torusGeometry args={[0.32, 0.055, 16, tier === "full" ? 56 : 30, Math.PI * 1.25]} />
        <meshPhysicalMaterial
          color={CERAMIC}
          roughness={0.32}
          metalness={0}
          clearcoat={0.85}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {/* A single brass line around the rim — the one piece of jewellery. */}
      <mesh position={[0, 0.826, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.756, 0.792, segments]} />
        <meshStandardMaterial
          color={GOLD}
          roughness={0.26}
          metalness={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>

      <LiquidSurface pointer={pointer} />

      {/* Steam. Three plumes on different phases so it never pulses. */}
      <SteamPlume offset={[-0.1, 1.62, 0.06]} phase={0} scale={[0.95, 1.7]} opacity={0.95} />
      <SteamPlume offset={[0.14, 1.78, -0.04]} phase={2.1} scale={[0.75, 2.0]} opacity={0.7} />
      {tier === "full" ? (
        <SteamPlume offset={[0.02, 1.5, 0.14]} phase={4.3} scale={[1.15, 1.5]} opacity={0.5} />
      ) : null}
    </group>
  );
}

/**
 * Tracks the pointer in normalised space outside React state.
 *
 * `state.pointer` from R3F only updates while the cursor is over the canvas.
 * The canvas here sits behind the headline and the CTAs, so half the hero's
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

/** Warm studio lighting, built from light cards rather than an HDR file. */
function Studio({ tier }: { tier: SceneTier }) {
  return (
    <>
      <ambientLight intensity={0.22} color={MOCHA} />

      {/* Key: a warm lamp, high and to the right, casting the shadow. */}
      <directionalLight
        position={[3.4, 5.2, 2.6]}
        intensity={1.45}
        color="#ffdcae"
        castShadow={tier === "full"}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
      />

      {/* Rim: brass, from behind and low, to separate the cup from the page. */}
      <directionalLight position={[-3.4, 1.8, -3.2]} intensity={3.4} color={GOLD} />

      {/* Fill: a cool sage bounce, very low, so the shadow side is not dead. */}
      <directionalLight position={[-2.2, -1.4, 2.4]} intensity={0.4} color="#4a5a48" />

      <Environment resolution={tier === "full" ? 256 : 128} frames={1}>
        <Lightformer
          form="rect"
          intensity={3.2}
          color="#ffdcae"
          position={[2.6, 3.4, 2]}
          scale={[5, 5, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={2.2}
          color={GOLD}
          position={[-3.4, 1.2, -2.6]}
          scale={[4, 6, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="circle"
          intensity={0.9}
          color={CREMA}
          position={[0, -2.4, 1.6]}
          scale={[6, 6, 1]}
          target={[0, 0, 0]}
        />
      </Environment>
    </>
  );
}

/**
 * Pauses the render loop whenever the canvas is off-screen or the tab is in
 * the background.
 *
 * This is the single most valuable thing in the file for battery life: a
 * hero canvas that keeps rendering while the visitor reads the menu three
 * screens down is pure waste, and it is invisible in testing because
 * everything still looks right.
 */
function RenderGate({ active }: { active: boolean }) {
  const setFrameloop = useThree((state) => state.setFrameloop);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    setFrameloop(active ? "always" : "never");
  }, [active, setFrameloop]);

  // Release the WebGL context properly when this scene goes away. Browsers
  // cap live contexts per page; leaking one is how the canvas comes back
  // blank after a few route changes.
  useEffect(() => {
    return () => {
      gl.setAnimationLoop(null);
      gl.dispose();
    };
  }, [gl]);

  return null;
}

export default function CupScene({ tier }: { tier: SceneTier }) {
  const pointer = usePointerTracking();
  const hostRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  // On-screen and tab-visible are two different questions; the scene needs
  // both to be true before it is worth rendering a frame.
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
        // Capped at 2 as a hard ceiling, and lower on the lite tier. A 3×
        // device pixel ratio quadruples the fragment cost for a difference
        // nobody can see on a soft-lit ceramic object.
        dpr={[1, full ? 2 : 1.4]}
        gl={{
          antialias: full,
          alpha: true,
          powerPreference: "high-performance",
          // Guards against a lost context taking the page down with it.
          failIfMajorPerformanceCaveat: false,
        }}
        shadows={full}
        camera={{ position: [0, 1.65, 5.9], fov: 36, near: 0.1, far: 40 }}
        style={{ background: "transparent" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.98;
        }}
      >
        <Suspense fallback={null}>
          <RenderGate active={active} />
          <Studio tier={tier} />
          <CupGroup tier={tier} pointer={pointer} />
          <Beans count={full ? 22 : 10} />

          {full ? (
            <ContactShadows
              position={[1.42, -1.44, 0]}
              opacity={0.55}
              scale={7}
              blur={2.8}
              far={3}
              resolution={512}
              color="#0c0704"
              frames={1}
            />
          ) : null}
        </Suspense>
      </Canvas>
    </div>
  );
}
