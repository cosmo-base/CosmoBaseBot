import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 🌟これを超追加！「毎回絶対に最新のデータを確認する（サボり防止）」の魔法
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const nowJST = new Date(Date.now() + (9 * 60 * 60 * 1000));
    console.log("🤖 Cron起動！日本判定時刻:", nowJST.toLocaleString("ja-JP"));

    const pendingPosts = await prisma.scheduledPost.findMany({
      where: {
        status: "PENDING",
        post_at: {
          lte: nowJST, // 🌟日本時間基準で比較する
        },
      },
    });

    console.log(`📋 見つかった投稿待ちデータ: ${pendingPosts.length}件`); // 🌟ログ用

    if (pendingPosts.length === 0) {
      return NextResponse.json({ message: "現在、投稿待ちのデータはありませんでした。" });
    }

    for (const post of pendingPosts) {
      try {
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

          if (!discordRes.ok) {
            const errorData = await discordRes.json();
            console.error("Discord API Error 詳細:", errorData); // 🌟エラーの理由を詳しく出す
            throw new Error("Discordの送信に失敗しました");
          }
        }

        // 定期投稿の処理
        if (post.is_recurring && post.recurrence_pattern) {
          const nextDate = new Date(post.post_at);
          if (post.recurrence_pattern === "DAILY") nextDate.setDate(nextDate.getDate() + 1);
          else if (post.recurrence_pattern === "WEEKLY") nextDate.setDate(nextDate.getDate() + 7);
          else if (post.recurrence_pattern === "MONTHLY") nextDate.setMonth(nextDate.getMonth() + 1);

          await prisma.scheduledPost.update({
            where: { id: post.id },
            data: { post_at: nextDate },
          });
          console.log(`✅ 定期投稿完了: 次回は ${nextDate.toISOString()} にセットされました`); // 🌟ログ用
          
        } else {
          await prisma.scheduledPost.update({
            where: { id: post.id },
            data: { status: "POSTED" },
          });
          console.log(`✅ 通常投稿完了: POSTEDにしました`); // 🌟ログ用
        }

      } catch (error) {
        console.error(`❌ Post ID ${post.id} でエラー発生:`, error);
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: { status: "FAILED" },
        });
      }
    }

    return NextResponse.json({ success: true, processedCount: pendingPosts.length });

  } catch (error) {
    console.error("🚨 Cron API 全体エラー:", error);
    return NextResponse.json({ error: "自動投稿処理の途中でエラーが発生しました" }, { status: 500 });
  }
}