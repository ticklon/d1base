import { getDbClient } from 'd1base';

// リレーション機能の利用例
export default {
  async fetch(request: Request, env: any, ctx: any) {
    const db = getDbClient(env);
    
    // ユーザーとそのユーザーの投稿を一度に取得する例
    // select()にオブジェクト形式でリレーションを指定
    const { data: users, error } = await db
      .from('users')
      .select(['id', 'name', { posts: ['id', 'title', 'content'] }])
      .where('status', '=', 'active')
      .limit(5)
      .execute();
    
    if (error) {
      return new Response(`エラーが発生しました: ${error.message}`, {
        status: 500,
      });
    }
    
    // 投稿とその投稿者、更にコメントを一度に取得する例（多階層リレーション）
    const { data: posts, error: postsError } = await db
      .from('posts')
      .select([
        'id', 
        'title', 
        'content', 
        { 
          user: ['id', 'name'],
          comments: ['id', 'content', { user: ['id', 'name'] }]
        }
      ])
      .order('created_at', 'desc')
      .limit(10)
      .execute();
    
    if (postsError) {
      return new Response(`エラーが発生しました: ${postsError.message}`, {
        status: 500,
      });
    }
    
    // JSON形式でデータを返す
    return new Response(JSON.stringify({ users, posts }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
};
