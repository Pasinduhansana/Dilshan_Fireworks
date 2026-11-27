"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const COUNT = 56;

const vertexShader = /* glsl */ `
  attribute float aScale;
  attribute float aAlpha;
  attribute float aRotation;
  attribute float aSeed;
  varying float vAlpha;
  varying float vRotation;
  varying float vSeed;
  varying float vDepth;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * (220.0 / max(vDepth, 0.1));
    vAlpha = aAlpha;
    vRotation = aRotation;
    vSeed = aSeed;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  varying float vAlpha;
  varying float vRotation;
  varying float vSeed;
  varying float vDepth;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.1;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float c = cos(vRotation);
    float s = sin(vRotation);
    uv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
    float r = length(uv) * 2.0;

    vec2 nUv = uv * 3.0 + vSeed * 10.0 + uTime * 0.05;
    float n = fbm(nUv);
    float n2 = fbm(nUv * 2.2 - uTime * 0.03);
    float cloud = r - (n * 0.45 + n2 * 0.2);

    float alpha = 1.0 - smoothstep(0.35, 0.95, cloud);
    alpha *= smoothstep(1.1, 0.6, r);
    alpha *= vAlpha;

    vec3 dark = vec3(0.14, 0.14, 0.16);
    vec3 mid = vec3(0.32, 0.31, 0.33);
    vec3 warm = vec3(0.42, 0.32, 0.26);
    float shade = smoothstep(0.2, 0.85, n);
    vec3 color = mix(dark, mid, shade);
    color = mix(color, warm, smoothstep(0.55, 0.0, vAlpha) * 0.15);

    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color, alpha * 0.5);
  }
`;

type SmokeParticle = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
  rotation: number;
  rotSpeed: number;
  seed: number;
  baseAlpha: number;
};

function spawn(p: SmokeParticle, initial = false) {
  p.life = initial ? Math.random() * p.maxLife : 0;
  p.pos.set((Math.random() - 0.5) * 0.16, -0.15 - Math.random() * 0.35, (Math.random() - 0.5) * 0.16);
  p.vel.set((Math.random() - 0.5) * 0.18, -0.3 - Math.random() * 0.5, (Math.random() - 0.5) * 0.18);
  p.maxLife = 2.0 + Math.random() * 2.2;
  p.scale = 0.28 + Math.random() * 0.4;
  p.rotation = Math.random() * Math.PI * 2;
  p.rotSpeed = (Math.random() - 0.5) * 0.6;
  p.seed = Math.random();
  p.baseAlpha = 0.28 + Math.random() * 0.32;
}

export default function SmokeParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, scales, alphas, rotations, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);
    const alphas = new Float32Array(COUNT);
    const rotations = new Float32Array(COUNT);
    const seeds = new Float32Array(COUNT);
    return { positions, scales, alphas, rotations, seeds };
  }, []);

  const particlesRef = useRef<SmokeParticle[] | null>(null);
  if (particlesRef.current === null) {
    particlesRef.current = Array.from({ length: COUNT }, () => {
      const p: SmokeParticle = {
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 2,
        scale: 1,
        rotation: 0,
        rotSpeed: 0,
        seed: 0,
        baseAlpha: 0.5,
      };
      spawn(p, true);
      return p;
    });
  }

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  /* eslint-disable react-hooks/immutability -- Three.js uniform mutated per frame */
  useFrame((_, delta) => {
    if (!pointsRef.current || !particlesRef.current) return;
    uniforms.uTime.value += delta;
    const posAttr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    const scaleAttr = pointsRef.current.geometry.getAttribute("aScale") as THREE.BufferAttribute;
    const alphaAttr = pointsRef.current.geometry.getAttribute("aAlpha") as THREE.BufferAttribute;
    const rotAttr = pointsRef.current.geometry.getAttribute("aRotation") as THREE.BufferAttribute;
    const seedAttr = pointsRef.current.geometry.getAttribute("aSeed") as THREE.BufferAttribute;
    const particles = particlesRef.current;

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      p.life += delta;
      if (p.life >= p.maxLife) spawn(p);

      const t = p.life / p.maxLife;
      p.vel.x += Math.sin(p.life * 1.7 + p.seed * 10) * delta * 0.15;
      p.vel.z += Math.cos(p.life * 1.3 + p.seed * 8) * delta * 0.15;
      p.vel.y -= delta * 0.05;
      p.pos.addScaledVector(p.vel, delta);
      p.rotation += p.rotSpeed * delta;

      const expand = p.scale + t * 2.2;
      const fadeIn = smoothstep(0, 0.12, t);
      const fadeOut = 1 - smoothstep(0.4, 1, t);

      posAttr.array[i * 3] = p.pos.x;
      posAttr.array[i * 3 + 1] = p.pos.y;
      posAttr.array[i * 3 + 2] = p.pos.z;
      scaleAttr.array[i] = expand;
      alphaAttr.array[i] = p.baseAlpha * fadeIn * fadeOut;
      rotAttr.array[i] = p.rotation;
      seedAttr.array[i] = p.seed;
    }

    posAttr.needsUpdate = true;
    scaleAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
    rotAttr.needsUpdate = true;
    seedAttr.needsUpdate = true;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        <bufferAttribute attach="attributes-aAlpha" args={[alphas, 1]} />
        <bufferAttribute attach="attributes-aRotation" args={[rotations, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </points>
  );
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
