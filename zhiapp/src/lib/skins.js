// ============ 商城 · 皮肤/装扮 统一目录（由 manage_shop.py 生成，请勿手改结构）============
// 每类商品都符合：购买(扣积分、永久拥有) → 装备/切换。不同类别落到不同渲染点。

export const SKIN_PRICE = 10;
export const GLASS_PRICE = 15;

// ---- 打卡按钮皮肤 ----
export const SKINS = [
  {id: "bi", name: "笔打卡动画", short: "笔", price: 0, desc: "默认 · 笔尖一点，落款成章", ownedByDefault: true},
  {id: "graffiti", name: "动感涂鸦", short: "涂", price: 10, desc: "涂鸦喷墨，随性而动"},
  {id: "astronaut", name: "太空人", short: "太", price: 10, desc: "宇宙漫游，失重打卡"},
  {id: "lighton", name: "开灯", short: "灯", price: 10, desc: "点亮台灯，照亮坚持"},
  {id: "heartstar", name: "心星摇摆", short: "星", price: 10, desc: "心与星，一起摇摆"},
  {id: "beach", name: "椰滩海洋", short: "海", price: 10, desc: "椰风海浪，度假打卡"}
];

// ---- 自定义按钮皮肤（后台下载模板->改样式->上传生成） ----
export const CUSTOM_BUTTONS = [
  
];
export function customButtonById(id) {
  return CUSTOM_BUTTONS.find((s) => s.id === id) || null;
}

// ---- 时钟工作台皮肤（背景） ----
export const CLOCK_SKINS = [
  {id: "aurora", name: "流光极光", price: 20, desc: "深蓝极光，静谧流动", css: "radial-gradient(120% 120% at 18% 12%, #244a63 0%, #13223a 48%, #0a1322 100%), radial-gradient(70% 70% at 82% 78%, rgba(96,214,180,0.25), transparent 62%), radial-gradient(60% 60% at 78% 18%, rgba(120,160,230,0.22), transparent 60%)"},
  {id: "galaxy", name: "星河", price: 20, desc: "紫夜星河，星光散落", css: "radial-gradient(120% 120% at 70% 30%, #3a2a5a 0%, #1a1430 52%, #0b0917 100%), radial-gradient(40% 40% at 24% 78%, rgba(255,200,120,0.18), transparent 60%), radial-gradient(30% 30% at 62% 22%, rgba(180,150,255,0.22), transparent 55%)"},
  {id: "glass", name: "磨砂玻璃", price: 25, desc: "通透磨砂，柔和光影", css: "linear-gradient(155deg, rgba(34,46,64,0.72), rgba(10,14,20,0.84)), radial-gradient(90% 90% at 50% 0%, rgba(140,180,230,0.28), transparent 58%), radial-gradient(70% 70% at 18% 88%, rgba(200,160,80,0.16), transparent 60%)"}
];

// ---- 主题 / 强调色皮肤 ----
export const THEME_SKINS = [
  {id: "ocean", name: "海湾青", price: 18, desc: "冷静青调，清爽专注", vars: {"--accent": "#1f6f8b", "--accent-strong": "#155d75", "--accent-tint": "#e2f0f5", "--accent-ink": "#0c3a4b", "--bg": "#eef3f4", "--bg-2": "#e3ebee", "--surface": "#ffffff", "--surface-2": "#f8fbfc", "--line": "#dbe6ea", "--line-2": "#edf3f5"}},
  {id: "sunset", name: "落日橘", price: 18, desc: "暖阳橘调，温柔有光", vars: {"--accent": "#c2612e", "--accent-strong": "#a94f22", "--accent-tint": "#faeee6", "--accent-ink": "#4a2413", "--bg": "#f7f1ec", "--bg-2": "#efe6df", "--surface": "#fffdfb", "--surface-2": "#fbf6f2", "--line": "#e9dcd3", "--line-2": "#f4ebe4"}},
  {id: "plum", name: "雾紫", price: 18, desc: "低饱和紫，雅致静谧", vars: {"--accent": "#6b4a8f", "--accent-strong": "#553a74", "--accent-tint": "#eee8f5", "--accent-ink": "#3a2753", "--bg": "#f2eef5", "--bg-2": "#ebe4f0", "--surface": "#ffffff", "--surface-2": "#faf7fc", "--line": "#e2d8ea", "--line-2": "#f0eaf5"}}
];

