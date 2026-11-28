"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type PackageFireworkRevealProps = {
  active: boolean;
  seed: number;
  className?: string;
};

const PARTICLES = 190;
const ROCKET_TIME = 0.72;
const BURN_TIME = 1.15;
const REVERSE_TIME = 0.8;

const surfaceVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const surfaceFragment = /* glsl */ `
  precision highp float;
  uniform float uBurn;
  uniform float uTime;
  uniform float uSeed;
  uniform float uFlash;
  uniform vec2 uResolution;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 34.37);
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
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += noise(p) * amplitude;
      p *= 2.08;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    float aspect = max(uResolution.x / max(uResolution.y, 1.0), 0.001);
    vec2 centered = (vUv - 0.5) * vec2(aspect, 1.0);
    float dist = length(centered);

    vec2 flow = vec2(uTime * 0.05, -uTime * 0.08);
    float coarse = fbm(vUv * vec2(aspect, 1.0) * 5.0 + uSeed * 3.7 + flow);
    float fine = fbm(vUv * vec2(aspect, 1.0) * 15.0 - uSeed * 2.1 - flow * 1.7);
    float turbulence = (coarse - 0.5) * 0.15 + (fine - 0.5) * 0.055;

    float threshold = uBurn * 0.7 - 0.045;
    float edge = dist + turbulence - threshold;

    float surface = smoothstep(0.0, 0.045, edge);
    float rim = exp(-abs(edge) * 28.0) * smoothstep(0.015, 0.18, uBurn);
    rim *= 0.75 + 0.25 * sin(uTime * 16.0 + vUv.y * 40.0);

    vec3 dark = mix(vec3(0.045, 0.125, 0.15), vec3(0.018, 0.07, 0.09), vUv.y);
    dark += (coarse - 0.5) * 0.03;

    vec3 fire = mix(vec3(1.0, 0.32, 0.05), vec3(1.0, 0.86, 0.35), smoothstep(0.0, 0.035, edge));
    vec3 color = dark + fire * rim * 1.7;
    color += uFlash * exp(-dist * 7.0) * vec3(1.0, 0.62, 0.24);

    float alpha = max(surface * 0.97, rim * 0.9);
    alpha = max(alpha, uFlash * exp(-dist * 9.0) * 0.85);
    if (alpha < 0.008) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

const sparkVertex = /* glsl */ `
  attribute float aLife;
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uPixelRatio;
  varying float vLife;
  varying vec3 vColor;
  void main() {
    vLife = aLife;
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (0.35 + aLife * 0.9);
  }
`;

const sparkFragment = /* glsl */ `
  precision highp float;
  varying float vLife;
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;
    float soft = smoothstep(1.0, 0.0, d);
    soft *= soft;
    float alpha = soft * vLife;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor * (1.2 + soft * 1.4), alpha);
  }
