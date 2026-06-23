import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH } from "../../consts/aquarium";

const NUM_FLAGS = 10;
const FLAG_COLORS = [
  0xff4d6a, 0xffbe00, 0x4dff91, 0x4d9fff, 0xd84dff, 0xff8c4d,
] as const;

type GarlandProps = {
  yPos: number;
  zPos: number;
};

type FlagState = {
  mesh: THREE.Mesh;
  baseY: number;
  phase: number;
};

/**
 * 単一のガーランド（三角旗列）
 * 水槽を横断する紐にカラフルな三角旗が吊り下げられ、水流でなびく
 */
function Garland({ yPos, zPos }: GarlandProps) {
  const flagRefs = useRef<FlagState[]>([]);

  const ropeLine = useMemo(() => {
    const startX = -TANK_WIDTH / 2;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= NUM_FLAGS; i++) {
      const t = i / NUM_FLAGS;
      const x = startX + t * TANK_WIDTH;
      const y = yPos - Math.sin(t * Math.PI) * 1.5;
      points.push(new THREE.Vector3(x, y, zPos));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x999999,
      transparent: true,
      opacity: 0.5,
    });
    return new THREE.Line(geo, mat);
  }, [yPos, zPos]);

  const flagObjects = useMemo(() => {
    const startX = -TANK_WIDTH / 2;
    const states: FlagState[] = [];

    for (let i = 0; i < NUM_FLAGS; i++) {
      const t = (i + 0.5) / NUM_FLAGS;
      const x = startX + t * TANK_WIDTH;
      const y = yPos - Math.sin(t * Math.PI) * 1.5 - 0.2;

      const geo = new THREE.ConeGeometry(0.65, 1.0, 4);
      geo.rotateX(Math.PI);
      geo.scale(1, 1, 0.05);

      const mat = new THREE.MeshStandardMaterial({
        color: FLAG_COLORS[i % FLAG_COLORS.length],
        roughness: 0.3,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y - 0.3, zPos);
      mesh.castShadow = true;

      states.push({ mesh, baseY: y - 0.3, phase: i * 0.5 });
    }

    flagRefs.current = states;
    return states;
  }, [yPos, zPos]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    for (const flag of flagRefs.current) {
      flag.mesh.rotation.y = Math.sin(time * 1.2 + flag.phase) * 0.2;
      flag.mesh.rotation.x = Math.cos(time * 0.96 + flag.phase) * 0.1;
      flag.mesh.position.y = flag.baseY;
    }
  });

  return (
    <group>
      <primitive object={ropeLine} />
      {flagObjects.map((f, i) => (
        <primitive key={i} object={f.mesh} />
      ))}
    </group>
  );
}

/**
 * 水槽内のガーランドフィールド
 * 前面・奥面に複数段のガーランドを配置
 */
export function GarlandField() {
  const garlands = useMemo(() => {
    const backZ = -TANK_DEPTH / 2 + 0.5;
    const topY = TANK_HEIGHT / 2 - 1.5;
    return [
      { yPos: topY, zPos: backZ },
      { yPos: topY - 2.5, zPos: backZ },
    ];
  }, []);

  return (
    <>
      {garlands.map((g, i) => (
        <Garland key={i} yPos={g.yPos} zPos={g.zPos} />
      ))}
    </>
  );
}
