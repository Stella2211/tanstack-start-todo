import { createServerFn } from "@tanstack/react-start"
import { db, todos, type Todo, type NewTodo } from "../db"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"

/**
 * =====================================
 * TanStack Start - Server Functions
 * =====================================
 *
 * Server Functionsは、TanStack Start特有の重要な概念です。
 * サーバーサイドでのみ実行されるコードを定義し、
 * クライアントから型安全に呼び出すことができます。
 *
 * 特徴:
 * - サーバーでのみ実行される（DBアクセスなど安全）
 * - クライアントからはHTTPリクエストとして呼び出される
 * - 型安全（引数も戻り値も型チェックされる）
 * - loaderからもコンポーネントからも呼び出せる
 *
 * TanStack Routerを使ったことがあれば:
 * - loaderでデータを取得するのは同じ
 * - Server Functionsはloaderの中身を分離したようなもの
 * - mutation（POST/PUT/DELETE）も同様に定義できる
 *
 * Honoを使ったことがあれば:
 * - Server Functions ≒ RPCエンドポイント
 * - ただし、型定義を共有する手間がない（自動で推論される）
 */

/**
 * =====================================
 * バリデーションスキーマ
 * =====================================
 *
 * zodを使った入力バリデーション
 * Server FunctionsのinputValidatorで使用
 */

// Todo更新用スキーマ
const updateTodoSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
})

// ID指定用スキーマ
const idSchema = z.object({
  id: z.number().int().positive(),
})

/**
 * =====================================
 * GET: 全Todoを取得
 * =====================================
 *
 * createServerFn()でServer Functionを作成します。
 *
 * method: 'GET' | 'POST'
 * - GET: データ取得（キャッシュされやすい）
 * - POST: データ変更（キャッシュされない）
 *
 * .handler() で実際の処理を定義
 * - async関数で、サーバーサイドの処理を書く
 * - データベースアクセス、ファイル操作など何でもOK
 */
export const getTodos = createServerFn({
  method: "GET",
}).handler(async (): Promise<Todo[]> => {
  // Drizzle ORMでSELECT * FROM todos ORDER BY created_at DESC
  const result = await db.select().from(todos).orderBy(desc(todos.createdAt))

  return result
})

/**
 * =====================================
 * POST: 新規Todoを作成
 * =====================================
 *
 * .inputValidator() で入力のバリデーションを追加できます。
 * - zodスキーマを使うと型も自動推論される
 * - バリデーションエラーは自動的にエラーレスポンスになる
 *
 * handler({ data }) で検証済みのデータにアクセス
 */
export const createTodo = createServerFn({
  method: "POST",
})
  // inputValidatorには関数を渡す（Zodスキーマをそのまま渡すことはできない）
  // この関数は入力データを検証し、検証済みのデータを返す
  .inputValidator((input: { title: string }) => input)
  .handler(async ({ data }): Promise<Todo> => {
    // Drizzle ORMでINSERT INTO todos (title) VALUES (?)
    const [newTodo] = await db
      .insert(todos)
      .values({
        title: data.title,
      })
      .returning() // returning()で挿入したデータを返す（SQLiteでも使える）

    return newTodo
  })

/**
 * =====================================
 * POST: Todoを更新
 * =====================================
 *
 * 部分更新（Partial Update）パターン
 * - titleとcompletedはオプショナル
 * - 指定されたフィールドのみ更新
 */
export const updateTodo = createServerFn({
  method: "POST",
})
  .inputValidator((input: unknown) => updateTodoSchema.parse(input))
  .handler(async ({ data }): Promise<Todo | null> => {
    // 更新するフィールドを動的に構築
    const updateData: Partial<NewTodo> = {}

    if (data.title !== undefined) {
      updateData.title = data.title
    }
    if (data.completed !== undefined) {
      updateData.completed = data.completed
    }

    // Drizzle ORMでUPDATE todos SET ... WHERE id = ?
    const [updated] = await db
      .update(todos)
      .set(updateData)
      .where(eq(todos.id, data.id))
      .returning()

    return updated ?? null
  })

/**
 * =====================================
 * POST: Todoの完了状態をトグル
 * =====================================
 *
 * よく使う操作なので専用のServer Functionとして切り出し
 * UIからはこれを呼ぶだけで済む
 */
export const toggleTodo = createServerFn({
  method: "POST",
})
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }): Promise<Todo | null> => {
    // 現在の状態を取得
    const [current] = await db.select().from(todos).where(eq(todos.id, data.id))

    if (!current) {
      return null
    }

    // 完了状態を反転
    const [updated] = await db
      .update(todos)
      .set({ completed: !current.completed })
      .where(eq(todos.id, data.id))
      .returning()

    return updated ?? null
  })

/**
 * =====================================
 * POST: Todoを削除
 * =====================================
 *
 * DELETEメソッドは現在サポートされていないため、POSTを使用
 * REST APIとは異なり、Server FunctionsはRPCスタイル
 */
export const deleteTodo = createServerFn({
  method: "POST",
})
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    // Drizzle ORMでDELETE FROM todos WHERE id = ?
    await db.delete(todos).where(eq(todos.id, data.id))

    return { success: true }
  })

/**
 * =====================================
 * POST: 完了済みTodoを全て削除
 * =====================================
 */
export const deleteCompletedTodos = createServerFn({
  method: "POST",
}).handler(async (): Promise<{ deletedCount: number }> => {
  // 完了済みのTodoを全て削除
  const result = await db.delete(todos).where(eq(todos.completed, true)).returning()

  return { deletedCount: result.length }
})
