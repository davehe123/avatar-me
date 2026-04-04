"use client";

import { useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [credits] = useState(3);
  const [totalGenerations] = useState(12);

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">个人中心</span>
        </h1>

        {/* User Info */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <p className="text-lg font-semibold">访客用户</p>
              <p className="text-sm text-purple-300/60">登录以保存您的生成记录</p>
            </div>
          </div>
        </div>

        {/* Credits */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">今日剩余次数</h2>
            <span className="text-2xl font-bold text-purple-400">{credits}</span>
          </div>
          <div className="w-full h-2 bg-purple-900/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all"
              style={{ width: `${(credits / 3) * 100}%` }}
            />
          </div>
          <p className="text-xs text-purple-300/60 mt-2">每日 00:00 重置</p>
        </div>

        {/* Subscription */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">订阅计划</h2>
          <div className="space-y-4">
            <div
              className={`p-4 rounded-xl border-2 transition-colors ${
                plan === "free"
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-purple-500/30 bg-purple-900/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">免费版</p>
                  <p className="text-sm text-purple-300/60">每日 3 次生成</p>
                </div>
                <span className="text-lg font-bold">$0</span>
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                plan === "pro"
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-purple-500/30 bg-purple-900/10 hover:border-purple-500/50"
              }`}
              onClick={() => setPlan("pro")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    Pro
                    <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
                      推荐
                    </span>
                  </p>
                  <p className="text-sm text-purple-300/60">无限次 · 15+ 风格 · 无水印</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">$4.99/月</p>
                  <p className="text-xs text-purple-300/60">或 $29.99 买断</p>
                </div>
              </div>
            </div>

            {plan === "free" && (
              <button className="w-full py-3 rounded-xl font-semibold btn-primary">
                升级到 Pro
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">生成统计</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-xl bg-purple-900/20">
              <p className="text-3xl font-bold text-purple-400">{totalGenerations}</p>
              <p className="text-sm text-purple-300/60">总生成次数</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-purple-900/20">
              <p className="text-3xl font-bold text-purple-400">5</p>
              <p className="text-sm text-purple-300/60">使用的风格</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        {plan === "free" && (
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-purple-200/80 mb-4">
              登录后可同步生成记录，不丢失任何作品
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 rounded-xl font-semibold btn-primary"
            >
              立即登录 / 注册
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
