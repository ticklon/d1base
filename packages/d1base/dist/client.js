import { QueryBuilder } from './builder';
/**
 * D1データベースクライアントを初期化し、QueryBuilderを生成するための関数
 * @param env Cloudflare Workers/Pages環境変数（env.DBにD1インスタンスが含まれる）
 * @returns DbClientインスタンス
 */
export function getDbClient(env) {
    return {
        /**
         * 指定したテーブルに対するクエリを開始する
         * @param table テーブル名
         * @returns QueryBuilderインスタンス
         */
        from: (table) => {
            return new QueryBuilder(env.DB, table);
        }
    };
}
