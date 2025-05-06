# 開発ガイドライン

このドキュメントでは、d1baseプロジェクトの開発に参加する際のガイドラインを説明します。

## 開発環境のセットアップ

1. リポジトリをクローンします：
   ```bash
   git clone https://github.com/yourusername/d1base.git
   cd d1base
   ```

2. 依存関係をインストールします：
   ```bash
   npm install
   ```

3. 開発モードで実行します：
   ```bash
   npm run dev
   ```

## プロジェクト構造

このプロジェクトはmonorepo構造を採用しています：

```
/packages/
  └── d1base/          # メインライブラリ
      ├── src/
      │   ├── client.ts     # DbClient定義・getDbClient関数
      │   ├── builder.ts    # QueryBuilderクラス（メインチェーン処理）
      │   ├── sql.ts        # SQL構文構築ユーティリティ
      │   ├── types.ts      # テーブル構造・クエリ型・リレーション定義
      │   └── index.ts      # エクスポート用まとめ
      └── __tests__/        # テストコード
```

## 開発のワークフロー

1. 新機能またはバグ修正のためのブランチを作成します：
   ```bash
   git checkout -b feature/機能名
   ```

2. コードを変更し、テストを追加します。

3. テストを実行して、すべてのテストが通過することを確認します：
   ```bash
   npm test
   ```

4. リントとフォーマットを実行します：
   ```bash
   npm run lint
   npm run format
   ```

5. 変更をコミットしてプッシュします：
   ```bash
   git commit -m "機能の説明"
   git push origin feature/機能名
   ```

6. プルリクエストを作成します。

## コーディング規約

- TypeScriptの型定義を正確に行い、`any`の使用を避けます。
- 関数やクラスには適切なJSDocコメントを付けます。
- テストカバレッジを高く保ちます。
- 変数・関数・クラスには意味のある名前を付けます。
- 複雑なロジックにはコメントを付けます。

## テスト

テストは次のコマンドで実行できます：

```bash
npm test
```

テストファイルは`__tests__`ディレクトリに配置し、`.test.ts`という拡張子を使用します。

## ビルド

以下のコマンドでプロジェクトをビルドできます：

```bash
npm run build
```

ビルド結果は`packages/d1base/dist`ディレクトリに出力されます。

## 今後の開発予定

- `.upsert()`, `.count()`, `.transaction()` の導入
- Prismaのような型生成機構
- CLIでの型自動生成
- テスト環境でのD1 Emulator統合
