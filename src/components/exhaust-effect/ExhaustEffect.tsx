"use client";

import FlameShader from "./FlameShader";
import SmokeParticles from "./SmokeParticles";
import SparkParticles from "./SparkParticles";

type ExhaustEffectProps = {
  position?: [number, number, number];
  scale?: number;
};

export default function ExhaustEffect({
  position = [0, 0, 0],
  scale = 1,
}: ExhaustEffectProps) {
  return (
    <group position={position} scale={scale}>
      <SmokeParticles />
      <FlameShader />
      <SparkParticles />
    </group>
  );
}
