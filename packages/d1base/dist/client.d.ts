import type { DbClient } from './types';
import type { D1Database } from '@cloudflare/workers-types';
/**
 * D1データベースクライアントを初期化し、QueryBuilderを生成するための関数
 * @param env Cloudflare Workers/Pages環境変数（env.DBにD1インスタンスが含まれる）
 * @returns DbClientインスタンス
 */
export declare function getDbClient(env: {
    DB: D1Database;
}): DbClient;
