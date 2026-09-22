"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import type { SceneTier } from "@/lib/motion";

/* ==========================================================================
   The moving half of the hero.
   --------------------------------------------------------------------------
   The photograph froze a pour: beans suspended in the air, a plume of steam
   off the cup. This canvas gives that back its time.

   What is on it, and what is deliberately not:

   • The beans are the photograph's own beans. scripts/build-hero-layers.py
     cuts each one out of the original frame with its own alpha, motion blur
     and all, and they are used here as textures on billboarded planes. They
     are not drawn, not modelled and not stand-ins — they are the same beans,
     falling slowly instead of hanging still.

   • The steam is the photograph's own plume, lifted as a soft alpha field and
     released in overlapping puffs that rise, spread and thin out.

   • The cup is NOT here. It is a normal <img> in HeroStage sitting *in front*
     of this canvas. That is the whole architecture, and it is what removes
     the flash on reload: there is no second copy of the photograph to fade
     into, so there is nothing to see swapping over. It also buys perfect
     occlusion for nothing — the cup image is alpha cut-out, so beans falling
     behind it vanish behind its silhouette and reappear nowhere, and steam
     rises from behind the rim exactly as it should.

   • Nothing fades in. The beans start above the top of the frame and fall in;
     the puffs start transparent and grow. So the moment this canvas mounts,
     a second or two after the page paints, the screen does not change — the
     air simply starts moving.
   ========================================================================== */

const BEAN_URLS = [
  "/images/hero-bean-0.png",
  "/images/hero-bean-1.png",
  "/images/hero-bean-2.png",
  "/images/hero-bean-3.png",
  "/images/hero-bean-4.png",
  "/images/hero-bean-5.png",
];
const STEAM_URL = "/images/hero-steam.png";

/* The canvas is aligned to the same 64% right-hand column that the cup image
   occupies, so world units here map onto the photograph. */
const PLATE_WIDTH = 0.64;

/** Where the beans fall, in world units, relative to the cup's centre. */
const SPAWN_TOP = 3.4;
const FALL_BOTTOM = -0.9; // about the height of the rim: they land in the cup

/* --------------------------------------------------------------------------
   Textures
   -------------------------------------------------------------------------- */

/**
 * Loads a set of textures and owns them.
 *
 * Not `useLoader`: that returns textures owned by the loader's cache, and
 * configuring them means mutating something this component did not create —
 * which leaks settings into anything else that loads the same URL, and which
 * the React compiler is right to reject.
 */
function useTextures(urls: readonly string[]) {
  const [textures, setTextures] = useState<THREE.Texture[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    const loaded: THREE.Texture[] = [];

    Promise.all(
      urls.map(
        (url) =>
          new Promise<THREE.Texture>((resolve, reject) =>
            loader.load(url, resolve, undefined, reject)
          )
      )
    )
      .then((result) => {
        if (cancelled) {
          result.forEach((t) => t.dispose());
          return;
        }
        result.forEach((texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = 4;
          texture.needsUpdate = true;
          loaded.push(texture);
        });
        setTextures(result);
      })
      .catch(() => {
        /* A missing sprite must not take the page down: the hero is still a
           photograph without it. */
      });

    return () => {
      cancelled = true;
      loaded.forEach((texture) => texture.dispose());
    };
  }, [urls]);

  return textures;
}

/* --------------------------------------------------------------------------
   Beans
   -------------------------------------------------------------------------- */

type BeanSeed = {
  texture: number;
  x: number;
  z: number;
  scale: number;
  speed: number;
  offset: number;
  spin: number;
  sway: number;
  swayPhase: number;
};

/**
 * Deterministic seeds.
 *
 * A seeded generator rather than Math.random, so the arrangement is the same
 * on the server, on the client and in every screenshot of a regression test.
 * Random heroes are heroes you cannot diff.
 */
function makeSeeds(count: number, textureCount: number): BeanSeed[] {
  let state = 0x9e3779b9 >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };

  return Array.from({ length: count }, (_, index) => {
    // Spread across the cup's mouth, biased hard to the middle — a pour is a
    // cone, not a curtain. The camera sees about ±1.96 world units across and
    // the cup's mouth is roughly ±0.9 of that, so anything wider than this
    // rains down beside the cup instead of into it.
    const spread = (random() - 0.5) * 2;
    return {
      texture: index % textureCount,
      x: spread * Math.abs(spread) * 0.62,
      z: (random() - 0.5) * 1.6,
      // Sized to match the beans already in the photograph, which are 50–90px
      // in a 1400px-wide plate. Bigger than that and the falling ones read as
      // a different, closer object.
      scale: 0.13 + random() * 0.13,
      // Slowly. The brief asked for pouring, not raining: a bean crosses the
      // frame in eight to fourteen seconds.
      speed: 0.3 + random() * 0.22,
      offset: random(),
      spin: (random() - 0.5) * 0.5,
      sway: 0.05 + random() * 0.12,
      swayPhase: random() * Math.PI * 2,
    };
  });
}

