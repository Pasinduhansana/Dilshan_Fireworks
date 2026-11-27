"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef } from "react";
import ExhaustEffect from "@/components/exhaust-effect/ExhaustEffect";

const BODY_HEIGHT = 2.35;
const BODY_RADIUS = 0.46;

function RocketModel() {
  const [bodyMap, capMap] = useTexture(["/rocket-texture.png", "/rocket-cap.png"]);
  const rocket = useRef<THREE.Group>(null);
  const isDragging = useRef(false);
  const drag = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });

  const { bodyTexture, capTexture } = useMemo(() => {
    const body = bodyMap.clone();
    body.colorSpace = THREE.SRGBColorSpace;
    body.wrapS = THREE.RepeatWrapping;
    body.wrapT = THREE.ClampToEdgeWrapping;
    body.anisotropy = 8;
    body.needsUpdate = true;

    const cap = capMap.clone();
    cap.colorSpace = THREE.SRGBColorSpace;
    cap.wrapS = THREE.RepeatWrapping;
    cap.wrapT = THREE.ClampToEdgeWrapping;
    cap.anisotropy = 8;
    cap.needsUpdate = true;

    return { bodyTexture: body, capTexture: cap };
  }, [bodyMap, capMap]);

  useFrame((_, delta) => {
    if (!rocket.current) return;
    rocket.current.rotation.x = THREE.MathUtils.damp(
      rocket.current.rotation.x,
      targetRotation.current.x,
      6,
      delta,
    );
    rocket.current.rotation.y = THREE.MathUtils.damp(
      rocket.current.rotation.y,
      targetRotation.current.y,
      6,
      delta,
    );
  });

  return (
    <group
      ref={rocket}
      scale={0.78}
      onPointerDown={(event) => {
        event.stopPropagation();
        isDragging.current = true;
        drag.current.x = event.nativeEvent.clientX;
        drag.current.y = event.nativeEvent.clientY;
      }}
      onPointerMove={(event) => {
        if (!isDragging.current) return;
        const dx = event.nativeEvent.clientX - drag.current.x;
        const dy = event.nativeEvent.clientY - drag.current.y;
        drag.current.x = event.nativeEvent.clientX;
        drag.current.y = event.nativeEvent.clientY;

        targetRotation.current.y += dx * 0.008;
        targetRotation.current.x += dy * 0.008;
        targetRotation.current.x = THREE.MathUtils.clamp(targetRotation.current.x, -1.2, 1.2);
      }}
      onPointerUp={() => {
        isDragging.current = false;
      }}
      onPointerLeave={() => {
        isDragging.current = false;
      }}
    >
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[BODY_RADIUS, BODY_RADIUS, BODY_HEIGHT, 64, 1, false]} />
        <meshPhysicalMaterial
          map={bodyTexture}
          metalness={0.35}
          roughness={0.28}
          clearcoat={0.8}
          clearcoatRoughness={0.18}
        />
      </mesh>

      <mesh position={[0, 1.65, 0]}>
        <coneGeometry args={[0.57, 0.95, 64]} />
        <meshPhysicalMaterial
          map={capTexture}
          metalness={0.4}
          roughness={0.25}
          clearcoat={1}
          clearcoatRoughness={0.12}
        />
      </mesh>

      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.47, 0.47, 0.09, 64]} />
        <meshStandardMaterial color="#d7a348" metalness={0.85} roughness={0.22} />
      </mesh>

      <mesh position={[0, -1.18, 0]}>
        <cylinderGeometry args={[0.48, 0.48, 0.12, 64]} />
        <meshStandardMaterial color="#d7a348" metalness={0.8} roughness={0.25} />
      </mesh>

      <mesh position={[0, -1.38, 0]}>
        <cylinderGeometry args={[0.24, 0.34, 0.4, 32]} />
        <meshPhysicalMaterial color="#34343a" metalness={0.85} roughness={0.28} />
      </mesh>

      <mesh position={[0, -1.59, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.07, 32]} />
        <meshStandardMaterial color="#b78b45" metalness={0.85} roughness={0.2} />
      </mesh>

      <ExhaustEffect position={[0, -1.62, 0]} scale={1} />
    </group>
  );
}

export default function RocketScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 5, 6]} intensity={2} />
        <pointLight position={[-3, 2, 3]} intensity={1.5} color="#ffbb77" />
        <pointLight position={[2, -3, 4]} intensity={1.2} color="#ff6600" />
        <RocketModel />
      </Canvas>
    </div>
  );
}
