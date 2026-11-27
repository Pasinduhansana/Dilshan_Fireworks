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
    float n3 = fbm(nUv * 3.1 + vec2(t * 1.2, -t * 2.4));
    float turb = (n1 - 0.5) * 0.6 + (n2 - 0.5) * 0.28 + (n3 - 0.5) * 0.12;

    float radius = length(vPos.xz);
    float maxR = mix(0.46, 0.03, pow(y, 0.9)) * (0.82 + n1 * 0.4 + turb * 0.16);
    float shape = 1.0 - smoothstep(maxR * 0.45, maxR, radius);

    shape *= smoothstep(1.0, 0.5, y);
    shape *= smoothstep(0.0, 0.06, y);

    float erosion = fbm(vec2(angle * 2.4 + t * 2.8, y * 6.0 - t * 6.5));
    shape *= smoothstep(0.12, 0.58, erosion + (1.0 - y) * 0.3);

    float core = exp(-pow(radius / max(maxR * 0.28, 0.001), 2.0));
    core *= smoothstep(0.55, 0.0, y);
    float throat = exp(-pow(radius / 0.07, 2.0)) * smoothstep(0.22, 0.0, y);

    float intensity = shape * (0.75 + n1 * 0.55) + core * 1.1 + throat * 0.8;

    vec3 red = vec3(0.85, 0.12, 0.01);
    vec3 orange = vec3(1.0, 0.38, 0.04);
    vec3 yellow = vec3(1.0, 0.76, 0.12);
    vec3 white = vec3(1.0, 0.98, 0.92);

    vec3 color = mix(red, orange, smoothstep(0.03, 0.4, intensity));
    color = mix(color, yellow, smoothstep(0.3, 0.72, intensity));
    color = mix(color, white, smoothstep(0.62, 1.2, core + throat + intensity * 0.28));

    float flicker = 0.9 + sin(t * 32.0 + y * 14.0) * 0.07 + sin(t * 21.0) * 0.05;
    color *= flicker;

    float alpha = clamp(shape * (0.6 + core * 0.75) + throat * 0.25, 0.0, 1.0);
    alpha *= smoothstep(1.0, 0.72, y);

    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color * (1.35 + core * 2.1 + throat * 1.2), alpha);
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
      <mesh ref={outerRef} position={[0, -1.05, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.46, 2.35, 48, 28, true]} />
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
      <mesh ref={innerRef} position={[0, -0.78, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.24, 1.7, 32, 20, true]} />
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
      <mesh position={[0, -0.15, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.1, 0.55, 24, 12, true]} />
        <meshBasicMaterial color="#fff6d5" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight position={[0, -0.2, 0]} color="#fff0c2" intensity={8} distance={2.2} decay={2} />
      <pointLight position={[0, -1.0, 0]} color="#ff6a14" intensity={18} distance={6.5} decay={2} />
    </group>
  );
}
