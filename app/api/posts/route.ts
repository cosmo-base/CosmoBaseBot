import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newPost = await prisma.scheduledPost.create({
      data: {
        post_to_discord: data.postToDiscord,
        post_to_x: data.postToX,
        discord_channel_id: data.discordChannelId,
        discord_content: data.discordContent,
        x_content: data.xContent,
        post_at: new Date(data.postAt),

        // 定期投稿の設定
        is_recurring: data.isRecurring || false,
        recurrence_pattern: data.recurrencePattern || null,

        // 🌟 変更：エラーの原因になっていた存在しないアンケート項目（use_pollなど）を削除しました
        image_file_ids: data.imageFileIds,
        status: "PENDING",
      },
    });
    return NextResponse.json({ success: true, post: newPost });
  } catch (error) {
    console.error("保存エラー:", error);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}