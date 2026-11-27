
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function RocketImage() {
  const texture = useTexture("/hero.png");
  const groupRef = useRef<THREE.Group>(null);

  const targetRotation = useRef({
    x: 0,
    y: 0,
  });

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const group = groupRef.current;

    // Floating animation
    group.position.y =
      Math.sin(state.clock.elapsedTime * 0.8) * 0.12;

    // Smooth mouse-follow rotation
    group.rotation.x = THREE.MathUtils.damp(
      group.rotation.x,
      targetRotation.current.x,
      4,
      delta
    );

    group.rotation.y = THREE.MathUtils.damp(
      group.rotation.y,
      targetRotation.current.y,
      4,
      delta
    );

    // Slight continuous rotation
    group.rotation.z =
      Math.sin(state.clock.elapsedTime * 0.4) * 0.025;
  });

  return (
    <group
      ref={groupRef}
      onPointerMove={(event) => {
        const bounds = event.nativeEvent.target as HTMLElement;
        const rect = bounds.getBoundingClientRect();

        const x =
          (event.nativeEvent.clientX - rect.left) / rect.width;
        const y =
          (event.nativeEvent.clientY - rect.top) / rect.height;

        targetRotation.current.x = (y - 0.5) * 0.2;
        targetRotation.current.y = (x - 0.5) * 0.25;
      }}
      onPointerLeave={() => {
        targetRotation.current.x = 0;
        targetRotation.current.y = 0;
      }}
    >
      <mesh>
        <planeGeometry args={[3.8, 3.8]} />
        <meshBasicMaterial
          map={texture}
          transparent
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function RocketScene() {
  return (
    <div className="rocket-scene">
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 45,
        }}
        gl={{
          alpha: true,
          antialias: true,
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <RocketImage />
        </Suspense>
      </Canvas>
    </div>
  );
}
