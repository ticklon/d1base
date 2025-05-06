# 📦 Supabase風 D1ラッパー設計ドキュメント（Cloudflare Pages / Remix 向け）

## 🎯 目的（What & Why）
Cloudflare D1を使いつつ、Supabase Clientのように「**直感的・チェーン可能・型安全なデータ操作**」を実現。
SQL直書きではなく、**`.from("table")` から `.select()`, `.insert()` などを繋げるクエリビルダ体験**を提供する。

---

## 🏗️ 基本設計（API設計）

### `getDbClient(env: Env): DbClient`
> D1クライアント（`env.DB`）をラップして、指定テーブル操作ができるクライアントを返す。

---

## 🧪 使用例（開発者体験）

```ts
const db = getDbClient(env);

// SELECT
const { data, error } = await db
  .from("entries")
  .select("*")
  .where("user_id", "=", userId)
  .order("created_at", "desc")
  .limit(10);

// INSERT
await db
  .from("entries")
  .insert({ title: "新しい記事", body: "本文です", user_id: "123" });

// UPDATE
await db
  .from("entries")
  .update({ title: "更新済み" })
  .where("id", "=", "entry_456");

// DELETE
await db
  .from("entries")
  .delete()
  .where("user_id", "=", userId);
```

---

## 🔧 ラッパー構成（クラス & 型）

### `DbClient`  
- `from(table: string): QueryBuilder`

### `QueryBuilder`（テーブルごとに操作できるチェーンビルダ）

| メソッド名 | 戻り値 | 説明 |
|------------|--------|------|
| `.select(columns?: string | string[])` | `QueryBuilder` | SELECT句を指定 |
| `.insert(data: object)` | `QueryBuilder` | INSERT文を生成 |
| `.update(data: object)` | `QueryBuilder` | UPDATE文を生成 |
| `.delete()` | `QueryBuilder` | DELETE文を生成 |
| `.where(column, operator, value)` | `QueryBuilder` | WHERE句を追加 |
| `.order(column, direction?)` | `QueryBuilder` | ORDER BY句を追加 |
| `.limit(n: number)` | `QueryBuilder` | LIMIT句を追加 |
| `.execute()` | `Promise<{ data: T[], error: Error | null }>` | 実行して結果取得 |
| `.single()` / `.maybeSingle()` | `Promise<T>` | 1件だけ返すユーティリティ |

---

## 📌 特記事項
- 内部的には SQL文を文字列で構築し、`.prepare(...).bind(...).all()` でD1に実行
- 型推論や補完の効きを良くするために `T` のジェネリクス設計を導入予定
- SQLインジェクション対策として **すべてバインド形式（?）での実行**

---

## 📂 モジュール構成（予定）

```
/packages/utils/db/
  ├─ client.ts          ← getDbClient, DbClient定義
  ├─ builder.ts         ← QueryBuilderクラスとチェーン実装
  ├─ types.ts           ← D1対応の基本型（Row, Result など）
  └─ sql.ts             ← SQL構築のための内部関数群
```

---

## 🧭 今後のディスカッション項目（次チャット用）
- トランザクション対応（`db.transaction(fn)`）
- スキーマ型生成（`zod` or 型手書き）
- 特定用途に便利な `.upsert()` `.count()` などの拡張
- 単体テスト or e2eテストの仕組み（D1 Emulator使用可）
