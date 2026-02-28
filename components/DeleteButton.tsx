"use client"; // 🌟ここが重要！この部品はブラウザ側で動かすという宣言です

export default function DeleteButton({ id, deleteAction }: { id: string, deleteAction: (formData: FormData) => void }) {
  return (
    <form
      action={deleteAction}
      onSubmit={(e) => {
        if (!confirm("本当にこの投稿スケジュールを削除しますか？")) {
          e.preventDefault(); // キャンセルされたら削除をストップ
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors">
        削除
      </button>
    </form>
  );
}