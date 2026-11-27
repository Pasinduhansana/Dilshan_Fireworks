"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef } from "react";

/* =========================================================
   ROCKET CONFIGURATION
========================================================= */

const BODY_HEIGHT = 2.35;
const BODY_RADIUS = 0.46;

/* =========================================================
   PROCEDURAL FIRE SHADER
   No flame image texture required.
========================================================= */

const flameVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;

    gl_Position = projectionMatrix *
                  modelViewMatrix *
                  vec4(position, 1.0);
  }
`;

const flameFragmentShader = `
  uniform float uTime;

  varying vec2 vUv;

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

    return mix(
      mix(a, b, f.x),
      mix(c, d, f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 5; i++) {
      value += noise(p) * amplitude;
      p *= 2.0;
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vec2 uv = vUv;

    // y = 0: flame tip
    // y = 1: rocket nozzle

    float y = uv.y;

    // The flame tapers at the lower end.
    float taper = smoothstep(0.0, 0.18, y);

    float upperTaper =
      1.0 - smoothstep(0.88, 1.0, y) * 0.35;

    float width = taper * upperTaper;

    // Animated turbulence
    float t = uTime;

    vec2 noiseCoord = vec2(
      uv.x * 4.2 + sin(t * 2.0) * 0.3,
      uv.y * 5.0 - t * 3.2
    );

    float n1 = fbm(noiseCoord);
    float n2 = fbm(
      noiseCoord * 1.8 + vec2(t * 1.4, -t * 0.7)
    );

    float turbulence = (n1 - 0.5) * 0.38;
    turbulence += (n2 - 0.5) * 0.18;

    float distortedX = uv.x + turbulence;

    // Flame shape
    float center = 0.5;

    float flameWidth =
      width * (0.18 + n1 * 0.22 + n2 * 0.12);

    flameWidth *=
      0.7 + sin(t * 9.0 + uv.y * 18.0) * 0.08;

    float distanceFromCenter =
      abs(distortedX - center);

    float shape = 1.0 -
      smoothstep(
        flameWidth * 0.65,
        flameWidth,
        distanceFromCenter
      );

    // Irregular flame edge
    shape *= smoothstep(
      0.0,
      0.08,
      uv.y
    );

    shape *=
      1.0 - smoothstep(0.0, 0.06, uv.y);

    // Additional turbulent edge
    float edgeNoise = fbm(
      vec2(
        uv.x * 9.0 + t * 2.5,
        uv.y * 10.0 - t * 4.0
      )
    );

    shape *= smoothstep(
      0.15,
      0.65,
      edgeNoise + 0.3
    );

    // Bright central combustion
    float core = exp(
      -pow(distanceFromCenter / max(flameWidth * 0.38, 0.001), 2.0)
    );

    core *= shape;

    // Temperature-based color gradient
    vec3 outerColor = vec3(0.85, 0.055, 0.008);
    vec3 orangeColor = vec3(1.0, 0.23, 0.015);
    vec3 yellowColor = vec3(1.0, 0.68, 0.08);
    vec3 whiteColor = vec3(1.0, 0.95, 0.72);

    float intensity = shape * (
      0.65 + n1 * 0.55 + n2 * 0.35
    );

    vec3 color = mix(
      outerColor,
      orangeColor,
      smoothstep(0.05, 0.55, intensity)
    );

    color = mix(
      color,
      yellowColor,
      smoothstep(0.35, 0.75, core)
    );

    color = mix(
      color,
      whiteColor,
      smoothstep(0.72, 0.98, core)
    );

    // Flame brightness fluctuations
    float flicker =
      0.9 + sin(t * 23.0) * 0.08
      + sin(t * 37.0) * 0.04;

    color *= flicker;

    float alpha = shape * (
      0.65 + core * 0.35
    );

    alpha *= smoothstep(0.0, 0.12, uv.y);

    // Additive rendering
    gl_FragColor = vec4(
      color * intensity * 2.0,
      alpha
    );
  }
`;

/* =========================================================
   PROCEDURAL FLAME
========================================================= */

function ExhaustFlame() {
  const flameRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;

    if (!flameRef.current) return;

    flameRef.current.scale.x =
      1.0 + Math.sin(clock.elapsedTime * 17.0) * 0.08;

    flameRef.current.scale.y =
      1.0 + Math.sin(clock.elapsedTime * 12.0) * 0.12;
  });

  return (
    <mesh
      ref={flameRef}
      position={[0, -0.85, 0]}
      rotation={[0, 0, 0]}
    >
      <planeGeometry args={[1.15, 2.5, 1, 32]} />

      <shaderMaterial
        uniforms={uniforms}
        vertexShader={flameVertexShader}
        fragmentShader={flameFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

/* =========================================================
   SMOKE PARTICLES
   Smoke image texture: /rocket-smoke.png
========================================================= */

function SmokeParticles() {
  const smokeTexture = useTexture("/rocket-smoke.png");

  const particles = useRef<THREE.Sprite[]>([]);

  const data = useMemo(() => {
    return Array.from({ length: 40 }, () => ({
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),

      scale: 0.3 + Math.random() * 0.5,

      rotation: Math.random() * Math.PI,

      rotationSpeed:
        (Math.random() - 0.5) * 1.2,

      life: Math.random() * 2.0,

      opacity: 0.15 + Math.random() * 0.25,
    }));
  }, []);

  useFrame((_, delta) => {
    data.forEach((p, i) => {
      const sprite = particles.current[i];

      if (!sprite) return;

      p.life += delta;

      p.position.addScaledVector(
        p.velocity,
        delta
      );

      // Turbulent drifting
      p.velocity.x +=
        (Math.random() - 0.5) * delta * 0.45;

      p.velocity.z +=
        (Math.random() - 0.5) * delta * 0.45;

      p.velocity.x = THREE.MathUtils.clamp(
        p.velocity.x,
        -0.65,
        0.65
      );

      p.velocity.z = THREE.MathUtils.clamp(
        p.velocity.z,
        -0.65,
        0.65
      );

      // Smoke twists as it rises
      p.position.x +=
        Math.sin(p.life * 2.5) * delta * 0.12;

      p.position.z +=
        Math.cos(p.life * 2.0) * delta * 0.08;

      // Expansion
      p.scale += delta * 0.28;

      p.rotation += p.rotationSpeed * delta;

      if (p.life > 2.5 || p.position.y > 3.0) {
        p.life = 0;

        p.position.set(
          (Math.random() - 0.5) * 0.35,
          0,
          (Math.random() - 0.5) * 0.35
        );

        p.velocity.set(
          (Math.random() - 0.5) * 0.4,
          0.4 + Math.random() * 0.65,
          (Math.random() - 0.5) * 0.4
        );

        p.scale = 0.25 + Math.random() * 0.45;

        p.opacity = 0.15 + Math.random() * 0.25;
      }

      sprite.position.copy(p.position);

      sprite.scale.set(
        p.scale,
        p.scale,
        p.scale
      );

      sprite.material.rotation = p.rotation;

      const fadeIn = Math.min(p.life / 0.35, 1);

      const fadeOut = Math.max(
        0,
        1 - p.life / 2.5
      );

      sprite.material.opacity =
        p.opacity * fadeIn * fadeOut;
    });
  });

  return (
    <>
      {data.map((_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            if (el) particles.current[i] = el;
          }}
        >
          <spriteMaterial
            map={smokeTexture}
            transparent
            depthWrite={false}
            opacity={0.25}
            color="#858585"
          />
        </sprite>
      ))}
    </>
  );
}

/* =========================================================
   SPARK PARTICLES
========================================================= */

function SparkParticles() {
  const sparks = useRef<THREE.Mesh[]>([]);

  const data = useMemo(() => {
    return Array.from({ length: 65 }, () => ({
      position: new THREE.Vector3(),

      velocity: new THREE.Vector3(),

      life: 0,

      maxLife: 0.4 + Math.random() * 0.9,

      size: 0.015 + Math.random() * 0.035,
    }));
  }, []);

  const resetSpark = (p: (typeof data)[0]) => {
    p.position.set(
      (Math.random() - 0.5) * 0.22,
      0,
      (Math.random() - 0.5) * 0.22
    );

    const angle = Math.random() * Math.PI * 2;

    const spread = 0.3 + Math.random() * 1.5;

    p.velocity.set(
      Math.cos(angle) * spread,
      0.5 + Math.random() * 2.5,
      Math.sin(angle) * spread
    );

    p.life = 0;

    p.maxLife = 0.4 + Math.random() * 0.9;

    p.size = 0.015 + Math.random() * 0.035;
  };

  useFrame((_, delta) => {
    data.forEach((p, i) => {
      const mesh = sparks.current[i];

      if (!mesh) return;

      p.life += delta;

      // Gravity
      p.velocity.y -= delta * 3.2;

      // Atmospheric drag
      p.velocity.x *= 1 - delta * 0.35;
      p.velocity.z *= 1 - delta * 0.35;

      p.position.addScaledVector(
        p.velocity,
        delta
      );

      mesh.position.copy(p.position);

      const progress = Math.min(
        p.life / p.maxLife,
        1
      );

      mesh.scale.setScalar(
        p.size * (1 - progress)
      );

      const material =
        mesh.material as THREE.MeshBasicMaterial;

      material.opacity = 1 - progress;

      if (p.life >= p.maxLife) {
        resetSpark(p);
      }
    });
  });

  return (
    <>
      {data.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) sparks.current[i] = el;
          }}
        >
          <sphereGeometry args={[1, 6, 6]} />

          <meshBasicMaterial
            color="#ffbb55"
            transparent
            opacity={1}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
}

/* =========================================================
   ROCKET MODEL
========================================================= */

function RocketModel() {
  const bodyTexture = useTexture("/rocket-texture.png");

  const capTexture = useTexture("/rocket-cap.png");

  const rocket = useRef<THREE.Group>(null);

  const isDragging = useRef(false);

  const drag = useRef({ x: 0, y: 0 });

  const targetRotation = useRef({
    x: 0,
    y: 0,
  });

  useFrame((_, delta) => {
    if (!rocket.current) return;

    rocket.current.rotation.x = THREE.MathUtils.damp(
      rocket.current.rotation.x,
      targetRotation.current.x,
      6,
      delta
    );

    rocket.current.rotation.y = THREE.MathUtils.damp(
      rocket.current.rotation.y,
      targetRotation.current.y,
      6,
      delta
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

        const dx =
          event.nativeEvent.clientX - drag.current.x;

        const dy =
          event.nativeEvent.clientY - drag.current.y;

        drag.current.x = event.nativeEvent.clientX;
        drag.current.y = event.nativeEvent.clientY;

        targetRotation.current.y += dx * 0.008;

        targetRotation.current.x += dy * 0.008;

        targetRotation.current.x =
          THREE.MathUtils.clamp(
            targetRotation.current.x,
            -1.2,
            1.2
          );
      }}
      onPointerUp={() => {
        isDragging.current = false;
      }}
      onPointerLeave={() => {
        isDragging.current = false;
      }}
    >
      {/* Rocket body */}

      <mesh position={[0, 0, 0]}>
        <cylinderGeometry
          args={[
            BODY_RADIUS,
            BODY_RADIUS,
            BODY_HEIGHT,
            64,
            1,
            false,
          ]}
        />

        <meshPhysicalMaterial
          map={bodyTexture}
          metalness={0.35}
          roughness={0.28}
          clearcoat={0.8}
          clearcoatRoughness={0.18}
        />
      </mesh>

      {/* Nose cap */}

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

      {/* Neck ring */}

      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry
          args={[0.47, 0.47, 0.09, 64]}
        />

        <meshStandardMaterial
          color="#d7a348"
          metalness={0.85}
          roughness={0.22}
        />
      </mesh>

      {/* Bottom ring */}

      <mesh position={[0, -1.18, 0]}>
        <cylinderGeometry
          args={[0.48, 0.48, 0.12, 64]}
        />

        <meshStandardMaterial
          color="#d7a348"
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>

      {/* Nozzle */}

      <mesh position={[0, -1.38, 0]}>
        <cylinderGeometry
          args={[0.24, 0.34, 0.4, 32]}
        />

        <meshPhysicalMaterial
          color="#34343a"
          metalness={0.85}
          roughness={0.28}
        />
      </mesh>

      {/* Nozzle inner ring */}

      <mesh position={[0, -1.59, 0]}>
        <cylinderGeometry
          args={[0.25, 0.25, 0.07, 32]}
        />

        <meshStandardMaterial
          color="#b78b45"
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* Exhaust */}

      <group position={[0, -1.75, 0.12]}>
        <ExhaustFlame />

        <SmokeParticles />

        <SparkParticles />
      </group>
    </group>
  );
}

/* =========================================================
   MAIN SCENE
========================================================= */

export default function RocketScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{
          position: [0, 0, 6],
          fov: 40,
        }}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <ambientLight intensity={1.2} />

        <directionalLight
          position={[4, 5, 6]}
          intensity={2}
        />

        <pointLight
          position={[-3, 2, 3]}
          intensity={1.5}
          color="#ffbb77"
        />

        <pointLight
          position={[2, -3, 4]}
          intensity={1.2}
          color="#ff6600"
        />

        <RocketModel />
      </Canvas>
    </div>
  );
}