"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DISCORD_CHANNELS } from "@/lib/discord-channels";

export default function EditPost() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [discordChannelId, setDiscordChannelId] = useState("");
  const [discordContent, setDiscordContent] = useState("");
  const [postAt, setPostAt] = useState("");

  // 🌟変更：画像を「既に保存されているもの」と「新しく追加するもの」に分けました
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (res.ok) {
          const data = await res.json();
          setDiscordChannelId(data.discord_channel_id || "");
          setDiscordContent(data.discord_content || "");

          // 🌟追加：保存済みの画像データ（Base64）があればStateにセットする
          if (data.image_file_ids && Array.isArray(data.image_file_ids)) {
            setExistingImages(data.image_file_ids);
          }

          const dateObj = new Date(data.post_at);
          dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
          setPostAt(dateObj.toISOString().slice(0, 16));
        } else {
          alert("データの取得に失敗しました");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchPost();
  }, [id]);

  const isFormValid = () => {
    if (!discordChannelId) return false;
    if (!postAt) return false;
    return true;
  };

  // 🌟追加：保存済みの画像をクリックして消す処理
  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // 🌟追加：新しく選んだ画像をクリックして取り消す処理
  const handleRemoveNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    setIsSubmitting(true);

    try {
      let convertedNewImages: string[] = [];

      // 新しく追加された画像だけをBase64文字列に変換する
      if (newImageFiles.length > 0) {
        const convertToBase64 = (file: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
          });
        };
        convertedNewImages = await Promise.all(newImageFiles.map(convertToBase64));
      }

      // 🌟変更：「元々あった画像」と「新しく追加した画像」を合体させる！
      const finalImages = [...existingImages, ...convertedNewImages];

      const response = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordChannelId,
          discordContent,
          postAt,
          imageFileIds: finalImages.length > 0 ? finalImages : null,
        }),
      });

      if (response.ok) {
        alert("スケジュールの更新が完了しました！🎉");
        router.push("/");
      } else {
        alert("更新エラー: 画像のサイズが大きすぎる可能性があります");
      }
    } catch (error: any) {
      alert(error.message || "通信エラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xl font-bold text-slate-500">読み込み中...🚀</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-12">
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">スケジュールの編集</h1>
            <p className="text-slate-500 mt-2 font-medium">登録済みの投稿内容を変更します</p>
          </div>
          <a href="/" className="px-5 py-2.5 bg-white border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            キャンセル
          </a>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">

          <section className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
            <h2 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
              <span className="bg-indigo-200 text-indigo-800 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
              Discord 送信設定
            </h2>

            <div className="mb-5">
              <label className="block text-indigo-900 font-bold mb-2 text-sm">送信先チャンネル <span className="text-red-500">*</span></label>
              <select
                value={discordChannelId}
                onChange={(e) => setDiscordChannelId(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700"
              >
                <option value="">チャンネルを選択してください</option>
                {/* 🌟変更：別ファイルで管理しているリストから自動で選択肢を作る */}
                {DISCORD_CHANNELS.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-indigo-900 font-bold mb-2 text-sm">メッセージ内容</label>
              <textarea
                rows={5}
                className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-800 bg-white placeholder-slate-400 font-medium"
                value={discordContent}
                onChange={(e) => setDiscordContent(e.target.value)}
              />
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* 🌟変更：画像のプレビュー・削除・追加ができるように大改修！ */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
              画像の確認と追加
            </h2>

            {/* 画像の追加ボタン */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors mb-6">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    // 新しく選んだ画像を「追加」する（既存のものに結合）
                    setNewImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer block">
                <div className="text-4xl mb-2">📸</div>
                <p className="text-slate-600 font-bold mb-1">クリックして新しい画像を追加</p>
              </label>
            </div>

            {/* サムネイル一覧表示エリア */}
            <div className="space-y-4">

              {/* 保存済みの画像 */}
              {existingImages.length > 0 && (
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                  <p className="text-sm font-bold text-slate-700 mb-3">💾 現在保存されている画像 (クリックで削除)</p>
                  <div className="flex flex-wrap gap-4">
                    {existingImages.map((src, i) => (
                      <div key={`exist-${i}`} onClick={() => handleRemoveExistingImage(i)} className="relative group cursor-pointer border-2 border-transparent hover:border-red-400 rounded-lg transition-all">
                        <img src={src} alt="saved" className="w-24 h-24 object-cover rounded-md group-hover:opacity-50 transition-opacity bg-white shadow-sm" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">削除</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 今回新しく追加する画像 */}
              {newImageFiles.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-sm font-bold text-blue-800 mb-3">✨ 新しく追加する画像 (クリックで取り消し)</p>
                  <div className="flex flex-wrap gap-4">
                    {newImageFiles.map((file, i) => (
                      <div key={`new-${i}`} onClick={() => handleRemoveNewImage(i)} className="relative group cursor-pointer border-2 border-transparent hover:border-red-400 rounded-lg transition-all">
                        {/* 選択したファイルをその場でプレビュー表示 */}
                        <img src={URL.createObjectURL(file)} alt="new" className="w-24 h-24 object-cover rounded-md group-hover:opacity-50 transition-opacity bg-white shadow-sm" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">取消</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </section>

          <hr className="border-slate-100" />

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
              投稿日時を設定 <span className="text-red-500">*</span>
            </h2>
            <input
              type="datetime-local"
              className="w-full max-w-md p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-bold bg-white"
              value={postAt}
              onChange={(e) => setPostAt(e.target.value)}
            />
          </section>

          <div className="pt-6">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-lg transition-colors shadow-md"
            >
              {isSubmitting ? "更新中..." : "変更を保存する"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}