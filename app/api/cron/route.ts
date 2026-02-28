import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  // ① 「今」の時間から少し前の時間まで、送信すべき投稿を探す
  const now = new Date();

  try {
    const postsToSend = await prisma.scheduledPost.findMany({
      where: {
        status: "PENDING",
        post_at: { lte: now }, // 今の時間より過去（または同じ）になっているもの
        // 🌟 追加：「下書き（Draft）」ではないものだけを厳選する！
        isDraft: false,
      },
    });

    if (postsToSend.length === 0) {
      return NextResponse.json({ message: "送信する投稿はありませんでした" });
    }

    // ② 見つかった投稿を、順番にDiscordに送信していく
    for (const post of postsToSend) {
      try {
        let files = [];

        if (post.image_file_ids && Array.isArray(post.image_file_ids)) {
          files = (post.image_file_ids as string[]).map((base64String, index) => {
            const matches = base64String.match(/^data:(image\/\w+);base64,(.+)$/);
            if (!matches) return null;
            const ext = matches[1].split("/")[1];
            const buffer = Buffer.from(matches[2], "base64");
            const blob = new Blob([buffer], { type: matches[1] });
            return new File([blob], `image_${index}.${ext}`, { type: matches[1] });
          }).filter(Boolean);
        }

        const formData = new FormData();

        // 🌟 追加：Discordのメンションが本物の通知として機能するように「allowed_mentions」を設定
        formData.append("payload_json", JSON.stringify({
          content: post.discord_content,
          allowed_mentions: { parse: ["users", "roles", "everyone"] }
        }));

        files.forEach((file) => {
          if (file) formData.append("files", file);
        });

        // 🌟 追加：本物のDiscordのWebhook URL（FSIF/CosmoBaseの環境に合わせて後で変更してください）
        // ※今はテスト用のダミーURLを入れていますが、エラーにならないように動かします。
        const webhookUrl = "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN";

        /* 【注意】本番環境では以下の fetch のコメントアウトを外して実際に送信させます
        const response = await fetch(webhookUrl, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Discordへの送信に失敗しました: ${response.status}`);
        }
        */

        // ③ 送信が成功したあとの処理

        // 🌟 追加：定期投稿のチェック（もし定期投稿なら、次回の日時を計算してステータスをPENDINGのまま更新）
        if (post.isRecurring && post.recurrencePattern) {
          const nextDate = new Date(post.post_at);

          if (post.recurrencePattern === "daily") {
            nextDate.setDate(nextDate.getDate() + 1); // 1日後
          } else if (post.recurrencePattern === "weekly") {
            nextDate.setDate(nextDate.getDate() + 7); // 7日後
          } else if (post.recurrencePattern === "monthly") {
            nextDate.setMonth(nextDate.getMonth() + 1); // 1ヶ月後
          }

          await prisma.scheduledPost.update({
            where: { id: post.id },
            data: {
              post_at: nextDate,
              status: "PENDING", // 次回も送信待ちにする
            },
          });
          console.log(`定期投稿を更新しました: 次回 ${nextDate}`);

        } else {
          // 定期投稿ではない（単発）なら、送信済（SENT）にして終わらせる
          await prisma.scheduledPost.update({
            where: { id: post.id },
            data: { status: "SENT" },
          });
        }

      } catch (postError) {
        console.error(`投稿ID ${post.id} の送信エラー:`, postError);
        // エラーになっても止まらずに次の投稿へ進む
      }
    }

    return NextResponse.json({ success: true, processedCount: postsToSend.length });
  } catch (error) {
    console.error("Cron実行エラー:", error);
    return NextResponse.json({ error: "Cronの実行に失敗しました" }, { status: 500 });
  }
}