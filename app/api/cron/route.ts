import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const now = new Date();

    const pendingPosts = await prisma.scheduledPost.findMany({
      where: {
        status: "PENDING",
        post_at: { lte: now },
      },
    });

    if (pendingPosts.length === 0) {
      return NextResponse.json({ message: "現在、投稿待ちのデータはありませんでした。" });
    }

    for (const post of pendingPosts) {
      try {
        // ==========================================
        // 🔵 Discordへの投稿処理
        // ==========================================
        if (post.post_to_discord && post.discord_channel_id && post.discord_content) {
          const formData = new FormData();
          formData.append("payload_json", JSON.stringify({ content: post.discord_content }));

          if (post.image_file_ids && Array.isArray(post.image_file_ids)) {
            (post.image_file_ids as string[]).forEach((base64String, index) => {
              const base64Data = base64String.split(',')[1];
              if (base64Data) {
                const buffer = Buffer.from(base64Data, 'base64');
                const blob = new Blob([buffer], { type: 'image/jpeg' });
                formData.append(`files[${index}]`, blob, `image${index}.jpg`);
              }
            });
          }

          const discordRes = await fetch(`https://discord.com/api/v10/channels/${post.discord_channel_id}/messages`, {
            method: "POST",
            headers: {
              "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            },
            body: formData,
          });

          if (!discordRes.ok) throw new Error("Discordの送信に失敗しました");
        }

        // ==========================================
        // 🔄 成功後の処理：定期投稿かどうかで分岐させる
        // ==========================================
        if (post.is_recurring && post.recurrence_pattern) {
          // 🌟 定期投稿の場合：次回の時間を計算して「上書き」する（完了にはしない）
          const nextDate = new Date(post.post_at);
          
          if (post.recurrence_pattern === "DAILY") {
            nextDate.setDate(nextDate.getDate() + 1); // 1日足す
          } else if (post.recurrence_pattern === "WEEKLY") {
            nextDate.setDate(nextDate.getDate() + 7); // 7日足す
          } else if (post.recurrence_pattern === "MONTHLY") {
            nextDate.setMonth(nextDate.getMonth() + 1); // 1ヶ月足す
          }

          await prisma.scheduledPost.update({
            where: { id: post.id },
            data: { post_at: nextDate }, // 新しい時間をセット（ステータスはPENDINGのまま）
          });
          
        } else {
          // 🌟 通常の投稿の場合：今まで通り「POSTED（完了）」にする
          await prisma.scheduledPost.update({
            where: { id: post.id },
            data: { status: "POSTED" },
          });
        }

      } catch (error) {
        console.error(`Post ID ${post.id} でエラー発生:`, error);
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: { status: "FAILED" },
        });
      }
    }

    return NextResponse.json({ success: true, processedCount: pendingPosts.length });

  } catch (error) {
    console.error("Cron API Error:", error);
    return NextResponse.json({ error: "自動投稿処理の途中でエラーが発生しました" }, { status: 500 });
  }
}