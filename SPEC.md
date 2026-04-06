# AvatarMe - 项目规范

> AI 头像生成工具 | v0.1.0 MVP

---

## 1. 概述与目标

**AvatarMe** 是一款 AI 头像生成工具，用户上传真人照片，生成保留面部相似度的个性化 AI 头像。

**核心目标（4周 MVP）**：
- 上传照片 → 浏览器端人脸检测（不存储原图）
- 提取面部特征向量 → 调用 Fal.ai 生成头像
- 支持 15+ 种风格选择
- 免费用户每日 3 次生成，Pro 用户无限

---

## 2. 技术架构

### 2.1 技术栈

| 层级 | 技术方案 | 说明 |
|------|----------|------|
| 前端 + 部署 | Next.js + Cloudflare Pages | 静态页面托管 |
| AI 推理 | Fal.ai (flux-schnell + LoRA) | 按量 $0.02/次 |
| 人脸检测 | face-api.js | 浏览器端，隐私友好 |
| 存储 | Cloudflare R2 | 生成图片存储 |
| 数据库 | Cloudflare D1 | 用户数据、生成记录 |
| 认证 | Cloudflare Workers + Google OAuth | 免费 |
| 后端 API | Cloudflare Workers | 业务逻辑 |
| 支付 | PayPal | 订阅 + 买断 |

### 2.2 部署架构

```
用户浏览器
    │
    ▼
前端 Next.js ──────────────────────────────────────► Cloudflare Pages
https://avatarme.pages.dev（或自定义域名）              （托管静态页面）
    │
    │ fetch() 调用 Workers API
    ▼
后端 Cloudflare Worker ◄───────────────────────────► Fal.ai API
https://avatarme-api.xxx.workers.dev
    │
    ├──► Cloudflare D1 (用户数据/次数限制)
    ├──► Cloudflare R2 (生成图片)
    └──► Fal.ai (AI 生成)
```

---

## 3. 功能清单

### 3.1 MVP 功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 照片上传 | TODO | 支持拖拽/点击，浏览器端预览 |
| 人脸检测 | TODO | face-api.js 提取 68/468 点特征 |
| 相似度调节 | TODO | 滑块 60%-95% |
| AI 生成 | TODO | Fal.ai flux-schnell |
| 风格选择 | TODO | 15+ 预设风格网格 |
| 下载 | TODO | 免费版标流水印 |
| 用户注册/登录 | TODO | 邮箱 + Google OAuth |
| 每日次数限制 | TODO | 免费每日 3 次 |
| Pro 订阅 | TODO | PayPal 月付 $4.99 |
| Pro 买断 | TODO | PayPal 一次性 $29.99 |

### 3.2 风格列表（15种）

**动漫/卡通系（5种）**
1. 日系动漫 - 大眼睛柔和风格
2. 美式卡通 - Pixar/Disney 风
3. 韩系插画 - K-pop 偶像风
4. Q版卡通 - 圆脸萌系
5. 水墨动漫 - 国风动漫

**游戏系（5种）**
6. RPG角色 - 塞尔达/原神风
7. 像素头像 - 8-bit 复古
8. 赛博朋克 - 2077 霓虹风
9. 魔兽风格 - 史诗奇幻
10. 蒸汽朋克 - 维多利亚+机械

**艺术系（3种）**
11. 油画肖像 - 伦勃朗/梵高风
12. 水彩插画 - 手绘质感
13. 素描线稿 - 黑白铅笔画

**潮流系（2种）**
14. Y2K - 千禧年辣妹风
15. 痞帅西装 - 商业精英感

---

## 4. 数据库设计

### 4.1 D1 表结构

**users**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  paypal_email TEXT,
  plan TEXT DEFAULT 'free',
  daily_credits INTEGER DEFAULT 3,
  last_reset_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**generations**
```sql
CREATE TABLE generations (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  style TEXT,
  similarity INTEGER DEFAULT 80,
  input_features TEXT,
  output_url TEXT,
  has_watermark BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/auth/google` | Google OAuth 登录 |
| GET | `/auth/callback` | OAuth 回调 |
| GET | `/auth/me` | 获取当前用户 |
| POST | `/auth/logout` | 登出 |
| GET | `/api/user/credits` | 查询剩余次数 |
| POST | `/api/generate` | 生成头像 |
| GET | `/api/styles` | 获取风格列表 |
| POST | `/api/paypal/create-order` | 创建一次性订单 |
| POST | `/api/paypal/capture-order` | 捕获订单 |
| POST | `/api/paypal/create-subscription` | 创建订阅 |
| POST | `/api/paypal/webhook` | PayPal Webhook |

---

## 6. 页面结构

```
/                    首页 - Hero + 上传入口
/generate            生成页 - 上传 + 风格选择 + 生成
/profile             个人中心 - 次数 / 订阅管理
/login               登录页
```

---

## 7. 开发进度

### Week 1：核心功能 ✅ (基本完成)
- [x] 项目初始化 (Next.js 15.5.2 + Cloudflare Pages)
- [x] face-api.js 人脸检测集成
- [x] 15 种风格定义 (动漫/游戏/艺术/潮流)
- [x] 相似度滑块 (60%-95%)
- [x] 基础 UI + 风格选择组件
- [x] GitHub 仓库创建
- [x] Cloudflare Pages 部署上线
- [ ] Fal.ai API 调用（需 Worker 后端）
- [ ] 本地测试生成流程

### Week 2：用户系统
- [ ] Cloudflare D1 数据库初始化
- [ ] Cloudflare Worker 后端（AI 生成 API）
- [ ] 用户注册/登录（邮箱 + Google OAuth）
- [ ] 每日次数限制逻辑
- [ ] 生成记录存储
- [ ] 水印叠加功能

### Week 3：支付接入
- [ ] PayPal 商户账号申请
- [ ] PayPal JS SDK 集成
- [ ] Pro 订阅/月付/买断功能
- [ ] 支付成功 webhook 处理
- [ ] Pro 功能解锁逻辑

### Week 4：发布
- [x] Cloudflare Pages 部署
- [ ] 自定义域名绑定
- [ ] Reddit 社区推广
- [ ] Telegram 群组推广
- [ ] 收集用户反馈

---

*最后更新：2026-04-04*
