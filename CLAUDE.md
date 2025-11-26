# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 開発コマンド

```bash
# 開発サーバー起動（ポート3000）
bun run dev

# ビルド
bun run build

# 型チェック（tsgo使用）
bun run check

# リント
bun run lint

# フォーマット
bun run format

# テスト実行
bun run test

# Cloudflareにデプロイ
bun run deploy
```

### データベース操作（Drizzle Kit）

```bash
# マイグレーションファイル生成
bun run db:generate

# スキーマをDBに直接プッシュ（開発用）
bun run db:push

# Drizzle Studio起動（GUI）
bun run db:studio
```

## アーキテクチャ

### TanStack Start + Server Functions

フルスタックReactフレームワーク。Server Functionsを使用してサーバーサイドロジックを定義し、クライアントから型安全に呼び出す。

- `src/server/` - Server Functions（RPC形式のAPI）
- `src/routes/` - ファイルベースルーティング（URLパスに対応）
- `src/routeTree.gen.ts` - 自動生成されるルートツリー（編集禁止）

Server Functionの定義パターン:
```typescript
export const myFunction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => { ... })
```

### データベース（Drizzle ORM + SQLite）

- `src/db/schema.ts` - Drizzleスキーマ定義
- `src/db/index.ts` - DBクライアント初期化（bun:sqlite使用）
- `drizzle.config.ts` - Drizzle Kit設定
- `./sqlite.db` - ローカルSQLiteファイル

### UIコンポーネント

- `src/components/ui/` - shadcn/uiコンポーネント（Biomeリント対象外）
- Tailwind CSS v4使用
- パスエイリアス `@/*` で `./src/*` を参照

### デプロイ

Cloudflare Workersにデプロイ可能。`USE_CLOUDFLARE=true` 環境変数でCloudflareモードに切り替え。

- `wrangler.jsonc` - Wrangler設定

## コーディング規約

- Biome使用: セミコロンなし、ダブルクォート、インデント2スペース
- 自動生成ファイル（`routeTree.gen.ts`、`worker-configuration.d.ts`）はリント対象外
