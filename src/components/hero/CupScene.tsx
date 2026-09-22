"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The single 3D element on the site: a ceramic cup on a saucer, lit like a
 * product shot, turning slowly.
 *
 * Built from lathe and tube geometry rather than a loaded GLTF — nothing to
 * download, nothing to cache-bust, and it stays on palette. No drei
 * <Environment> either: those fetch an HDR from a CDN, which is a network
 * dependency the hero does not need. The studio lighting below is generated
 * at runtime instead.
 */

/* -------------------------------------------------------------------------- */
/* Geometry                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Cross-section of the cup, revolved around Y.
 *
 * The proportions are a real cappuccino cup: a foot wide enough to look
 * stable, a body that swells through the middle, and a wall with visible
 * thickness at the rim. A straight taper from a narrow base is what makes a
 * 3D cup read as a paper cup.
 */
const CUP_PROFILE: [number, number][] = [
  [0.0, 0.0],
  [0.36, 0.0],
  [0.395, 0.016],
  [0.412, 0.048],
  // outside wall, swelling through the belly
  [0.458, 0.14],
  [0.522, 0.28],
  [0.583, 0.43],
  [0.629, 0.57],
  [0.655, 0.69],
  [0.666, 0.755],
  [0.669, 0.78],
  // over the rim — the gap here is the wall thickness
  [0.639, 0.78],
  [0.633, 0.73],
  [0.601, 0.6],
  [0.549, 0.44],
  [0.479, 0.27],
  [0.414, 0.12],
  [0.372, 0.05],
  [0.0, 0.042],
];

/** Shallow dish, raised lip, small foot ring. */
const SAUCER_PROFILE: [number, number][] = [
  [0.0, 0.048],
  [0.3, 0.043],
  [0.55, 0.036],
  [0.72, 0.042],
  [0.85, 0.066],
  [0.91, 0.088],
  [0.935, 0.082],
  [0.9, 0.052],
  [0.7, 0.022],
  [0.44, 0.011],
  [0.36, 0.0],
  [0.0, 0.006],
];

/**
 * The handle, as a tube swept along a curve that starts and ends on the cup
 * wall. A torus floats beside the cup; this is actually attached.
 */
const HANDLE_CURVE = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.6, 0.6, 0),
  new THREE.Vector3(0.81, 0.585, 0),
  new THREE.Vector3(0.92, 0.47, 0),
  new THREE.Vector3(0.915, 0.34, 0),
  new THREE.Vector3(0.8, 0.255, 0),
  new THREE.Vector3(0.58, 0.235, 0),
]);

/** Roughly eleven seconds for a full turn — a showcase, not a spin. */
const ROTATION_SPEED = (Math.PI * 2) / 11;

/* -------------------------------------------------------------------------- */
/* Materials                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Matte glazed porcelain. High clearcoat plus low roughness reads as plastic;
 * a broad, slightly rough surface with a thin clearcoat reads as ceramic.
 */
const CERAMIC = {
  color: "#ffffff",
  roughness: 0.46,
  metalness: 0,
  clearcoat: 0.22,
  clearcoatRoughness: 0.45,
  envMapIntensity: 1.15,
} as const;

/**
 * Deterministic pseudo-random, so the scene is identical on every render and
 * between server and client. Math.random() during render is impure.
 */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** A soft radial dot, reused by the steam and the depth particles. */
