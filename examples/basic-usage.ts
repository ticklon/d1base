import { getDbClient } from 'd1base';

// Cloudflare Worker/Pagesでの利用例
export default {
  async fetch(request: Request, env: any, ctx: any) {
    // データベースクライアントの初期化
    const db = getDbClient(env);
    
    // ユーザー一覧を取得する例
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
    
    // ユーザーを1件だけ取得する例
    try {
      const user = await db
        .from('users')
        .select('id, name, email')
        .where('id', '=', '123')
        .single();
      
      console.log('単一ユーザー:', user);
    } catch (err) {
      console.error('単一ユーザー取得エラー:', err);
    }
    
    // ユーザーが存在しない場合はnullを返す例
    const maybeUser = await db
      .from('users')
      .select('*')
      .where('id', '=', 'non-existent')
      .maybeSingle();
    
    console.log('存在しないかもしれないユーザー:', maybeUser); // null
    
    // 新規ユーザーを追加する例
    await db
      .from('users')
      .insert({
        name: '新規ユーザー',
        email: 'new@example.com',
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .execute();
    
    // ユーザー情報を更新する例
    await db
      .from('users')
      .update({
        name: '更新済みユーザー',
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', '123')
      .execute();
    
    // ユーザーを削除する例
    await db
      .from('users')
      .delete()
      .where('id', '=', '456')
      .execute();
    
    // JSON形式でユーザー一覧を返す
    return new Response(JSON.stringify({ users }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
};
