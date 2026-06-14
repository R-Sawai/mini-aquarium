import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
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
import { Fish } from "./aquarium/fish";
import { Food } from "./aquarium/food";
import {
  TANK_WIDTH,
  TANK_HEIGHT,
  TANK_DEPTH,
  FISH_COLORS,
} from "./aquarium/constants";

type Theme = "day" | "night" | "abyss";

export default function App() {
  // Three.js refs（再レンダリング不要なため useRef で管理）
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const fishesRef = useRef<Fish[]>([]);
  const foodsRef = useRef<Food[]>([]);
  const bubbleSystemRef = useRef<THREE.Points | null>(null);
  const lightRaysRef = useRef<THREE.Mesh[]>([]);
  const topLightRef = useRef<THREE.SpotLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const animationIdRef = useRef<number>(0);

  // UI state
  const [fishCount, setFishCount] = useState(0);
  const [foodCount, setFoodCount] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const [activeTheme, setActiveTheme] = useState<Theme>("day");

  const spawnFish = useCallback(() => {
    if (!sceneRef.current) return;
    const color = FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)];
    const fish = new Fish(color, sceneRef.current, () => foodsRef.current);
    fishesRef.current.push(fish);
    setFishCount(fishesRef.current.length);
  }, []);

  const spawnFood = useCallback(() => {
    if (!sceneRef.current) return;
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const rx = (Math.random() - 0.5) * (TANK_WIDTH - 6);
      const rz = (Math.random() - 0.5) * (TANK_DEPTH - 6);
      const food = new Food(rx, rz, sceneRef.current, (f) => {
        foodsRef.current = foodsRef.current.filter((x) => x !== f);
        setFoodCount(foodsRef.current.length);
      });
      foodsRef.current.push(food);
    }
    setFoodCount(foodsRef.current.length);
  }, []);

  const handleTheme = useCallback((mode: Theme) => {
    const scene = sceneRef.current;
    const ambient = ambientLightRef.current;
    const top = topLightRef.current;
    const rays = lightRaysRef.current;
    if (!scene || !ambient || !top) return;

    if (mode === "day") {
      (scene.background as THREE.Color).setHex(0x011125);
      (scene.fog as THREE.FogExp2).color.setHex(0x011125);
      (scene.fog as THREE.FogExp2).density = 0.025;
      ambient.color.setHex(0x0a2240);
      ambient.intensity = 1.5;
      top.color.setHex(0xffffff);
      top.intensity = 5;
      rays.forEach((r) => (r.visible = true));
    } else if (mode === "night") {
      (scene.background as THREE.Color).setHex(0x00040a);
      (scene.fog as THREE.FogExp2).color.setHex(0x00040a);
      (scene.fog as THREE.FogExp2).density = 0.035;
      ambient.color.setHex(0x010815);
      ambient.intensity = 0.6;
      top.color.setHex(0x4080ff);
      top.intensity = 1.8;
      rays.forEach((r) => (r.visible = false));
    } else {
      (scene.background as THREE.Color).setHex(0x000105);
      (scene.fog as THREE.FogExp2).color.setHex(0x000105);
      (scene.fog as THREE.FogExp2).density = 0.06;
      ambient.color.setHex(0x00020a);
      ambient.intensity = 0.2;
      top.color.setHex(0x22d3ee);
      top.intensity = 3.0;
      rays.forEach((r) => (r.visible = true));
    }
    setActiveTheme(mode);
  }, []);

  // Three.js の初期化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // シーン
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x011125);
    scene.fog = new THREE.FogExp2(0x011125, 0.025);
    sceneRef.current = scene;

    // カメラ
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 5, 25);
    cameraRef.current = camera;

    // レンダラー
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // カメラコントロール
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.01;
    controls.minDistance = 5;
    controls.maxDistance = 40;
    controlsRef.current = controls;

    // ライティング
    const ambientLight = new THREE.AmbientLight(0x224466, 3);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const topLight = new THREE.SpotLight(0xffffff, 400);
    topLight.position.set(0, TANK_HEIGHT, 0);
    topLight.angle = Math.PI / 3;
    topLight.penumbra = 0.8;
    topLight.castShadow = true;
    topLight.shadow.mapSize.width = 1024;
    topLight.shadow.mapSize.height = 1024;
    scene.add(topLight);
    scene.add(topLight.target); // SpotLight の向き計算に必要
    topLightRef.current = topLight;

    // 水槽の外枠
    const tankGeo = new THREE.BoxGeometry(TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH);
    const edgeGeo = new THREE.EdgesGeometry(tankGeo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.15,
    });
    scene.add(new THREE.LineSegments(edgeGeo, edgeMat));

    // 底砂
    const floorGeo = new THREE.PlaneGeometry(TANK_WIDTH, TANK_DEPTH, 24, 24);
    const pos = floorGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      pos.setZ(
        i,
        Math.sin(vx * 0.3) * Math.cos(vy * 0.3) * 0.2 +
          Math.sin(vx * 0.1) * 0.1,
      );
    }
    floorGeo.computeVertexNormals();
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x051b30,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -TANK_HEIGHT / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 水光の差し込み
    const rayGeo = new THREE.ConeGeometry(8, TANK_HEIGHT, 4, 1, true);
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const rays: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const ray = new THREE.Mesh(rayGeo, rayMat);
      ray.position.set(
        (Math.random() - 0.5) * 15,
        0,
        (Math.random() - 0.5) * 10,
      );
      ray.rotation.x = (Math.random() - 0.5) * 0.2;
      ray.rotation.z = (Math.random() - 0.5) * 0.2;
      scene.add(ray);
      rays.push(ray);
    }
    lightRaysRef.current = rays;

    // 泡（パーティクル）
    const bubbleCount = 120;
    const geom = new THREE.BufferGeometry();
    const positions: number[] = [];
    const speeds: number[] = [];
    for (let i = 0; i < bubbleCount; i++) {
      positions.push(
        (Math.random() - 0.5) * (TANK_WIDTH - 2),
        (Math.random() - 0.5) * TANK_HEIGHT,
        (Math.random() - 0.5) * (TANK_DEPTH - 2),
      );
      speeds.push(0.02 + Math.random() * 0.04);
    }
    geom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    const bubbleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const bubbleSystem = new THREE.Points(geom, bubbleMat);
    bubbleSystem.userData = { speeds };
    scene.add(bubbleSystem);
    bubbleSystemRef.current = bubbleSystem;

    // 初期の魚
    const initialFishes: Fish[] = [];
    for (let i = 0; i < 12; i++) {
      const color = FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)];
      initialFishes.push(new Fish(color, scene, () => foodsRef.current));
    }
    fishesRef.current = initialFishes;
    setFishCount(12);

    // アニメーションループ
    function animate() {
      animationIdRef.current = requestAnimationFrame(animate);
      const time = performance.now() * 0.001;
      controls.update();

      fishesRef.current.forEach((fish) => fish.update(time));

      // スナップショットで安全にイテレート（更新中に配列が変わっても問題ない）
      const currentFoods = [...foodsRef.current];
      for (let i = currentFoods.length - 1; i >= 0; i--) {
        currentFoods[i].update();
      }

      if (bubbleSystemRef.current) {
        const posArr = bubbleSystemRef.current.geometry.attributes.position
          .array as Float32Array;
        const spds = bubbleSystemRef.current.userData.speeds as number[];
        for (let i = 0; i < spds.length; i++) {
          const idxY = i * 3 + 1;
          posArr[idxY] += spds[i];
          if (posArr[idxY] > TANK_HEIGHT / 2) {
            posArr[idxY] = -TANK_HEIGHT / 2;
            posArr[i * 3] = (Math.random() - 0.5) * (TANK_WIDTH - 2);
            posArr[i * 3 + 2] = (Math.random() - 0.5) * (TANK_DEPTH - 2);
          }
        }
        bubbleSystemRef.current.geometry.attributes.position.needsUpdate = true;
      }

      lightRaysRef.current.forEach((ray, idx) => {
        ray.rotation.y = time * 0.1 * (idx + 1);
        ray.position.x += Math.sin(time + idx) * 0.005;
      });

      renderer.render(scene, camera);
    }
    animate();

    // リサイズ対応
    function onResize() {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener("resize", onResize);
      fishesRef.current = [];
      foodsRef.current = [];
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
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
      {/* Three.js キャンバスのコンテナ */}
      <div
        ref={containerRef}
        className="w-full h-full absolute top-0 left-0 z-1"
      />

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
                <span className="text-cyan-400 font-bold">{fishCount}</span> 匹
              </span>
              <span>
                エサの数:{" "}
                <span className="text-amber-400 font-bold">{foodCount}</span> 個
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
                  onClick={() => handleTheme(t)}
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
