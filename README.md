# PERFORM

日本の外科研修文化に即した、指導医評価・自己評価に基づく手術手技評価・フィードバックシステム。

## リポジトリの構成

```
perform/
├── frontend/          … Netlifyが配信する静的サイト（学習者・指導医・登録画面など）
│   ├── index.html
│   ├── learner.html
│   ├── evaluator.html
│   ├── register.html
│   └── qr-admin.html
├── backend/
│   └── Code.gs        … Google Apps Script（バックエンドAPI・データベース連携）
├── docs/
│   └── SETUP_NOTES.md … 詳細なセットアップ手順・変更履歴
└── netlify.toml        … Netlifyのビルド・配信設定
```

`frontend/` はNetlifyがそのまま静的サイトとして配信します。`backend/Code.gs` は現状Netlifyのビルド対象には含まれません（後述の通り、Google Apps Scriptエディタに手動でコピー＆ペーストしてデプロイする運用です）。

## セットアップ手順（初回のみ）

### 1. Googleスプレッドシート・GASの準備

`docs/SETUP_NOTES.md` の手順に従い、2つのGoogleスプレッドシート（本人情報用・データ用）を作成し、`backend/Code.gs` の中身をGoogle Apps Scriptエディタに貼り付けてWebアプリとしてデプロイしてください。デプロイ後に発行されるURLを、`frontend/` 内の各HTMLファイルにある `GAS_URL` の値に反映します。

### 2. GitHub × Netlifyの連携

このリポジトリをNetlifyの「Import from Git」機能で連携すると、`main`ブランチにpushするたびに自動で再デプロイされます。

1. Netlifyダッシュボード → 「Add new site」→「Import an existing project」
2. GitHubを選択し、このリポジトリを指定
3. Build settings は `netlify.toml` の内容が自動で読み込まれます（Publish directory: `frontend`）
4. デプロイ完了後、発行されたURLを関係者に共有

## 共同編集について

コードを編集する共同研究者は、このGitHubリポジトリへの書き込み権限があれば作業できます（Netlify自体のアカウントは不要です）。変更をpushすると、Netlify側が自動的に再デプロイします。

**Code.gs（バックエンド）を編集した場合のみ、別途Google Apps Scriptエディタ側にも反映（コピー＆ペースト→再デプロイ）が必要**です。GitHub側の変更がGAS側に自動反映されるわけではない点に注意してください（`clasp` というCLIツールを使うとGAS側もgit連携・自動デプロイできますが、現状は手動運用としています）。

## 開発の流れ（推奨）

1. `git pull` で最新を取得
2. `frontend/` または `backend/Code.gs` を編集
3. 変更内容がわかるコミットメッセージをつけて `git commit`
4. `git push`
5. `frontend/` を編集した場合 → Netlifyが自動デプロイ（数十秒〜数分で反映）
6. `backend/Code.gs` を編集した場合 → 上記の通り、GASエディタ側にも手動で反映

## 詳細ドキュメント

アーキテクチャの詳細、データベース設計、匿名化の仕組み、これまでの変更履歴などは `docs/SETUP_NOTES.md` を参照してください。
