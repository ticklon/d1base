import type { QueryState } from './types';
/**
 * SQLクエリを生成し、バインドパラメータを準備するユーティリティクラス
 */
export declare class SqlBuilder {
    /**
     * SELECT文を構築する
     * @param state クエリ状態オブジェクト
     * @returns [SQL文字列, バインドパラメータ配列]
     */
    static buildSelect(state: QueryState): [string, any[]];
    /**
     * INSERT文を構築する
     * @param state クエリ状態オブジェクト
     * @returns [SQL文字列, バインドパラメータ配列]
     */
    static buildInsert(state: QueryState): [string, any[]];
    /**
     * UPDATE文を構築する
     * @param state クエリ状態オブジェクト
     * @returns [SQL文字列, バインドパラメータ配列]
     */
    static buildUpdate(state: QueryState): [string, any[]];
    /**
     * DELETE文を構築する
     * @param state クエリ状態オブジェクト
     * @returns [SQL文字列, バインドパラメータ配列]
     */
    static buildDelete(state: QueryState): [string, any[]];
    /**
     * WHERE句を構築する
     * @param conditions WHERE条件の配列
     * @param bindings バインドパラメータ配列（参照渡し）
     * @returns 構築されたWHERE句
     */
    private static buildWhereClause;
}
