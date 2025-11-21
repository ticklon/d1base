import type {
  QueryState,
  WhereCondition,
  OrderCondition,
  JoinCondition
} from './types.js';

/**
 * SQLクエリを生成し、バインドパラメータを準備するユーティリティクラス
 */
export class SqlBuilder {
  /**
   * 識別子（テーブル名、カラム名）をエスケープする
   * @param identifier エスケープする識別子
   */
  static escapeIdentifier(identifier: string): string {
    // 単純な英数字とアンダースコアのみ許可し、それ以外はダブルクォートで囲む
    // すでにドットで区切られている場合は個別にエスケープする
    return identifier.split('.').map(part => `"${part.replace(/"/g, '""')}"`).join('.');
  }

  /**
   * SELECT文を構築する
   * @param state クエリ状態オブジェクト
   * @returns [SQL文字列, バインドパラメータ配列]
   */
  static buildSelect(state: QueryState): [string, any[]] {
    const bindings: any[] = [];
    let sql = 'SELECT ';
    const table = this.escapeIdentifier(state.table);

    const columns: string[] = [];
    const joins: JoinCondition[] = [];

    // 選択されたカラムとリレーションを処理するヘルパー関数
    const processSelect = (item: string | Record<string, any>) => {
      if (typeof item === 'string') {
        // 通常のカラム指定
        columns.push(`${table}.${this.escapeIdentifier(item)}`);
      } else if (typeof item === 'object') {
        // リレーション指定
        for (const [relationName, relationColumns] of Object.entries(item)) {
          // リレーション設定を取得
          const relationConfig = state.relations?.[relationName];

          let joinTable: string;
          let joinOn: { column: string; operator: string; value: string };
          const relatedTableAlias = `${relationName}_rel`;
          const escapedRelatedTableAlias = this.escapeIdentifier(relatedTableAlias);

          if (relationConfig) {
            // 設定がある場合
            joinTable = relationConfig.table || relationName;
            // エスケープ処理はJOIN句構築時に行われるため、ここでは生の値を使用
            // ただし、ON句の値はここで構築するため、エイリアス部分はエスケープが必要かもしれないが
            // 現状のbuildSelectの実装では、ON句の構築ロジック内でエスケープを考慮する必要がある

            joinOn = {
              column: `${this.escapeIdentifier(state.table)}.${this.escapeIdentifier(relationConfig.foreignKey)}`,
              operator: '=',
              value: `${escapedRelatedTableAlias}.${this.escapeIdentifier(relationConfig.primaryKey)}`
            };
          } else {
            // デフォルトの挙動（後方互換性）
            joinTable = relationName;

            joinOn = {
              column: `${this.escapeIdentifier(state.table)}.${this.escapeIdentifier('id')}`,
              operator: '=',
              value: `${escapedRelatedTableAlias}.${this.escapeIdentifier(state.table.slice(0, -1) + '_id')}`
            };
          }

          // リレーションJOINを追加
          joins.push({
            table: joinTable,
            alias: relatedTableAlias,
            type: 'LEFT',
            on: joinOn
          });

          // リレーション先のカラムを追加
          if (Array.isArray(relationColumns)) {
            for (const col of relationColumns) {
              if (typeof col === 'string') {
                columns.push(`${escapedRelatedTableAlias}.${this.escapeIdentifier(col)} AS ${this.escapeIdentifier(`${relationName}_${col}`)}`);
              }
            }
          }
        }
      }
    };

    // SELECT句の構築
    if (!state.select || state.select.length === 0) {
      columns.push(`${table}.*`);
    } else if (Array.isArray(state.select)) {
      state.select.forEach(item => processSelect(item as string | Record<string, any>));
    } else {
      // オブジェクト形式の場合はリレーションを処理
      columns.push(`${table}.*`); // メインテーブルの全カラム
      processSelect(state.select as Record<string, any>);
    }

    // カラムが空の場合はすべてのカラムを取得（念のため）
    if (columns.length === 0) {
      columns.push(`${table}.*`);
    }

    sql += columns.join(', ');

    // 状態にJOINを追加
    if (!state.joins) {
      state.joins = [];
    }
    state.joins.push(...joins);

    sql += ` FROM ${table}`;

    // JOIN句の追加
    if (state.joins && state.joins.length > 0) {
      for (const join of state.joins) {
        const joinTable = this.escapeIdentifier(join.table);
        const joinAlias = this.escapeIdentifier(join.alias);
        // ON句のカラムは単純化のためここではエスケープ済みと仮定するか、またはパースが必要
        // 今回は既存ロジックに合わせて、識別子が含まれていると仮定して簡易的に処理
        // 本来は on.column, on.value も構造化すべき
        sql += ` ${join.type} JOIN ${joinTable} AS ${joinAlias} ON ${join.on.column} ${join.on.operator} ${join.on.value}`;
      }
    }

    // WHERE句の追加
    sql += this.buildWhereClause(state.where, bindings);

    // ORDER BY句の追加
    if (state.order && state.order.length > 0) {
      const orders = state.order.map(
        (o) => `${this.escapeIdentifier(String(o.column))} ${o.direction.toUpperCase()}`
      );
      sql += ` ORDER BY ${orders.join(', ')}`;
    }

    // LIMIT句の追加
    if (state.limit !== undefined) {
      sql += ' LIMIT ?';
      bindings.push(state.limit);
    }

    return [sql, bindings];
  }

