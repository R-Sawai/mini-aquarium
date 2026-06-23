import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TANK_HEIGHT } from "../../consts/aquarium";

const STRING_LENGTH = 7.0;
const BALLOON_COLORS = [
  0xff4d6a, 0xffbe00, 0x4dff91, 0x4d9fff, 0xd84dff, 0xff8c4d,
] as const;

type BalloonProps = {
  x: number;
  z: number;
  color: number;
};

/**
 * 単一の風船
 * 紐で底砂に繋がれ、水流でプカプカと揺れる
 */
function Balloon({ x, z, color }: BalloonProps) {
  const balloonRef = useRef<THREE.Mesh>(null!);

  const wiggleSpeed = useMemo(() => 1.0 + Math.random() * 0.8, []);
  const phaseOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  // 紐を Three.js オブジェクトとして直接生成
  const stringLine = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, STRING_LENGTH, 0),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.6,
    });
    return new THREE.Line(geo, mat);
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const swingX = Math.sin(time * wiggleSpeed + phaseOffset) * 0.4;
    const swingZ = Math.cos(time * wiggleSpeed * 0.8 + phaseOffset) * 0.4;

    balloonRef.current.position.set(swingX, STRING_LENGTH, swingZ);

    // 紐の終点を風船の根元に追従させる
    const positions = stringLine.geometry.attributes.position
      .array as Float32Array;
    positions[3] = swingX;
    positions[4] = STRING_LENGTH - 0.65;
    positions[5] = swingZ;
    stringLine.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group position={[x, -TANK_HEIGHT / 2, z]}>
      {/* 風船本体（縦長に変形） */}
      <mesh
        ref={balloonRef}
        position={[0, STRING_LENGTH, 0]}
        scale={[1, 1.3, 1]}
        castShadow
      >
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.1} metalness={0.1} />
        {/* 結び目 */}
        <mesh position={[0, -0.65, 0]}>
          <coneGeometry args={[0.08, 0.15, 5]} />
          <meshStandardMaterial color={color} roughness={0.1} metalness={0.1} />
        </mesh>
      </mesh>
      {/* 紐 */}
      <primitive object={stringLine} />
    </group>
  );
}

type BalloonInstance = { x: number; z: number; color: number };

/**
 * 水槽内の風船フィールド
 * 複数の Balloon をランダムに配置
 */
export function BalloonField() {
  const instances = useMemo<BalloonInstance[]>(() => {
    const positions: [number, number][] = [
      [-10, -5],
      [-5, 6],
      [0, -7],
      [5, 4],
      [10, -3],
      [-8, 2],
      [8, -6],
    ];
    return positions.map(([x, z], i) => ({
      x: x + (Math.random() - 0.5) * 2,
      z: z + (Math.random() - 0.5) * 2,
      color: BALLOON_COLORS[i % BALLOON_COLORS.length],
    }));
  }, []);

  return (
    <>
      {instances.map((inst, idx) => (
        <Balloon key={idx} x={inst.x} z={inst.z} color={inst.color} />
      ))}
    </>
  );
}
