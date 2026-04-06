"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/config";

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  plan: string;
  remaining_credits: number;
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // 处理 OAuth 回调中的 session token
  useEffect(() => {
    const sessionParam = searchParams.get("session");
    const subscriptionReturn = searchParams.get("subscription_return");
    const subscriptionCancel = searchParams.get("subscription_cancel");

    if (sessionParam) {
      // 保存 session token 到 localStorage
      localStorage.setItem("session_token", sessionParam);
      setShowWelcome(true);
      // 清除 URL 参数
      window.history.replaceState({}, "", "/profile");
    }

    if (subscriptionReturn === "1") {
      setShowWelcome(true);
      window.history.replaceState({}, "", "/profile");
    }

    if (subscriptionCancel === "1") {
      alert("订阅已取消");
      window.history.replaceState({}, "", "/profile");
    }
  }, [searchParams]);

  // 获取用户信息
  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("session_token");
        if (!token) {
          setIsLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          localStorage.removeItem("session_token");
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleUpgrade = async () => {
    const token = localStorage.getItem("session_token");
    if (!token) {
      window.location.href = "/login?redirect=/profile";
      return;
    }

    setSubscriptionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/paypal/create-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: "pro" }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.approvalUrl) {
          window.location.href = data.approvalUrl;
        }
      } else {
        const data = await res.json();
        alert(data.error || "订阅创建失败");
      }
    } catch (err) {
      console.error("Subscription error:", err);
      alert("订阅服务错误，请稍后重试");
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("session_token");
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore
      }
    }
    localStorage.removeItem("session_token");
    setUser(null);
  };

  const credits = user?.remaining_credits ?? 0;
  const isPro = user?.plan === "pro";

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">个人中心</span>
        </h1>

        {/* Welcome Banner */}
        {showWelcome && (
          <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <p className="font-semibold text-green-400">登录成功！</p>
                <p className="text-sm text-purple-200/60">欢迎回来，正在刷新页面...</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-3 text-purple-200/60">加载中...</p>
          </div>
        )}

        {/* Not logged in */}
        {!isLoading && !user && (
          <>
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <p className="text-lg font-semibold">访客用户</p>
                  <p className="text-sm text-purple-300/60">登录以同步生成记录</p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 text-center">
              <p className="text-purple-200/80 mb-4">
                登录后可享受每日免费生成次数和更多高级风格
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 rounded-xl font-semibold btn-primary"
              >
                立即登录 / 注册
              </Link>
            </div>
          </>
        )}

        {/* Logged in - User Info */}
        {user && (
          <>
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-4">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl">
                    👤
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-lg font-semibold">{user.name || "用户"}</p>
                  <p className="text-sm text-purple-300/60">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm rounded-lg glass-card hover:bg-purple-500/10 transition-colors"
                >
                  退出
                </button>
              </div>
            </div>

            {/* Credits */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">今日剩余次数</h2>
                <span className="text-2xl font-bold text-purple-400">
                  {isPro ? "∞" : credits}
                </span>
              </div>
              {!isPro && (
                <div className="w-full h-2 bg-purple-900/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all"
                    style={{ width: `${Math.min((credits / 3) * 100, 100)}%` }}
                  />
                </div>
              )}
              <p className="text-xs text-purple-300/60 mt-2">
                {isPro ? "Pro 用户无限次生成" : "每日 00:00 重置"}
              </p>
            </div>

            {/* Subscription */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">订阅计划</h2>
              <div className="space-y-4">
                {/* Free Plan */}
                <div
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    !isPro
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

                {/* Pro Plan */}
                <div
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    isPro
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-purple-500/30 bg-purple-900/10 hover:border-purple-500/50"
                  }`}
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
                    </div>
                  </div>
                </div>

                {!isPro && (
                  <button
                    onClick={handleUpgrade}
                    disabled={subscriptionLoading}
                    className="w-full py-3 rounded-xl font-semibold btn-primary flex items-center justify-center gap-2"
                  >
                    {subscriptionLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        跳转 PayPal...
                      </>
                    ) : (
                      "升级到 Pro"
                    )}
                  </button>
                )}

                {isPro && (
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                    <p className="text-green-400 font-semibold">✨ 您已是 Pro 用户</p>
                    <p className="text-sm text-purple-200/60 mt-1">享受无限次生成</p>
                  </div>
                )}
              </div>
            </div>

            {/* Generation History CTA */}
            <div className="glass-card rounded-2xl p-6 text-center">
              <p className="text-purple-200/80 mb-4">
                前往生成页面创建您的第一个 AI 头像
              </p>
              <Link
                href="/generate"
                className="inline-block px-6 py-3 rounded-xl font-semibold btn-primary"
              >
                开始生成 🎭
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
