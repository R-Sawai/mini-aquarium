import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TANK_HEIGHT } from "./constants";

export type FoodData = { id: number; x: number; z: number };

type Props = {
  data: FoodData;
  meshMapRef: React.MutableRefObject<Map<number, THREE.Mesh>>;
  onRemove: (id: number) => void;
};

export function FoodMesh({ data, meshMapRef, onRemove }: Props) {
  const { id, x, z } = data;
  const meshRef = useRef<THREE.Mesh>(null!);
  const fallSpeed = useMemo(() => 0.015 + Math.random() * 0.01, []);
  const removed = useRef(false);
  const onRemoveRef = useRef(onRemove);
  useEffect(() => {
    onRemoveRef.current = onRemove;
  }, [onRemove]);

  useEffect(() => {
    meshMapRef.current.set(id, meshRef.current);
    return () => {
      meshMapRef.current.delete(id);
    };
  }, [id, meshMapRef]);

  useFrame(() => {
    if (removed.current) return;
    meshRef.current.position.y -= fallSpeed;
    if (meshRef.current.position.y <= -TANK_HEIGHT / 2 + 0.2) {
      removed.current = true;
      meshMapRef.current.delete(id);
      onRemoveRef.current(id);
    }
  });

  return (
    <mesh ref={meshRef} position={[x, TANK_HEIGHT / 2 - 0.5, z]}>
      <sphereGeometry args={[0.18, 6, 6]} />
      <meshStandardMaterial color={0xd97706} roughness={0.9} />
    </mesh>
  );
}
