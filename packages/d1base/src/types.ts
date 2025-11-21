import { QueryBuilder } from './builder.js';

/**
 * データベースクライアントインターフェース
 */
export interface DbClient {
  /**
   * 指定したテーブルに対するクエリを開始
   * @param table テーブル名
   */
  from: <T extends Record<string, any> = Record<string, any>>(
    table: string
  ) => QueryBuilder<T>;
}

/**
 * リレーション設定
 */
export interface RelationConfig {
  foreignKey: string;
  primaryKey: string;
  table?: string; // 関連テーブル名（省略時はリレーション名と同じ）
}

/**
 * クエリの内部状態を保持する型
 */
export interface QueryState<T = any> {
  /** ターゲットテーブル名 */
  table: string;
  /** SELECT時の取得カラム */
  select?: (keyof T | string)[] | Record<string, any>;
  /** INSERT時のデータ */
  insert?: Record<string, any>;
  /** UPDATE時のデータ */
  update?: Record<string, any>;
  /** DELETE操作フラグ */
  delete?: boolean;
  /** WHERE条件の配列 */
  where: WhereCondition<T>[];
  /** 並び順（ORDER BY）設定 */
  order?: OrderCondition<T>[];
  /** 取得上限（LIMIT）設定 */
  limit?: number;
  /** JOINの設定 */
  joins?: JoinCondition[];
  /** リレーション設定 */
  relations?: Record<string, RelationConfig>;
}

/**
 * WHEREの条件型
 */
/**
 * WHEREの条件型
 */
export interface WhereCondition<T = any> {
  column: keyof T | string;
  operator: string;
  value: any;
}

/**
 * ORDER BY条件型
 */
export interface OrderCondition<T = any> {
  column: keyof T | string;
  direction: 'asc' | 'desc';
}

/**
 * JOIN条件型
 */
export interface JoinCondition {
  table: string;
  alias: string;
  type: 'LEFT' | 'INNER' | 'RIGHT';
  on: {
    column: string;
    operator: string;
    value: string;
  };
}

/**
 * クエリ実行結果の型
 */
export interface QueryResult<T> {
  data: T[];
  error: Error | null;
}

/**
 * テーブルのリレーション設定を定義する型
 * 今後の拡張で使用予定
 */
export interface TableRelations {
  [tableName: string]: {
    [relationName: string]: {
      table: string;
      foreignKey: string;
      primaryKey: string;
    };
  };
}
