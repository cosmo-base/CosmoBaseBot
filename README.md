# 🚀 CosmoBase PR Automator (自動広報システム)

CosmoBaseおよびFSIFの広報活動を効率化・自動化するために開発された、Discord向けの自動投稿予約システムです。
指定した日時に自動でメッセージや画像をDiscordチャンネルへ送信します。

## ✨ 主な機能 (Features)

- **🔐 セキュアなログイン:** Discordアカウントを用いたOAuth2ログイン（NextAuth）
- **📅 予約投稿:** 指定した日時（30分刻み）でのDiscordへの自動メッセージ・画像送信
- **🔁 定期投稿:** 毎日・毎週・毎月といったルーティン投稿の自動生成
- **🧹 自動クリーンアップ:** 単発の投稿は、送信完了後にデータベースから自動削除され、容量を節約します
- **🤖 完全自動化 (Cron):** GitHub Actionsを利用し、毎時00分・30分に自動で送信処理を実行

## 🛠️ 技術スタック (Tech Stack)

- **Frontend / Backend:** Next.js (App Router)
- **Database:** PostgreSQL (Neon / Supabase)
- **ORM:** Prisma
- **Authentication:** NextAuth.js (Auth.js)
- **Deployment:** Vercel
- **Automation (Cron):** GitHub Actions

## ⚙️ 環境変数 (Environment Variables)

ローカル環境での開発や、Vercelへのデプロイ時には以下の環境変数（`.env`）が必要です。

```env
# Database
DATABASE_URL="postgresql://ユーザー名:パスワード@ホスト名/データベース名"

# Discord Bot
DISCORD_BOT_TOKEN="あなたのDiscord Botトークン"

# NextAuth (Discord OAuth2)
DISCORD_CLIENT_ID="OAuth2のクライアントID"
DISCORD_CLIENT_SECRET="OAuth2のクライアントシークレット"
NEXTAUTH_SECRET="ランダムな文字列（openssl rand -base64 32 などで生成）"
NEXTAUTH_URL="http://localhost:3000" # 本番環境ではVercelのURL