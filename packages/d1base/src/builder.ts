import { SqlBuilder } from './sql.js';
import type { 
  QueryState, 
  WhereCondition, 
  OrderCondition, 
  QueryResult 
} from './types.js';
import type { D1Database, D1Result } from '@cloudflare/workers-types';

/**
 * クエリビルダークラス
 * チェーン可能なAPIでSQL文を構築する
 */
export class QueryBuilder<T extends Record<string, any> = Record<string, any>> {
  /** D1データベースインスタンス */
  private db: D1Database;
  
  /** クエリの内部状態 */
  private state: QueryState;
  
  /**
   * QueryBuilderを初期化
   * @param db D1Database インスタンス
   * @param table 対象テーブル名
   */
  constructor(db: D1Database, table: string) {
    this.db = db;
    this.state = {
      table,
      where: [],
    };
  }
  
  /**
   * 取得カラムを指定
   * @param columns 取得するカラム（文字列配列またはリレーション含むオブジェクト）
   */
  select(columns: string | string[] | Record<string, any> = '*'): QueryBuilder<T> {
    if (typeof columns === 'string') {
      if (columns === '*') {
        this.state.select = [];
      } else {
        this.state.select = [columns];
      }
    } else {
      this.state.select = columns;
    }
    return this;
  }
  
  /**
   * INSERT用のデータを設定
   * @param data 挿入するデータオブジェクト
   */
  insert(data: Partial<T>): QueryBuilder<T> {
    this.state.insert = data as Record<string, any>;
    return this;
  }
  
  /**
   * UPDATE用のデータを設定
   * @param data 更新するデータオブジェクト
   */
  update(data: Partial<T>): QueryBuilder<T> {
    this.state.update = data as Record<string, any>;
    return this;
  }
  
  /**
   * DELETE操作を設定
   */
  delete(): QueryBuilder<T> {
    // DELETE操作用のフラグを設定
    this.state.delete = true;
    return this;
  }
  
  /**
   * WHERE条件を追加
   * @param column カラム名
   * @param operator 演算子（'=', '!=', '>', '<', 'LIKE'など）
   * @param value 比較する値
   */
  where(column: string, operator: string, value: any): QueryBuilder<T> {
    this.state.where.push({
      column,
      operator,
      value,
    });
    return this;
  }
  
  /**
   * ORDER BY句を追加
   * @param column カラム名
   * @param direction ソート順（'asc' または 'desc'）
   */
  order(column: string, direction: 'asc' | 'desc' = 'asc'): QueryBuilder<T> {
    if (!this.state.order) {
      this.state.order = [];
    }
    
    this.state.order.push({
      column,
      direction,
    });
    
    return this;
  }
  
  /**
   * LIMIT句を設定
   * @param limit 最大取得件数
   */
  limit(limit: number): QueryBuilder<T> {
    this.state.limit = limit;
    return this;
  }
  
  /**
   * クエリを実行して結果を取得
   */
  async execute(): Promise<QueryResult<T>> {
    try {
      let sql: string;
      let bindings: any[];
      
      // 操作タイプに基づいてSQLを構築
      if (this.state.insert) {
        [sql, bindings] = SqlBuilder.buildInsert(this.state);
      } else if (this.state.update) {
        [sql, bindings] = SqlBuilder.buildUpdate(this.state);
      } else if (this.state.delete) {
        [sql, bindings] = SqlBuilder.buildDelete(this.state);
      } else {
        // デフォルトはSELECT
        [sql, bindings] = SqlBuilder.buildSelect(this.state);
      }
      
      console.log('SQL:', sql);
      console.log('Bindings:', bindings);
      
      // D1クエリの実行
      const stmt = this.db.prepare(sql);
      const result = await stmt.bind(...bindings).all();
      
      // SELECT文でリレーションがある場合は結果を整形
      if (!this.state.insert && !this.state.update && !this.state.delete && 
          this.state.select && typeof this.state.select === 'object' && !Array.isArray(this.state.select)) {
        // リレーションデータを整形
        const formattedResults = this.formatRelationalResults(result.results);
        return {
          data: formattedResults as T[],
          error: null,
        };
      } else if (!this.state.insert && !this.state.update && !this.state.delete && 
                Array.isArray(this.state.select)) {
        // 配列形式のSELECTでリレーションチェック
        const hasRelations = this.state.select.some(item => typeof item === 'object');
        if (hasRelations) {
          const formattedResults = this.formatRelationalResults(result.results);
          return {
            data: formattedResults as T[],
            error: null,
          };
        }
      }
      
      return {
        data: result.results as T[],
        error: null,
      };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
  
  /**
   * リレーションデータを持つクエリ結果を整形する
   * @param results D1からの生の結果
   * @returns 整形されたデータ
   */
  private formatRelationalResults(results: any[]): any[] {
    if (!results || results.length === 0) {
      return [];
    }
    
    // リレーションの情報を収集
    const relations: Record<string, string[]> = {};
    
    // 結果の最初の行からリレーションを特定
    const firstRow = results[0];
    const mainKeys: string[] = [];
    
    Object.keys(firstRow).forEach(key => {
      if (key.includes('_')) {
        // '_'を含むキーはリレーションのカラム（例: posts_id）
        const [relationName, columnName] = key.split('_');
        
        if (!relations[relationName]) {
          relations[relationName] = [];
        }
        
        if (!relations[relationName].includes(columnName)) {
          relations[relationName].push(columnName);
        }
      } else {
        // メインテーブルのカラム
        mainKeys.push(key);
      }
    });
    
    // 結果を整形
    return results.map(row => {
      const mainItem: Record<string, any> = {};
      
      // メインテーブルのデータを設定
      mainKeys.forEach(key => {
        mainItem[key] = row[key];
      });
      
      // リレーションデータを設定
      Object.entries(relations).forEach(([relationName, columns]) => {
        const relationItems: Record<string, any> = {};
        
        columns.forEach(column => {
          const fullKey = `${relationName}_${column}`;
          relationItems[column] = row[fullKey];
        });
        
        // nullでないリレーションデータのみを追加（LEFT JOINで結合されていないデータは除外）
        const hasNonNullValues = Object.values(relationItems).some(value => value !== null);
        if (hasNonNullValues) {
          mainItem[relationName] = relationItems;
        }
      });
      
      return mainItem;
    });
  }
  
  /**
   * 単一行結果を取得（結果がない場合はエラー）
   */
  async single(): Promise<T> {
    const result = await this.execute();
    
    if (result.error) {
      throw result.error;
    }
    
    if (result.data.length === 0) {
      throw new Error('結果がありません');
    }
    
    return result.data[0];
  }
  
  /**
   * 単一行結果を取得（結果がない場合はnull）
   */
  async maybeSingle(): Promise<T | null> {
    const result = await this.execute();
    
    if (result.error) {
      throw result.error;
    }
    
    if (result.data.length === 0) {
      return null;
    }
    
    return result.data[0];
  }
}
