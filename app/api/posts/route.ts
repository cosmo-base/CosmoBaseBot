import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newPost = await prisma.scheduledPost.create({
      data: {
        post_to_discord: data.postToDiscord,
        post_to_x: data.postToX,
        discord_channel_id: data.discordChannelId || "",
        discord_content: data.discordContent || "",
        x_content: data.xContent || "",
        
        // フロントエンドでUTCに変換されたものを素直に保存
        post_at: data.postAt ? new Date(data.postAt) : null,

        is_recurring: data.isRecurring || false,
        recurrence_pattern: data.recurrencePattern || null,
        isDraft: data.isDraft || false,
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