function Beans({
  seeds,
  textures,
  pointer,
}: {
  seeds: BeanSeed[];
  textures: THREE.Texture[];
  pointer: React.RefObject<THREE.Vector2>;
}) {
  const group = useRef<THREE.Group>(null);

  const materials = useMemo(
    () =>
      textures.map(
        (map) =>
          new THREE.MeshBasicMaterial({
            map,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
          })
      ),
    [textures]
  );

  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  useFrame((state) => {
    const host = group.current;
    if (!host) return;

    const time = state.clock.elapsedTime;
    const travel = SPAWN_TOP - FALL_BOTTOM;

    host.children.forEach((child, index) => {
      const seed = seeds[index];
      if (!seed) return;

      // A sawtooth in normalised height, so every bean loops for ever without
      // any bookkeeping and without a moment where they all reset together.
      const progress = (seed.offset + time * seed.speed * 0.1) % 1;
      const y = SPAWN_TOP - progress * travel;

      child.position.set(
        seed.x + Math.sin(time * seed.sway + seed.swayPhase) * 0.14,
        y,
        seed.z
      );
      child.rotation.z = seed.swayPhase + time * seed.spin;

      // Fade in at the top and out at the bottom. The top fade is what makes
      // the canvas's arrival invisible; the bottom fade is the bean arriving
      // in the coffee.
      const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.opacity =
        Math.min(1, progress / 0.12) * Math.min(1, (1 - progress) / 0.18);
    });

    // The whole shower answers the pointer a little more than the cup behind
    // it does. That difference is the depth.
    const target = pointer.current;
    if (target) {
      host.position.x = THREE.MathUtils.lerp(host.position.x, target.x * 0.22, 0.04);
      host.position.y = THREE.MathUtils.lerp(host.position.y, target.y * 0.12, 0.04);
    }
  });

  return (
    <group ref={group}>
      {seeds.map((seed, index) => {
        const texture = textures[seed.texture];
        const aspect = texture.image
          ? (texture.image as HTMLImageElement).width /
            (texture.image as HTMLImageElement).height
          : 1;
        return (
          <mesh key={index} material={materials[seed.texture]}>
            <planeGeometry args={[seed.scale * aspect, seed.scale]} />
          </mesh>
        );
      })}
    </group>
  );
}

/* --------------------------------------------------------------------------
   Steam
   -------------------------------------------------------------------------- */

type PuffSeed = {
  x: number;
  z: number;
  scale: number;
  speed: number;
  offset: number;
  drift: number;
};

function makePuffs(count: number): PuffSeed[] {
  let state = 0x85ebca6b >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };

  return Array.from({ length: count }, (_, index) => ({
    x: (random() - 0.5) * 0.34,
    z: -0.2 - random() * 0.5,
    scale: 0.85 + random() * 0.5,
    speed: 0.055 + random() * 0.035,
    offset: index / count + random() * 0.05,
    drift: (random() - 0.5) * 0.3,
  }));
}

function Steam({ seeds, texture }: { seeds: PuffSeed[]; texture: THREE.Texture }) {
  const group = useRef<THREE.Group>(null);

  const materials = useMemo(
    () =>
      seeds.map(
        () =>
          new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            opacity: 0,
            toneMapped: false,
            blending: THREE.AdditiveBlending,
          })
      ),
    [seeds, texture]
  );

  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  useFrame((state) => {
    const host = group.current;
    if (!host) return;
    const time = state.clock.elapsedTime;

    host.children.forEach((child, index) => {
      const seed = seeds[index];
      if (!seed) return;

      const progress = (seed.offset + time * seed.speed) % 1;

      // Vapour rises, widens and thins. All three at once, or it reads as a
      // texture sliding upward — which is what cheap steam always looks like.
      const rise = -0.55 + progress * 2.1;
      const spread = 1 + progress * 0.85;

      child.position.set(seed.x + progress * seed.drift, rise, seed.z);
      child.scale.set(spread, spread, 1);

      const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.opacity =
        0.38 * Math.min(1, progress / 0.25) * Math.max(0, 1 - progress) ** 1.4;
    });
  });

  return (
    <group ref={group}>
      {seeds.map((seed, index) => (
        <mesh key={index} material={materials[index]}>
          <planeGeometry args={[seed.scale * 0.55, seed.scale * 1.3]} />
        </mesh>
      ))}
    </group>
  );
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

function Contents({ tier, pointer }: { tier: SceneTier; pointer: React.RefObject<THREE.Vector2> }) {
  const beanTextures = useTextures(BEAN_URLS);
  const steamTextures = useTextures(useMemo(() => [STEAM_URL], []));

  const full = tier === "full";
  const seeds = useMemo(
    () => makeSeeds(full ? 18 : 10, BEAN_URLS.length),
    [full]
  );
  const puffs = useMemo(() => makePuffs(full ? 5 : 3), [full]);

  return (
    <>
      {steamTextures?.[0] ? <Steam seeds={puffs} texture={steamTextures[0]} /> : null}
      {beanTextures ? (
        <Beans seeds={seeds} textures={beanTextures} pointer={pointer} />
      ) : null}
    </>
  );
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
    <div
      ref={hostRef}
      /* Aligned to the cup image's own column so that "above the cup" in this
         scene is above the cup on screen, at every viewport width. */
      className="absolute inset-y-0 right-0 w-full md:w-[64%]"
      style={{ ["--plate-width" as string]: PLATE_WIDTH }}
    >
      <Canvas
        // Hard ceiling of 2, lower on the lite tier.
        dpr={[1, full ? 2 : 1.4]}
        gl={{
          antialias: full,
          alpha: true,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        }}
        camera={{ position: [0, 0, 5], fov: 42, near: 0.1, far: 30 }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <RenderGate active={active} />
          <Contents tier={tier} pointer={pointer} />
        </Suspense>
      </Canvas>
    </div>
  );
}
