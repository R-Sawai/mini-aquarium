import { useRef, useEffect, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping } from "three";
import { EyeOff, Eye, Soup, Music2Icon } from "lucide-react";
import { AquariumScene } from "./components/objects/aquarium-scene";
import { TANK_WIDTH, TANK_DEPTH, FISH_COLORS } from "./consts/aquarium";
import type { FoodData } from "./components/objects/food-mesh";
import { useBgm } from "./hooks/use-bgm";

export default function App() {
  const fishIdCounter = useRef(0);
  const foodIdCounter = useRef(0);

  /** 魚データ */
  const fishes = Array.from({ length: 12 }, () => ({
    id: fishIdCounter.current++,
    color: FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)],
  }));

  const [foods, setFoods] = useState<FoodData[]>([]);
  const [showUI, setShowUI] = useState(true);

  const spawnFood = useCallback(() => {
    const count = 3 + Math.floor(Math.random() * 3);
    const newFoods: FoodData[] = Array.from({ length: count }, () => ({
      id: foodIdCounter.current++,
      x: (Math.random() - 0.5) * (TANK_WIDTH - 6),
      z: (Math.random() - 0.5) * (TANK_DEPTH - 6),
    }));
    setFoods((prev) => [...prev, ...newFoods]);
  }, []);

  const removeFood = useCallback((id: number) => {
    setFoods((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Esc キーで UI 復帰
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowUI(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const { isPlaying, handlePlayToggle } = useBgm();

  return (
    <>
      {/* R3F キャンバス */}
      <Canvas
        className="absolute top-0 left-0 h-full w-full"
        camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 5, 25] }}
        shadows="percentage"
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        <AquariumScene
          fishes={fishes}
          foods={foods}
          onFoodRemove={removeFood}
        />
      </Canvas>

      {/* 観賞モード中の復帰ボタン */}
      {!showUI && (
        <button
          onClick={() => setShowUI(true)}
          className="fixed top-4 left-4 z-30 rounded-2xl border border-slate-700/50 bg-slate-900/80 p-3 text-cyan-400 shadow-2xl transition duration-200 hover:bg-slate-800"
          title="UIを表示する"
        >
          <Eye className="h-6 w-6" />
        </button>
      )}

      {/* UI オーバーレイ */}
      <div
        className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 transition-all duration-500 md:p-6"
        style={{
          display: showUI ? "flex" : "none",
        }}
      >
        {/* ヘッダー */}
        <header className="flex w-full items-start justify-between">
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              onClick={() => {
                setShowUI(false);
              }}
              className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-3 text-slate-300 shadow-2xl transition duration-200 hover:bg-slate-800 hover:text-cyan-400"
              title="観賞モード（UI非表示）"
            >
              <EyeOff className="h-5 w-5" />
            </button>
            <button
              onClick={handlePlayToggle}
              className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-3 text-slate-300 shadow-2xl transition duration-200 hover:bg-slate-800 hover:text-cyan-400"
              title="BGMの再生/停止"
            >
              {isPlaying ? (
                <Music2Icon className="h-5 w-5" />
              ) : (
                <Music2Icon className="h-5 w-5 text-slate-500" />
              )}
            </button>
          </div>
        </header>

        {/* コントロールパネル */}
        <footer className="flex max-w-xl gap-4">
          {/* シミュレーション */}
          <div className="pointer-events-auto flex flex-col gap-3 rounded-2xl border border-slate-700/50 bg-slate-900/80 p-4 backdrop-blur-md">
            <button
              onClick={spawnFood}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-amber-500 to-orange-600 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-orange-950/50 transition duration-200 hover:from-amber-400 hover:to-orange-500"
            >
              <Soup className="h-4 w-4" />
              エサをあげる
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}
