// d1baseのテスト用スクリプト (CommonJS形式)
// ESMのインポートの代わりに、モジュールを直接定義してテスト実行

// Cloudflare D1の型定義
class D1Result {
  constructor(results, success) {
    this.results = results;
    this.success = success;
    this.meta = {};
  }
}

// QueryBuilder、SQL、Clientの簡易実装（テスト用）
class QueryBuilder {
  constructor(db, table) {
    this.db = db;
    this.table = table;
    this.columns = '*';
    this.whereConditions = [];
    this.orderByColumn = null;
    this.orderByDirection = null;
    this.limitCount = null;
    this.insertData = null;
    this.updateData = null;
    this.isDelete = false;
    this.joins = [];
  }

  select(columns) {
    this.columns = columns || '*';
    return this;
  }

  where(column, operator, value) {
    this.whereConditions.push({ column, operator, value });
    return this;
  }

  order(column, direction) {
    this.orderByColumn = column;
    this.orderByDirection = direction || 'asc';
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  insert(data) {
    this.insertData = data;
    return this;
  }

  update(data) {
    this.updateData = data;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  // SQLを構築するヘルパーメソッド
  buildSql() {
    let sql = '';
    let bindings = [];

    if (this.isDelete) {
      sql = `DELETE FROM ${this.table}`;
    } else if (this.updateData) {
      const setClauses = Object.keys(this.updateData)
        .map(key => `${key} = ?`)
        .join(', ');
      
      bindings = Object.values(this.updateData);
      sql = `UPDATE ${this.table} SET ${setClauses}`;
    } else if (this.insertData) {
      const columns = Object.keys(this.insertData).join(', ');
      const placeholders = Object.keys(this.insertData)
        .map(() => '?')
        .join(', ');
      
      bindings = Object.values(this.insertData);
      sql = `INSERT INTO ${this.table} (${columns}) VALUES (${placeholders})`;
    } else {
      // SELECT処理
      const selectColumns = Array.isArray(this.columns) 
        ? this.columns.filter(col => typeof col === 'string').join(', ') 
        : this.columns;
      
      sql = `SELECT ${selectColumns} FROM ${this.table}`;
      
      // JOIN処理（リレーション対応）
      if (Array.isArray(this.columns)) {
        this.columns.forEach(col => {
          if (typeof col === 'object') {
            const relationTable = Object.keys(col)[0];
            sql += ` LEFT JOIN ${relationTable} ON ${this.table}.${relationTable}_id = ${relationTable}.id`;
          }
        });
      }
    }

    // WHERE句の追加
    if (this.whereConditions.length > 0) {
      const whereClauses = this.whereConditions
        .map(({ column, operator }) => `${column} ${operator} ?`)
        .join(' AND ');
      
      sql += ` WHERE ${whereClauses}`;
      
      // WHERE句のバインド値を追加
      this.whereConditions.forEach(({ value }) => {
        bindings.push(value);
      });
    }

    // ORDER BY句の追加
    if (this.orderByColumn) {
      sql += ` ORDER BY ${this.orderByColumn} ${this.orderByDirection}`;
    }

    // LIMIT句の追加
    if (this.limitCount) {
      sql += ` LIMIT ${this.limitCount}`;
    }

    return { sql, bindings };
  }

  // クエリを実行するメソッド
  async execute() {
    try {
      const { sql, bindings } = this.buildSql();
      console.log(`実行するSQL: ${sql}`);
      console.log(`バインド値: ${JSON.stringify(bindings)}`);
      
      const statement = this.db.prepare(sql);
      let result;
      
      if (this.isDelete || this.updateData || this.insertData) {
        // DML操作
        result = await statement.bind(...bindings).run();
        return {
          data: { success: result.success },
          error: null,
        };
      } else {
        // SELECT操作
        result = await statement.bind(...bindings).all();
        return {
          data: result.results,
          error: null,
        };
      }
    } catch (error) {
      console.error('SQLエラー:', error);
      return {
        data: null,
        error: {
          message: error.message,
        },
      };
    }
  }

  // 単一結果を返すメソッド
  async single() {
    const { data, error } = await this.execute();
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (!data || data.length === 0) {
      throw new Error('レコードが見つかりません');
    }
    
    return data[0];
  }

  // 単一結果（存在しなければnull）を返すメソッド
  async maybeSingle() {
    const { data, error } = await this.execute();
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    return data[0];
  }
}

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

// DbClient関数（getDbClient）
function getDbClient(env) {
  return {
    from: (table) => {
      return new QueryBuilder(env.DB, table);
    }
  };
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
