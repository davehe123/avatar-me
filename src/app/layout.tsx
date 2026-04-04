import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AvatarMe - AI 头像生成工具",
  description: "上传照片，生成保留面部相似度的个性化 AI 头像。15+ 风格可选，隐私优先。",
};

function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-purple-500/20">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎭</span>
          <span className="font-bold text-xl gradient-text">AvatarMe</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/generate"
            className="text-sm font-medium text-purple-300 hover:text-white transition-colors"
          >
            开始生成
          </Link>
          <Link
            href="/profile"
            className="text-sm font-medium text-purple-300 hover:text-white transition-colors"
          >
            个人中心
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium rounded-lg btn-primary"
          >
            登录
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-[#0a0a0f]`}>
        <NavBar />
        <main className="flex-1 pt-16">{children}</main>
        <footer className="border-t border-purple-500/20 py-8 mt-16">
          <div className="max-w-6xl mx-auto px-6 text-center text-sm text-purple-300/60">
            <p>© 2026 AvatarMe. 照片仅用于浏览器端处理，我们不存储您的原始图片。</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
