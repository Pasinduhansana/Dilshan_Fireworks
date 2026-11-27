
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

const BODY_HEIGHT = 2.35;
const BODY_RADIUS = 0.46;

function SpiralRibbon() {
  const geometry = useMemo(() => {
    const turns = 3.6;
    const segments = 480;
    const ribbonWidth = 0.19;
    const slope = BODY_HEIGHT / (turns * Math.PI * 2);
    
    const normalLength = Math.sqrt(slope * slope + BODY_RADIUS * BODY_RADIUS);
    const ns = -slope / normalLength;
    const ny = BODY_RADIUS / normalLength;

    const vertices: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * turns * Math.PI * 2;
      const y = -BODY_HEIGHT / 2 + t * BODY_HEIGHT;

      for (const side of [-1, 1]) {
        const offsetS = side * ribbonWidth / 2 * ns;
        const offsetY = side * ribbonWidth / 2 * ny;
        const adjustedAngle = angle + offsetS / BODY_RADIUS;

        vertices.push(
          (BODY_RADIUS + 0.012) * Math.cos(adjustedAngle),
          y + offsetY,
          (BODY_RADIUS + 0.012) * Math.sin(adjustedAngle)
        );
      }
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1);
      indices.push(a + 1, a + 2, a + 3);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        color="#d9a0ff"
        metalness={0.72}
        roughness={0.22}
        clearcoat={1}
        clearcoatRoughness={0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Flame() {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (outerRef.current) {
      outerRef.current.scale.y = 0.85 + Math.sin(t * 18) * 0.12;
      outerRef.current.scale.x = 0.85 + Math.sin(t * 14) * 0.1;
      outerRef.current.rotation.z = Math.sin(t * 12) * 0.05;
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
      {/* Outer flame */}
      <mesh ref={outerRef} position={[0, -0.45, 0]}>
        <coneGeometry args={[0.32, 1.1, 32]} />
        <meshBasicMaterial
          color="#ff6500"
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Inner flame */}
      <mesh ref={innerRef} position={[0, -0.35, 0]}>
        <coneGeometry args={[0.19, 0.85, 32]} />
        <meshBasicMaterial
          color="#ffdc85"
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Hot core */}
      <mesh position={[0, -0.25, 0]}>
        <coneGeometry args={[0.09, 0.65, 24]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Exhaust glow */}
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

function Sparks() {
  const sparksRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = 100;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 4);

    for (let i = 0; i < count; i++) {
      seeds[i * 4] = Math.random() * Math.PI * 2;
      seeds[i * 4 + 1] = 0.3 + Math.random() * 1.8;
      seeds[i * 4 + 2] = Math.random() * 2;
      seeds[i * 4 + 3] = Math.random() * 5;

      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }

    return { positions, seeds };
  }, []);

  useFrame((state) => {
    if (!sparksRef.current) return;

    const t = state.clock.elapsedTime;
    const positions = sparksRef.current.geometry.attributes.position;
    const array = positions.array as Float32Array;

    for (let i = 0; i < particles.seeds.length / 4; i++) {
      const angle = particles.seeds[i * 4];
      const speed = particles.seeds[i * 4 + 1];
      const phase = particles.seeds[i * 4 + 3];

      const progress = ((t + phase) % 1.5) / 1.5;

      const radius = progress * speed;

      array[i * 3] =
        Math.cos(angle + progress * 2) * radius;

      array[i * 3 + 1] =
        -1.55 - progress * 1.4 + Math.sin(t * 8 + phase) * 0.05;

      array[i * 3 + 2] =
        Math.sin(angle + progress * 2) * radius;
    }

    positions.needsUpdate = true;
  });

  return (
    <points ref={sparksRef} position={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
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

  const targetRotation = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (!rocketRef.current) return;

    const rocket = rocketRef.current;

    rocket.position.y =
      Math.sin(state.clock.elapsedTime * 0.8) * 0.08;

    rocket.rotation.x = THREE.MathUtils.damp(
      rocket.rotation.x,
      targetRotation.current.x,
      4,
      delta
    );

    rocket.rotation.y = THREE.MathUtils.damp(
      rocket.rotation.y,
      targetRotation.current.y,
      4,
      delta
    );
  });

  return (
    <group
      ref={rocketRef}
      onPointerMove={(event) => {
        targetRotation.current.x = event.point.y * 0.12;
        targetRotation.current.y = event.point.x * 0.18;
      }}
      onPointerLeave={() => {
        targetRotation.current.x = 0;
        targetRotation.current.y = 0;
      }}
    >
      {/* Main shell */}
      <mesh>
        <cylinderGeometry args={[BODY_RADIUS, BODY_RADIUS, BODY_HEIGHT, 96, 1]} />
        <meshPhysicalMaterial
          color="#57008f"
          metalness={0.82}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.12}
        />
      </mesh>

      {/* Spiral ribbon */}
      <SpiralRibbon />

      {/* Nose cone */}
      <mesh position={[0, 1.52, 0]}>
        <coneGeometry args={[BODY_RADIUS, 0.65, 96]} />
        <meshPhysicalMaterial
          color="#7200bd"
          metalness={0.78}
          roughness={0.19}
          clearcoat={1}
        />
      </mesh>

      {/* Nose ring */}
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
          roughness={0.75}
        />
      </mesh>

      {/* Animated flame */}
      <Flame />

      {/* Animated sparks */}
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

        <directionalLight
          position={[3, 4, 5]}
          intensity={3}
        />

        <pointLight
          position={[-3, 1, 2]}
          color="#c46aff"
          intensity={18}
        />

        <pointLight
          position={[2, -2, 3]}
          color="#ffb05b"
          intensity={15}
        />

        <RocketModel />
      </Canvas>
    </div>
  );
}
