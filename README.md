# TanStack Start Todo

TanStack Start + Drizzle ORM + SQLite で構築したシンプルなTodoアプリケーションです。

## 技術スタック

- **フレームワーク**: [TanStack Start](https://tanstack.com/start) - フルスタックReactフレームワーク
- **ルーティング**: [TanStack Router](https://tanstack.com/router) - 型安全なファイルベースルーティング
- **データベース**: SQLite + [Drizzle ORM](https://orm.drizzle.team/)
- **UI**: [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS v4](https://tailwindcss.com/)
- **ランタイム**: [Bun](https://bun.sh/)
- **デプロイ**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **リント/フォーマット**: [Biome](https://biomejs.dev/)
- **テスト**: [Vitest](https://vitest.dev/)

## セットアップ

```bash
# 依存関係のインストール
bun install

# データベースのセットアップ
bun run db:push

# 開発サーバー起動
bun run dev
```

開発サーバーは http://localhost:3000 で起動します。

## 開発コマンド

| コマンド | 説明 |
|---------|------|
| `bun run dev` | 開発サーバー起動（ポート3000） |
| `bun run build` | 本番ビルド |
| `bun run check` | 型チェック |
| `bun run lint` | リント実行 |
| `bun run format` | コードフォーマット |
| `bun run test` | テスト実行 |

### データベース操作

| コマンド | 説明 |
|---------|------|
| `bun run db:generate` | マイグレーションファイル生成 |
| `bun run db:push` | スキーマをDBに直接プッシュ |
| `bun run db:studio` | Drizzle Studio（GUI）起動 |

## プロジェクト構成

```
src/
├── components/      # Reactコンポーネント
│   └── ui/          # shadcn/uiコンポーネント
├── db/              # データベース関連
│   ├── index.ts     # DBクライアント
│   └── schema.ts    # Drizzleスキーマ定義
├── routes/          # ファイルベースルーティング
│   ├── __root.tsx   # ルートレイアウト
│   ├── index.tsx    # トップページ
│   └── todos.tsx    # Todoページ
├── server/          # Server Functions
│   └── todo.ts      # Todo操作のAPI
└── lib/             # ユーティリティ
```

## デプロイ

Cloudflare Workersへデプロイ:

```bash
bun run deploy
```

## ライセンス

MIT
