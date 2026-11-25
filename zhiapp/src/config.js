// 全局配置（可自行修改）

export const APP_NAME = "知时";
export const APP_TAG = "考试 · 时钟 · 档案";

// 管理员口令：考试进行中输入此密码可控制听力音频（暂停/继续/重播/跳转）
export const ADMIN_PASS = "000";

// 数据看板（可视化面板）地址 —— 预留项，可在“我的-设置”中修改（开发者权限）
export const PANEL_URL = "";

// 黄V 图标：默认使用 public/img/yelloV.png
// 想换别的：把文件放进 public/img/ 并改下面文件名，或直接填 https 完整图片地址。
// （建议正方形透明底 PNG/SVG）
const BASE = import.meta.env.BASE_URL || "./";
export const V_ICON_URL = `${BASE}img/yelloV.png`;

// 开发者联系方式（称号/看板等预留项解锁失败时展示）
export const DEV_CONTACT = "rainycrew@qq.com";

// 媒体文件夹名：音频放在 public/audio/ 下，manifest.json 登记文件名与用途
export const AUDIO_DIR = "audio/";

// 音乐文件夹里预设的背景（CSS 渐变，均为深色调，白字）
export const CLOCK_PRESETS = [
  { id: "ink", name: "墨夜", css: "radial-gradient(120% 120% at 18% 12%, #2b3440 0%, #151a21 46%, #0d1015 100%)" },
  { id: "navy", name: "深黛", css: "linear-gradient(155deg, #1d2c47 0%, #101a2e 52%, #0a0f1c 100%)" },
  { id: "pine", name: "松影", css: "radial-gradient(130% 130% at 80% 10%, #1e3a31 0%, #12231e 55%, #0b1612 100%)" },
  { id: "plum", name: "绛紫", css: "linear-gradient(160deg, #3a2440 0%, #241530 55%, #150a1c 100%)" },
  { id: "sepia", name: "暖褐", css: "radial-gradient(120% 120% at 20% 20%, #4a3626 0%, #2c2018 55%, #19110c 100%)" },
  { id: "slate", name: "烟青", css: "linear-gradient(150deg, #39404a 0%, #1f242c 50%, #101318 100%)" }
];

// 内置提示音（无需任何音频文件即可发声，用 WebAudio 合成）
export const BUILTIN_TONES = [
  { id: "begin", name: "开考 · 上扬双音" },
  { id: "warn", name: "提醒 · 三连短音" },
  { id: "end", name: "结束 · 下行长音" },
  { id: "ding", name: "提示 · 单音" }
];

// 考试专栏音效（public/audio/kaoshi/ 下）
export const EXAM_SOUNDS = [
  { file: "kaoshi/action.MP3", name: "考试开始" },
  { file: "kaoshi/15min.MP3", name: "还剩 15 分钟" },
  { file: "kaoshi/end.MP3", name: "考试结束" },
  { file: "kaoshi/timeend.mp3", name: "闹钟 / 倒计时结束" }
];
