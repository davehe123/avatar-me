export const STYLES = [
  // 动漫/卡通系
  {
    id: "anime",
    name: "日系动漫",
    category: "动漫",
    prompt: "anime style, big eyes, soft lighting, Japanese anime art",
    color: "#f472b6",
  },
  {
    id: "cartoon",
    name: "美式卡通",
    category: "动漫",
    prompt: "Pixar Disney style, 3D cartoon character, vibrant colors",
    color: "#3b82f6",
  },
  {
    id: "kpop",
    name: "韩系插画",
    category: "动漫",
    prompt: "K-pop idol style, Korean illustration, detailed hair",
    color: "#ec4899",
  },
  {
    id: "chibi",
    name: "Q版卡通",
    category: "动漫",
    prompt: "chibi style, cute round face, big head small body",
    color: "#fb923c",
  },
  {
    id: "sumin",
    name: "水墨动漫",
    category: "动漫",
    prompt: "Chinese ink painting style anime, traditional East Asian art",
    color: "#6366f1",
  },
  // 游戏系
  {
    id: "rpg",
    name: "RPG角色",
    category: "游戏",
    prompt: "fantasy RPG game character, Zelda Genshin style",
    color: "#10b981",
  },
  {
    id: "pixel",
    name: "像素头像",
    category: "游戏",
    prompt: "pixel art style avatar, 16-bit retro game character",
    color: "#8b5cf6",
  },
  {
    id: "cyberpunk",
    name: "赛博朋克",
    category: "游戏",
    prompt: "cyberpunk 2077 style, neon lights, futuristic",
    color: "#06b6d4",
  },
  {
    id: "fantasy",
    name: "魔兽风格",
    category: "游戏",
    prompt: "epic fantasy Warcraft style, ornate armor, dramatic",
    color: "#f59e0b",
  },
  {
    id: "steampunk",
    name: "蒸汽朋克",
    category: "游戏",
    prompt: "steampunk Victorian style, mechanical gears, brass",
    color: "#d97706",
  },
  // 艺术系
  {
    id: "oil",
    name: "油画肖像",
    category: "艺术",
    prompt: "oil painting portrait, Rembrandt style, dramatic lighting",
    color: "#f59e0b",
  },
  {
    id: "watercolor",
    name: "水彩插画",
    category: "艺术",
    prompt: "watercolor illustration style, soft brush strokes",
    color: "#14b8a6",
  },
  {
    id: "sketch",
    name: "素描线稿",
    category: "艺术",
    prompt: "pencil sketch portrait, black and white, detailed",
    color: "#64748b",
  },
  // 潮流系
  {
    id: "y2k",
    name: "Y2K",
    category: "潮流",
    prompt: "Y2K 2000s style, butterfly clips, low rise, blonde",
    color: "#f472b6",
  },
  {
    id: "suits",
    name: "痞帅西装",
    category: "潮流",
    prompt: "handsome businessman suit style, sharp jawline, confident",
    color: "#1e293b",
  },
];

export const BASIC_STYLES = STYLES.filter((s) =>
  ["anime", "cartoon", "oil"].includes(s.id)
);

export const CATEGORIES = [
  { id: "all", name: "全部" },
  { id: "动漫", name: "动漫/卡通" },
  { id: "游戏", name: "游戏" },
  { id: "艺术", name: "艺术" },
  { id: "潮流", name: "潮流" },
];
