import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 🌟 ブラウザのタブのアイコンを設定！
export const metadata: Metadata = {
  title: "CosmoBase Hub",
  description: "FSIF / CosmoBase 自動広報システム",
  icons: {
    icon: "/CB-mark.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  );
}