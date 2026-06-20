import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping } from "three";
import { EyeOff, Eye, Soup, Music2Icon, Settings } from "lucide-react";
import { AquariumScene } from "./components/objects/aquarium-scene";
import { TANK_WIDTH, TANK_DEPTH, FISH_COLORS } from "./consts/aquarium";
import type { FoodData } from "./components/objects/food-mesh";
import { useBgm } from "./hooks/use-bgm";
import { Button } from "./components/ui/button";
import { Toggle } from "./components/ui/toggle";
import { Dialog, DialogTrigger } from "./components/ui/dialog";
import { AquariumSettings } from "./components/aquarium-settings";

export default function App() {
  const fishIdCounter = useRef(0);
  const foodIdCounter = useRef(0);

  /** 魚データ */
  const [fishCount, setFishCount] = useState(12);
  const fishes = useMemo(
    () =>
      Array.from({ length: fishCount }, () => ({
        id: fishIdCounter.current++,
        color: FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)],
      })),
    [fishCount],
  );

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

  const { isPlaying, volume, setVolume, handlePlayToggle } = useBgm();

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
        <Button
          onClick={() => setShowUI(true)}
          variant="aquarium"
          size="icon-xl"
          className="fixed top-6 left-6 z-30"
          title="UIを表示する"
        >
          <Eye className="text-primary size-full" />
        </Button>
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
            <Button
              onClick={() => {
                setShowUI(false);
              }}
              size="icon-xl"
              variant="aquarium"
              title="観賞モード（UI非表示）"
            >
              <EyeOff className="size-full" />
            </Button>
            <Toggle
              onClick={handlePlayToggle}
              variant="aquarium"
              title="BGMの再生/停止"
              size="icon-xl"
            >
              {isPlaying ? (
                <Music2Icon className="text-primary size-full" />
              ) : (
                <Music2Icon className="size-full" />
              )}
            </Toggle>

            {/* 設定ダイアログ */}
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon-xl" variant="aquarium" title="水槽の設定">
                  <Settings className="size-full" />
                </Button>
              </DialogTrigger>
              <AquariumSettings
                volume={volume}
                setVolume={setVolume}
                fishCount={fishCount}
                setFishCount={setFishCount}
              />
            </Dialog>
          </div>
        </header>

        {/* コントロールパネル */}
        <footer className="flex items-end justify-between gap-4">
          {/* シミュレーション */}
          <div className="bg-background/80 border-border/50 pointer-events-auto flex flex-col gap-3 rounded-2xl border p-4 backdrop-blur-md">
            <Button
              onClick={spawnFood}
              className="text-foreground bg-linear-to-r from-amber-500 to-orange-600 p-5 transition duration-200 hover:from-amber-400 hover:to-orange-500"
            >
              <Soup className="h-4 w-4" />
              エサをあげる
            </Button>
          </div>

          <p className="text-border text-xs">
            v{__APP_VERSION__} &copy; {__APP_AUTHOR__}
          </p>
        </footer>
      </div>
    </>
  );
}
