import { useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { Plus, Trash2, CheckCircle2, Circle, Loader2 } from "lucide-react"

// shadcn/uiコンポーネント
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Server Functions
import { getTodos, createTodo, toggleTodo, deleteTodo, deleteCompletedTodos } from "@/server/todo"
import type { Todo } from "@/db/schema"

/**
 * =====================================
 * TanStack Router - File-based Routing
 * =====================================
 *
 * createFileRoute でルートを定義します。
 * ファイルパスがURLパスになる（/src/routes/todos.tsx → /todos）
 *
 * TanStack Routerを使ったことがあれば:
 * - 基本的に同じ概念
 * - loaderでデータをプリフェッチできる
 *
 * TanStack Start特有のポイント:
 * - loaderはサーバーでもクライアントでも実行される可能性がある
 * - Server Functionsを使えば、確実にサーバーで実行される
 * - SSRモード（ssr: 'full-ssr' | 'data-only' | 'spa-mode'）で挙動を制御できる
 */
export const Route = createFileRoute("/todos")({
  /**
   * loader: ルートがレンダリングされる前にデータを取得
   *
   * TanStack Start では:
   * - SSR時: サーバーで実行され、HTMLと一緒にデータが送られる
   * - クライアントナビゲーション時: クライアントで実行される
   *
   * Server Functionを使うと:
   * - 常にサーバーで実行される（DBアクセスが安全）
   * - クライアントからはHTTPリクエストになる
   */
  loader: async () => {
    // getTodos()はServer Function
    // サーバーで実行され、結果だけがクライアントに送られる
    const todos = await getTodos()
    return { todos }
  },

  // コンポーネントを指定
  component: TodoPage,
})

/**
 * =====================================
 * Todo Page Component
 * =====================================
 */
function TodoPage() {
  /**
   * Route.useLoaderData()
   *
   * loaderで取得したデータにアクセス
   * 型は自動推論される（loaderの戻り値から）
   */
  const { todos: initialTodos } = Route.useLoaderData()

  /**
   * useRouter()
   *
   * TanStack Routerのインスタンスにアクセス
   * invalidate()でデータの再取得をトリガーできる
   */
  const router = useRouter()

  // ローカルステート
  const [newTodoTitle, setNewTodoTitle] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set())

  // Todoリスト（loaderから取得したデータを使用）
  // router.invalidate()で再取得されるため、initialTodosを直接使う
  const todos = initialTodos

  /**
   * =====================================
   * Event Handlers
   * =====================================
   *
   * Server Functionsはクライアントから直接呼び出せます。
   * 内部的にはHTTP POSTリクエストに変換される。
   */

  // 新規Todo作成
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoTitle.trim() || isCreating) return

    setIsCreating(true)
    try {
      // Server Functionを呼び出し
      await createTodo({ data: { title: newTodoTitle.trim() } })
      setNewTodoTitle("")

      /**
       * router.invalidate()
       *
       * 現在のルートのloaderを再実行し、データを更新
       * React QueryのinvalidateQueriesに似た概念
       *
       * TanStack Start特有:
       * - invalidate()はloaderを再実行する
       * - Server Functionが呼ばれ、最新データを取得
       */
      await router.invalidate()
    } catch (error) {
      console.error("Failed to create todo:", error)
    } finally {
      setIsCreating(false)
    }
  }

  // Todo完了状態トグル
  const handleToggle = async (id: number) => {
    setLoadingIds((prev) => new Set(prev).add(id))
    try {
      await toggleTodo({ data: { id } })
      await router.invalidate()
    } catch (error) {
      console.error("Failed to toggle todo:", error)
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // Todo削除
  const handleDelete = async (id: number) => {
    setLoadingIds((prev) => new Set(prev).add(id))
    try {
      await deleteTodo({ data: { id } })
      await router.invalidate()
    } catch (error) {
      console.error("Failed to delete todo:", error)
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // 完了済みTodo一括削除
  const handleDeleteCompleted = async () => {
    try {
      await deleteCompletedTodos()
      await router.invalidate()
    } catch (error) {
      console.error("Failed to delete completed todos:", error)
    }
  }

  // 統計情報
  const completedCount = todos.filter((t: Todo) => t.completed).length
  const activeCount = todos.length - completedCount

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">TanStack Start Todo</h1>
          <p className="text-gray-400">Server FunctionsとSQLiteでデータを永続化</p>
        </div>

        {/* 新規Todo入力フォーム */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="flex gap-2">
              <Input
                type="text"
                placeholder="新しいTodoを入力..."
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                disabled={isCreating}
              />
              <Button
                type="submit"
                disabled={isCreating || !newTodoTitle.trim()}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todoリスト */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">
              Todos ({activeCount} active, {completedCount} completed)
            </CardTitle>
            {completedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteCompleted}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear completed
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {todos.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                Todoがありません。上のフォームから追加してください。
              </p>
            ) : (
              <ul className="space-y-2">
                {todos.map((todo: Todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    isLoading={loadingIds.has(todo.id)}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* 説明 */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>このアプリはTanStack Start + Drizzle ORM + SQLiteで構築されています。</p>
          <p className="mt-1">データはサーバーサイドのSQLiteデータベースに保存されます。</p>
        </div>
      </div>
    </div>
  )
}

/**
 * =====================================
 * TodoItem Component
 * =====================================
 *
 * 個々のTodoアイテムを表示するコンポーネント
 */
interface TodoItemProps {
  todo: Todo
  isLoading: boolean
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

function TodoItem({ todo, isLoading, onToggle, onDelete }: TodoItemProps) {
  return (
    <li
      className={`
        flex items-center gap-3 p-3 rounded-lg
        bg-slate-700/50 border border-slate-600
        transition-all duration-200
        ${isLoading ? "opacity-50" : ""}
        ${todo.completed ? "opacity-70" : ""}
      `}
    >
      {/* チェックボックス */}
      <button
        type="button"
        onClick={() => onToggle(todo.id)}
        disabled={isLoading}
        className="flex-shrink-0 text-cyan-400 hover:text-cyan-300 transition-colors disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : todo.completed ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      {/* タイトル */}
      <span
        className={`
          flex-1 text-white
          ${todo.completed ? "line-through text-gray-400" : ""}
        `}
      >
        {todo.title}
      </span>

      {/* 削除ボタン */}
      <button
        type="button"
        onClick={() => onDelete(todo.id)}
        disabled={isLoading}
        className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors disabled:cursor-not-allowed"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  )
}
