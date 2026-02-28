import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newPost = await prisma.scheduledPost.create({
      data: {
        post_to_discord: data.postToDiscord !== undefined ? data.postToDiscord : true,
        post_to_x: data.postToX || false,
        discord_channel_id: data.discordChannelId || "",
        discord_content: data.discordContent || "",
        x_content: data.xContent || "",
        post_at: new Date(data.postAt),

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