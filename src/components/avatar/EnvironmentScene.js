"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Lighting presets: ambient + directional colours
 */
const LIGHTING_PRESETS = {
  studio: { ambient: "#ffffff", ambientI: 0.6, dir: "#ffffff", dirI: 1.0 },
  warm: { ambient: "#ffe4c4", ambientI: 0.5, dir: "#ffd700", dirI: 0.9 },
  cool: { ambient: "#cce0ff", ambientI: 0.5, dir: "#aac8ff", dirI: 0.9 },
  night: { ambient: "#334466", ambientI: 0.25, dir: "#6688cc", dirI: 0.5 },
  sunset: { ambient: "#ffccaa", ambientI: 0.4, dir: "#ff8844", dirI: 1.0 },
};

/**
 * Map emotions → slight lighting tint shifts
 */
const EMOTION_TINT = {
  happy: "#fffff0",
  sad: "#d0d8e8",
  angry: "#ffe0d0",
  calm: "#e8f0ff",
  anxious: "#e8e0d8",
  neutral: "#ffffff",
};

/**
 * Map backgrounds → ground color + lighting preset hint + scene background
 */
const BACKGROUND_COLORS = {
  soft_blue: { ground: "#90B8D4", lightPreset: "studio", sceneBg: "#B8D4E8" },
  lavender: { ground: "#A898C0", lightPreset: "cool", sceneBg: "#C8B8DB" },
  mint: { ground: "#90C0A8", lightPreset: "studio", sceneBg: "#B5D8CC" },
  peach: { ground: "#D8B8A0", lightPreset: "warm", sceneBg: "#F0D5C0" },
  sky: { ground: "#88A8C8", lightPreset: "studio", sceneBg: "#A8C8E8" },
  warm_gray: { ground: "#A8A098", lightPreset: "warm", sceneBg: "#C8C0B8" },
  ocean: { ground: "#4A7890", lightPreset: "cool", sceneBg: "#5B8FA8" },
  forest: { ground: "#4A7858", lightPreset: "warm", sceneBg: "#5A8868" },
  sunset: { ground: "#B06850", lightPreset: "sunset", sceneBg: "#C87860" },
  midnight: { ground: "#1a1a2e", lightPreset: "night", sceneBg: "#2A2A40" },
  // Legacy fallbacks
  living_room: { ground: "#8B7355", lightPreset: "warm", sceneBg: "#3D2B1F" },
  charcoal: { ground: "#2a2a3e", lightPreset: "studio", sceneBg: "#1a1a2e" },
  starfield: { ground: "#1a1a2e", lightPreset: "studio", sceneBg: "#0a0a1a" },
};

/**
 * EnvironmentScene — sets up ambient light, directional light, and ground plane.
 * Emotion & lighting-preset driven.
 */
export function EnvironmentScene({
  emotion = "neutral",
  background = "starfield",
  lightingPreset = "studio",
}) {
  const ambientRef = useRef(null);
  const dirRef = useRef(null);
  const groundRef = useRef(null);
  const { scene } = useThree();

  const bgConfig = BACKGROUND_COLORS[background] || BACKGROUND_COLORS.starfield;
  const effectivePreset =
    LIGHTING_PRESETS[lightingPreset] ||
    LIGHTING_PRESETS[bgConfig.lightPreset] ||
    LIGHTING_PRESETS.studio;
  const tint = EMOTION_TINT[emotion] || EMOTION_TINT.neutral;

  // Set the 3D scene background color so it's visually distinct
  if (!scene.background) scene.background = new THREE.Color(bgConfig.sceneBg);

  // Smooth color transitions each frame
  useFrame((_, delta) => {
    const speed = delta * 3;

    // Lerp scene background
    if (scene.background) {
      const targetBg = new THREE.Color(bgConfig.sceneBg);
      scene.background.lerp(targetBg, speed);
    }
    if (ambientRef.current) {
      const target = new THREE.Color(effectivePreset.ambient).multiply(
        new THREE.Color(tint),
      );
      ambientRef.current.color.lerp(target, speed);
      ambientRef.current.intensity +=
        (effectivePreset.ambientI - ambientRef.current.intensity) * speed;
    }
    if (dirRef.current) {
      const target = new THREE.Color(effectivePreset.dir);
      dirRef.current.color.lerp(target, speed);
      dirRef.current.intensity +=
        (effectivePreset.dirI - dirRef.current.intensity) * speed;
    }
    if (groundRef.current) {
      const targetGround = new THREE.Color(bgConfig.ground);
      groundRef.current.color.lerp(targetGround, speed);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={effectivePreset.ambientI} />
      <directionalLight
        ref={dirRef}
        position={[2, 4, 3]}
        intensity={effectivePreset.dirI}
        castShadow={false}
      />
      {/* Soft fill light from below to avoid harsh shadows under chin */}
      <directionalLight position={[-1, -1, 2]} intensity={0.2} />
      {/* Ground plane — color driven by background selection */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
        receiveShadow={false}
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          ref={groundRef}
          color={bgConfig.ground}
          transparent
          opacity={0.6}
        />
      </mesh>
    </>
  );
}
