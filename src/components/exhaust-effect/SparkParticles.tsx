"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const COUNT = 90;
const TRAIL = 5;
const TOTAL = COUNT * TRAIL;

type Spark = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  prev: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  hot: number;
};

function spawn(s: Spark, initial = false) {
  s.life = initial ? Math.random() * 1.4 : 0;
  s.maxLife = 0.55 + Math.random() * 1.25;
  const angle = Math.random() * Math.PI * 2;
  const spread = 0.08 + Math.random() * 1.1;
  const speed = 0.9 + Math.random() * 3.2;
  s.pos.set((Math.random() - 0.5) * 0.1, -0.05 - Math.random() * 0.15, (Math.random() - 0.5) * 0.1);
  s.prev.copy(s.pos);
  s.vel.set(
    Math.cos(angle) * spread * speed + (Math.random() - 0.5) * 0.4,
    -speed * (0.45 + Math.random() * 0.8),
    Math.sin(angle) * spread * speed + (Math.random() - 0.5) * 0.4,
  );
  s.size = 0.01 + Math.random() * 0.028;
  s.hot = Math.random();
}

export default function SparkParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  const sparksRef = useRef<Spark[] | null>(null);
  if (sparksRef.current === null) {
    sparksRef.current = Array.from({ length: COUNT }, () => {
      const s: Spark = {
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        prev: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        size: 0.02,
        hot: 0,
      };
      spawn(s, true);
      return s;
    });
  }

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || !sparksRef.current) return;
    const sparks = sparksRef.current;
    const dt = Math.min(delta, 0.033);

    for (let i = 0; i < COUNT; i++) {
      const s = sparks[i];
      s.prev.copy(s.pos);
      s.life += dt;
      if (s.life >= s.maxLife) spawn(s);

      s.vel.y -= dt * (2.6 + s.hot * 1.2);
      s.vel.x += (Math.random() - 0.5) * dt * 0.8;
      s.vel.z += (Math.random() - 0.5) * dt * 0.8;
      s.vel.x *= 1 - dt * 0.45;
      s.vel.z *= 1 - dt * 0.45;
      s.vel.y *= 1 - dt * 0.08;
      s.pos.addScaledVector(s.vel, dt);

      const t = s.life / s.maxLife;
      const heat = 1 - Math.pow(t, 0.65);

      for (let j = 0; j < TRAIL; j++) {
        const idx = i * TRAIL + j;
        const k = j / (TRAIL - 1);
        const trailFade = 1 - k;
        dummy.position.lerpVectors(s.pos, s.prev, k * 0.85);
        const scale = s.size * trailFade * (0.35 + heat * 0.9);
        dummy.scale.setScalar(Math.max(scale, 0.0001));
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);

        const glow = heat * trailFade;
        if (glow > 0.82) {
          color.setRGB(1, 0.98, 0.85);
        } else if (glow > 0.45) {
          color.setRGB(1, 0.55 + glow * 0.35, 0.12 + glow * 0.15);
        } else {
          color.setRGB(1, 0.22 + glow * 0.45, 0.03 + glow * 0.08);
        }
        mesh.setColorAt(idx, color);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TOTAL]} frustumCulled={false}>
      <sphereGeometry args={[1, 5, 5]} />
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
