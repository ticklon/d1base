import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryBuilder } from '../builder';
import type { QueryResult } from '../types';
import type { D1Database } from '@cloudflare/workers-types';

// モック
class MockD1Statement {
    private sql: string;
    private bindings: any[] = [];

    constructor(sql: string) {
        this.sql = sql;
    }

    bind(...values: any[]): MockD1Statement {
        this.bindings = values;
        return this;
    }

    async all(): Promise<{ results: any[] }> {
        return { results: [] };
    }
}

class MockD1Database {
    prepare(sql: string): MockD1Statement {
        return new MockD1Statement(sql);
    }
}

describe('Relation Configuration', () => {
    let db: MockD1Database;
    let builder: QueryBuilder;

    beforeEach(() => {
        db = new MockD1Database();
        builder = new QueryBuilder(db as unknown as D1Database, 'posts');
    });

    it('should use defined relation configuration', async () => {
        // リレーションを定義 (posts -> author)
        // posts.author_id = users.id
        builder.defineRelation('author', {
            table: 'users',
            foreignKey: 'author_id', // posts.author_id
            primaryKey: 'id',        // users.id
        });

        // executeメソッドをモック化
        const mockResult: QueryResult<any> = {
            data: [],
            error: null
        };

        // SQL生成ロジックを検証するためにスパイ
        // しかし、execute内でSqlBuilderが呼ばれるため、生成されたSQLを直接検証するのは難しい
        // 代わりに、builder.execute()を呼んで、内部でdb.prepareが呼ばれたときのSQLを検証する

        const prepareSpy = vi.spyOn(db, 'prepare');
        vi.spyOn(builder, 'execute').mockResolvedValueOnce(mockResult);

        // 実際にはexecuteを呼ばずに、SqlBuilderを直接テストする方が確実だが、
        // ここでは統合テスト的に振る舞いを確認したい
        // しかし、executeをモックするとprepareが呼ばれないので、
        // executeのモックを解除して、db.prepareの呼び出しを検証する

        vi.restoreAllMocks();
        const prepareSpy2 = vi.spyOn(db, 'prepare');

        await builder
            .select(['id', 'title', { author: ['name'] }])
            .execute();

        expect(prepareSpy2).toHaveBeenCalled();
        const sql = prepareSpy2.mock.calls[0][0];

        // 期待されるSQL:
        // LEFT JOIN "users" AS "author_rel" ON "posts"."author_id" = "author_rel"."id"

        expect(sql).toContain('LEFT JOIN "users" AS "author_rel"');
        expect(sql).toContain('ON "posts"."author_id" = "author_rel"."id"');
    });

    it('should fallback to default behavior if no relation defined', async () => {
        const prepareSpy = vi.spyOn(db, 'prepare');

        await builder
            .select(['id', 'title', { comments: ['content'] }])
            .execute();

        const sql = prepareSpy.mock.calls[0][0];

        // デフォルトの挙動:
        // LEFT JOIN "comments" AS "comments_rel" ON "posts"."id" = "comments_rel"."posts_id"
        // (posts -> comments, HasMany)

        expect(sql).toContain('LEFT JOIN "comments" AS "comments_rel"');
        expect(sql).toContain('ON "posts"."id" = "comments_rel"."post_id"');
    });
});