function useSoftDot() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.35, "rgba(255,255,255,0.45)");
      g.addColorStop(0.7, "rgba(255,255,255,0.1)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

/**
 * The glaze, with the wordmark fired into it.
 *
 * Lathe geometry lays U around the circumference and V up the profile, so
 * drawing the mark at the middle of the canvas places it on one face of the
 * cup and lets the curve wrap it naturally.
 */
function useGlaze() {
  return useMemo(() => {
    const width = 2048;
    const height = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#f6f1e7";
      ctx.fillRect(0, 0, width, height);

      // A trace of unevenness, so the glaze is not a flat swatch.
      const random = seeded(4242);
      ctx.globalAlpha = 0.03;
      for (let i = 0; i < 160; i += 1) {
        ctx.fillStyle = random() > 0.5 ? "#000000" : "#ffffff";
        const r = 30 + random() * 120;
        ctx.beginPath();
        ctx.arc(random() * width, random() * height, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // V runs bottom-to-top on the lathe, so a low y here sits high on the cup.
      ctx.save();
      ctx.translate(width * 0.5, height * 0.34);
      ctx.scale(-1, 1); // lathe winding mirrors U
      ctx.fillStyle = "#b08d54";
      ctx.font = "500 74px Georgia, 'Times New Roman', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.letterSpacing = "34px";
      ctx.fillText("MYSA", 0, 0);
      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }, []);
}

/* -------------------------------------------------------------------------- */
/* Environment, shadow, atmosphere                                            */
/* -------------------------------------------------------------------------- */

/**
 * A studio environment generated at runtime, with no HDR to download.
 *
 * This is what makes glazed ceramic look glazed and coffee look wet. Lights
 * alone give diffuse shading and a specular dot; an environment gives the
 * broad soft reflections a real object picks up from a room — the biggest
 * single difference between "3D render" and "photograph".
 */
function StudioEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const width = 512;
    const height = 256;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const base = ctx.createLinearGradient(0, 0, 0, height);
    base.addColorStop(0, "#2e251c");
    base.addColorStop(0.45, "#171210");
    base.addColorStop(1, "#0b0908");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    // Key softbox, upper right — the broad band that rakes across the rim.
    const key = ctx.createRadialGradient(
      width * 0.68, height * 0.18, 0,
      width * 0.68, height * 0.18, width * 0.32
    );
    key.addColorStop(0, "rgba(255, 238, 210, 1)");
    key.addColorStop(0.35, "rgba(214, 170, 114, 0.5)");
    key.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = key;
    ctx.fillRect(0, 0, width, height);

    // Weaker fill behind left, so the shadow side is not dead.
    const fill = ctx.createRadialGradient(
      width * 0.15, height * 0.4, 0,
      width * 0.15, height * 0.4, width * 0.26
    );
    fill.addColorStop(0, "rgba(176, 158, 136, 0.5)");
    fill.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, width, height);

    // Gold bounce low down, which shows along the foot of the cup.
    const bounce = ctx.createRadialGradient(
      width * 0.42, height * 0.88, 0,
      width * 0.42, height * 0.88, width * 0.3
    );
    bounce.addColorStop(0, "rgba(200, 161, 101, 0.4)");
    bounce.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bounce;
    ctx.fillRect(0, 0, width, height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const target = pmrem.fromEquirectangular(texture);

    // three.js scenes are imperative, mutable objects by design — assigning to
    // them is how the library works, not React state being mutated.
    // eslint-disable-next-line react-hooks/immutability
    scene.environment = target.texture;

    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
      texture.dispose();
    };
  }, [gl, scene]);

  return null;
}

/**
 * Contact shadow drawn as a radial-gradient texture.
 *
 * drei's <ContactShadows> renders an opaque plane on an alpha canvas, which
 * shows up as a grey disc instead of a shadow.
 */
