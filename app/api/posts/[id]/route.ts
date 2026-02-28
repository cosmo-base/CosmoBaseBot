import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ① 編集画面を開いた時に、既存のデータを読み込む処理
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    // 🌟 変更：Next.js 15の新ルールに合わせ、awaitでidを取り出す
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

// ② 編集画面で「更新する」を押した時に、データを上書き保存する処理
export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    // 🌟 変更：ここも同様にawaitで取り出す
    const params = await props.params;
    const id = params.id;

    const data = await request.json();
    const updatedPost = await prisma.scheduledPost.update({
      where: { id },
      data: {
        discord_channel_id: data.discordChannelId,
        discord_content: data.discordContent,
        post_at: new Date(data.postAt),
        // 画像が新しく選ばれた場合のみ、画像データも上書きする
        ...(data.imageFileIds !== undefined && { image_file_ids: data.imageFileIds }),
      },
    });
    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error) {
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}