  /**
   * INSERT文を構築する
   * @param state クエリ状態オブジェクト
   * @returns [SQL文字列, バインドパラメータ配列]
   */
  static buildInsert(state: QueryState): [string, any[]] {
    if (!state.insert) {
      throw new Error('INSERT文を生成するにはinsertデータが必要です');
    }

    const bindings: any[] = [];
    const columns = Object.keys(state.insert);
    const escapedColumns = columns.map(c => this.escapeIdentifier(c));
    const placeholders = Array(columns.length).fill('?').join(', ');
    const table = this.escapeIdentifier(state.table);

    const sql = `INSERT INTO ${table} (${escapedColumns.join(', ')}) VALUES (${placeholders})`;

    // バインドパラメータを準備
    columns.forEach((col) => {
      bindings.push(state.insert![col]);
    });

    return [sql, bindings];
  }

  /**
   * UPDATE文を構築する
   * @param state クエリ状態オブジェクト
   * @returns [SQL文字列, バインドパラメータ配列]
   */
  static buildUpdate(state: QueryState): [string, any[]] {
    if (!state.update) {
      throw new Error('UPDATE文を生成するにはupdateデータが必要です');
    }

    const bindings: any[] = [];
    const columns = Object.keys(state.update);
    const setClause = columns.map((col) => `${this.escapeIdentifier(col)} = ?`).join(', ');
    const table = this.escapeIdentifier(state.table);

    let sql = `UPDATE ${table} SET ${setClause}`;

    // バインドパラメータを準備（SET句用）
    columns.forEach((col) => {
      bindings.push(state.update![col]);
    });

    // WHERE句の追加
    sql += this.buildWhereClause(state.where, bindings);

    return [sql, bindings];
  }

  /**
   * DELETE文を構築する
   * @param state クエリ状態オブジェクト
   * @returns [SQL文字列, バインドパラメータ配列]
   */
  static buildDelete(state: QueryState): [string, any[]] {
    const bindings: any[] = [];
    const table = this.escapeIdentifier(state.table);
    let sql = `DELETE FROM ${table}`;

    // WHERE句の追加
    sql += this.buildWhereClause(state.where, bindings);

    return [sql, bindings];
  }

  /**
   * WHERE句を構築する
   * @param conditions WHERE条件の配列
   * @param bindings バインドパラメータ配列（参照渡し）
   * @returns 構築されたWHERE句
   */
  private static buildWhereClause(
    conditions: WhereCondition[],
    bindings: any[]
  ): string {
    if (conditions.length === 0) {
      return '';
    }

    const whereParts = conditions.map((condition) => {
      bindings.push(condition.value);
      return `${this.escapeIdentifier(String(condition.column))} ${condition.operator} ?`;
    });

    return ` WHERE ${whereParts.join(' AND ')}`;
  }
}
