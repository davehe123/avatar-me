// Worker API URL - 用于所有前端 API 调用
// 由于 Next.js 静态导出不包含 API routes，所有请求直接打到 Worker
const WORKER_URL = 
  typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_API_URL || 'https://avatar-me-api.deforde159.workers.dev')
    : undefined;

export const API_URL = WORKER_URL || '';

// 完整风格列表（带 emoji）
export const STYLE_LIST = [
  { id: "anime", name: "日系动漫", category: "anime", emoji: "🎨" },
  { id: "cartoon", name: "美式卡通", category: "anime", emoji: "🎬" },
  { id: "kpop", name: "韩系插画", category: "anime", emoji: "💃" },
  { id: "chibi", name: "Q版卡通", category: "anime", emoji: "🐱" },
  { id: "sumin", name: "水墨动漫", category: "anime", emoji: "🖌️" },
  { id: "rpg", name: "RPG角色", category: "game", emoji: "⚔️" },
  { id: "pixel", name: "像素头像", category: "game", emoji: "👾" },
  { id: "cyberpunk", name: "赛博朋克", category: "game", emoji: "🤖" },
  { id: "fantasy", name: "魔兽风格", category: "game", emoji: "🛡️" },
  { id: "steampunk", name: "蒸汽朋克", category: "game", emoji: "⚙️" },
  { id: "oil", name: "油画肖像", category: "art", emoji: "🖼️" },
  { id: "watercolor", name: "水彩插画", category: "art", emoji: "🎨" },
  { id: "sketch", name: "素描线稿", category: "art", emoji: "✏️" },
  { id: "y2k", name: "Y2K", category: "trendy", emoji: "🦋" },
  { id: "suits", name: "痞帅西装", category: "trendy", emoji: "🤵" },
];
