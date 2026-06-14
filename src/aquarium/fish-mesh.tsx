import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH } from "./constants";

export type FishData = { id: number; color: number };

type Props = {
  data: FishData;
  foodMeshMapRef: React.MutableRefObject<Map<number, THREE.Mesh>>;
  onFoodEaten: (id: number) => void;
};

export function FishMesh({ data, foodMeshMapRef, onFoodEaten }: Props) {
  const { color } = data;
  const groupRef = useRef<THREE.Group>(null!);
  const tailJointRef = useRef<THREE.Group>(null!);

  const onFoodEatenRef = useRef(onFoodEaten);
  useEffect(() => {
    onFoodEatenRef.current = onFoodEaten;
  }, [onFoodEaten]);

  // Stable per-fish random state stored in a single ref object
  const fishState = useRef({
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * 0.08,
      (Math.random() - 0.5) * 0.04,
      (Math.random() - 0.5) * 0.08,
    ),
    speedLimit: 0.06 + Math.random() * 0.04,
    wiggleSpeed: 10 + Math.random() * 8,
    wigglePhase: Math.random() * Math.PI * 2,
  });

  const scale = useMemo(() => 0.8 + Math.random() * 0.4, []);
  const initialPos = useMemo<[number, number, number]>(
    () => [
      (Math.random() - 0.5) * (TANK_WIDTH - 4),
      (Math.random() - 0.5) * (TANK_HEIGHT - 4),
      (Math.random() - 0.5) * (TANK_DEPTH - 4),
    ],
    [],
  );

  // Bake geometry transforms as in the original class
  const bodyGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.6, 16, 8);
    geo.scale(1.8, 1, 0.5);
    return geo;
  }, []);

  const tailGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.4, 0.8, 4);
    geo.rotateZ(-Math.PI / 2);
    geo.scale(1, 0.2, 1.5);
    return geo;
  }, []);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    const tailJoint = tailJointRef.current;
    if (!group || !tailJoint) return;

    const time = clock.getElapsedTime();
    const s = fishState.current;
    const { velocity } = s;
    const pos = group.position;

    // Boundary avoidance
    const boundX = TANK_WIDTH / 2 - 2;
    const boundY = TANK_HEIGHT / 2 - 1.5;
    const boundZ = TANK_DEPTH / 2 - 2;
    const force = 0.005;

    if (pos.x > boundX) velocity.x -= force;
    if (pos.x < -boundX) velocity.x += force;
    if (pos.y > boundY) velocity.y -= force;
    if (pos.y < -boundY) velocity.y += force;
    if (pos.z > boundZ) velocity.z -= force;
    if (pos.z < -boundZ) velocity.z += force;

    velocity.x += (Math.random() - 0.5) * 0.002;
    velocity.y += (Math.random() - 0.5) * 0.001;
    velocity.z += (Math.random() - 0.5) * 0.002;

    // Seek nearest food
    const foodMap = foodMeshMapRef.current;
    if (foodMap.size > 0) {
      let closestId = -1;
      let minDist = 999;
      let closestFoodPos: THREE.Vector3 | null = null;

      for (const [fid, mesh] of foodMap) {
        const dist = pos.distanceTo(mesh.position);
        if (dist < minDist) {
          minDist = dist;
          closestId = fid;
          closestFoodPos = mesh.position;
        }
      }

      if (closestFoodPos && minDist < 15) {
        const dir = new THREE.Vector3()
          .subVectors(closestFoodPos, pos)
          .normalize();
        velocity.addScaledVector(dir, 0.008);

        if (minDist < 1.0 && closestId >= 0) {
          foodMap.delete(closestId);
          onFoodEatenRef.current(closestId);
          s.speedLimit = 0.15;
          setTimeout(() => {
            s.speedLimit = 0.06 + Math.random() * 0.04;
          }, 1000);
        }
      }
    }

    velocity.clampLength(0, s.speedLimit);
    pos.add(velocity);

    // Face direction of movement
    if (velocity.lengthSq() > 0.0001) {
      const targetRotation = Math.atan2(-velocity.z, velocity.x);
      let diff = targetRotation - group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      group.rotation.y += diff * 0.08;
      const pitch = velocity.y * 5;
      group.rotation.z += (pitch - group.rotation.z) * 0.1;
    }

    // Tail wiggle
    tailJoint.rotation.y = Math.sin(time * s.wiggleSpeed + s.wigglePhase) * 0.5;
  });

  return (
    <group ref={groupRef} position={initialPos} scale={scale}>
      <mesh geometry={bodyGeo} castShadow>
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.1}
          flatShading
        />
      </mesh>
      <group ref={tailJointRef} position={[-1.0, 0, 0]}>
        <mesh geometry={tailGeo} position={[-0.4, 0, 0]} castShadow>
          <meshStandardMaterial color={color} roughness={0.4} flatShading />
        </mesh>
      </group>
      <mesh position={[0.6, 0.2, 0.3]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>
      <mesh position={[0.6, 0.2, -0.3]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>
    </group>
  );
}
