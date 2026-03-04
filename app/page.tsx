import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import DeleteButton from "@/components/DeleteButton";
import { DISCORD_CHANNELS } from "@/lib/discord-channels";

export default async function Dashboard() {
  const session = await getServerSession();

  const deletePost = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    if (id) {
      await prisma.scheduledPost.delete({ where: { id } });
      revalidatePath("/");
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center p-12 bg-white rounded-2xl shadow-xl border border-slate-100">
          {/* 🌟 ログイン画面のロゴ */}
          <img src="/CB-mark.png" alt="CosmoBase" className="w-24 h-24 object-cover bg-white mx-auto mb-6 rounded-2xl shadow-md" />
          <h1 className="text-4xl font-extrabold mb-3 text-slate-800 tracking-tight">CosmoBase Hub</h1>
          <p className="text-slate-500 mb-10 font-medium">FSIF 広報・SNS自動投稿システム</p>
          <a href="/api/auth/signin" className="inline-block bg-[#5865F2] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#4752C4] transition-colors shadow-md">
            Discordでログイン
          </a>
        </div>
      </div>
    );
  }

  // 下書きも含めて取得
  const scheduledPosts = await prisma.scheduledPost.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" }, // 🌟 作成順に並び替え（日時未定があるため）
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* サイドバー */}
      <div className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-10">
        <div className="p-8 flex items-center gap-3">
          {/* 🌟 サイドバーのロゴ */}
          <img src="/CB-mark.png" alt="logo" className="w-12 h-12 object-cover rounded-xl shadow-sm bg-white" />
          <div>
            <h2 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              CosmoBase
            </h2>
            <p className="text-slate-400 text-[10px] mt-1 font-semibold tracking-widest uppercase">Bot Management</p>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <a href="/" className="block p-4 bg-slate-800/80 text-blue-400 rounded-xl font-bold border border-slate-700/50">📊 ダッシュボード</a>
          <a href="/create" className="block p-4 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-medium">📝 新規投稿（時間指定）</a>
        </nav>
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4 mb-6 px-2">
            <img src={session.user?.image || ""} alt="icon" className="w-10 h-10 rounded-full border-2 border-slate-700" />
            <span className="text-sm font-bold truncate text-slate-200">{session.user?.name}</span>
          </div>
          <a href="/api/auth/signout" className="block w-full text-center text-sm font-bold bg-slate-800 text-slate-400 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 border border-slate-700 transition-all">
            ログアウト
          </a>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 p-12 overflow-y-auto">
        <div className="mb-10 border-b border-slate-200 pb-6 flex justify-between items-end">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-extrabold text-slate-800">ダッシュボード</h1>
          </div>
          <a href="/create" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md inline-block">
            ＋ 新しい投稿を作成
          </a>
        </div>

        {scheduledPosts.length === 0 ? (
          <div className="bg-white p-16 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="text-6xl mb-6">🚀</div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">まだ予約された投稿はありません</h3>
            <p className="text-slate-500">右上のボタンから、最初の投稿スケジュールを作成しましょう。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {scheduledPosts.map((post) => (
              <div key={post.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:border-blue-300 transition-colors">
                <div className="flex items-start gap-6 w-full">

                  {/* 日時表示＆下書きバッジ */}
                  <div className="bg-slate-100 p-4 rounded-xl text-center min-w-[120px] shrink-0 relative">
                    {/* 🌟 下書きバッジ！ */}
                    {post.isDraft && (
                      <span className="absolute -top-3 -right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md z-10">
                        下書き
                      </span>
                    )}

                    {post.post_at ? (
                      <>
                        <div className="text-sm text-slate-500 font-bold mb-1">
                          {/*サーバー（Vercel）環境でも確実に日本時間で表示させる最強の書き方 */}
                          {new Intl.DateTimeFormat('ja-JP', {
                            timeZone: 'Asia/Tokyo',
                            month: 'short',
                            day: 'numeric'
                          }).format(new Date(post.post_at))}
                        </div>
                        <div className="text-xl font-extrabold text-slate-800">
                          {new Intl.DateTimeFormat('ja-JP', {
                            timeZone: 'Asia/Tokyo',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false // 24時間表記に固定
                          }).format(new Date(post.post_at))}
                        </div>
                      </>
                    ) : (
                      <div className="text-slate-400 font-bold py-2">日時未定</div>
                    )}
                  </div>

                  {/* 内容表示 */}
                  <div className="flex-1">
                    <div className="flex gap-2 mb-2 items-center">
                      {post.post_to_discord && <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">Discord</span>}
                      {post.post_to_x && <span className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full">𝕏 (Twitter)</span>}
                    </div>

                    {post.post_to_discord && (
                      <p className="text-slate-700 font-medium line-clamp-2 mb-2 text-sm border-l-4 border-indigo-200 pl-3">
                        <span className="text-xs text-slate-400 block mb-1">Discord:</span>
                        {post.discord_content || "（本文なし）"}
                      </p>
                    )}

                    {post.post_to_x && (
                      <p className="text-slate-700 font-medium line-clamp-2 text-sm border-l-4 border-slate-300 pl-3">
                        <span className="text-xs text-slate-400 block mb-1">X (Twitter):</span>
                        {post.x_content || "（本文なし）"}
                      </p>
                    )}

                    {post.image_file_ids && Array.isArray(post.image_file_ids) && (post.image_file_ids as string[]).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(post.image_file_ids as string[]).map((imgBase64, index) => (
                          <img key={index} src={imgBase64} alt={`添付画像 ${index + 1}`} className="w-16 h-16 object-cover rounded-md border border-slate-200 shadow-sm" />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 右端のボタン類 */}
                  <div className="flex gap-2 shrink-0 self-center">
                    <a href={`/edit/${post.id}`} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors inline-block">
                      編集
                    </a>
                    <DeleteButton id={post.id} deleteAction={deletePost} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}