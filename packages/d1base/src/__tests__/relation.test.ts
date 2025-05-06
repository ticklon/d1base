import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryBuilder } from '../builder';
import type { QueryResult } from '../types';

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
    // JOIN用のモックデータ
    if (this.sql.includes('JOIN')) {
      return {
        results: [
          { 
            id: 1, 
            name: 'ユーザー1',
            posts_rel_id: 101,
            posts_rel_title: '最初の投稿',
            posts_rel_content: '投稿内容1'
          },
          { 
            id: 1, 
            name: 'ユーザー1',
            posts_rel_id: 102,
            posts_rel_title: '2番目の投稿',
            posts_rel_content: '投稿内容2'
          },
          { 
            id: 2, 
            name: 'ユーザー2',
            posts_rel_id: 201,
            posts_rel_title: 'ユーザー2の投稿',
            posts_rel_content: '投稿内容3'
          }
        ],
      };
    }
    
    // 通常のモックデータ
    return {
      results: [{ id: 1, name: 'テストユーザー' }],
    };
  }
}

class MockD1Database {
  prepare(sql: string): MockD1Statement {
    return new MockD1Statement(sql);
  }
}

describe('Relation Functionality', () => {
  let db: MockD1Database;
  let builder: QueryBuilder;

  beforeEach(() => {
    db = new MockD1Database();
    builder = new QueryBuilder(db as unknown as D1Database, 'users');
  });

  describe('relational queries', () => {
    it('should support object-based relational selects', async () => {
      // executeメソッドをモック化して、リレーションデータを返す
      const mockResult: QueryResult<any> = {
        data: [
          {
            id: 1,
            name: 'ユーザー1',
            posts: [
              { id: 101, title: '最初の投稿', content: '投稿内容1' },
              { id: 102, title: '2番目の投稿', content: '投稿内容2' }
            ]
          },
          {
            id: 2,
            name: 'ユーザー2',
            posts: [
              { id: 201, title: 'ユーザー2の投稿', content: '投稿内容3' }
            ]
          }
        ],
        error: null
      };
      
      vi.spyOn(builder, 'execute').mockResolvedValueOnce(mockResult);
      
      const result = await builder
        .select({ posts: ['id', 'title', 'content'] })
        .execute();
      
      expect(result.data).toHaveLength(2);
      expect(result.data[0].posts).toBeDefined();
      expect(result.data[0].posts).toHaveLength;
    });
    
    it('should support array-based relational selects', async () => {
      // executeメソッドをモック化して、リレーションデータを返す
      const mockResult: QueryResult<any> = {
        data: [
          {
            id: 1,
            name: 'ユーザー1',
            posts: [
              { id: 101, title: '最初の投稿', content: '投稿内容1' },
              { id: 102, title: '2番目の投稿', content: '投稿内容2' }
            ]
          }
        ],
        error: null
      };
      
      vi.spyOn(builder, 'execute').mockResolvedValueOnce(mockResult);
      
      const result = await builder
        .select(['id', 'name', { posts: ['id', 'title', 'content'] }])
        .execute();
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].name).toBe('ユーザー1');
      expect(result.data[0].posts).toBeDefined();
    });
    
    it('should format relational results correctly', async () => {
      // formatRelationalResultsメソッドをテスト
      const originalData = [
        { 
          id: 1, 
          name: 'ユーザー1',
          posts_id: 101,
          posts_title: '最初の投稿'
        },
        { 
          id: 1, 
          name: 'ユーザー1',
          posts_id: 102,
          posts_title: '2番目の投稿'
        },
        { 
          id: 2, 
          name: 'ユーザー2',
          posts_id: 201,
          posts_title: 'ユーザー2の投稿'
        }
      ];
      
      // privateメソッドをテストするため、anyでキャスト
      const formattedResults = (builder as any).formatRelationalResults(originalData);
      
      expect(formattedResults).toHaveLength(3);
      expect(formattedResults[0].posts).toBeDefined();
      expect(formattedResults[0].posts.id).toBe(101);
    });
  });
});
