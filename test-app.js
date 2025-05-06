// d1baseのテスト用スクリプト
import { getDbClient } from './packages/d1base/src/index.js';

// D1データベースのモック
class MockD1Statement {
  constructor(sql) {
    this.sql = sql;
    this.bindings = [];
    console.log(`SQL準備: ${sql}`);
  }

  bind(...values) {
    this.bindings = values;
    console.log(`バインド値: ${JSON.stringify(values)}`);
    return this;
  }

  async all() {
    console.log(`クエリ実行 (all): ${this.sql} with ${JSON.stringify(this.bindings)}`);
    // テスト用のダミーデータを返す
    return {
      results: [
        { id: 1, name: 'ユーザー1', email: 'user1@example.com' },
        { id: 2, name: 'ユーザー2', email: 'user2@example.com' },
      ],
    };
  }

  async run() {
    console.log(`クエリ実行 (run): ${this.sql} with ${JSON.stringify(this.bindings)}`);
    return { success: true };
  }
}

class MockD1Database {
  prepare(sql) {
    return new MockD1Statement(sql);
  }
}

// モックD1データベースを使ってテスト
async function runTests() {
  console.log('===== d1baseモジュールテスト開始 =====');
  
  // モックD1データベースでクライアントを初期化
  const env = { DB: new MockD1Database() };
  const db = getDbClient(env);
  
  try {
    // テスト1: SELECTクエリ
    console.log('\n----- テスト1: SELECT -----');
    const selectResult = await db
      .from('users')
      .select('id, name, email')
      .where('status', '=', 'active')
      .limit(10)
      .execute();
    
    console.log('SELECT結果:', selectResult);
    
    // テスト2: INSERT
    console.log('\n----- テスト2: INSERT -----');
    const insertResult = await db
      .from('users')
      .insert({
        name: '新規ユーザー',
        email: 'new@example.com',
        status: 'active',
      })
      .execute();
    
    console.log('INSERT結果:', insertResult);
    
    // テスト3: UPDATE
    console.log('\n----- テスト3: UPDATE -----');
    const updateResult = await db
      .from('users')
      .update({ name: '更新済みユーザー' })
      .where('id', '=', 1)
      .execute();
    
    console.log('UPDATE結果:', updateResult);
    
    // テスト4: DELETE
    console.log('\n----- テスト4: DELETE -----');
    const deleteResult = await db
      .from('users')
      .delete()
      .where('id', '=', 1)
      .execute();
    
    console.log('DELETE結果:', deleteResult);
    
    // テスト5: リレーション (JOIN)
    console.log('\n----- テスト5: リレーション (JOIN) -----');
    const joinResult = await db
      .from('users')
      .select(['id', 'name', { posts: ['id', 'title'] }])
      .where('id', '=', 1)
      .execute();
    
    console.log('JOIN結果:', joinResult);
    
    console.log('\n===== すべてのテスト完了 =====');
  } catch (error) {
    console.error('テストエラー:', error);
  }
}

// テスト実行
runTests();
