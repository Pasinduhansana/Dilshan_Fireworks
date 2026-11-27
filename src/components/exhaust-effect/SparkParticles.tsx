"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const COUNT = 90;

type Spark = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
};

function spawn(s: Spark, initial = false) {
  s.life = initial ? Math.random() * 1.2 : 0;
  s.maxLife = 0.45 + Math.random() * 1.1;
  const angle = Math.random() * Math.PI * 2;
  const spread = 0.15 + Math.random() * 0.9;
  const speed = 0.8 + Math.random() * 2.8;
  s.pos.set((Math.random() - 0.5) * 0.12, -0.1 - Math.random() * 0.2, (Math.random() - 0.5) * 0.12);
  s.vel.set(Math.cos(angle) * spread * speed, -speed * (0.55 + Math.random() * 0.7), Math.sin(angle) * spread * speed);
  s.size = 0.012 + Math.random() * 0.03;
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
        life: 0,
        maxLife: 1,
        size: 0.02,
      };
      spawn(s, true);
      return s;
    });
  }

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || !sparksRef.current) return;
    const sparks = sparksRef.current;

    for (let i = 0; i < COUNT; i++) {
      const s = sparks[i];
      s.life += delta;
      if (s.life >= s.maxLife) spawn(s);

      s.vel.y -= delta * 3.2;
      s.vel.x *= 1 - delta * 0.35;
      s.vel.z *= 1 - delta * 0.35;
      s.pos.addScaledVector(s.vel, delta);

      const t = s.life / s.maxLife;
      const scale = s.size * (1 - Math.pow(t, 1.8));
      dummy.position.copy(s.pos);
      dummy.scale.setScalar(Math.max(scale, 0.0001));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const heat = 1 - t;
      color.setRGB(1, 0.45 + heat * 0.45, 0.15 + heat * 0.55);
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.95}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
