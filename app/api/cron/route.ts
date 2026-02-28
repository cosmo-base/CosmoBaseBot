import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const now = new Date();
  
  try {
    const postsToSend = await prisma.scheduledPost.findMany({
      where: {
        status: "PENDING",
        post_at: { lte: now },
        isDraft: false, 
      },
    });

    if (postsToSend.length === 0) {
      return NextResponse.json({ message: "送信する投稿はありませんでした" });
    }

    for (const post of postsToSend) {
      try {
        let files: any[] = [];
        
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
        
        formData.append("payload_json", JSON.stringify({ 
          content: post.discord_content || "",
          allowed_mentions: { parse: ["users", "roles", "everyone"] } 
        }));

        files.forEach((file) => {
          if (file) formData.append("files", file);
        });

        // 🌟 本物のDiscordのWebhook URL（FSIF/CosmoBaseの環境に合わせて後で変更）
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
        // 🌟 修正：データベースの正しい名前（is_recurring, recurrence_pattern）に直しました！
        if (post.is_recurring && post.recurrence_pattern) {
          const nextDate = new Date(post.post_at);
          
          if (post.recurrence_pattern === "daily") {
            nextDate.setDate(nextDate.getDate() + 1); // 1日後
          } else if (post.recurrence_pattern === "weekly") {
            nextDate.setDate(nextDate.getDate() + 7); // 7日後
          } else if (post.recurrence_pattern === "monthly") {
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