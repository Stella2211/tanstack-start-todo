# TanStack Start アーキテクチャ解説

このドキュメントでは、TanStack Startの全体像と、TanStack Router/Honoとの違いを説明します。

## プロジェクト構成

```
src/
├── routes/           # ファイルベースルーティング（TanStack Routerと同じ）
│   ├── __root.tsx    # ルートレイアウト
│   ├── index.tsx     # / ページ
│   └── todos.tsx     # /todos ページ
├── server/           # Server Functions
│   └── todo.ts       # Todo関連のサーバーロジック
├── db/               # データベース関連
│   ├── schema.ts     # Drizzleスキーマ定義
│   └── index.ts      # DBクライアント設定
├── components/       # Reactコンポーネント
│   ├── ui/           # shadcn/uiコンポーネント
│   └── Header.tsx    # 共通ヘッダー
├── router.tsx        # ルーター設定
└── routeTree.gen.ts  # 自動生成されるルートツリー
```

## TanStack Start = TanStack Router + サーバー機能

TanStack Routerを使ったことがあれば、基本的な概念は同じです：

| 機能 | TanStack Router | TanStack Start |
|------|-----------------|----------------|
| ファイルベースルーティング | ✅ | ✅（同じ） |
| loader | ✅ | ✅（同じ） |
| Search Params | ✅ | ✅（同じ） |
| SSR | ❌ | ✅ |
| Server Functions | ❌ | ✅ |
| API Routes | ❌ | ✅ |

## Honoとの比較

Honoを使ったことがあれば、Server Functionsは「型安全なRPCエンドポイント」として理解できます：

```typescript
// Hono の場合
app.post('/api/todos', async (c) => {
  const body = await c.req.json()
  // バリデーション、DB操作、レスポンス...
})

// TanStack Start の Server Functions
export const createTodo = createServerFn({ method: 'POST' })
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ data }) => {
    // DBへ操作、結果を返す
  })
```

**主な違い：**
- Honoは手動でルート定義 → Server Functionsは関数単位で自動
- Honoは型定義を別途共有 → Server Functionsは型が自動推論
- Honoはクライアント用のfetchを書く → Server Functionsはそのまま関数として呼べる

## データフロー

```
[Client]                    [Server]
    │                           │
    │  1. ページアクセス         │
    │ ─────────────────────────> │
    │                           │
    │  2. loader実行             │
    │      └─ getTodos()        │ ← Server Function
    │         └─ db.select()    │
    │                           │
    │  3. HTML + データ返却      │
    │ <───────────────────────── │
    │                           │
    │  4. ユーザーアクション     │
    │      └─ createTodo()      │ ← Server Function
    │ ─────────────────────────> │
    │         └─ db.insert()    │
    │                           │
    │  5. 結果返却               │
    │ <───────────────────────── │
    │                           │
    │  6. router.invalidate()   │
    │      └─ loader再実行      │
    │                           │
```

## 重要ファイルの役割

### vite.config.ts
Viteの設定。TanStack Startプラグインはここで有効化。
- `tanstackStart()`: ファイルベースルーティング、Server Functionsのコンパイル

### src/routes/__root.tsx
アプリ全体のルートレイアウト。
- `<html>`, `<head>`, `<body>`の定義
- 共通コンポーネント（Header等）の配置
- `<Scripts />`でJSをhydrate

### src/router.tsx
TanStack Routerの設定。基本的にTanStack Routerと同じ。
