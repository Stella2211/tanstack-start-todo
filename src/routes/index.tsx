import { createFileRoute, Link } from "@tanstack/react-router"
import { CheckSquare, Database, Server, Zap } from "lucide-react"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10" />
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-6 mb-6">
            <img
              src="/tanstack-circle-logo.png"
              alt="TanStack Logo"
              className="w-24 h-24 md:w-32 md:h-32"
            />
            <h1 className="text-6xl md:text-7xl font-black text-white [letter-spacing:-0.08em]">
              <span className="text-gray-300">TODO</span>{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                APP
              </span>
            </h1>
          </div>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            TanStack Start + Drizzle ORM + SQLite
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            Server FunctionsとSQLiteデータベースを使ったシンプルなTodoアプリ。 TanStack
            Startの基本的な使い方を学ぶためのサンプルです。
          </p>
          <Link
            to="/todos"
            className="inline-block px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
          >
            Todo Appを開く
          </Link>
        </div>
      </section>

      <section className="py-16 px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">使用技術</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <Zap className="w-10 h-10 text-cyan-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">TanStack Start</h3>
            <p className="text-gray-400">
              Server FunctionsでサーバーサイドのロジックをRPCスタイルで呼び出し
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <Server className="w-10 h-10 text-cyan-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Drizzle ORM</h3>
            <p className="text-gray-400">型安全なSQLクエリビルダーでデータベース操作</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <Database className="w-10 h-10 text-cyan-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">SQLite (bun:sqlite)</h3>
            <p className="text-gray-400">Bunランタイムのネイティブドライバーで高速なDB操作</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <CheckSquare className="w-10 h-10 text-cyan-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">shadcn/ui</h3>
            <p className="text-gray-400">RadixベースのアクセシブルなUIコンポーネント</p>
          </div>
        </div>
      </section>
    </div>
  )
}