function ShadowDisc() {
  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(0,0,0,0.6)");
      g.addColorStop(0.42, "rgba(0,0,0,0.3)");
      g.addColorStop(0.75, "rgba(0,0,0,0.07)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }

    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, []);

  return (
    <mesh position={[1.25, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[3.2, 2.05, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} opacity={0.9} />
    </mesh>
  );
}

/**
 * Steam as soft sprites rather than geometry. Tube geometry reads as wire
 * however thin you make it; overlapping additive puffs read as vapour.
 */
function Steam() {
  const dot = useSoftDot();
  const group = useRef<THREE.Group>(null);

  const puffs = useMemo(() => {
    const random = seeded(20260922);
    return Array.from({ length: 12 }, (_, i) => ({
      offset: i / 12,
      x: (random() - 0.5) * 0.46,
      drift: (random() - 0.5) * 0.42,
      speed: 0.09 + random() * 0.04,
      scale: 0.2 + random() * 0.18,
    }));
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;

    group.current.children.forEach((child, i) => {
      const puff = puffs[i];
      const sprite = child as THREE.Sprite;
      const cycle = (t * puff.speed + puff.offset) % 1;

      sprite.position.set(
        puff.x + puff.drift * cycle * 0.7 + Math.sin(t * 0.55 + i) * 0.03,
        0.79 + cycle * 0.46,
        0.02
      );

      const alpha = Math.sin(cycle * Math.PI) ** 1.7;
      sprite.material.opacity = alpha * 0.095;
      const scale = puff.scale * (0.5 + cycle);
      sprite.scale.set(scale, scale, scale);
    });
  });

  return (
    <group ref={group}>
      {puffs.map((_, i) => (
        <sprite key={i}>
          <spriteMaterial
            map={dot}
            color="#e4d2b4"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
  );
}

/** Slow gold motes drifting around the cup, which give the scene depth. */
function Motes() {
  const dot = useSoftDot();
  const group = useRef<THREE.Group>(null);

  const motes = useMemo(() => {
    const random = seeded(77771);
    return Array.from({ length: 20 }, () => ({
      base: new THREE.Vector3(
        (random() - 0.5) * 7,
        (random() - 0.5) * 4.2,
        -2.2 + random() * 3.4
      ),
      speed: 0.05 + random() * 0.09,
      phase: random() * Math.PI * 2,
      scale: 0.05 + random() * 0.13,
      alpha: 0.1 + random() * 0.26,
    }));
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;

    group.current.children.forEach((child, i) => {
      const mote = motes[i];
      const sprite = child as THREE.Sprite;

      sprite.position.set(
        mote.base.x + Math.sin(t * mote.speed + mote.phase) * 0.5,
        mote.base.y + Math.cos(t * mote.speed * 0.8 + mote.phase) * 0.35,
        mote.base.z
      );
      sprite.material.opacity = mote.alpha * (0.55 + Math.sin(t * 0.5 + mote.phase) * 0.45);
    });
  });

  return (
    <group ref={group}>
      {motes.map((mote, i) => (
        <sprite key={i} scale={[mote.scale, mote.scale, mote.scale]}>
          <spriteMaterial
            map={dot}
            color="#c8a165"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* The cup                                                                    */
/* -------------------------------------------------------------------------- */

function Cup() {
  const spinner = useRef<THREE.Group>(null);
  const floater = useRef<THREE.Group>(null);
  const spin = useRef(0);
  const { pointer } = useThree();

  const glaze = useGlaze();

  const cupGeometry = useMemo(
    () => new THREE.LatheGeometry(CUP_PROFILE.map(([x, y]) => new THREE.Vector2(x, y)), 192),
    []
  );

  const saucerGeometry = useMemo(
    () => new THREE.LatheGeometry(SAUCER_PROFILE.map(([x, y]) => new THREE.Vector2(x, y)), 160),
    []
  );

  const handleGeometry = useMemo(
    () => new THREE.TubeGeometry(HANDLE_CURVE, 96, 0.046, 20, false),
    []
  );

  useFrame((state, delta) => {
    if (!spinner.current || !floater.current) return;

    // A steady, slow turn, with a restrained parallax toward the cursor. Both
    // are eased so nothing ever snaps.
    spin.current += delta * ROTATION_SPEED;
    const targetY = spin.current + pointer.x * 0.14;
    const targetX = -pointer.y * 0.035;

    spinner.current.rotation.y = THREE.MathUtils.lerp(spinner.current.rotation.y, targetY, 0.045);
    spinner.current.rotation.x = THREE.MathUtils.lerp(spinner.current.rotation.x, targetX, 0.03);

    // A float of a few pixels, so the object never reads as frozen.
    floater.current.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.012;
  });

  return (
    <group ref={floater} position={[1.25, -0.5, 0]} scale={1.16}>
      <group ref={spinner}>
        {/* saucer */}
        <mesh geometry={saucerGeometry}>
          <meshPhysicalMaterial {...CERAMIC} color="#f4efe4" side={THREE.DoubleSide} />
        </mesh>

        {/* cup body, wordmark fired into the glaze */}
        <mesh geometry={cupGeometry} position={[0, 0.062, 0]}>
          <meshPhysicalMaterial {...CERAMIC} map={glaze} side={THREE.DoubleSide} />
        </mesh>

        {/* handle */}
        <mesh geometry={handleGeometry} position={[0, 0.062, 0]}>
          <meshPhysicalMaterial {...CERAMIC} color="#f8f3ea" />
        </mesh>

        {/* coffee: dark, glossy, sunk just below the rim */}
        <mesh position={[0, 0.79, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.634, 128]} />
          <meshPhysicalMaterial
            color="#2b1509"
            roughness={0.1}
            metalness={0.18}
            clearcoat={1}
            clearcoatRoughness={0.05}
            envMapIntensity={1.9}
          />
        </mesh>

        {/* crema, lighter where it meets the ceramic */}
        <mesh position={[0, 0.792, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.634, 128]} />
          <meshBasicMaterial color="#8a4f1d" transparent opacity={0.42} depthWrite={false} />
        </mesh>

        <Steam />
      </group>
    </group>
  );
}

function Lighting() {
  const rim = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (rim.current) {
      rim.current.intensity = 30 + Math.sin(state.clock.elapsedTime * 0.5) * 4;
    }
  });

  return (
    <>
      <ambientLight intensity={0.1} color="#8a6a45" />

      {/* Key: a warm softbox, high and to the right. */}
      <directionalLight position={[3.4, 5.2, 2.8]} intensity={2.6} color="#ffe6c4" />

      {/* Gold rim from behind left — this is what draws the ceramic edge. */}
      <pointLight ref={rim} position={[-2.6, 1.9, -2.0]} intensity={30} color="#d9ab68" distance={13} decay={2} />

      {/* Low front fill, so the near side does not flatten out. */}
      <pointLight position={[-1.6, 1.0, 3.2]} intensity={11} color="#b3a394" distance={12} decay={2} />

      {/* Bounce from the table, lifting the saucer out of the cup's shadow. */}
      <pointLight position={[0.9, 0.15, 1.2]} intensity={8} color="#e8cfa8" distance={5} decay={2} />

      {/* Specular glint across the coffee surface. */}
      <spotLight
        position={[1.6, 4.0, 1.4]}
        angle={0.45}
        penumbra={1}
        intensity={30}
        color="#fff1d8"
        distance={15}
        decay={2}
      />
    </>
  );
}

export default function CupScene() {
  return (
    <Canvas
      // Capped DPR: past ~1.75 the extra pixels cost frames and buy nothing.
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.22,
      }}
      // Slightly elevated three-quarter angle: shape, handle, wordmark and a
      // little of the coffee surface all read at once.
      camera={{ position: [0, 2.3, 8.4], fov: 28 }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <StudioEnvironment />
        <Lighting />
        <ShadowDisc />
        <Motes />
        <Cup />
      </Suspense>
    </Canvas>
  );
}
