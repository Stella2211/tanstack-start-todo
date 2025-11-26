import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

/**
 * Todoテーブルのスキーマ定義
 *
 * Drizzle ORMでは、TypeScriptでスキーマを定義します。
 * これにより、データベースの構造とTypeScriptの型が自動的に同期されます。
 *
 * sqliteTable: SQLiteのテーブルを定義する関数
 * - 第1引数: テーブル名
 * - 第2引数: カラム定義のオブジェクト
 */
export const todos = sqliteTable("todos", {
  /**
   * ID: 主キー
   * integer + primaryKey で自動インクリメントされる
   * SQLiteでは INTEGER PRIMARY KEY は自動的にROWIDのエイリアスになる
   */
  id: integer("id").primaryKey({ autoIncrement: true }),

  /**
   * タイトル: Todoの内容
   * notNull() で必須フィールドに
   */
  title: text("title").notNull(),

  /**
   * 完了状態
   * SQLiteにはboolean型がないため、integer(0 or 1)で表現
   * default(0) で初期値は未完了
   */
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),

  /**
   * 作成日時
   * SQLiteにはdate型がないため、textで保存
   * ISO8601形式の文字列として保存する
   */
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),

  /**
   * 更新日時
   * $onUpdate で更新時に自動的に現在時刻がセットされる
   */
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
})

/**
 * 型のエクスポート
 *
 * DrizzleはスキーマからTypeScriptの型を自動生成できます。
 * $inferSelect: SELECT結果の型（読み取り用）
 * $inferInsert: INSERT時の型（書き込み用、オプショナルなフィールドを含む）
 */
export type Todo = typeof todos.$inferSelect
export type NewTodo = typeof todos.$inferInsert
