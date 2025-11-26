import { defineConfig } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import viteTsConfigPaths from "vite-tsconfig-paths"
import tailwindcss from "@tailwindcss/vite"
import { cloudflare } from "@cloudflare/vite-plugin"

/**
 * =====================================
 * Vite設定ファイル
 * =====================================
 *
 * TanStack Startは内部でViteを使用しています。
 * この設定ファイルでプラグインやビルドオプションを設定します。
 *
 * 開発環境 vs 本番環境:
 * - 開発環境: Node.js SSRでbetter-sqlite3を使用
 * - 本番環境: Cloudflare Workers + D1/Tursoを使用
 *
 * USE_CLOUDFLARE=true を設定するとCloudflareモードで起動
 * デフォルトはNode.jsモード（SQLiteファイルが使える）
 */

// Cloudflareモードかどうかを環境変数で判定
const useCloudflare = process.env.USE_CLOUDFLARE === "true"

const config = defineConfig({
  plugins: [
    // TanStack DevTools（デバッグ用）
    devtools(),

    // Cloudflare Viteプラグイン（Cloudflare Workersにデプロイする場合のみ有効）
    // Node.jsネイティブモジュール（better-sqlite3）を使う場合は無効にする必要がある
    ...(useCloudflare ? [cloudflare({ viteEnvironment: { name: "ssr" } })] : []),

    // パスエイリアス（@/で始まるimportを有効に）
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),

    // Tailwind CSS v4
    tailwindcss(),

    // TanStack Startプラグイン
    // - ファイルベースルーティングの自動生成
    // - Server Functionsのコンパイル
    // - SSRの設定
    tanstackStart(),

    // React Viteプラグイン
    // - Fast Refresh（HMR）
    // - JSX transform
    viteReact(),
  ],
})

export default config
