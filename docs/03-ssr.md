# SSR（Server-Side Rendering）解説

TanStack Startは複数のSSRモードをサポートしています。

## SSRモードの種類

### 1. full-ssr（デフォルト）

コンポーネントの完全なHTMLをサーバーで生成します。

```typescript
export const Route = createFileRoute('/page')({
  ssr: 'full-ssr', // デフォルトなので省略可能
  loader: () => getData(),
  component: Page,
})
```

**特徴:**
- SEO最適化
- 初回表示が高速
- サーバー負荷が高い

### 2. data-only

データだけをサーバーで取得し、HTMLはクライアントで生成します。

```typescript
export const Route = createFileRoute('/page')({
  ssr: 'data-only',
  loader: () => getData(),
  component: Page,
})
```

**特徴:**
- サーバー負荷が軽い
- 初回表示はスケルトン → データ表示
- インタラクティブなUIに適している

### 3. spa-mode

完全なSPAモード。サーバーは何も実行しません。

```typescript
export const Route = createFileRoute('/page')({
  ssr: 'spa-mode',
  loader: () => getData(),
  component: Page,
})
```

**特徴:**
- 従来のSPAと同じ動作
- サーバー負荷最小
- SEOには不向き

## 図解：各モードの動作

```
full-ssr:
┌─────────────────────────────────────────────────────────────┐
│ Browser: /page にアクセス                                    │
│     │                                                       │
│     ▼                                                       │
│ Server:                                                     │
│   1. loader実行 (データ取得)                                 │
│   2. コンポーネントをHTMLにレンダリング                       │
│   3. HTML + データを返却                                     │
│     │                                                       │
│     ▼                                                       │
│ Browser:                                                    │
│   1. HTMLを表示（すぐ見える）                                │
│   2. JavaScriptをロード                                     │
│   3. Hydrate（インタラクティブに）                           │
└─────────────────────────────────────────────────────────────┘

data-only:
┌─────────────────────────────────────────────────────────────┐
│ Browser: /page にアクセス                                    │
│     │                                                       │
│     ▼                                                       │
│ Server:                                                     │
│   1. loader実行 (データ取得)                                 │
│   2. 空のシェル + データJSONを返却                           │
│     │                                                       │
│     ▼                                                       │
│ Browser:                                                    │
│   1. シェルを表示                                            │
│   2. JavaScriptをロード                                     │
│   3. データを使ってレンダリング                              │
└─────────────────────────────────────────────────────────────┘

spa-mode:
┌─────────────────────────────────────────────────────────────┐
│ Browser: /page にアクセス                                    │
│     │                                                       │
│     ▼                                                       │
│ Server:                                                     │
│   1. 空のHTMLシェルを返却                                    │
│     │                                                       │
│     ▼                                                       │
│ Browser:                                                    │
│   1. JavaScriptをロード                                     │
│   2. loader実行（クライアントで）                            │
│   3. レンダリング                                            │
└─────────────────────────────────────────────────────────────┘
```

## Todoアプリでの使用

このTodoアプリではデフォルトの`full-ssr`を使用しています：

```typescript
// src/routes/todos.tsx
export const Route = createFileRoute('/todos')({
  // SSRモードは指定していない（デフォルト: full-ssr）
  loader: async () => {
    const todos = await getTodos()
    return { todos }
  },
  component: TodoPage,
})
```

**理由:**
- Todoリストは初回表示時にすぐ見えてほしい
- データ量が少ないのでサーバー負荷は問題なし

## クライアントナビゲーション時の動作

SSRはあくまで**初回アクセス時**の動作です。
SPAとしてナビゲーションする場合は、すべてのモードで同じ動作になります：

```
[Home] → [Todos] へのナビゲーション（SPAの動き）

1. Link/navigate()でナビゲーション
2. loader実行（Server Functionが呼ばれる）
3. データを受け取ってレンダリング
```

## head()メソッドでのメタタグ

SSRで重要なのがメタタグの設定です：

```typescript
// src/routes/__root.tsx
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  // ...
})
```

ページごとにも設定可能：

```typescript
export const Route = createFileRoute('/todos')({
  head: () => ({
    meta: [
      { title: 'Todo List - My App' },
      { name: 'description', content: 'Manage your todos' },
    ],
  }),
  // ...
})
```
