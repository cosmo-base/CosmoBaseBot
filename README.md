# 🚀 CosmoBase Hub (自動広報システム)

CosmoBase および FSIF のための、Discord ＆ 𝕏 (Twitter) 連携スケジュール投稿システムです。
指定した日時に、画像付きのリッチなメッセージを自動で配信します。

## ✨ 主な機能

### 1. 🎯 高度なスケジュール投稿
- **1分刻みの精密な時間指定:** 狙った時間に正確に投稿可能（※安全のため 7:00〜22:00 に制限）。
- **定期投稿の永久ループ:** 「毎日」「毎週」「毎月」の指定で、一度セットすれば自動的に次回の日時を計算してループ送信します。
- **下書き（Draft）保存:** 途中で作業を中断したい場合や、後でメンバーに確認してもらうための「下書き保存」に対応。

### 2. 👾 Discord 完全特化のUI
- **リアルタイム・プレビュー:** 入力したMarkdown（**太字**、__下線__、~~取消線~~、||ネタバレ||、> 引用など）やメンションが、Discord本家そっくりに右画面へリアルタイム反映されます。
- **メンション簡単入力:** `@everyone` や特定のロール（役職）をワンクリックで挿入可能。実際にスマホへ通知（Ping）も飛びます。
- **テンプレート機能:** よく使う「イベント告知」や「定例会リマインド」などの文章を画面上から保存・呼び出し可能。

### 3. 𝕏 (Twitter) 連携機能（※準備中）
- Discordとは別に、140文字制限に合わせた専用のテキストボックスを用意。
- X向けの文字数カウンターと、最大4枚までの画像プレビューに対応。

---

## 🛠️ システム構成（アーキテクチャ）

- **フロントエンド:** Next.js (App Router), React, Tailwind CSS
- **バックエンド:** Next.js (API Routes)
- **データベース:** Neon (Serverless Postgres), Prisma ORM
- **認証:** NextAuth.js (Discord OAuth2)
- **自動実行 (Cron):** cron-job.org (5分間隔で監視・実行)
- **デプロイ:** Vercel

---

## 💻 開発者向けセットアップ

ローカル環境で動かすための手順です。

### 1. パッケージのインストール
\`\`\`bash
npm install
\`\`\`

### 2. 環境変数の設定
プロジェクトのルートに `.env` ファイルを作成し、以下の値を設定してください。
\`\`\`env
# Neon Database
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require"

# NextAuth (Discord Login)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secret_key"
DISCORD_CLIENT_ID="your_discord_client_id"
DISCORD_CLIENT_SECRET="your_discord_client_secret"
\`\`\`

### 3. データベースの同期
\`\`\`bash
npx prisma db push
npx prisma generate
\`\`\`

### 4. 開発サーバーの起動
\`\`\`bash
npm run dev
\`\`\`
ブラウザで `http://localhost:3000` にアクセスしてください。

---

## 📝 今後のアップデート予定
- [ ] 𝕏 (Twitter) API v2 を利用した画像付き自動投稿の実装