# Server Functions 詳細解説

Server Functionsは、TanStack Start特有の最も重要な機能です。

## 基本概念

Server Functionsは「サーバーでのみ実行される関数」です。
クライアントから呼び出すと、内部的にHTTPリクエストに変換されます。

```typescript
import { createServerFn } from '@tanstack/react-start'

// この関数はサーバーでのみ実行される
export const getServerTime = createServerFn({ method: 'GET' })
  .handler(async () => {
    return new Date().toISOString()
  })
```

## Honoとの概念比較

```
Hono:
┌─────────────────────────────────────────┐
│ Client                                  │
│   fetch('/api/time')                    │
│        │                                │
│        ▼                                │
│ Server (Hono)                           │
│   app.get('/api/time', handler)         │
│        │                                │
│        ▼                                │
│   レスポンス返却                          │
└─────────────────────────────────────────┘

TanStack Start:
┌─────────────────────────────────────────┐
│ Client                                  │
│   getServerTime()  ← 関数呼び出し         │
│        │                                │
│        ▼ (自動でHTTPに変換)              │
│ Server (TanStack Start)                 │
│   handler実行                            │
│        │                                │
│        ▼                                │
│   結果を返却（型安全）                     │
└─────────────────────────────────────────┘
```

## メソッドの選択

```typescript
// GET: データ取得（副作用なし）
// - キャッシュされやすい
// - 冪等性が期待される
export const getTodos = createServerFn({ method: 'GET' })
  .handler(async () => { ... })

// POST: データ変更（副作用あり）
// - キャッシュされない
// - 作成、更新、削除に使用
export const createTodo = createServerFn({ method: 'POST' })
  .handler(async () => { ... })
```

## 入力バリデーション

Server Functionsはネットワーク境界を越えるため、入力の検証が重要です。

```typescript
import { z } from 'zod'

const createTodoSchema = z.object({
  title: z.string().min(1).max(200),
})

export const createTodo = createServerFn({ method: 'POST' })
  // inputValidatorには「関数」を渡す（zodスキーマではない）
  .inputValidator((input: unknown) => createTodoSchema.parse(input))
  .handler(async ({ data }) => {
    // dataはcreateTodoSchemaの型に推論される
    // data.title は string 型
  })
```

### 注意点
- Zodスキーマをそのまま渡すことは**できない**
- `.parse()`を呼ぶ関数を渡す必要がある

## loaderでの使用

TanStack Routerのloaderと同様に、ルートでデータを事前取得できます：

```typescript
// src/routes/todos.tsx
export const Route = createFileRoute('/todos')({
  // loaderでServer Functionを呼び出す
  loader: async () => {
    const todos = await getTodos()
    return { todos }
  },
  component: TodoPage,
})

function TodoPage() {
  // loaderのデータにアクセス（型安全）
  const { todos } = Route.useLoaderData()
  // ...
}
```

### loaderの実行タイミング

```
1. 初回アクセス（SSR）
   サーバー: loader実行 → HTML生成 → クライアントに送信

2. クライアントナビゲーション（SPA）
   クライアント: loader実行 → Server Function呼び出し → 画面更新
```

## コンポーネントでの直接呼び出し

Server Functionsは、コンポーネント内から直接呼び出すこともできます：

```typescript
function TodoPage() {
  const handleCreate = async () => {
    // Server Functionを直接呼び出し
    // 内部的にはPOSTリクエストになる
    await createTodo({ data: { title: 'New Todo' } })
  }
  // ...
}
```

## データの更新パターン

### router.invalidate()

Server Functionで更新後、`router.invalidate()`でloaderを再実行：

```typescript
function TodoPage() {
  const router = useRouter()

  const handleCreate = async () => {
    await createTodo({ data: { title: 'New Todo' } })

    // invalidate()でloaderを再実行
    // → getTodos()が呼ばれ、最新データを取得
    await router.invalidate()
  }
}
```

これは、TanStack QueryのinvalidateQueriesに似た概念です。

## 型の流れ

```typescript
// 1. 入力スキーマ定義
const schema = z.object({ title: z.string() })

// 2. Server Function定義
export const createTodo = createServerFn({ method: 'POST' })
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ data }) => {
    // data: { title: string }
    return { id: 1, ...data }
  })

// 3. クライアントでの呼び出し
const result = await createTodo({ data: { title: 'Test' } })
// result: { id: number, title: string }
// 型エラー: createTodo({ data: { title: 123 } })
```

## エラーハンドリング

```typescript
export const createTodo = createServerFn({ method: 'POST' })
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ data }) => {
    try {
      const [todo] = await db.insert(todos).values(data).returning()
      return todo
    } catch (error) {
      // エラーはクライアントに伝播する
      throw new Error('Todo作成に失敗しました')
    }
  })
```

クライアント側では通常のtry-catchで捕捉できます。
