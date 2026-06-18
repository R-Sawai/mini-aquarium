# mini-aquarium

ブラウザで動く 3D インタラクティブ水槽アプリ。
魚が自律的に泳ぎ、餌を与えると食べに来ます。

**ライブデモ**: https://r-sawai.github.io/mini-aquarium/

## 技術スタック

- **React 19** + **TypeScript**
- **React Three Fiber** / **Three.js** — 3D レンダリング
- **Vite** — ビルドツール
- **Tailwind CSS** — スタイリング
- **pnpm** — パッケージマネージャー

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
