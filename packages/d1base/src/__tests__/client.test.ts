import { describe, it, beforeEach, expect, vi } from 'vitest';
import { getDbClient } from '../src/client';
import { QueryBuilder } from '../src/builder';

// D1DatabaseのモッククラスとMockD1Statementの型定義
export class MockD1Statement {
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

export class MockD1Database {
  prepare(sql: string): MockD1Statement {
    return new MockD1Statement(sql);
  }

  dump(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }

  batch<T = unknown>(statements: any[]): Promise<T> {
    return Promise.resolve([] as unknown as T);
  }

  exec(query: string): Promise<D1Result<any>> {
    return Promise.resolve({
      results: [],
      success: true,
      meta: {},
    } as D1Result<any>);
  }
}

describe('getDbClient', () => {
  let mockDb: MockD1Database;

  beforeEach(() => {
    mockDb = new MockD1Database();
  });

  it('should create a DbClient instance', () => {
    const env = { DB: mockDb as unknown as D1Database };
    const db = getDbClient(env);
    
    expect(db).toBeDefined();
    expect(typeof db.from).toBe('function');
  });

  it('should create a QueryBuilder when from() is called', () => {
    const env = { DB: mockDb as unknown as D1Database };
    const db = getDbClient(env);
    
    const builder = db.from('users');
    expect(builder).toBeInstanceOf(QueryBuilder);
  });
});
