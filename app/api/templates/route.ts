import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// テンプレート一覧を取得する（GET）
export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: "desc" }, // 新しい順に並べる
    });
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: "テンプレートの取得に失敗しました" }, { status: 500 });
  }
}

// 新しいテンプレートを保存する（POST）
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, content } = body;

    if (!name || !content) {
      return NextResponse.json({ error: "名前と本文は必須です" }, { status: 400 });
    }

    const newTemplate = await prisma.template.create({
      data: { name, content },
    });

    return NextResponse.json(newTemplate);
  } catch (error) {
    return NextResponse.json({ error: "テンプレートの保存に失敗しました" }, { status: 500 });
  }
}