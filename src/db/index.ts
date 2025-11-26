import { drizzle } from "drizzle-orm/bun-sqlite"
import { Database } from "bun:sqlite"
import * as schema from "./schema"

/**
 * =====================================
 * データベースクライアントの設定
 * =====================================
 *
 * TanStack Startでは、Server Functionsからデータベースにアクセスします。
 * このファイルはサーバーサイドでのみ実行されるため、
 * 環境変数やファイルシステムに安全にアクセスできます。
 *
 * 使用ライブラリ:
 * - bun:sqlite: BunランタイムのネイティブSQLiteドライバー
 * - drizzle-orm/bun-sqlite: DrizzleのBun SQLiteアダプター
 *
 * 本番環境では:
 * - Cloudflare Workers → D1またはTurso（@libsql/client/web）を使用
 * - Node.jsサーバー → better-sqlite3を使用
 * - Bunランタイム → bun:sqliteを使用（現在の設定）
 */

/**
 * データベースファイルのパス
 */
const dbPath = process.env.DATABASE_PATH ?? "./sqlite.db"

/**
 * Bun SQLiteのインスタンス作成
 */
const sqlite = new Database(dbPath)

/**
 * WALモードの有効化（Write-Ahead Logging）
 */
sqlite.exec("PRAGMA journal_mode = WAL;")

/**
 * Drizzle ORMインスタンスの作成
 */
export const db = drizzle(sqlite, { schema })

/**
 * スキーマの再エクスポート
 */
export * from "./schema"
