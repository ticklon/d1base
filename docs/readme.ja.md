# d1base

Cloudflare D1をバックエンドに用いた、Supabase風の型安全データクライアント

## 概要

d1baseは、Cloudflare D1データベースを簡単に操作するための型安全なクエリビルダーです。Supabaseクライアントライブラリに触発された使いやすいインターフェースを提供し、以下の特徴があります：

- チェーン可能なAPI（`.from().select().where()...`）
- TypeScriptによる型安全性
- SQLインジェクション対策のバインド実行
- リレーションデータの自動JOIN取得（N+1問題回避）
- 直感的なエラーハンドリング

## インストール

```bash
npm install d1base
```

## 基本的な使い方

```typescript
import { getDbClient } from 'd1base';

// Cloudflare Workers/Pagesでの利用
export default {
  async fetch(request: Request, env: any) {
    // データベースクライアントの初期化
    const db = getDbClient(env);
    
    // ユーザー一覧を取得
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
    
    // JSON形式でユーザー一覧を返す
    return new Response(JSON.stringify({ users }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
};
```

## 主要機能

### SELECT操作

```typescript
// 基本的なSELECT
const { data } = await db
  .from('posts')
  .select('id, title, content')
  .execute();

// 条件と並び順、制限付きSELECT
const { data } = await db
  .from('posts')
  .select('*')
  .where('user_id', '=', userId)
  .order('created_at', 'desc')
  .limit(10)
  .execute();

// 単一レコード取得（結果がない場合はエラー）
const post = await db
  .from('posts')
  .select('*')
  .where('id', '=', postId)
  .single();

// 単一レコード取得（結果がない場合はnull）
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
    content: '本文です',
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
    title: '更新済みタイトル',
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

### リレーションデータの取得

```typescript
// ユーザーとその投稿を一度に取得
const { data: users } = await db
  .from('users')
  .select(['id', 'name', { posts: ['id', 'title', 'content'] }])
  .where('status', '=', 'active')
  .execute();

// 投稿とその投稿者、コメントを一度に取得（多階層リレーション）
const { data: posts } = await db
  .from('posts')
  .select([
    'id', 
    'title', 
    { 
      user: ['id', 'name'],
      comments: ['id', 'content', { user: ['id', 'name'] }]
    }
  ])
  .execute();
```

## 型安全性

TypeScriptを利用する場合、テーブルごとに型定義を作成することで、完全な型安全性を得られます。

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

// 型情報を含めた使用例
const { data } = await db
  .from<User>('users')  // Userテーブルとして認識
  .select('*')
  .where('status', '=', 'active')
  .execute();

// dataは User[] 型になる
data.forEach(user => {
  console.log(user.name);  // 型補完が効く
});
```

## ライセンス

MIT

## コントリビューション

バグ報告や機能リクエストは、GitHubのIssueで受け付けています。
