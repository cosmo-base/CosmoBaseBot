import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = params.id;

    const post = await prisma.scheduledPost.findUnique({
      where: { id },
    });

    if (!post) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: "エラーが発生しました" }, { status: 500 });
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = params.id;

    const data = await request.json();
    const updatedPost = await prisma.scheduledPost.update({
      where: { id },
      data: {
        discord_channel_id: data.discordChannelId,
        discord_content: data.discordContent,
        x_content: data.xContent || "",
        post_at: new Date(data.postAt),

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