import type { QueryResult } from './types';
import type { D1Database } from '@cloudflare/workers-types';
/**
 * クエリビルダークラス
 * チェーン可能なAPIでSQL文を構築する
 */
export declare class QueryBuilder<T extends Record<string, any> = Record<string, any>> {
    /** D1データベースインスタンス */
    private db;
    /** クエリの内部状態 */
    private state;
    /**
     * QueryBuilderを初期化
     * @param db D1Database インスタンス
     * @param table 対象テーブル名
     */
    constructor(db: D1Database, table: string);
    /**
     * 取得カラムを指定
     * @param columns 取得するカラム（文字列配列またはリレーション含むオブジェクト）
     */
    select(columns?: string | string[] | Record<string, any>): QueryBuilder<T>;
    /**
     * INSERT用のデータを設定
     * @param data 挿入するデータオブジェクト
     */
    insert(data: Partial<T>): QueryBuilder<T>;
    /**
     * UPDATE用のデータを設定
     * @param data 更新するデータオブジェクト
     */
    update(data: Partial<T>): QueryBuilder<T>;
    /**
     * DELETE操作を設定
     */
    delete(): QueryBuilder<T>;
    /**
     * WHERE条件を追加
     * @param column カラム名
     * @param operator 演算子（'=', '!=', '>', '<', 'LIKE'など）
     * @param value 比較する値
     */
    where(column: string, operator: string, value: any): QueryBuilder<T>;
    /**
     * ORDER BY句を追加
     * @param column カラム名
     * @param direction ソート順（'asc' または 'desc'）
     */
    order(column: string, direction?: 'asc' | 'desc'): QueryBuilder<T>;
    /**
     * LIMIT句を設定
     * @param limit 最大取得件数
     */
    limit(limit: number): QueryBuilder<T>;
    /**
     * クエリを実行して結果を取得
     */
    execute(): Promise<QueryResult<T>>;
    /**
     * リレーションデータを持つクエリ結果を整形する
     * @param results D1からの生の結果
     * @returns 整形されたデータ
     */
    private formatRelationalResults;
    /**
     * 単一行結果を取得（結果がない場合はエラー）
     */
    single(): Promise<T>;
    /**
     * 単一行結果を取得（結果がない場合はnull）
     */
    maybeSingle(): Promise<T | null>;
}
