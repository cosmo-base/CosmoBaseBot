"use client";

import { useState } from "react";
import { DISCORD_CHANNELS } from "@/lib/discord-channels";

export default function CreatePost() {
  const [discordChannelId, setDiscordChannelId] = useState("");
  const [discordContent, setDiscordContent] = useState("");
  const [postAt, setPostAt] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  
  // 🌟追加：定期投稿用のState（状態管理）
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("WEEKLY"); // デフォルトは「毎週」

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = () => {
    if (!discordChannelId) return false;
    if (!postAt) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    setIsSubmitting(true);

    try {
      let base64Images: string[] = [];

      if (imageFiles.length > 0) {
        const convertToBase64 = (file: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
          });
        };
        base64Images = await Promise.all(imageFiles.map(convertToBase64));
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postToDiscord: true,
          postToX: false,
          discordChannelId,
          discordContent,
          xContent: null,
          postAt: new Date(postAt).toISOString(),
          
          // 🌟追加：APIに定期投稿の設定も送る
          isRecurring: isRecurring,
          recurrencePattern: isRecurring ? recurrencePattern : null,
          
          usePoll: false,
          pollOptions: null,
          pollDuration: null,
          imageFileIds: base64Images.length > 0 ? base64Images : null, 
        }),
      });

      if (response.ok) {
        alert("スケジュールの保存が完了しました！🎉");
        window.location.href = "/";
      } else {
        alert("保存エラーが発生しました");
      }
    } catch (error: any) {
      alert(error.message || "通信エラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-12">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">時間指定投稿の作成</h1>
            <p className="text-slate-500 mt-2 font-medium">指定した日時にDiscordへ自動で投稿します</p>
          </div>
          <a href="/" className="px-5 py-2.5 bg-white border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            戻る
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
                placeholder="@everyone CosmoBaseのオープニングイベントのお知らせです！&#13;&#10;詳細はこちら..."
                value={discordContent}
                onChange={(e) => setDiscordContent(e.target.value)}
              />
            </div>
          </section>

          <hr className="border-slate-100" />

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
              画像を添付
            </h2>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors">
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    setImageFiles(Array.from(e.target.files));
                  }
                }}
                className="hidden" 
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer block">
                <div className="text-4xl mb-2">📸</div>
                <p className="text-slate-600 font-bold mb-1">クリックして画像を選択</p>
                <p className="text-slate-400 text-sm">※ 複数枚の選択が可能です</p>
              </label>
              {imageFiles.length > 0 && (
                <div className="mt-4 text-left bg-white p-3 rounded-lg border border-slate-200">
                  <p className="text-sm font-bold text-slate-700 mb-1">選択中の画像:</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {imageFiles.map((file, i) => (
                      <li key={i}>・ {file.name}</li>
                    ))}
                  </ul>
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

          {/* 🌟追加：ここが定期投稿の設定エリアです！ */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
              定期投稿（繰り返し）の設定
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="isRecurring" className="font-bold text-slate-700 cursor-pointer">
                この投稿を定期的に繰り返す
              </label>
            </div>

            {isRecurring && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl ml-8">
                <label className="block text-slate-700 font-bold mb-2 text-sm">繰り返しの間隔</label>
                <select
                  value={recurrencePattern}
                  onChange={(e) => setRecurrencePattern(e.target.value)}
                  className="w-full max-w-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700"
                >
                  <option value="DAILY">毎日（設定した時刻に）</option>
                  <option value="WEEKLY">毎週（同じ曜日の同じ時刻に）</option>
                  <option value="MONTHLY">毎月（同じ日付の同じ時刻に）</option>
                </select>
              </div>
            )}
          </section>

          <div className="pt-6">
            <button 
              onClick={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-lg transition-colors shadow-md"
            >
              {isSubmitting ? "保存中..." : "スケジュールを保存する"} 
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}