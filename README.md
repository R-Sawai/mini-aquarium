# mini-aquarium

ブラウザで動く 3D インタラクティブ水槽アプリ。
魚が自律的に泳ぎ、餌を与えると食べに来ます。

**ライブデモ**: https://r-sawai.github.io/mini-aquarium/

## 技術スタック

- **React 19** + **TypeScript**
- **React Three Fiber** / **Three.js** — 3D レンダリング
- **Vite** — ビルドツール
- **Tailwind CSS** — スタイリング
- **Tone.js** — BGM（手続き的生成音楽）
- **pnpm** — パッケージマネージャー

## 機能

- 魚が自律的に泳ぎ回る（ブラウン運動・境界回避）
- エサを与えると近くの魚が食べに来る
- BGM 再生（コード進行 + 水滴風メロディ）
- 観賞モード（UI 非表示）

## セットアップ

```bash
pnpm install
pnpm dev
```

## コマンド

| コマンド         | 説明                        |
| ---------------- | --------------------------- |
| `pnpm dev`       | 開発サーバー起動            |
| `pnpm build`     | プロダクションビルド        |
| `pnpm preview`   | ビルド結果のプレビュー      |
| `pnpm lint`      | ESLint 実行                 |
| `pnpm build:ext` | Chrome 拡張機能としてビルド |

## デプロイ

`main` ブランチへのプッシュで GitHub Actions が自動的に GitHub Pages へデプロイします。

## ライセンス

MIT
