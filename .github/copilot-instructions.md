# 指示ファイル

このファイルは、エージェントがこのリポジトリで作業する際のガイダンスを提供します。

## コマンド

```bash
pnpm dev          # 開発サーバー起動（HMR あり）
pnpm build        # TypeScript コンパイル + Vite プロダクションビルド
pnpm lint         # ESLint 実行
pnpm preview      # プロダクションビルドのローカルプレビュー
pnpm build:ext    # Chrome 拡張機能としてビルド（--mode extension）
```

テストスイートは未設定。

## アーキテクチャ

React 19 + React Three Fiber（Three.js）+ TypeScript で構築した 3D インタラクティブ水槽。GitHub Pages へ `/mini-aquarium/` ベースパスでデプロイ。

**コンポーネント階層:**

```
App (src/app.tsx)
├── Canvas (React Three Fiber)
│   └── AquariumScene (src/components/objects/aquarium-scene.tsx)
│       ├── CameraControls       — OrbitControls ラッパー
│       ├── TankEnvironment      — 照明・ガラス壁・砂地・泡・光線
│       ├── SeaweedField / SeaweedBlade  — 手続き的な再帰海草
│       ├── FishMesh[]           — 自律行動する魚エージェント
│       └── FoodMesh[]           — 落下する餌パーティクル
└── UI オーバーレイ（ボタン・表示切替）
```

**ディレクトリ構成:**

```
src/
├── app.tsx
├── main.tsx
├── components/objects/   — 3D オブジェクトコンポーネント
│   ├── aquarium-scene.tsx
│   ├── camera-controls.tsx
│   ├── tank-environment.tsx
│   ├── seaweed.tsx
│   ├── fish-mesh.tsx
│   └── food-mesh.tsx
├── hooks/
│   └── use-bgm.ts        — BGM 再生フック（Tone.js）
└── consts/
    └── aquarium.ts       — 水槽定数・魚カラーパレット
```

**水槽定数**（`src/consts/aquarium.ts`）: 幅 30・高さ 16・奥行き 18 単位。魚のカラーパレットもここで定義。

**魚の挙動**（`fish-mesh.tsx`）: 速度ベースの自律エージェント。ブラウン運動・境界回避・半径 15 単位以内の餌探索を行う。食事後 1 秒間スピードブーストが発動。尻尾の揺れは `useFrame` ごとのサイン波で制御。

**餌システム**: 餌メッシュは `aquarium-scene.tsx` の `useRef` が持つ `Map<number, THREE.Mesh>` に登録され、魚が props を介さずに餌の位置を参照できる。餌は重力で落下し、水槽の底に到達すると自動削除（約 20 秒 TTL）。

**BGM**（`src/hooks/use-bgm.ts`）: Tone.js による手続き的生成音楽。PolySynth でコード進行、MonoSynth で水滴風メロディを生成。再生中の多重初期化・タイマーリークをガード済み。

## 重要な制約

- `tsconfig.app.json` で `noUnusedLocals` / `noUnusedParameters` が有効。意図的に未使用にする変数はアンダースコアプレフィックス（例: `_value`）で回避する。
- Vite のベースパスは拡張機能以外 `/mini-aquarium/`。アセットパスは相対パスかベースパスを考慮すること。
- CRX プラグイン（`manifest.config.ts`）は `--mode extension` のときのみ有効。通常の Web ビルドがデフォルト。
- `tank-environment.tsx` の `THEME_CONFIGS` は `"day"` テーマのみ実装済み。他テーマは形だけ拡張可能な状態。
- ファイルは原則 `kebab-case` とする
