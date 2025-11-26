# TanStack Start Todo App - 学習ドキュメント

このディレクトリには、TanStack Startの学習用ドキュメントが含まれています。

## ドキュメント一覧

| ファイル | 内容 |
|---------|------|
| [01-architecture.md](./01-architecture.md) | 全体構成とTanStack Router/Honoとの比較 |
| [02-server-functions.md](./02-server-functions.md) | Server Functionsの詳細解説 |
| [03-ssr.md](./03-ssr.md) | SSRモードの解説 |
| [04-todo-app-walkthrough.md](./04-todo-app-walkthrough.md) | Todoアプリの実装解説 |

## TanStack Start を一言で

> **TanStack Start = TanStack Router + Server Functions + SSR**

TanStack Routerを使ったことがあれば、9割は同じです。
追加で学ぶべきは「Server Functions」と「SSRの設定」の2点だけ。

## このTodoアプリで学べること

1. **Server Functionsの基本**
   - `createServerFn()`でサーバーロジックを定義
   - Zodによる入力バリデーション
   - loaderとの連携

2. **データの取得と更新**
   - loaderでデータをプリフェッチ
   - `router.invalidate()`で再取得

3. **Drizzle ORMとの連携**
   - スキーマ定義
   - CRUD操作

## クイックリファレンス

### Server Function作成

```typescript
import { createServerFn } from '@tanstack/react-start'

// GET: データ取得
export const getData = createServerFn({ method: 'GET' })
  .handler(async () => {
    return await db.select().from(table)
  })

// POST: データ変更（バリデーション付き）
export const createData = createServerFn({ method: 'POST' })
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ data }) => {
    return await db.insert(table).values(data).returning()
  })
```

### ルート定義

```typescript
export const Route = createFileRoute('/path')({
  loader: async () => ({ data: await getData() }),
  component: Page,
})
```

### データ更新

```typescript
const router = useRouter()

const handleUpdate = async () => {
  await updateData({ data: newData })
  await router.invalidate() // loaderを再実行
}
```

## 参考リンク

- [TanStack Start 公式ドキュメント](https://tanstack.com/start)
- [TanStack Router 公式ドキュメント](https://tanstack.com/router)
- [Drizzle ORM 公式ドキュメント](https://orm.drizzle.team)