`;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
};

export default function PackageFireworkReveal({ active, seed, className = "" }: PackageFireworkRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef<(value: boolean) => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    renderer.setClearColor(0x000000, 0);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(pixelRatio);

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();

    const surfaceUniforms = {
      uBurn: { value: 0 },
      uTime: { value: 0 },
      uSeed: { value: seed },
      uFlash: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    };
    const surfaceMaterial = new THREE.ShaderMaterial({
      uniforms: surfaceUniforms,
      vertexShader: surfaceVertex,
      fragmentShader: surfaceFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const surface = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), surfaceMaterial);
    surface.frustumCulled = false;
    scene.add(surface);

    const positions = new Float32Array(PARTICLES * 3);
    const lives = new Float32Array(PARTICLES);
    const sizes = new Float32Array(PARTICLES);
    const colors = new Float32Array(PARTICLES * 3);
    const particles: Particle[] = Array.from({ length: PARTICLES }, () => ({
      x: 0,
      y: -2,
      vx: 0,
      vy: 0,
      life: 1,
      maxLife: 1,
      size: 0,
      r: 1,
      g: 0.6,
      b: 0.2,
    }));

    const sparkGeometry = new THREE.BufferGeometry();
    sparkGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    sparkGeometry.setAttribute("aLife", new THREE.BufferAttribute(lives, 1));
    sparkGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    sparkGeometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    const sparkMaterial = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: pixelRatio } },
      vertexShader: sparkVertex,
      fragmentShader: sparkFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
    sparks.frustumCulled = false;
    scene.add(sparks);

    let width = 1;
    let height = 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      surfaceUniforms.uResolution.value.set(width, height);
      if (!running) render();
    };

    let phase: "idle" | "rocket" | "burn" | "reverse" = "idle";
    let phaseTime = 0;
    let burn = 0;
    let flash = 0;
    let rocketX = 0;
    let running = false;
    let last = performance.now();
    let raf = 0;

    const clearParticles = () => {
      for (let i = 0; i < PARTICLES; i++) {
        const p = particles[i];
        p.life = 1;
        p.maxLife = 1;
        p.size = 0;
        p.x = 0;
        p.y = -2;
        p.vx = 0;
        p.vy = 0;
      }
    };

    const writeParticles = () => {
      for (let i = 0; i < PARTICLES; i++) {
        const p = particles[i];
        const k = i * 3;
        positions[k] = p.x;
        positions[k + 1] = p.y;
        positions[k + 2] = 0;
        lives[i] = THREE.MathUtils.clamp(1 - p.life / p.maxLife, 0, 1);
        sizes[i] = p.size;
        colors[k] = p.r;
        colors[k + 1] = p.g;
        colors[k + 2] = p.b;
      }
      sparkGeometry.attributes.position.needsUpdate = true;
      sparkGeometry.attributes.aLife.needsUpdate = true;
      sparkGeometry.attributes.aSize.needsUpdate = true;
      sparkGeometry.attributes.aColor.needsUpdate = true;
    };

    const spawnParticle = (data: Partial<Particle>) => {
      for (let i = 0; i < PARTICLES; i++) {
        const p = particles[i];
        if (p.size > 0 && p.life < p.maxLife) continue;
        p.x = data.x ?? 0;
        p.y = data.y ?? 0;
        p.vx = data.vx ?? 0;
        p.vy = data.vy ?? 0;
        p.life = 0;
        p.maxLife = data.maxLife ?? 1;
        p.size = data.size ?? 3;
        p.r = data.r ?? 1;
        p.g = data.g ?? 0.5;
        p.b = data.b ?? 0.15;
        return;
      }
    };

    const explode = () => {
      flash = 1;
      spawnParticle({ x: rocketX, y: 0, vx: 0, vy: 0, size: 12, maxLife: 0.32, r: 1, g: 0.96, b: 0.78 });
      for (let i = 0; i < 150; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.22 + Math.random() * 0.95;
        const hot = Math.random();
        spawnParticle({
          x: rocketX + (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 4.5,
          maxLife: 0.65 + Math.random() * 1.05,
          r: 1,
          g: hot > 0.72 ? 0.9 : 0.36 + hot * 0.45,
          b: hot > 0.86 ? 0.7 : 0.08 + hot * 0.12,
        });
      }
      for (let i = 0; i < 26; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.08 + Math.random() * 0.3;
        spawnParticle({
          x: rocketX,
          y: 0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 6,
          maxLife: 1.1 + Math.random() * 0.8,
          r: 1,
          g: 0.28 + Math.random() * 0.28,
          b: 0.05,
        });
      }
    };

    const advanceParticles = (dt: number) => {
      for (let i = 0; i < PARTICLES; i++) {
        const p = particles[i];
        if (p.size <= 0 || p.life >= p.maxLife) continue;
        p.life += dt;
        p.vy -= dt * 0.32;
        p.vx *= 1 - dt * 0.7;
        p.vy *= 1 - dt * 0.22;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      writeParticles();
    };

    const render = () => {
      surfaceUniforms.uBurn.value = burn;
      surfaceUniforms.uFlash.value = flash;
      renderer.render(scene, camera);
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (phase === "rocket") {
        phaseTime += dt;
        const k = THREE.MathUtils.clamp(phaseTime / ROCKET_TIME, 0, 1);
        const eased = 1 - Math.pow(1 - k, 2.4);
        const y = -0.95 + eased * 0.95;
        rocketX = Math.sin(k * Math.PI) * 0.04;
        spawnParticle({
          x: rocketX + (Math.random() - 0.5) * 0.012,
          y: y - 0.02,
          vx: (Math.random() - 0.5) * 0.05,
          vy: -0.08 - Math.random() * 0.12,
          size: 2 + Math.random() * 3,
          maxLife: 0.2 + Math.random() * 0.22,
          r: 1,
          g: 0.45 + Math.random() * 0.45,
          b: 0.08 + Math.random() * 0.2,
        });
        spawnParticle({ x: rocketX, y, vx: 0, vy: 0, size: 7, maxLife: 0.16, r: 1, g: 0.92, b: 0.62 });
        if (k >= 1) {
          explode();
          phase = "burn";
          phaseTime = 0;
        }
      } else if (phase === "burn") {
        phaseTime += dt;
        burn = THREE.MathUtils.clamp(phaseTime / BURN_TIME, 0, 1);
        flash *= 1 - dt * 5.5;
        if (burn >= 1) {
          phase = "idle";
          running = false;
          surfaceUniforms.uFlash.value = 0;
          render();
          return;
        }
      } else if (phase === "reverse") {
        phaseTime += dt;
        const k = THREE.MathUtils.clamp(phaseTime / REVERSE_TIME, 0, 1);
        burn *= 1 - k * 0.22;
        if (k >= 1 || burn < 0.01) {
          burn = 0;
          flash = 0;
          clearParticles();
          writeParticles();
          phase = "idle";
          running = false;
          render();
          return;
        }
      }

      surfaceUniforms.uTime.value += dt;
      if (!reduced || phase === "burn" || phase === "reverse") advanceParticles(dt);
      render();
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      clearParticles();
      writeParticles();
      burn = 0;
      flash = 0;
      phaseTime = 0;
      rocketX = 0;
      phase = "rocket";
      last = performance.now();
      running = true;
      raf = requestAnimationFrame(frame);
    };

    const reverse = () => {
      if (phase === "idle" && burn === 0) return;
      cancelAnimationFrame(raf);
      phaseTime = 0;
      phase = "reverse";
      last = performance.now();
      running = true;
      raf = requestAnimationFrame(frame);
    };

    activeRef.current = (value: boolean) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        cancelAnimationFrame(raf);
        running = false;
        burn = value ? 1 : 0;
        flash = 0;
        clearParticles();
        writeParticles();
        render();
        return;
      }
      if (value) start();
      else reverse();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    render();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      surface.geometry.dispose();
      surfaceMaterial.dispose();
      sparkGeometry.dispose();
      sparkMaterial.dispose();
      renderer.dispose();
    };
  }, [seed]);

  useEffect(() => {
    activeRef.current(active);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      data-firework-reveal
      className={`pointer-events-none absolute inset-0 z-[1] h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
