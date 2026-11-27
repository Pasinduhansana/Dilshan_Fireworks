"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    vUv = uv;
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vPos;

  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 34.345);
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
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.2;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float y = vUv.y;
    float t = uTime;
    float angle = atan(vPos.z, vPos.x);
    vec2 nUv = vec2(angle * 1.2, y * 3.2 - t * 3.8);

    float n1 = fbm(nUv + vec2(t * 0.4, 0.0));
    float n2 = fbm(nUv * 1.7 - vec2(0.0, t * 1.6));
    float turb = (n1 - 0.5) * 0.55 + (n2 - 0.5) * 0.25;

    float radius = length(vPos.xz);
    float maxR = mix(0.42, 0.04, pow(y, 0.85)) * (0.85 + n1 * 0.35 + turb * 0.12);
    float shape = 1.0 - smoothstep(maxR * 0.55, maxR, radius);

    shape *= smoothstep(1.0, 0.55, y);
    shape *= smoothstep(0.0, 0.08, y);

    float erosion = fbm(vec2(angle * 2.0 + t * 2.0, y * 5.0 - t * 5.5));
    shape *= smoothstep(0.18, 0.52, erosion + (1.0 - y) * 0.25);

    float core = exp(-pow(radius / max(maxR * 0.35, 0.001), 2.0));
    core *= smoothstep(0.7, 0.0, y);

    float intensity = shape * (0.7 + n1 * 0.5) + core * 0.9;

    vec3 darkOrange = vec3(0.9, 0.18, 0.02);
    vec3 orange = vec3(1.0, 0.42, 0.05);
    vec3 yellow = vec3(1.0, 0.78, 0.15);
    vec3 white = vec3(1.0, 0.97, 0.88);

    vec3 color = mix(darkOrange, orange, smoothstep(0.05, 0.45, intensity));
    color = mix(color, yellow, smoothstep(0.35, 0.75, intensity));
    color = mix(color, white, smoothstep(0.65, 1.15, core + intensity * 0.35));

    float flicker = 0.92 + sin(t * 28.0 + y * 10.0) * 0.06 + sin(t * 19.0) * 0.04;
    color *= flicker;

    float alpha = clamp(shape * (0.55 + core * 0.7), 0.0, 1.0);
    alpha *= smoothstep(1.0, 0.75, y);

    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color * (1.2 + core * 1.8), alpha);
  }
`;

export default function FlameShader() {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const innerUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  /* eslint-disable react-hooks/immutability -- Three.js uniforms mutated per frame */
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    uniforms.uTime.value = t;
    innerUniforms.uTime.value = t + 0.3;
    if (outerRef.current) {
      const s = 1 + Math.sin(t * 14) * 0.04;
      outerRef.current.scale.set(s, 1 + Math.sin(t * 10) * 0.08, s);
    }
    if (innerRef.current) {
      const s = 1 + Math.sin(t * 18) * 0.05;
      innerRef.current.scale.set(s, 1 + Math.sin(t * 13) * 0.1, s);
    }
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group>
      <mesh ref={outerRef} position={[0, -0.95, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.42, 2.1, 48, 24, true]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={innerRef} position={[0, -0.7, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.22, 1.5, 32, 16, true]} />
        <shaderMaterial
          uniforms={innerUniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, -0.9, 0]} color="#ff7a1a" intensity={14} distance={6} decay={2} />
    </group>
  );
}
