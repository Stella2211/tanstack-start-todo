# Todo アプリ実装ウォークスルー

このドキュメントでは、Todoアプリの実装を順を追って解説します。

## 1. データベース設定

### スキーマ定義 (src/db/schema.ts)

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  // 主キー（自動インクリメント）
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Todoの内容
  title: text("title").notNull(),

  // 完了状態（SQLiteにはbooleanがないのでintegerで）
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),

  // タイムスタンプ
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

// 型のエクスポート（重要！）
export type Todo = typeof todos.$inferSelect;    // 読み取り用
export type NewTodo = typeof todos.$inferInsert; // 書き込み用
```

### DBクライアント (src/db/index.ts)

```typescript
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

// SQLiteファイルを開く
const sqlite = new Database("./sqlite.db");

// WALモード（パフォーマンス向上）
sqlite.pragma("journal_mode = WAL");

// Drizzleインスタンス作成
export const db = drizzle(sqlite, { schema });
```

## 2. Server Functions (src/server/todo.ts)

### データ取得

```typescript
export const getTodos = createServerFn({ method: "GET" })
  .handler(async (): Promise<Todo[]> => {
    // SELECT * FROM todos ORDER BY created_at DESC
    return await db.select().from(todos).orderBy(desc(todos.createdAt));
  });
```

### データ作成

```typescript
const createTodoSchema = z.object({
  title: z.string().min(1).max(200),
});

export const createTodo = createServerFn({ method: "POST" })
  .inputValidator((input) => createTodoSchema.parse(input))
  .handler(async ({ data }): Promise<Todo> => {
    // INSERT INTO todos (title) VALUES (?) RETURNING *
    const [newTodo] = await db
      .insert(todos)
      .values({ title: data.title })
      .returning();
    return newTodo;
  });
```

### データ更新（トグル）

```typescript
export const toggleTodo = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.number() }).parse(input))
  .handler(async ({ data }): Promise<Todo | null> => {
    // 現在の状態を取得
    const [current] = await db.select().from(todos).where(eq(todos.id, data.id));
    if (!current) return null;

    // 反転して更新
    const [updated] = await db
      .update(todos)
      .set({ completed: !current.completed })
      .where(eq(todos.id, data.id))
      .returning();
    return updated;
  });
```

## 3. ルート定義 (src/routes/todos.tsx)

### loaderでデータ取得

```typescript
export const Route = createFileRoute("/todos")({
  // SSR時・ナビゲーション時にデータを取得
  loader: async () => {
    const todos = await getTodos(); // Server Function呼び出し
    return { todos };
  },
  component: TodoPage,
});
```

### コンポーネント

```typescript
function TodoPage() {
  // loaderのデータを取得（型安全）
  const { todos } = Route.useLoaderData();

  // データ更新用のrouterインスタンス
  const router = useRouter();

  // 新規作成ハンドラ
  const handleCreate = async () => {
    await createTodo({ data: { title: newTodoTitle } });
    await router.invalidate(); // loaderを再実行
  };

  // トグルハンドラ
  const handleToggle = async (id: number) => {
    await toggleTodo({ data: { id } });
    await router.invalidate();
  };

  return (
    // JSX...
  );
}
```

## 4. データフローの全体像

```
[ブラウザ]                              [サーバー]
    │                                      │
    │ 1. /todos にアクセス                  │
    │ ───────────────────────────────────> │
    │                                      │
    │                      2. loader実行   │
    │                         getTodos()   │
    │                         ↓            │
    │                      3. DB: SELECT   │
    │                         ↓            │
    │ 4. HTML + todos データ               │
    │ <─────────────────────────────────── │
    │                                      │
    │ 5. 画面表示 & Hydrate                │
    │                                      │
    │ 6. ユーザー: "Buy milk" を入力       │
    │    → createTodo() 呼び出し           │
    │ ───────────────────────────────────> │
    │                                      │
    │                      7. handler実行  │
    │                         ↓            │
    │                      8. DB: INSERT   │
    │                         ↓            │
    │ 9. 新しいTodo返却                    │
    │ <─────────────────────────────────── │
    │                                      │
    │ 10. router.invalidate()              │
    │     → loader再実行 → 画面更新        │
    │                                      │
```

## 5. 重要なパターン

### router.invalidate() パターン

データ更新後に画面を最新にする標準的な方法：

```typescript
const handleCreate = async () => {
  await createTodo({ data: { title } });
  await router.invalidate(); // これが重要！
};
```

### ローディング状態の管理

```typescript
const [isCreating, setIsCreating] = useState(false);

const handleCreate = async () => {
  setIsCreating(true);
  try {
    await createTodo({ data: { title } });
    await router.invalidate();
  } catch (error) {
    console.error(error);
  } finally {
    setIsCreating(false);
  }
};
```

### 個別アイテムのローディング

```typescript
const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

const handleToggle = async (id: number) => {
  setLoadingIds(prev => new Set(prev).add(id));
  try {
    await toggleTodo({ data: { id } });
    await router.invalidate();
  } finally {
    setLoadingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }
};
```

## 6. 開発コマンド

```bash
# 開発サーバー起動
bun run dev

# データベースにスキーマを反映（開発用）
bun run db:push

# Drizzle Studio（DBをGUIで確認）
bun run db:studio

# ビルド
bun run build
```

## 7. 拡張のヒント

### TanStack Queryとの併用

より複雑な状態管理が必要な場合：

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

function TodoPage() {
  const queryClient = useQueryClient();

  const { data: todos } = useQuery({
    queryKey: ['todos'],
    queryFn: () => getTodos(),
  });

  const createMutation = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
```

### 楽観的更新（Optimistic Updates）

```typescript
const handleToggle = async (id: number) => {
  // 楽観的にUIを更新
  setOptimisticTodos(prev =>
    prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
  );

  try {
    await toggleTodo({ data: { id } });
    await router.invalidate();
  } catch {
    // エラー時は元に戻す
    await router.invalidate();
  }
};
```
