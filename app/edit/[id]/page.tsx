"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DISCORD_CHANNELS } from "@/lib/discord-channels";
import { DISCORD_ROLES } from "@/lib/discord-roles";

type Template = { id: string; name: string; content: string };

export default function EditPost() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [discordChannelId, setDiscordChannelId] = useState("");
  const [discordContent, setDiscordContent] = useState("");
  const [postAt, setPostAt] = useState("");

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTemplates();
    if (id) fetchPost();
  }, [id]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) setTemplates(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDiscordChannelId(data.discord_channel_id || "");
        setDiscordContent(data.discord_content || "");
        if (data.image_file_ids && Array.isArray(data.image_file_ids)) {
          setExistingImages(data.image_file_ids);
        }
        const dateObj = new Date(data.post_at);
        dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
        setPostAt(dateObj.toISOString().slice(0, 16));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    if (!discordChannelId) return false;
    if (!postAt) return false;
    if (!discordContent && existingImages.length === 0 && newImageFiles.length === 0) return false;
    return true;
  };

  const insertMention = (roleId: string) => {
    const mentionText = roleId === "everyone" || roleId === "here" ? `@${roleId} ` : `<@&${roleId}> `;
    setDiscordContent((prev) => prev + mentionText);
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName || !discordContent) return;
    setIsSavingTemplate(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTemplateName, content: discordContent }),
      });
      if (res.ok) {
        alert("テンプレートを保存しました！🎉");
        setNewTemplateName("");
        fetchTemplates();
      }
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    setIsSubmitting(true);
    try {
      let convertedNewImages: string[] = [];
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🌟 MarkdownとメンションをDiscord風に翻訳する魔法の関数（ネタバレ対応の最強版）
  const renderDiscordPreview = (text: string) => {
    if (!text) return <span className="text-[#949ba4] italic">メッセージを入力するとここに表示されます...</span>;

    let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-[#2b2d31] p-3 rounded-md font-mono text-xs border border-[#1e1f22] my-2 overflow-x-auto">$1</pre>');
    html = html.replace(/`([^`]+)`/g, '<code class="bg-[#2b2d31] px-1.5 py-0.5 rounded-md font-mono text-[13px]">$1</code>');

    html = html.replace(/^&gt; (.*$)/gm, '<div class="border-l-4 border-[#4f545c] pl-3 my-1 text-[#b5bac1]">$1</div>');
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" class="text-[#00a8fc] hover:underline" target="_blank">$1</a>');

    DISCORD_ROLES.forEach(role => {
      const regex = new RegExp(`&lt;@&amp;${role.id}&gt;`, 'g');
      html = html.replace(regex, `<span class="bg-[#5865F2]/30 text-[#c9cdfb] px-1 rounded font-medium">@${role.name}</span>`);
    });
    html = html.replace(/@everyone/g, `<span class="bg-[#5865F2]/30 text-[#c9cdfb] px-1 rounded font-medium">@everyone</span>`);
    html = html.replace(/@here/g, `<span class="bg-[#5865F2]/30 text-[#c9cdfb] px-1 rounded font-medium">@here</span>`);

    // 🌟 ネタバレ（スポイラー）機能追加！
    html = html.replace(/\|\|(.*?)\|\|/g, '<span class="bg-[#1e1f22] text-transparent hover:text-[#dbdee1] rounded px-1 cursor-pointer transition-colors duration-200" title="ネタバレ">$1</span>');

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/__(.*?)__/g, '<span class="underline">$1</span>');
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

    html = html.replace(/\n/g, '<br />');

    return <div dangerouslySetInnerHTML={{ __html: html }} className="text-sm text-[#dbdee1] leading-relaxed break-words" />;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xl font-bold text-slate-500">読み込み中...🚀</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">スケジュールの編集</h1>
            <p className="text-slate-500 mt-2 font-medium">登録済みの投稿内容を変更します</p>
          </div>
          <a href="/" className="px-5 py-2.5 bg-white border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            キャンセル
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側：入力フォーム */}
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
                  // 🌟 文字を濃く太くしました
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-800 font-bold"
                >
                  <option value="">チャンネルを選択してください</option>
                  {DISCORD_CHANNELS.map((channel) => (
                    <option key={channel.id} value={channel.id}>{channel.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-5 bg-white p-4 border border-slate-200 rounded-xl">
                <label className="block text-slate-700 font-bold mb-2 text-sm">💾 テンプレートから呼び出す</label>
                <select
                  onChange={(e) => {
                    const selected = templates.find(t => t.id === e.target.value);
                    if (selected) setDiscordContent(selected.content);
                  }}
                  // 🌟 文字を濃く太くしました
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none cursor-pointer bg-slate-50 text-slate-800 font-bold text-sm"
                >
                  <option value="">{templates.length === 0 ? "保存されたテンプレートはありません" : "テンプレートを選択..."}</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-indigo-900 font-bold mb-2 text-sm">📣 メンションを挿入</label>
                <div className="flex flex-wrap gap-2">
                  {DISCORD_ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => insertMention(role.id)}
                      className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs font-bold rounded-lg transition-colors border border-indigo-200"
                    >
                      {role.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-indigo-900 font-bold mb-2 text-sm">メッセージ内容</label>
                <textarea
                  rows={8}
                  className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white font-medium text-slate-800 placeholder-slate-500"
                  value={discordContent}
                  onChange={(e) => setDiscordContent(e.target.value)}
                  placeholder="ここにメッセージを入力します。&#13;&#10;**太字**、__下線__、~~取消線~~、||ネタバレ||、[リンク](URL)、> 引用、```コード``` などが使えます！"
                />

                {discordContent && (
                  <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-slate-700 font-bold mb-2 text-sm">📝 この文章を新しいテンプレートとして保存</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="テンプレート名 (例: 定例会用)"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        // 🌟 文字とプレースホルダーを濃く太くしました
                        className="flex-1 p-2 text-sm border border-slate-300 rounded bg-white outline-none focus:border-indigo-500 text-slate-800 font-bold placeholder-slate-500"
                      />
                      <button
                        onClick={handleSaveTemplate}
                        disabled={isSavingTemplate}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-sm font-bold transition-colors whitespace-nowrap"
                      >
                        {isSavingTemplate ? "保存中..." : "保存する"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                画像の確認と追加
              </h2>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors mb-6">
                <input type="file" multiple accept="image/*" onChange={(e) => e.target.files && setNewImageFiles(prev => [...prev, ...Array.from(e.target.files!)])} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="cursor-pointer block">
                  <div className="text-3xl mb-2">📸</div>
                  <p className="text-slate-600 font-bold text-sm">クリックして新しい画像を追加</p>
                </label>
              </div>

              <div className="space-y-4">
                {existingImages.length > 0 && (
                  <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-700 mb-2">💾 保存済みの画像 (クリックで削除)</p>
                    <div className="flex flex-wrap gap-2">
                      {existingImages.map((src, i) => (
                        <div key={`exist-${i}`} onClick={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))} className="relative group cursor-pointer border-2 border-transparent hover:border-red-400 rounded-lg transition-all">
                          <img src={src} alt="saved" className="w-16 h-16 object-cover rounded-md group-hover:opacity-50 transition-opacity bg-white" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">削除</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {newImageFiles.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-800 mb-2">✨ 新しく追加する画像 (クリックで取消)</p>
                    <div className="flex flex-wrap gap-2">
                      {newImageFiles.map((file, i) => (
                        <div key={`new-${i}`} onClick={() => setNewImageFiles(prev => prev.filter((_, idx) => idx !== i))} className="relative group cursor-pointer border-2 border-transparent hover:border-red-400 rounded-lg transition-all">
                          <img src={URL.createObjectURL(file)} alt="new" className="w-16 h-16 object-cover rounded-md group-hover:opacity-50 transition-opacity bg-white" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">取消</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                投稿日時を設定 <span className="text-red-500">*</span>
              </h2>
              <div className="flex gap-2 max-w-md">
                <input type="date" value={postAt ? postAt.split("T")[0] : ""} onChange={(e) => setPostAt(`${e.target.value || ""}T${postAt ? postAt.split("T")[1] : "07:00"}`)} className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-white" />
                <select value={postAt ? postAt.split("T")[1]?.split(":")[0] : "07"} onChange={(e) => setPostAt(`${postAt ? postAt.split("T")[0] : new Date().toISOString().split("T")[0]}T${e.target.value}:${postAt ? postAt.split("T")[1]?.split(":")[1] : "00"}`)} className="p-3 border border-slate-300 rounded-xl font-bold text-slate-700 cursor-pointer bg-white">
                  {Array.from({ length: 16 }).map((_, i) => <option key={i} value={(i + 7).toString().padStart(2, "0")}>{(i + 7).toString().padStart(2, "0")}時</option>)}
                </select>
                <select value={postAt ? postAt.split("T")[1]?.split(":")[1] : "00"} onChange={(e) => setPostAt(`${postAt ? postAt.split("T")[0] : new Date().toISOString().split("T")[0]}T${postAt ? postAt.split("T")[1]?.split(":")[0] : "07"}:${e.target.value}`)} className="p-3 border border-slate-300 rounded-xl font-bold text-slate-700 cursor-pointer bg-white">
                  <option value="00">00分</option>
                  <option value="30">30分</option>
                </select>
              </div>
            </section>

            <div className="pt-6">
              <button onClick={handleSubmit} disabled={!isFormValid() || isSubmitting} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-lg transition-colors shadow-md">
                {isSubmitting ? "更新中..." : "変更を保存する"}
              </button>
            </div>
          </div>

          {/* 右側：Discord リアルタイムプレビュー */}
          <div className="hidden lg:block">
            <div className="sticky top-12">
              <h3 className="text-xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                👀 Discord プレビュー
              </h3>
              <div className="bg-[#313338] text-gray-100 p-6 rounded-xl shadow-xl min-h-[300px] border border-[#1e1f22]">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 overflow-hidden">
                    <img src="https://cdn.discordapp.com/embed/avatars/0.png" alt="bot icon" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-bold text-white text-base hover:underline cursor-pointer">Cosmo Base</span>
                      <span className="bg-[#5865F2] text-white text-[10px] px-1.5 py-0.5 rounded font-bold">BOT</span>
                      <span className="text-[#949ba4] text-xs">今日 {postAt ? postAt.split("T")[1] : "00:00"}</span>
                    </div>

                    {renderDiscordPreview(discordContent)}

                    {(existingImages.length > 0 || newImageFiles.length > 0) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {existingImages.map((src, i) => (
                          <img key={`prev-ext-${i}`} src={src} alt="preview" className="max-w-[150px] max-h-[150px] rounded-lg object-cover" />
                        ))}
                        {newImageFiles.map((file, i) => (
                          <img key={`prev-new-${i}`} src={URL.createObjectURL(file)} alt="preview" className="max-w-[150px] max-h-[150px] rounded-lg object-cover" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}