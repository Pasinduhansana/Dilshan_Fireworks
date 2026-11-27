
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

const BODY_HEIGHT = 2.35;
const BODY_RADIUS = 0.46;

function Flame() {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (outerRef.current) {
      outerRef.current.scale.y = 0.85 + Math.sin(t * 18) * 0.12;
      outerRef.current.scale.x = 0.85 + Math.sin(t * 14) * 0.1;
    }

    if (innerRef.current) {
      innerRef.current.scale.y = 0.9 + Math.sin(t * 24) * 0.18;
      innerRef.current.scale.x = 0.9 + Math.sin(t * 20) * 0.12;
    }

    if (lightRef.current) {
      lightRef.current.intensity = 8 + Math.sin(t * 25) * 3;
    }
  });

  return (
    <group position={[0, -1.35, 0]}>
      <mesh ref={outerRef} position={[0, -0.45, 0]}>
        <coneGeometry args={[0.32, 1.1, 32]} />
        <meshBasicMaterial color="#ff6500" transparent opacity={0.92} />
      </mesh>

      <mesh ref={innerRef} position={[0, -0.35, 0]}>
        <coneGeometry args={[0.19, 0.85, 32]} />
        <meshBasicMaterial color="#ffdc85" transparent opacity={0.95} />
      </mesh>

      <mesh position={[0, -0.25, 0]}>
        <coneGeometry args={[0.09, 0.65, 24]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      <pointLight
        ref={lightRef}
        position={[0, -0.5, 0.2]}
        color="#ff9b35"
        intensity={10}
        distance={5}
      />
    </group>
  );
}

function createSparks() {
  let state = 123456789;
  const random = () => {
    state = (1664525 * state + 1013904223) % 4294967296;
    return state / 4294967296;
  };

  const positions = new Float32Array(100 * 3);
  const seeds = Array.from({ length: 100 }, () => ({
    angle: random() * Math.PI * 2,
    speed: 0.3 + random() * 1.8,
    phase: random() * 5,
  }));

  return { positions, seeds };
}

function Sparks() {
  const sparksRef = useRef<THREE.Points>(null);
  const { positions, seeds } = useMemo(() => createSparks(), []);

  useFrame((state) => {
    if (!sparksRef.current) return;

    const t = state.clock.elapsedTime;
    const array = sparksRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      const progress = ((t + seed.phase) % 1.5) / 1.5;
      const radius = progress * seed.speed;

      array[i * 3] = Math.cos(seed.angle + progress * 2) * radius;
      array[i * 3 + 1] = -1.55 - progress * 1.4;
      array[i * 3 + 2] = Math.sin(seed.angle + progress * 2) * radius;
    }

    sparksRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={sparksRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>

      <pointsMaterial
        color="#ffad45"
        size={0.045}
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
}

function RocketModel() {
  const rocketRef = useRef<THREE.Group>(null);

  const dragging = useRef(false);

  const [bodyMap, capMap] = useTexture([
    "/rocket-texture.png",
    "/rocket-cap.png",
  ]);

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

  useFrame((state) => {
    if (!rocketRef.current || dragging.current) return;

    const rocket = rocketRef.current;

    rocket.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
  });

  return (
    <group
      ref={rocketRef}
      onPointerDown={(event) => {
        dragging.current = true;
        if (event.target instanceof Element) {
          event.target.setPointerCapture(event.pointerId);
        }
      }}
      onPointerMove={(event) => {
        if (!dragging.current || !rocketRef.current) return;

        rocketRef.current.rotation.y += event.movementX * 0.008;
        rocketRef.current.rotation.x += event.movementY * 0.008;

        rocketRef.current.rotation.x = THREE.MathUtils.clamp(
          rocketRef.current.rotation.x,
          -1.2,
          1.2
        );
      }}
      onPointerUp={(event) => {
        dragging.current = false;
        if (event.target instanceof Element) {
          event.target.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    >
      {/* Textured rocket body */}
      <mesh>
        <cylinderGeometry args={[BODY_RADIUS, BODY_RADIUS, BODY_HEIGHT, 96, 1]} />
        <meshPhysicalMaterial
          map={bodyTexture}
          metalness={0.35}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.15}
        />
      </mesh>

      {/* Textured nose cone */}
      <mesh position={[0, 1.52, 0]}>
        <coneGeometry args={[BODY_RADIUS, 0.75, 96]} />
        <meshPhysicalMaterial
          map={capTexture}
          metalness={0.45}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.12}
        />
      </mesh>

      {/* Top collar */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.48, 0.48, 0.09, 96]} />
        <meshPhysicalMaterial
          color="#29003d"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Lower body ring */}
      <mesh position={[0, -1.16, 0]}>
        <cylinderGeometry args={[0.47, 0.47, 0.1, 96]} />
        <meshPhysicalMaterial
          color="#d18aff"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Exhaust nozzle */}
      <mesh position={[0, -1.25, 0]}>
        <cylinderGeometry args={[0.3, 0.22, 0.22, 48]} />
        <meshPhysicalMaterial
          color="#29003d"
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      <Flame />
      <Sparks />
    </group>
  );
}

export default function RocketScene() {
  return (
    <div className="rocket-scene">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.7} />

        <directionalLight position={[3, 4, 5]} intensity={3} />

        <pointLight
          position={[-3, 1, 2]}
          color="#c46aff"
          intensity={18}
        />

        <pointLight
          position={[2, -2, 3]}
          color="#ffb05b"
          intensity={10}
        />

        <RocketModel />
      </Canvas>
    </div>
  );
}
