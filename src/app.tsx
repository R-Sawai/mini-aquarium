import { useRef, useEffect, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping } from "three";
import {
  MousePointer,
  Move,
  EyeOff,
  Eye,
  PlusCircle,
  Soup,
  Settings,
  Palette,
} from "lucide-react";
import { AquariumScene } from "./aquarium/aquarium-scene";
import { TANK_WIDTH, TANK_DEPTH, FISH_COLORS } from "./aquarium/constants";
import type { FishData } from "./aquarium/fish-mesh";
import type { FoodData } from "./aquarium/food-mesh";
import type { Theme } from "./aquarium/tank-environment";

export default function App() {
  const fishIdCounter = useRef(0);
  const foodIdCounter = useRef(0);

  const [fishes, setFishes] = useState<FishData[]>(() =>
    Array.from({ length: 12 }, () => ({
      id: fishIdCounter.current++,
      color: FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)],
    })),
  );
  const [foods, setFoods] = useState<FoodData[]>([]);
  const [showUI, setShowUI] = useState(true);
  const [activeTheme, setActiveTheme] = useState<Theme>("day");

  const spawnFish = useCallback(() => {
    const color = FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)];
    setFishes((prev) => [...prev, { id: fishIdCounter.current++, color }]);
  }, []);

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

  const THEME_LABELS: Record<Theme, string> = {
    day: "お昼",
    night: "夜間",
    abyss: "深海",
  };

  return (
    <>
      {/* R3F キャンバス */}
      <Canvas
        className="absolute top-0 left-0 w-full h-full"
        camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 5, 25] }}
        shadows
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
          theme={activeTheme}
          onFoodRemove={removeFood}
        />
      </Canvas>

      {/* 観賞モード中の復帰ボタン */}
      {!showUI && (
        <button
          onClick={() => setShowUI(true)}
          className="fixed top-4 right-4 z-30 bg-slate-900/80 hover:bg-slate-800 text-cyan-400 p-3 rounded-full border border-cyan-500/30 shadow-2xl transition duration-200"
          title="UIを表示する"
        >
          <Eye className="w-6 h-6" />
        </button>
      )}

      {/* UI オーバーレイ */}
      <div
        className={`absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-6 transition-all duration-500 ${
          showUI ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* ヘッダー */}
        <header className="flex justify-between items-start pointer-events-auto w-full">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-full border border-slate-700/50 text-xs text-slate-300 items-center gap-3">
              <span className="flex items-center gap-1">
                <MousePointer className="w-4 h-4 text-cyan-400" />
                ドラッグ: 回転
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1">
                <Move className="w-4 h-4 text-cyan-400" />
                スクロール: ズーム
              </span>
            </div>
            <button
              onClick={() => {
                setShowUI(false);
              }}
              className="bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 p-3 rounded-2xl border border-slate-700/50 shadow-2xl transition duration-200"
              title="観賞モード（UI非表示）"
            >
              <EyeOff className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* コントロールパネル */}
        <footer className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 pointer-events-auto">
          {/* シミュレーション */}
          <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-cyan-400" />
              シミュレーション
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  spawnFish();
                }}
                className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium py-2 px-3 rounded-xl transition duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/50 text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                魚を追加
              </button>
              <button
                onClick={spawnFood}
                className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-medium py-2 px-3 rounded-xl transition duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-orange-950/50 text-sm"
              >
                <Soup className="w-4 h-4" />
                エサをあげる
              </button>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
              <span>
                魚の数:{" "}
                <span className="text-cyan-400 font-bold">{fishes.length}</span>{" "}
                匹
              </span>
              <span>
                エサの数:{" "}
                <span className="text-amber-400 font-bold">{foods.length}</span>{" "}
                個
              </span>
            </div>
          </div>

          {/* テーマ切り替え */}
          <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 flex flex-col gap-2.5">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-cyan-400" />
              水槽の環境
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {(["day", "night", "abyss"] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTheme(t)}
                  className={`font-medium py-1.5 px-2 rounded-xl text-xs transition duration-200 border ${
                    activeTheme === t
                      ? "bg-slate-800 text-cyan-400 border-cyan-500/30"
                      : "bg-slate-800/50 text-slate-400 border-transparent hover:bg-slate-800"
                  }`}
                >
                  {THEME_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
