import { QueryBuilder } from './builder';

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
 * クエリの内部状態を保持する型
 */
export interface QueryState {
  /** ターゲットテーブル名 */
  table: string;
  /** SELECT時の取得カラム */
  select?: string[] | Record<string, any>;
  /** INSERT時のデータ */
  insert?: Record<string, any>;
  /** UPDATE時のデータ */
  update?: Record<string, any>;
  /** WHERE条件の配列 */
  where: WhereCondition[];
  /** 並び順（ORDER BY）設定 */
  order?: OrderCondition[];
  /** 取得上限（LIMIT）設定 */
  limit?: number;
  /** JOINの設定 */
  joins?: JoinCondition[];
}

/**
 * WHEREの条件型
 */
export interface WhereCondition {
  column: string;
  operator: string;
  value: any;
}

/**
 * ORDER BY条件型
 */
export interface OrderCondition {
  column: string;
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
