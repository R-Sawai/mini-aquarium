import { useEffect, useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH } from "./constants";

export type Theme = "day" | "night" | "abyss";

export const THEME_CONFIGS = {
  day: {
    bg: 0x011125,
    fogDensity: 0.025,
    ambientColor: 0x0a2240,
    ambientIntensity: 1.5,
    spotColor: 0xddddff,
    spotIntensity: 3000,
    showRays: true,
  },
} as const;

function SceneBackground() {
  const { scene } = useThree();
  const config = THEME_CONFIGS["day"];

  useEffect(() => {
    scene.background = new THREE.Color(config.bg);
    scene.fog = new THREE.FogExp2(config.bg, config.fogDensity);
  }, [scene, config]);

  return null;
}

export function TankEnvironment() {
  const config = THEME_CONFIGS["day"];

  const ray0Ref = useRef<THREE.Mesh>(null!);
  const ray1Ref = useRef<THREE.Mesh>(null!);
  const ray2Ref = useRef<THREE.Mesh>(null!);
  const bubblesRef = useRef<THREE.Points>(null!);

  const rayPositions = useMemo(
    () =>
      Array.from({ length: 3 }, () => ({
        x: (Math.random() - 0.5) * 15,
        z: (Math.random() - 0.5) * 10,
        rx: (Math.random() - 0.5) * 0.2,
        rz: (Math.random() - 0.5) * 0.2,
      })),
    [],
  );

  const edgeGeo = useMemo(() => {
    return new THREE.EdgesGeometry(
      new THREE.BoxGeometry(TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH),
    );
  }, []);

  const floorGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TANK_WIDTH, TANK_DEPTH, 24, 24);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      pos.setZ(
        i,
        Math.sin(vx * 0.3) * Math.cos(vy * 0.3) * 0.2 +
          Math.sin(vx * 0.1) * 0.1,
      );
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const { bubbleGeo, bubbleSpeeds } = useMemo(() => {
    const count = 120;
    const positions = new Float32Array(count * 3);
    const speeds: number[] = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * (TANK_WIDTH - 2);
      positions[i * 3 + 1] = (Math.random() - 0.5) * TANK_HEIGHT;
      positions[i * 3 + 2] = (Math.random() - 0.5) * (TANK_DEPTH - 2);
      speeds.push(0.02 + Math.random() * 0.04);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { bubbleGeo: geo, bubbleSpeeds: speeds };
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    const rayRefs = [ray0Ref.current, ray1Ref.current, ray2Ref.current];
    rayRefs.forEach((ray, idx) => {
      if (!ray) return;
      ray.rotation.y = time * 0.1 * (idx + 1);
      ray.position.x += Math.sin(time + idx) * 0.005;
    });

    const points = bubblesRef.current;
    if (points) {
      const pos = points.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < bubbleSpeeds.length; i++) {
        pos[i * 3 + 1] += bubbleSpeeds[i];
        if (pos[i * 3 + 1] > TANK_HEIGHT / 2) {
          pos[i * 3 + 1] = -TANK_HEIGHT / 2;
          pos[i * 3] = (Math.random() - 0.5) * (TANK_WIDTH - 2);
          pos[i * 3 + 2] = (Math.random() - 0.5) * (TANK_DEPTH - 2);
        }
      }
      points.geometry.attributes.position.needsUpdate = true;
    }
  });

  const rayMeshRefs = [ray0Ref, ray1Ref, ray2Ref];

  return (
    <>
      <SceneBackground />

      <ambientLight
        color={config.ambientColor}
        intensity={config.ambientIntensity}
      />
      <spotLight
        color={config.spotColor}
        intensity={config.spotIntensity}
        position={[0, TANK_HEIGHT, 0]}
        angle={Math.PI / 3}
        penumbra={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Tank edges */}
      <lineSegments geometry={edgeGeo}>
        <lineBasicMaterial color={0x0ea5e9} transparent opacity={0.15} />
      </lineSegments>

      {/* Sand floor */}
      <mesh
        geometry={floorGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -TANK_HEIGHT / 2, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color={0x051b30}
          roughness={0.9}
          metalness={0.1}
          flatShading
        />
      </mesh>

      {/* Light rays */}
      {rayPositions.map((rp, idx) => (
        <mesh
          key={idx}
          ref={rayMeshRefs[idx]}
          position={[rp.x, 0, rp.z]}
          rotation={[rp.rx, 0, rp.rz]}
          visible={config.showRays}
        >
          <coneGeometry args={[8, TANK_HEIGHT, 4, 1, true]} />
          <meshBasicMaterial
            color={0x0ea5e9}
            transparent
            opacity={0.05}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Bubbles */}
      <points ref={bubblesRef}>
        <primitive object={bubbleGeo} attach="geometry" />
        <pointsMaterial
          color={0xffffff}
          size={0.15}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Glass walls */}
      {/* Front */}
      <GlassWall
        position={[0, 0, TANK_DEPTH / 2]}
        rotation={[0, Math.PI, 0]}
        width={TANK_WIDTH}
        height={TANK_HEIGHT}
      />
      <GlassWall
        position={[0, 0, -TANK_DEPTH / 2]}
        rotation={[0, 0, 0]}
        width={TANK_WIDTH}
        height={TANK_HEIGHT}
      />
      {/* Left */}
      <GlassWall
        position={[-TANK_WIDTH / 2, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        width={TANK_DEPTH}
        height={TANK_HEIGHT}
      />
      {/* Right */}
      <GlassWall
        position={[TANK_WIDTH / 2, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        width={TANK_DEPTH}
        height={TANK_HEIGHT}
      />
    </>
  );
}

const GlassWall: React.FC<{
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
}> = ({ position, rotation, width, height }) => {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <MeshReflectorMaterial
        resolution={512}
        mirror={0.85}
        mixBlur={0.6}
        mixStrength={1.5}
        roughness={0.05}
        depthScale={1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.2}
        color="#a8d5f7"
        metalness={0.1}
      />
    </mesh>
  );
};
