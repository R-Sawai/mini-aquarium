import { useRef } from "react";
import * as THREE from "three";
import { CameraControls } from "./camera-controls";
import { TankEnvironment } from "./tank-environment";
import { FishMesh, type FishData } from "./fish-mesh";
import { FoodMesh, type FoodData } from "./food-mesh";
import { SeaweedField } from "./seaweed";
import { BalloonField } from "./balloon";
import { GarlandField } from "./garland";
import { useAquariumStore } from "@/hooks/use-aquarium-store";
import { TANK_HEIGHT } from "@/consts/aquarium";

type Props = {
  /** 水槽内の魚のデータ */
  fishes: FishData[];
  /** 水槽内の餌のデータ */
  foods: FoodData[];
  /** 餌が食べられたときに呼ばれるコールバック */
  onFoodRemove: (id: number) => void;
};

/**
 * 水槽シーン全体を構成するコンポーネント
 * カメラ、環境、魚、餌、海藻をまとめてレンダリングする
 */
export function AquariumScene({ fishes, foods, onFoodRemove }: Props) {
  // 魚が餌を食べるときに、対応する餌メッシュを削除するための参照
  const foodMeshMapRef = useRef<Map<number, THREE.Mesh>>(new Map());

  // 現在のモードを取得
  const currentMode = useAquariumStore((state) => state.currentMode);

  return (
    <>
      <CameraControls />
      <TankEnvironment />
      <SeaweedField />

      {
        // パーティーモード
        currentMode === "party" && (
          <>
            <BalloonField />
            <GarlandField />
            <pointLight
              position={[0, TANK_HEIGHT * 0.7, 0]}
              intensity={500}
              color={0xff69b4}
            />
          </>
        )
      }

      {fishes.map((fish) => (
        <FishMesh
          key={fish.id}
          data={fish}
          foodMeshMapRef={foodMeshMapRef}
          onFoodEaten={onFoodRemove}
        />
      ))}
      {foods.map((food) => (
        <FoodMesh
          key={food.id}
          data={food}
          meshMapRef={foodMeshMapRef}
          onRemove={onFoodRemove}
        />
      ))}
    </>
  );
}
