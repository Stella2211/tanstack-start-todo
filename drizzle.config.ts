import { defineConfig } from "drizzle-kit"

/**
 * Drizzle Kit設定ファイル
 *
 * drizzle-kitはDrizzle ORMのためのCLIツールで、
 * マイグレーションの生成やデータベースのプッシュなどを行います。
 *
 * 主なコマンド:
 * - `bun drizzle-kit generate` : スキーマからマイグレーションファイルを生成
 * - `bun drizzle-kit push`     : スキーマをDBに直接プッシュ（開発用）
 * - `bun drizzle-kit studio`   : Drizzle Studioを起動（DBをGUIで閲覧）
 */
export default defineConfig({
  // スキーマファイルの場所
  schema: "./src/db/schema.ts",

  // マイグレーションファイルの出力先
  out: "./drizzle",

  // データベースの種類（SQLiteを使用）
  dialect: "sqlite",

  // データベース接続設定
  dbCredentials: {
    // ローカルファイルベースのSQLiteを使用
    // 本番環境ではTursoなどのリモートDBを使うことが多い
    url: "./sqlite.db",
  },
})
