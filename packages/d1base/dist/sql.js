/**
 * SQLクエリを生成し、バインドパラメータを準備するユーティリティクラス
 */
export class SqlBuilder {
    /**
     * SELECT文を構築する
     * @param state クエリ状態オブジェクト
     * @returns [SQL文字列, バインドパラメータ配列]
     */
    static buildSelect(state) {
        const bindings = [];
        let sql = 'SELECT ';
        // SELECT句の構築
        if (!state.select || state.select.length === 0) {
            sql += `${state.table}.*`;
        }
        else if (Array.isArray(state.select)) {
            // リレーションが含まれているか確認
            const columns = [];
            const joins = [];
            for (const item of state.select) {
                if (typeof item === 'string') {
                    // 通常のカラム指定
                    columns.push(`${state.table}.${item}`);
                }
                else if (typeof item === 'object') {
                    // リレーション指定
                    for (const [relationName, relationColumns] of Object.entries(item)) {
                        // リレーション先のテーブル名とカラムを解析
                        // 実際の実装では、事前に定義されたリレーション設定から自動的に生成する
                        // この例ではシンプルに単数形->複数形の関係を仮定
                        const relatedTable = relationName;
                        const relatedTableAlias = `${relationName}_rel`;
                        // リレーションJOINを追加
                        joins.push({
                            table: relatedTable,
                            alias: relatedTableAlias,
                            type: 'LEFT',
                            on: {
                                column: `${state.table}.id`,
                                operator: '=',
                                value: `${relatedTableAlias}.${state.table.slice(0, -1)}_id`
                            }
                        });
                        // リレーション先のカラムを追加
                        if (Array.isArray(relationColumns)) {
                            for (const col of relationColumns) {
                                if (typeof col === 'string') {
                                    columns.push(`${relatedTableAlias}.${col} AS ${relationName}_${col}`);
                                }
                                // ネストしたリレーションも同様に処理可能（再帰的な実装が必要）
                            }
                        }
                    }
                }
            }
            // カラムが空の場合はすべてのカラムを取得
            if (columns.length === 0) {
                sql += `${state.table}.*`;
            }
            else {
                sql += columns.join(', ');
            }
            // 状態にJOINを追加
            if (!state.joins) {
                state.joins = [];
            }
            state.joins.push(...joins);
        }
        else {
            // オブジェクト形式の場合はリレーションを処理
            const columns = [];
            const joins = [];
            // メインテーブルのカラム
            columns.push(`${state.table}.*`);
            // リレーションの処理
            for (const [relationName, relationColumns] of Object.entries(state.select)) {
                const relatedTable = relationName;
                const relatedTableAlias = `${relationName}_rel`;
                // リレーションJOINを追加
                joins.push({
                    table: relatedTable,
                    alias: relatedTableAlias,
                    type: 'LEFT',
                    on: {
                        column: `${state.table}.id`,
                        operator: '=',
                        value: `${relatedTableAlias}.${state.table.slice(0, -1)}_id`
                    }
                });
                // リレーション先のカラムを追加
                if (Array.isArray(relationColumns)) {
                    for (const col of relationColumns) {
                        if (typeof col === 'string') {
                            columns.push(`${relatedTableAlias}.${col} AS ${relationName}_${col}`);
                        }
                    }
                }
            }
            sql += columns.join(', ');
            // 状態にJOINを追加
            if (!state.joins) {
                state.joins = [];
            }
            state.joins.push(...joins);
        }
        sql += ` FROM ${state.table}`;
        // JOIN句の追加
        if (state.joins && state.joins.length > 0) {
            for (const join of state.joins) {
                sql += ` ${join.type} JOIN ${join.table} AS ${join.alias} ON ${join.on.column} ${join.on.operator} ${join.on.value}`;
            }
        }
        // WHERE句の追加
        sql += this.buildWhereClause(state.where, bindings);
        // ORDER BY句の追加
        if (state.order && state.order.length > 0) {
            const orders = state.order.map((o) => `${o.column} ${o.direction.toUpperCase()}`);
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
    static buildInsert(state) {
        if (!state.insert) {
            throw new Error('INSERT文を生成するにはinsertデータが必要です');
        }
        const bindings = [];
        const columns = Object.keys(state.insert);
        const placeholders = Array(columns.length).fill('?').join(', ');
        const sql = `INSERT INTO ${state.table} (${columns.join(', ')}) VALUES (${placeholders})`;
        // バインドパラメータを準備
        columns.forEach((col) => {
            bindings.push(state.insert[col]);
        });
        return [sql, bindings];
    }
    /**
     * UPDATE文を構築する
     * @param state クエリ状態オブジェクト
     * @returns [SQL文字列, バインドパラメータ配列]
     */
    static buildUpdate(state) {
        if (!state.update) {
            throw new Error('UPDATE文を生成するにはupdateデータが必要です');
        }
        const bindings = [];
        const columns = Object.keys(state.update);
        const setClause = columns.map((col) => `${col} = ?`).join(', ');
        let sql = `UPDATE ${state.table} SET ${setClause}`;
        // バインドパラメータを準備（SET句用）
        columns.forEach((col) => {
            bindings.push(state.update[col]);
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
    static buildDelete(state) {
        const bindings = [];
        let sql = `DELETE FROM ${state.table}`;
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
    static buildWhereClause(conditions, bindings) {
        if (conditions.length === 0) {
            return '';
        }
        const whereParts = conditions.map((condition) => {
            bindings.push(condition.value);
            return `${condition.column} ${condition.operator} ?`;
        });
        return ` WHERE ${whereParts.join(' AND ')}`;
    }
}
