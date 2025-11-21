# d1base

Cloudflare D1のためのSupabaseライクな型安全データクライアント

## 概要

d1baseは、Cloudflare D1データベースを簡単に操作するための型安全なクエリビルダーです。Supabaseクライアントライブラリにインスパイアされており、以下の特徴を持つ使いやすいインターフェースを提供します：

- メソッドチェーンAPI (`.from().select().where()...`)
- TypeScriptによる型安全性
- バインド実行によるSQLインジェクション対策
- リレーショナルデータの自動JOIN取得（N+1問題の回避）
- 直感的なエラーハンドリング

## インストール

```bash
npm install d1base
```

## 基本的な使い方

```typescript
import { getDbClient } from 'd1base';

// Cloudflare Workers/Pages での使用例
export default {
  async fetch(request: Request, env: any) {
    // データベースクライアントの初期化
    const db = getDbClient(env);
    
    // ユーザーリストの取得
    const { data: users, error } = await db
      .from('users')
      .select('*')
      .where('status', '=', 'active')
      .order('created_at', 'desc')
      .limit(10)
      .execute();
    
    if (error) {
      return new Response(`エラーが発生しました: ${error.message}`, {
        status: 500,
      });
    }
    
    // JSON形式でユーザーリストを返す
    return new Response(JSON.stringify({ users }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
};
```

## 主な機能

### SELECT操作

```typescript
// 基本的なSELECT
const { data } = await db
  .from('posts')
  .select('id, title, content')
  .execute();

// 条件、並び替え、制限付きSELECT
const { data } = await db
  .from('posts')
  .select('*')
  .where('user_id', '=', userId)
  .order('created_at', 'desc')
  .limit(10)
  .execute();

// 単一レコードの取得 (存在しない場合はエラー)
const post = await db
  .from('posts')
  .select('*')
  .where('id', '=', postId)
  .single();

// 単一レコードの取得 (存在しない場合はnull)
const post = await db
  .from('posts')
  .select('*')
  .where('id', '=', postId)
  .maybeSingle();
```

### INSERT操作

```typescript
// レコードの挿入
await db
  .from('posts')
  .insert({
    title: '新しい投稿',
    content: 'ここにコンテンツ',
    user_id: userId,
    created_at: new Date().toISOString(),
  })
  .execute();
```

### UPDATE操作

```typescript
// レコードの更新
await db
  .from('posts')
  .update({
    title: '更新されたタイトル',
    updated_at: new Date().toISOString(),
  })
  .where('id', '=', postId)
  .execute();
```

### DELETE操作

```typescript
// レコードの削除
await db
  .from('posts')
  .delete()
  .where('id', '=', postId)
  .execute();
```

### リレーションの定義

カスタム結合条件を指定するためにリレーションを定義できます。これは `BelongsTo` リレーションや、非標準的なカラム名を使用する場合に特に便利です。

```typescript
// リレーションの定義
db.from('posts')
  .defineRelation('author', {
    table: 'users',
    foreignKey: 'author_id', // posts.author_id
    primaryKey: 'id',        // users.id
  })
  .select(['id', 'title', { author: ['name'] }])
  .execute();
```

### リレーションデータの取得

```typescript
// ユーザーとその投稿を一度に取得 (HasMany: users.id = posts.user_id と推論されます)
const { data: users } = await db
  .from('users')
  .select(['id', 'name', { posts: ['id', 'title', 'content'] }])
  .where('status', '=', 'active')
  .execute();

// 投稿とその著者を取得 (BelongsTo: 定義が必要です)
const { data: posts } = await db
  .from('posts')
  .defineRelation('author', {
    table: 'users',
    foreignKey: 'author_id',
    primaryKey: 'id'
  })
  .select([
    'id', 
    'title', 
    { 
      author: ['id', 'name']
    }
  ])
  .execute();
```

## 型安全性

TypeScriptを使用する場合、各テーブルの型定義を作成することで、完全な型安全性（カラム名の補完や型チェック）を実現できます。

```typescript
// テーブルの型定義
interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  created_at: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
}

// 型情報を使用した使用例
const { data } = await db
  .from<User>('users')  // Userテーブルとして認識される
  .select('*')
  .where('status', '=', 'active')
  .execute();

// data は User[] 型
data.forEach(user => {
  console.log(user.name);  // 型補完が効く
});
```

## ライセンス

MIT

## コントリビューション

バグ報告や機能リクエストはGitHub Issuesで受け付けています。詳細は [コントリビューションガイドライン](./docs/contributing.md) をご覧ください。
