import { describe, it, expect } from 'vitest';
import { SqlBuilder } from '../sql';
import type { QueryState } from '../types';

describe('SqlBuilder', () => {
  describe('buildSelect', () => {
    it('should build a basic SELECT query', () => {
      const state: QueryState = {
        table: 'users',
        where: [],
      };
      
      const [sql, bindings] = SqlBuilder.buildSelect(state);
      
      expect(sql).toContain('SELECT users.* FROM users');
      expect(bindings).toEqual([]);
    });
    
    it('should build a SELECT query with specific columns', () => {
      const state: QueryState = {
        table: 'users',
        select: ['id', 'name', 'email'],
        where: [],
      };
      
      const [sql, bindings] = SqlBuilder.buildSelect(state);
      
      expect(sql).toContain('SELECT');
      expect(sql).toContain('users.id');
      expect(sql).toContain('users.name');
      expect(sql).toContain('users.email');
      expect(bindings).toEqual([]);
    });
    
    it('should build a SELECT query with WHERE clause', () => {
      const state: QueryState = {
        table: 'users',
        where: [
          { column: 'status', operator: '=', value: 'active' },
        ],
      };
      
      const [sql, bindings] = SqlBuilder.buildSelect(state);
      
      expect(sql).toContain('WHERE status = ?');
      expect(bindings).toEqual(['active']);
    });
    
    it('should build a SELECT query with ORDER BY clause', () => {
      const state: QueryState = {
        table: 'users',
        where: [],
        order: [
          { column: 'created_at', direction: 'desc' },
        ],
      };
      
      const [sql, bindings] = SqlBuilder.buildSelect(state);
      
      expect(sql).toContain('ORDER BY created_at DESC');
      expect(bindings).toEqual([]);
    });
    
    it('should build a SELECT query with LIMIT clause', () => {
      const state: QueryState = {
        table: 'users',
        where: [],
        limit: 10,
      };
      
      const [sql, bindings] = SqlBuilder.buildSelect(state);
      
      expect(sql).toContain('LIMIT ?');
      expect(bindings).toEqual([10]);
    });
  });
  
  describe('buildInsert', () => {
    it('should build an INSERT query', () => {
      const state: QueryState = {
        table: 'users',
        insert: {
          name: 'テストユーザー',
          email: 'test@example.com',
        },
        where: [],
      };
      
      const [sql, bindings] = SqlBuilder.buildInsert(state);
      
      expect(sql).toContain('INSERT INTO users');
      expect(sql).toContain('name, email');
      expect(sql).toContain('VALUES (?, ?)');
      expect(bindings).toContain('テストユーザー');
      expect(bindings).toContain('test@example.com');
    });
  });
  
  describe('buildUpdate', () => {
    it('should build an UPDATE query', () => {
      const state: QueryState = {
        table: 'users',
        update: {
          name: '更新ユーザー',
        },
        where: [
          { column: 'id', operator: '=', value: 1 },
        ],
      };
      
      const [sql, bindings] = SqlBuilder.buildUpdate(state);
      
      expect(sql).toContain('UPDATE users SET name = ?');
      expect(sql).toContain('WHERE id = ?');
      expect(bindings).toEqual(['更新ユーザー', 1]);
    });
  });
  
  describe('buildDelete', () => {
    it('should build a DELETE query', () => {
      const state: QueryState = {
        table: 'users',
        where: [
          { column: 'id', operator: '=', value: 1 },
        ],
      };
      
      const [sql, bindings] = SqlBuilder.buildDelete(state);
      
      expect(sql).toContain('DELETE FROM users');
      expect(sql).toContain('WHERE id = ?');
      expect(bindings).toEqual([1]);
    });
  });
});
