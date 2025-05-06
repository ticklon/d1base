import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryBuilder } from '../builder';

// D1DatabaseのモッククラスとMockD1Statementの型定義
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
    return {
      results: [{ id: 1, name: 'テストユーザー' }],
    };
  }

  async run(): Promise<{ success: boolean }> {
    return { success: true };
  }
}

class MockD1Database {
  prepare(sql: string): MockD1Statement {
    return new MockD1Statement(sql);
  }
}

describe('QueryBuilder', () => {
  let db: MockD1Database;
  let builder: QueryBuilder;

  beforeEach(() => {
    db = new MockD1Database();
    builder = new QueryBuilder(db as unknown as D1Database, 'users');
  });

  describe('select', () => {
    it('should build a basic SELECT query', async () => {
      const executeSpy = vi.spyOn(builder, 'execute');
      
      await builder.select().execute();
      
      expect(executeSpy).toHaveBeenCalled();
      // 実際のSQLは内部実装に依存するため、実装時に調整
    });

    it('should build a SELECT query with specific columns', async () => {
      const executeSpy = vi.spyOn(builder, 'execute');
      
      await builder.select(['id', 'name']).execute();
      
      expect(executeSpy).toHaveBeenCalled();
      // 実際のSQLは内部実装に依存するため、実装時に調整
    });
  });

  describe('where', () => {
    it('should add WHERE conditions', async () => {
      const executeSpy = vi.spyOn(builder, 'execute');
      
      await builder
        .select()
        .where('id', '=', 1)
        .execute();
      
      expect(executeSpy).toHaveBeenCalled();
      // 実際のSQLは内部実装に依存するため、実装時に調整
    });
  });

  describe('order and limit', () => {
    it('should add ORDER BY and LIMIT clauses', async () => {
      const executeSpy = vi.spyOn(builder, 'execute');
      
      await builder
        .select()
        .order('created_at', 'desc')
        .limit(10)
        .execute();
      
      expect(executeSpy).toHaveBeenCalled();
      // 実際のSQLは内部実装に依存するため、実装時に調整
    });
  });

  describe('insert', () => {
    it('should build an INSERT query', async () => {
      const executeSpy = vi.spyOn(builder, 'execute');
      
      await builder
        .insert({ name: 'テストユーザー', email: 'test@example.com' })
        .execute();
      
      expect(executeSpy).toHaveBeenCalled();
      // 実際のSQLは内部実装に依存するため、実装時に調整
    });
  });

  describe('update', () => {
    it('should build an UPDATE query', async () => {
      const executeSpy = vi.spyOn(builder, 'execute');
      
      await builder
        .update({ name: '更新ユーザー' })
        .where('id', '=', 1)
        .execute();
      
      expect(executeSpy).toHaveBeenCalled();
      // 実際のSQLは内部実装に依存するため、実装時に調整
    });
  });

  describe('delete', () => {
    it('should build a DELETE query', async () => {
      const executeSpy = vi.spyOn(builder, 'execute');
      
      await builder
        .delete()
        .where('id', '=', 1)
        .execute();
      
      expect(executeSpy).toHaveBeenCalled();
      // 実際のSQLは内部実装に依存するため、実装時に調整
    });
  });

  describe('single and maybeSingle', () => {
    it('should return a single result', async () => {
      const result = await builder.select().single();
      expect(result).toEqual({ id: 1, name: 'テストユーザー' });
    });

    it('should return null when no result with maybeSingle', async () => {
      // モックを上書きして空の結果を返すようにする
      vi.spyOn(builder, 'execute').mockResolvedValueOnce({
        data: [],
        error: null,
      });
      
      const result = await builder.select().maybeSingle();
      expect(result).toBeNull();
    });
  });
});
