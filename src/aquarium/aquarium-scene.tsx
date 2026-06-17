import { useRef } from "react";
import * as THREE from "three";
import { CameraControls } from "./camera-controls";
import { TankEnvironment } from "./tank-environment";
import { FishMesh, type FishData } from "./fish-mesh";
import { FoodMesh, type FoodData } from "./food-mesh";
import { SeaweedField } from "./seaweed";

type Props = {
  fishes: FishData[];
  foods: FoodData[];
  onFoodRemove: (id: number) => void;
};

export function AquariumScene({ fishes, foods, onFoodRemove }: Props) {
  // Shared mutable map of food mesh positions, used by fish to seek food
  const foodMeshMapRef = useRef<Map<number, THREE.Mesh>>(new Map());

  return (
    <>
      <CameraControls />
      <TankEnvironment />
      <SeaweedField />
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
