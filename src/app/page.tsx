import Link from "next/link";

const FEATURES = [
  {
    icon: "🔒",
    title: "隐私优先",
    desc: "照片仅用于浏览器端特征提取，不上传原图，保护您的隐私。",
  },
  {
    icon: "✨",
    title: "高相似度",
    desc: "LoRA 微调技术，精确保持面部特征，生成的头像更像您。",
  },
  {
    icon: "🎨",
    title: "多风格",
    desc: "动漫、游戏、艺术等 15+ 种风格，满足各种场景需求。",
  },
  {
    icon: "⚡",
    title: "快速生成",
    desc: "AI 驱动，通常在 10 秒内完成，随时随地生成头像。",
  },
];

const STYLES_PREVIEW = [
  { name: "日系动漫", category: "动漫", color: "#f472b6" },
  { name: "赛博朋克", category: "游戏", color: "#06b6d4" },
  { name: "油画肖像", category: "艺术", color: "#f59e0b" },
  { name: "像素头像", category: "游戏", color: "#10b981" },
  { name: "水墨动漫", category: "动漫", color: "#8b5cf6" },
  { name: "Y2K", category: "潮流", color: "#ec4899" },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-purple-300 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            已支持 Fal.ai 生成
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">AI 头像生成</span>
            <br />
            <span className="text-white">保留你的独特魅力</span>
          </h1>

          <p className="text-lg md:text-xl text-purple-200/80 mb-10 max-w-2xl mx-auto">
            上传一张照片，即可在 10 秒内生成保留面部相似度的个性化 AI 头像。
            15+ 种风格，隐私优先，不存储原图。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/generate"
              className="px-8 py-4 text-lg font-semibold rounded-xl btn-primary"
            >
              立即开始生成 →
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 text-lg font-medium rounded-xl glass-card hover:bg-purple-500/10 transition-colors"
            >
              登录 / 注册
            </Link>
          </div>

          <p className="mt-6 text-sm text-purple-300/60">
            免费用户每日可生成 3 次 · Pro 用户无限次
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 gradient-text">
            为什么选择 AvatarMe
          </h2>
          <p className="text-purple-200/60 text-center mb-16 max-w-2xl mx-auto">
            我们专注于质量、隐私和用户体验
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="glass-card rounded-2xl p-6 hover:bg-purple-500/5 transition-colors"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2 text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-purple-200/60">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Style Preview Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 gradient-text">
            15+ 创意风格
          </h2>
          <p className="text-purple-200/60 text-center mb-16 max-w-2xl mx-auto">
            从动漫到游戏，从艺术到潮流，找到属于你的风格
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {STYLES_PREVIEW.map((style) => (
              <div
                key={style.name}
                className="style-card glass-card rounded-xl p-4 text-center cursor-pointer"
              >
                <div
                  className="w-16 h-16 mx-auto mb-3 rounded-lg flex items-center justify-center text-3xl"
                  style={{ backgroundColor: `${style.color}20` }}
                >
                  🎭
                </div>
                <p className="font-medium text-white text-sm">{style.name}</p>
                <p className="text-xs text-purple-300/60 mt-1">
                  {style.category}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/generate"
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              查看全部 15+ 风格 →
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 gradient-text">
            简单透明的定价
          </h2>
          <p className="text-purple-200/60 text-center mb-16">
            选择适合您的方案
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="glass-card rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-2 text-white">免费版</h3>
              <p className="text-4xl font-bold mb-6">
                $0<span className="text-lg font-normal text-purple-300">/月</span>
              </p>
              <ul className="space-y-3 mb-8">
                {["每日 3 次生成", "3 种基础风格", "标清水印", "低分辨率下载", "标准相似度"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-purple-200/80">
                    <span className="text-green-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/generate"
                className="block w-full py-3 text-center font-medium rounded-xl glass-card hover:bg-purple-500/10 transition-colors"
              >
                立即使用
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative glass-card rounded-2xl p-8 border-purple-500/50">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-sm font-medium">
                推荐
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Pro</h3>
              <p className="text-4xl font-bold mb-6">
                $4.99<span className="text-lg font-normal text-purple-300">/月</span>
              </p>
              <ul className="space-y-3 mb-8">
                {["无限次生成", "全部 15+ 种风格", "无水印", "4K 高清下载", "优先生成队列", "高级相似度调节"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-purple-200/80">
                    <span className="text-purple-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 text-center font-medium rounded-xl btn-primary">
                升级到 Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            准备好生成您的
            <span className="gradient-text"> AI 头像</span>了吗？
          </h2>
          <p className="text-purple-200/60 mb-10">
            只需一张照片，立刻拥有独特的 AI 头像
          </p>
          <Link
            href="/generate"
            className="inline-block px-10 py-4 text-lg font-semibold rounded-xl btn-primary"
          >
            开始生成 🎭
          </Link>
        </div>
      </section>
    </div>
  );
}