// ---- 打卡天数卡片皮肤 ----
export const CARD_SKINS = [
  {id: "obsidian", name: "曜石", price: 15, desc: "黑曜石配鎏金，沉稳高级"},
  {id: "sakura", name: "樱粉", price: 15, desc: "樱花粉白，温柔恬淡"},
  {id: "starlight", name: "星光", price: 15, desc: "午夜星空，梦幻闪烁"}
];

// ---- 头像框 ----
export const AVATAR_FRAMES = [
  {id: "01", name: "鎏金框", price: 12, desc: "金属浮雕外框，典雅贵气", type: "image"},
  {id: "02", name: "银辉框", price: 12, desc: "冷银细框，简约利落", type: "image"},
  {id: "03", name: "绚彩框", price: 18, desc: "渐变流光，绚丽出众", type: "image"},
  {id: "gold", name: "金色光环", price: 12, desc: "金色圆环光环，温暖提亮", type: "ring"},
  {id: "silver", name: "银灰光环", price: 12, desc: "银灰圆环光环，清爽利落", type: "ring"},
  {id: "aurora", name: "极光光环", price: 18, desc: "蓝紫渐变呼吸光环", type: "ring"}
];

// ---- 标识徽章 ----
export const MARK_PRICE = 8;
export const DEFAULT_MARK = "yelloV";
export const MARK_BADGES = [
  {id: "fenzuan", name: "粉钻", price: 8, desc: "柔粉钻石，精致可爱"},
  {id: "fenguan", name: "粉冠", price: 8, desc: "粉色小冠，元气满满"},
  {id: "huangguan", name: "皇冠", price: 8, desc: "金色皇冠，贵气十足"},
  {id: "yinghua", name: "樱花", price: 8, desc: "樱花粉，温柔治愈"},
  {id: "maomi", name: "猫咪", price: 8, desc: "软萌猫咪，乖巧加分"},
  {id: "xuesheng", name: "学生", price: 8, desc: "学生气质，清爽好学"},
  {id: "zhengtaiying", name: "正太音", price: 8, desc: "正太音，青春元気"}
];
// 开发者专属标识（不上架商城）
export const DEV_MARKS = [
  
];

// ---- 白噪音皮肤 ----
export const NOISE_PRICE = 5;
export const NOISE_SKINS = [
  {id: "huanghunshatan", name: "黄昏沙滩", price: 5, desc: "黄昏海浪，温柔治愈", file: "img/baizaoyin/huanghunshatan.mp3"},
  {id: "xiayu", name: "下雨", price: 5, desc: "淅沥雨声，助眠静心", file: "img/baizaoyin/xiayu.mp3"},
  {id: "yangguanghuwai", name: "阳光户外", price: 5, desc: "午后蝉鸣，清爽惬意", file: "img/baizaoyin/yangguanghuwai.mp3"}
];

export function skinById(id) {
  return SKINS.find((s) => s.id === id) || SKINS[0];
}

export function clockSkinById(id) {
  return CLOCK_SKINS.find((s) => s.id === id) || null;
}

export function themeById(id) {
  return THEME_SKINS.find((s) => s.id === id) || null;
}

export function cardSkinById(id) {
  return CARD_SKINS.find((s) => s.id === id) || null;
}

export function frameById(id) {
  return AVATAR_FRAMES.find((s) => s.id === id) || null;
}

export function markById(id) {
  if (!id) return null;
  if (id === DEFAULT_MARK) return { id: DEFAULT_MARK, name: "默认黄V" };
  const m = MARK_BADGES.find((s) => s.id === id);
  if (m) return m;
  return DEV_MARKS.find((s) => s.id === id) || null;
}
export function markImgUrl(id) {
  const base = (import.meta.env.BASE_URL || "./") + "img/";
  return id === DEFAULT_MARK ? base + "yelloV.png" : base + "chenghao/" + id + ".png";
}

export function noiseSkinById(id) {
  return NOISE_SKINS.find((s) => s.id === id) || null;
}
export function noiseSkinUrl(id) {
  const base = (import.meta.env.BASE_URL || "./") + "img/";
  return base + "baizaoyin/" + id + ".mp3";
}
