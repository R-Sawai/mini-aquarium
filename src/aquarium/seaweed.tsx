import { useRef, useMemo } from "react";
import type { ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TANK_HEIGHT, TANK_WIDTH } from "./constants";

const SEAWEED_COLOR = 0x166534;
const SEGMENT_COUNT = 6;

type SeaweedBladeProps = {
  x: number;
  z: number;
  targetHeight: number;
};

/**
 * 単一の海藻ブレード
 * 複数のセグメントで構成され、ゆらゆらと揺れる
 */
function SeaweedBlade({ x, z, targetHeight }: SeaweedBladeProps) {
  const segmentHeight = targetHeight / SEGMENT_COUNT;
  const jointRefs = useRef<(THREE.Group | null)[]>([]);
  const wiggleSpeed = useMemo(() => 1.2 + Math.random() * 1.0, []);
  const phaseOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const angleX = Math.sin(time * wiggleSpeed + phaseOffset) * 0.06;
    const angleZ = Math.cos(time * wiggleSpeed * 0.8 + phaseOffset) * 0.06;

    jointRefs.current.forEach((joint) => {
      if (!joint) return;
      joint.rotation.x = angleX;
      joint.rotation.z = angleZ;
    });
  });

  const renderSegments = (index: number): ReactNode => {
    if (index >= SEGMENT_COUNT) return null;

    const radiusBottom = 0.25 * (1 - (index / SEGMENT_COUNT) * 0.7);
    const radiusTop = 0.25 * (1 - ((index + 1) / SEGMENT_COUNT) * 0.7);

    return (
      <group
        ref={(el) => {
          jointRefs.current[index] = el;
        }}
        position-y={index === 0 ? 0 : segmentHeight}
      >
        {/* Offset mesh so its base sits at y=0 of the joint */}
        <mesh position-y={segmentHeight / 2} castShadow receiveShadow>
          <cylinderGeometry
            args={[radiusTop, radiusBottom, segmentHeight, 5]}
          />
          <meshStandardMaterial
            color={SEAWEED_COLOR}
            roughness={0.8}
            flatShading
          />
        </mesh>
        {renderSegments(index + 1)}
      </group>
    );
  };

  return <group position={[x, -TANK_HEIGHT / 2, z]}>{renderSegments(0)}</group>;
}

type SeaweedInstance = { x: number; z: number; height: number };

/**
 * 水槽内の海藻フィールド
 * 複数の SeaweedBlade インスタンスをランダムに配置
 */
export function SeaweedField() {
  const instances = useMemo<SeaweedInstance[]>(() => {
    const clusters = [
      { x: -TANK_WIDTH * 0.28, z: -3, count: 5 },
      { x: TANK_WIDTH * 0.28, z: 2, count: 6 },
      { x: -TANK_WIDTH * 0.08, z: 3, count: 4 },
      { x: TANK_WIDTH * 0.1, z: -4, count: 5 },
    ];

    return clusters.flatMap((cluster) =>
      Array.from({ length: cluster.count }, () => ({
        x: cluster.x + (Math.random() - 0.5) * 3,
        z: cluster.z + (Math.random() - 0.5) * 3,
        height: 3.5 + Math.random() * 3.0,
      })),
    );
  }, []);

  return (
    <>
      {instances.map((inst, idx) => (
        <SeaweedBlade
          key={idx}
          x={inst.x}
          z={inst.z}
          targetHeight={inst.height}
        />
      ))}
    </>
  );
}
