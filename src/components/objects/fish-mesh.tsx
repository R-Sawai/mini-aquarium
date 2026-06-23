import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH } from "../../consts/aquarium";
import { useAquariumStore } from "@/hooks/use-aquarium-store";

export type FishData = { id: number; color: number };

type Props = {
  data: FishData;
  foodMeshMapRef: React.RefObject<Map<number, THREE.Mesh>>;
  onFoodEaten: (id: number) => void;
};

/**
 * 単一の魚メッシュ
 * 自律的に泳ぎ、近くの餌を追いかける
 */
export function FishMesh({ data, foodMeshMapRef, onFoodEaten }: Props) {
  const { color } = data;
  const groupRef = useRef<THREE.Group>(null!);
  const tailJointRef = useRef<THREE.Group>(null!);

  const onFoodEatenRef = useRef(onFoodEaten);
  useEffect(() => {
    onFoodEatenRef.current = onFoodEaten;
  }, [onFoodEaten]);

  // 魚の状態を保持するためのuseRef
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
  const hatColor = useMemo(() => {
    const hatColors = [0xff3b30, 0xffcc00, 0x34c759, 0x007aff, 0xaf52de];
    return hatColors[Math.floor(Math.random() * hatColors.length)];
  }, []);
  const initialPos = useMemo<[number, number, number]>(
    () => [
      (Math.random() - 0.5) * (TANK_WIDTH - 4),
      (Math.random() - 0.5) * (TANK_HEIGHT - 4),
      (Math.random() - 0.5) * (TANK_DEPTH - 4),
    ],
    [],
  );

  // 魚のボディと尾のジオメトリをuseMemoで作成して再利用
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

  // useFrameで毎フレームの更新処理を行う
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

    // 食べ物の追跡
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

    // 魚の向きを速度ベクトルに合わせて回転させる
    if (velocity.lengthSq() > 0.0001) {
      const targetRotation = Math.atan2(-velocity.z, velocity.x);
      let diff = targetRotation - group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      group.rotation.y += diff * 0.08;
      const pitch = velocity.y * 5;
      group.rotation.z += (pitch - group.rotation.z) * 0.1;
    }

    // 尻尾を揺らす
    tailJoint.rotation.y = Math.sin(time * s.wiggleSpeed + s.wigglePhase) * 0.5;
  });

  /** 現在のモード */
  const currentMode = useAquariumStore((state) => state.currentMode);

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

      {/* パーティーモード時のみパーティーハットを表示 */}
      {currentMode === "party" && (
        <group position={[0.4, 0.7, 0]} rotation={[0, 0, -0.15]}>
          {/* コーン部分 */}
          <mesh>
            <coneGeometry args={[0.2, 0.45, 8]} />
            <meshStandardMaterial
              color={hatColor}
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
          {/* ポンポン部分 */}
          <mesh position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color={0xffffff} />
          </mesh>
        </group>
      )}
    </group>
  );
}
