# プロジェクト実装計画

## プロジェクト概要

d1baseは、Cloudflare D1をバックエンドに用いた、Supabase風の型安全データクライアントです。チェーン式のクエリビルダーAPIを提供し、TypeScriptによる型安全性と、SQLインジェクション対策を備えています。

## ディレクトリ構成

以下のモノレポ構成で実装されています：

```
/packages/
  └── d1base/           # メインパッケージ
      ├── src/
      │   ├── client.ts     # DbClient定義・getDbClient関数
      │   ├── builder.ts    # QueryBuilderクラス（メインチェーン処理）
      │   ├── sql.ts        # SQL構文構築ユーティリティ
      │   ├── types.ts      # テーブル構造・クエリ型定義
      │   └── index.ts      # エクスポート用まとめ
      ├── __tests__/        # テストコード
      └── package.json      # パッケージ設定
/examples/               # 使用例
/vitest.config.ts        # テスト設定
/package.json            # monorepo全体設定
/turbo.json              # Turborepo設定
```

## 機能一覧

1. **チェーン可能なAPI**
   - `.from("table")` → テーブル指定
   - `.select()` → カラム選択（リレーション対応）
   - `.insert()` → データ挿入
   - `.update()` → データ更新
   - `.delete()` → データ削除
   - `.where()` → 条件指定
   - `.order()` → 並び順指定
   - `.limit()` → 最大取得件数
   - `.execute()` → 実行

2. **リレーションサポート**
   - `select(['id', { posts: ['id', 'title'] }])` 形式のリレーション指定
   - 自動LEFT JOIN生成
   - N+1問題回避（一回のクエリで関連データも取得）

3. **セキュリティ対策**
   - SQLインジェクション対策（バインドパラメータ使用）
   - 型安全な入力と出力
   
4. **ユーティリティ機能**
   - `.single()` → 単一レコード取得（なければエラー）
   - `.maybeSingle()` → 単一レコード取得（なければnull）

## 実装スケジュール（実績）

| フェーズ | 実装内容 |
|-------|--------|
| 準備 | ✅ モノレポ設定<br>✅ TypeScript設定<br>✅ テスト環境設定 |
| フェーズ1 | ✅ 基本クエリビルダー骨格<br>✅ SELECT/INSERT/UPDATEメソッド実装 |
| フェーズ2 | ✅ リレーション対応<br>✅ 型定義充実 |
| フェーズ3 | ✅ テスト整備<br>✅ ドキュメント整備 |

## 今後の拡張予定

- `.upsert()`, `.count()`, `.transaction()` の導入
- スキーマ型自動生成
- ページネーション機能
- 高度な条件指定（OR条件、IN句など）
- D1 Emulatorとの統合
