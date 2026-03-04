import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const post = await prisma.scheduledPost.findUnique({ where: { id: params.id } });
    if (!post) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: "エラーが発生しました" }, { status: 500 });
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const data = await request.json();
    const updatedPost = await prisma.scheduledPost.update({
      where: { id: params.id },
      data: {
        post_to_discord: data.postToDiscord,
        post_to_x: data.postToX,
        discord_channel_id: data.discordChannelId,
        discord_content: data.discordContent,
        x_content: data.xContent,
        
        // フロントエンドでUTCに変換されたものを素直に保存
        post_at: data.postAt ? new Date(data.postAt) : null,
        
        isDraft: data.isDraft !== undefined ? data.isDraft : false,
        is_recurring: data.isRecurring !== undefined ? data.isRecurring : false,
        recurrence_pattern: data.recurrencePattern || null,
        ...(data.imageFileIds !== undefined && { image_file_ids: data.imageFileIds }),
      },
    });
    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error("更新エラー:", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}