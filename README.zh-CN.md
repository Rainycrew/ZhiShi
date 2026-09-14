# 知时 · Zhishi

[English](README.md) | **简体中文**

![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-6-119eff?logo=capacitor&logoColor=white)
![后端](https://img.shields.io/badge/后端-无-22604f)
![离线](https://img.shields.io/badge/离线可用-是-f2bf1e)

> **纯本地、无后端的 Vue 3 平板应用**：考试广播系统 + 时钟工作台（翻页钟 / 正计时 / 倒计时 / 番茄钟 / 白噪音）+ 计划打卡与勋章 + 个人档案（证书 / 奖状 / 心情日记 / 数据备份）。
>
> 适配**平板横屏 / 手机竖屏 / 桌面宽屏**；**不需要服务器、不需要登录、不联网、不上传任何数据**，所有内容保存在本机浏览器（localStorage + IndexedDB）。

---

## 目录

- [一、功能总览](#一功能总览)
- [二、技术栈与环境要求](#二技术栈与环境要求)
- [三、快速开始](#三快速开始)
- [四、目录结构](#四目录结构)
- [五、音频系统：五个来源与替换方法](#五音频系统五个来源与替换方法)
- [六、配置参考（src/config.js）](#六配置参考srcconfigjs)
- [七、数据存储、备份与重置](#七数据存储备份与重置)
- [八、数据结构速查](#八数据结构速查)
- [九、积分与商城](#九积分与商城)
- [十、勋章系统](#十勋章系统)
- [十一、管理后台（独立入口，App 内不可达）](#十一管理后台独立入口app-内不可达)
- [十二、打包成 Android APK](#十二打包成-android-apk)
- [十三、便携版单文件 exe](#十三便携版单文件-exe)
- [十四、外观与常见自定义](#十四外观与常见自定义)
- [十五、开发者 / 隐藏项（请勿展示给普通用户）](#十五开发者--隐藏项请勿展示给普通用户)
- [十六、常见问题](#十六常见问题)
- [十七、已知限制与注意事项](#十七已知限制与注意事项)

---

## 一、功能总览

底部 / 侧栏共 **6 个页面**：`首页` · `考试` · `时钟` · `计划` · `商城` · `我的`。
响应式断点为 **窗口宽度 900px**：`≥900px` 显示左侧竖栏（232px 宽），`<900px` 显示底部 Dock 导航（高度 `--nav-h: 64px`，已适配 `env(safe-area-inset-*)` 安全区）。考试进行页与手机端时钟页为**无导航沉浸页**。

| 模块 | 能力 |
| --- | --- |
| **考试广播** | 普通考试 / 英语听力两种模板；按**绝对时间戳**在 4 种时间点（开考、结束前 N 分钟、结束、自定义第 N 秒）自动播放提示音；听力考试开考自动播放、考生端不可暂停；管理员凭口令控制播放 |
| **时钟工作台** | 翻页时钟、正计时、倒计时、番茄钟；6 款免费深色预设 + 商城背景皮肤 + 自定义背景图；白噪音 4 种（关闭 / 白噪音 / 雨声 / 风声）+ 商城音频皮肤；全屏 |
| **计划打卡** | 5 类计划、目标日期倒计时、每日打卡、近 30 天打卡热力条、连续打卡统计 |
| **积分与商城** | 打卡获取积分，兑换 8 类装扮（按钮皮肤 / Dock 毛玻璃 / 时钟背景 / 主题色 / 天数卡 / 头像框 / 标识徽章 / 白噪音），购买后永久拥有 |
| **勋章成就** | 20 枚勋章、4 个等级（铜 / 银 / 金 / 曜），覆盖打卡、专注、考试、证书、日记等行为 |
| **个人档案** | 证书与奖状（可配图）、专注记录与 7 日柱状图、心情日记（5 档心情配图）、头像与称号、数据备份导出导入、分类清理、恢复出厂 |
| **成就卡导出** | 一键把学习统计绘制成 1080×1560 的 PNG 成就卡（Canvas 绘制，可保存或系统分享） |

**为什么"无后端"也能用**：所有音频提示音都用 WebAudio 实时合成或读本地文件，所有数据都落在浏览器本地，因此断网、无服务器也能完整运行。

---

## 二、技术栈与环境要求

| 项 | 说明 |
| --- | --- |
| 框架 | Vue 3（`^3.5.13`，Composition API + `<script setup>`） |
| 构建 | Vite 6（`^6.0.7`）+ `@vitejs/plugin-vue` |
| 移动端 | Capacitor 6（core / android / splash-screen / status-bar / filesystem / share） |
| 动效 | GSAP `^3.15.0`（页面入场、打卡庆祝粒子、成就卡弹层） |
| 路由 | **自研极简 hash 路由**（`src/router.js`），未使用 vue-router |
| 持久化 | localStorage + IndexedDB，无数据库、无接口、无账号 |
| Node.js | **≥ 18（建议 20 LTS 或更高）** |

**浏览器要求**：需支持 `localStorage`、`IndexedDB`、`WebAudio`、`requestFullscreen`。
用 `file://` 直接打开 `dist/index.html` 可能因浏览器安全策略受限（IndexedDB / fetch manifest 会失败），**请用任意静态服务器**：`npm run preview` 或 `npx http-server dist`。

---

## 三、快速开始

```bash
# 1. 进入项目
cd zhishi-app

# 2. 安装依赖（仅首次）
npm install

# 3. 生成占位提示音（可选，写入 public/audio/ 的示例 wav）
npm run gen:audio

# 4. 开发预览 → http://localhost:5173
npm run dev

# 5. 打包生产 → dist/（纯静态，可放到任意静态服务器或目录）
npm run build

# 6. 本地预览打包产物 → http://localhost:4173
npm run preview
```

**全部 npm 脚本**

| 脚本 | 作用 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器（`host: true`，端口 5173） |
| `npm run build` | 生产构建到 `dist/`（多入口，含 `index.html` 与 `admin.html`） |
| `npm run preview` | 预览 `dist/` 构建产物 |
| `npm run gen:audio` | 生成占位提示音（`scripts/generate-placeholder-audio.mjs`） |
| `npm run build:portable` | 只构建主应用（无后台）到 `release/dist`，供便携版 exe 使用 |
| `npm run assets` | 用 `resources/` 生成 Android 图标与启动页（System.Drawing，无需 sharp） |
| `npm run android:sync` | `cap sync android`（同步 `dist/` + 插件到原生工程） |
| `npm run android:open` | 打开 Android Studio |

> **Windows 提示**：若 `npm` 报执行策略错误，改用 `npm.cmd ...`。

---

## 四、目录结构

```
zhishi-app/
├─ index.html                    # 主应用入口（App 本体）
├─ admin.html                    # 管理后台入口（独立 Vite 入口）
├─ vite.config.js                # 双入口构建（main + admin）
├─ vite.dist.config.js           # 便携版构建（仅 main，输出 release/dist）
├─ capacitor.config.ts           # Capacitor 配置（appId / 名称 / 启动页 / 横屏说明）
├─ package.json
├─ README.md                     # 英文说明（GitHub 默认显示）
├─ README.zh-CN.md               # 中文说明（本文件）
├─ README-便携版.md              # 便携版 exe 说明
├─ manage_shop.py                # 商城数据管理工具（tkinter，改写 src/lib/skins.js）
├─ manage_admin.py               # 勋章 & 导出样式的解析/生成（库 + 自测，无服务）
├─ shop_admin_server.py          # 管理后台启动器（vite dev + 本地 API 8700 + 打开 admin.html）
├─ resources/                    # App 图标 / 启动页源图（icon.png 1024²、splash.png 2732²）
│  └─ README.md
├─ android/                      # Android 原生工程（npx cap add android 生成）
├─ public/
│  ├─ audio/                     # 通用提示音文件夹
│  │  ├─ manifest.json           # 文件登记表（App 运行时读取）
│  │  ├─ README.md
│  │  ├─ *.wav                   # 占位音（npm run gen:audio 生成）
│  │  └─ kaoshi/                 # 「考试专栏」真实音频（config.js 的 EXAM_SOUNDS 引用）
│  ├─ img/                       # 图标、头像框、标识、白噪音、心情、导航图标
│  └─ favicon.png / favicon.svg
├─ scripts/
│  ├─ generate-placeholder-audio.mjs
│  ├─ generate-android-res.ps1   # System.Drawing 生成 Android 图标/启动页
│  └─ portable_server.py         # 便携版 exe 的本地静态服务器（仅监听 127.0.0.1）
├─ release/                      # 便携版产物（release/dist + 知时-便携版.exe）
└─ src/
   ├─ main.js / App.vue / router.js / ui.js / uiUnlocks.js / config.js / utils.js
   ├─ styles/main.css            # 全局设计令牌（:root）+ 组件样式
   ├─ lib/
   │  ├─ skins.js                # 商城 8 类商品数据 —— 由后台改写
   │  ├─ achievements.js         # 20 枚勋章定义与判定 —— 由后台改写
   │  ├─ exportStyle.js          # 成就卡导出样式 —— 由后台改写
   │  ├─ exportImage.js          # Canvas 绘制并导出成就卡
   │  ├─ backup.js               # 备份导出 / 导入恢复
   │  ├─ focus.js                # 专注记录写入 + 勋章判定广播
   │  └─ celebrate.js            # GSAP 庆祝粒子 / 光环
   ├─ store/  (state.js / media.js / dev.js)
   ├─ audio/  (engine.js / noise.js / manifest.js)
   ├─ composables/ (useNow.js / useMotion.js)
   ├─ components/                # 通用组件 + clock/ 与 profile/ 子目录
   ├─ admin/                     # 管理后台（入口 admin.html）
   └─ views/                     # HomeView / ExamCenterView / ExamEditView / ExamRunView
                                 # ClockView / PlansView / ShopView / ProfileView
```

---

## 五、音频系统：五个来源与替换方法

考试节点的提示音可以从 **4 种来源**任选，另加时钟页实时合成的白噪音：

| 来源 | 音频从哪来 | 需要文件吗 | 能否静音 |
| --- | --- | --- | --- |
| **内置提示音** `builtin` | 代码用 WebAudio 实时合成 | 不需要 | 可，每节点可单独静音 |
| **考试专栏** `folder`（kaoshi） | `public/audio/kaoshi/` 里的 4 个真实 MP3，由 `config.js` 的 `EXAM_SOUNDS` 登记 | 需要（仓库已含） | 可 |
| **audio 文件夹** `folder` | `public/audio/` 下的文件，须在 `public/audio/manifest.json` 登记 | 需要 | 可 |
| **我的音频库** `library` | 应用内上传，存 IndexedDB（kind=`audio`），可跨考试复用 | 不需要（应用内上传） | 可 |
| **听力考试音频** | 应用内上传（IndexedDB，kind=`listen`）或从音频库选 | 不需要（应用内上传） | 考生不可暂停，管理员口令解锁后可控制 |
| **时钟白噪音** | WebAudio 实时合成（白噪 / 雨声 / 风声），或商城购买的音频皮肤 | 合成不需要文件 | 可关闭，音量可调 |

「选音频」弹层（`src/components/SoundPicker.vue`）共 **4 个标签页**：`内置提示音` · `考试` · `audio 文件夹` · `我的音频库`。它最终输出下面 4 种之一的声音描述符：

```js
null                                              // 静音
{ mode: 'builtin', tone: 'begin' }                // 内置合成音
{ mode: 'folder',  file: 'kaoshi/action.MP3' }    // 文件（可含子目录）
{ mode: 'library', key: 'audio:xxx', name: 'xxx.mp3' }  // 音频库
```

### 5.1 内置合成提示音（不需要任何文件）

| id | 名称 | 声音设计（WebAudio） |
| --- | --- | --- |
| `begin` | 开考 · 上扬双音 | 659Hz → 659Hz → 988Hz，上行 |
| `warn` | 提醒 · 三连短音 | 880Hz 三角波 × 3，间隔 0.24s |
| `end` | 结束 · 下行长音 | 523Hz → 392Hz → 330Hz，下行长音 |
| `ding` | 提示 · 单音 | 784Hz + 1175Hz |

- 名称清单：`src/config.js` 的 `BUILTIN_TONES`；发声实现：`src/audio/engine.js` 的 `playBuiltin()`。
- **想新增一种内置音**：在 `engine.js` 的 `playBuiltin()` 里加一个分支（用 `tone(freq, t0, dur, peak)` 组合即可），再往 `BUILTIN_TONES` 加 `{ id, name }`。

### 5.2 替换现有占位提示音（无需改代码）

1. 打开 `public/audio/`，用真实音频**同名覆盖**占位文件即可（例如把你的 `start.mp3` 覆盖 `start.wav`），**或**把 `manifest.json` 里的 `file` 改成你的新文件名。
2. 开发模式刷新页面即可；**打包版**需把新文件放进 `dist/audio/`，或重新 `npm run build`。
3. 支持的格式由浏览器决定：`.mp3 .wav .m4a(.aac) .ogg .flac` 均可。

当前 `public/audio/manifest.json` 登记了 4 条：`start.wav`（开考提示）、`warn.wav`（提醒音）、`end.wav`（结束提示）、`custom.wav`（自定义提示）。

### 5.3 新增一个音频文件（例如监考老师语音 `teacher-note.mp3`）

```bash
# 1) 把文件放进音频文件夹
public/audio/teacher-note.mp3
```

```jsonc
// 2) 在 public/audio/manifest.json 里追加一条登记：
[
  // ...已有的条目，然后追加：
  { "file": "teacher-note.mp3", "label": "监考老师语音" }
]
```

3. 使用：开发模式刷新后 →「考试中心 → 编辑某考试 → 时间点节点 → 选音频 → audio 文件夹」即可选用。
   App 在运行时读取 `manifest.json`（带 `no-store`，本会话内会缓存，可用弹层里的「刷新」按钮重取），**新文件不需要改 Vue 代码**；打包版重新 build 即可。

> `public/audio/kaoshi/` 里的 4 个 MP3 不写进 `manifest.json`，而是由 `src/config.js` 的 `EXAM_SOUNDS` 单独登记，显示在弹层的「考试」标签页：
> `kaoshi/action.MP3`（考试开始）、`kaoshi/15min.MP3`（还剩 15 分钟）、`kaoshi/end.MP3`（考试结束）、`kaoshi/timeend.mp3`（闹钟 / 倒计时结束）。

### 5.4 想改「新考试默认带哪些节点 / 默认音」

- 位置：`src/store/state.js` 的 `createTemplate(kind)`：
  - 普通考试默认节点：`开始(start, builtin begin)`、`最后15分钟(beforeEnd 15, warn)`、`结束(end, end)`；默认时长 60 分钟；
  - 听力考试默认节点：`提醒(beforeEnd 5, warn)`、`结束(end, end)`；默认时长 30 分钟。
- 节点数据结构（存在 localStorage 的模板里）：

```js
{
  id: 'uuid', label: '最后15分钟',
  atType: 'start' | 'beforeEnd' | 'end' | 'atSec',
  value: 0,               // beforeEnd = 结束前多少分钟；atSec = 从开考起第几秒
  sound: null | { mode:'builtin', tone:'begin'|'warn'|'end'|'ding' }
        | { mode:'folder', file:'start.wav' }
        | { mode:'library', key:'audio:...', name:'xxx.mp3' }
}
```

- 触发时间换算：`start` = 0 秒；`end` = 总秒数；`beforeEnd` = 总秒数 − value×60；`atSec` = value（开考后第 N 秒）。
- 计时以**绝对时间戳**判断（`src/views/ExamRunView.vue` 的 `tick()`，200ms 一跳），即使切后台也不会错过响铃；每个节点只触发一次。

### 5.5 重新生成占位音频（开发用）

```bash
npm run gen:audio
```

会运行 `scripts/generate-placeholder-audio.mjs`，以 22050Hz 单声道 16bit PCM 合成 `start.wav / warn.wav / end.wav / custom.wav`。
想加新的占位音：在该脚本里用同样的方式生成，并同步登记 `manifest.json`。

---

## 六、配置参考（src/config.js）

| 常量 | 作用 | 当前默认值 |
| --- | --- | --- |
| `APP_NAME` | 应用名 | `"知时"` |
| `APP_TAG` | 副标题 / 标语 | `"考试 · 时钟 · 档案"` |
| `ADMIN_PASS` | 考试管理员口令（听力音频控制） | `"000"` |
| `PANEL_URL` | 数据看板默认地址（个人页可改，需开发者解锁） | `""` |
| `V_ICON_URL` | **黄V图标**：默认用 `img/yelloV.png`；换成自己的图就改这里（正方形透明底 PNG/SVG） | `` `${BASE}img/yelloV.png` `` |
| `DEV_CONTACT` | 开发者联系方式（解锁失败时展示） | `"rainycrew@qq.com"` |
| `AUDIO_DIR` | 音频文件夹相对路径 | `"audio/"` |
| `CLOCK_PRESETS` | 时钟预设背景（CSS 渐变数组） | 6 款深色：墨夜 / 深黛 / 松影 / 绛紫 / 暖褐 / 烟青 |
| `BUILTIN_TONES` | 内置提示音清单 | `begin / warn / end / ding` |
| `EXAM_SOUNDS` | 考试专栏音效（`public/audio/kaoshi/`） | 考试开始 / 还剩 15 分钟 / 考试结束 / 闹钟 |

其它关键默认值：

- 称号默认 `"普通用户"`，定义在 `src/store/state.js` 的 `defaultProfile()`（旧数据中若为 `"认证用户"` 会自动迁移为 `"普通用户"`）。
- 管理员口令与开发者口令当前都写作 `"000"`，但它们是**两处独立配置**：`config.js` 的 `ADMIN_PASS`（考试听力控制）与 `DataSection.vue` 内的 `DEV_PASS`（开发者解锁），互不影响。

---

## 七、数据存储、备份与重置

### 7.1 存储位置

- **localStorage**：**唯一键 `zhishi.pad.v1`**，保存全部结构化数据。
  字段：`profile` / `templates`（考试模板）/ `records`（考试记录）/ `certs`（证书）/ `awards`（奖状）/ `clock`（时钟偏好）/ `plans`（计划）/ `checkins`（打卡）/ `focus`（专注）/ `diary`（心情日记）/ `achievements`（勋章解锁时间）/ `points`（积分）/ `streakRewarded` / `dailyRewarded` / `skins` / `glass` / `clockskin` / `theme` / `cardskin` / `avatarframe` / `mark` / `noiseskin`。
  写入方式是 `watch(state, persist, { deep: true })` 深度监听自动落盘，并监听 `storage` 事件实现**多标签页同步**。
- **IndexedDB**：库 `zhishi-media`，版本 1，表 `files`（`keyPath: "key"`），按 `key` 存文件。key 前缀即"媒体类别"：

  | 前缀 | 用途 |
  | --- | --- |
  | `avatar:*` | 头像 |
  | `img:*` | 证书 / 奖状图片、时钟自定义背景图 |
  | `audio:*` | 我的音频库（提示音铃声） |
  | `listen:*` | 听力考试音频 |

  没有任何体积上限、压缩或配额检查；`media.url()` 返回的 objectURL 由调用方负责释放。

### 7.2 导出 / 导入（我的 → 设置 → 数据管理）

- **导出数据文件**：生成 `zhishi-backup-YYYY-MM-DD.json`。
  格式（**version 2**）：`{ app: "zhishi-pad", version: 2, exportedAt, state: {...22 个字段...}, media: [{ key, name, mime, size, addedAt, dataUrl }] }`。
  保存在原生端走 Capacitor Filesystem + 系统分享；网页端优先用 `showSaveFilePicker` 选择保存位置，否则浏览器下载；被环境拦截时可用**「查看 / 复制备份文本」**手动保存 `.json`。
- **导入数据文件**：选备份文件 → **覆盖式恢复**（不是合并）：
  1. 校验 `app === "zhishi-pad"` 与必需字段，不符则报错；
  2. **先删除全部现有媒体文件**，再写入备份中的媒体；
  3. 结构化数据整体替换，随后重新判定勋章并刷新页面。
  > 因此：**建议先导出再导入**；备份里没有的媒体文件在导入后会永久丢失。
- **清理存储**：按内容分类，共 11 类（考试记录 / 考试模板 / 证书与奖状 / 计划与打卡 / 专注记录 / 心情日记 / 勋章解锁记录 / 音频库 / 听力文件 / 图片 / 全部数据），每类**两次确认**。
  注意：清理"计划与打卡"会同时清空打卡记录；清理"音频库"或"听力文件"会把引用到它们的考试节点 / 模板引用置空。
- **恢复出厂设置**：清空全部（姓名、各类记录、媒体…）；**必须手动输入 `我已知道上述操作风险`** 才能执行。

---

## 八、数据结构速查

```js
// 个人档案 profile
{ name, title:'普通用户', vEnabled:true, avatarKey:null, panelUrl:'', setupReward:false }

// 考试模板 template
{ id, kind:'standard'|'listening', name, durationMin, createdAt, updatedAt,
  listeningKey, listeningName,            // 仅听力考试
  nodes:[ { id, label, atType, value, sound } ] }

// 考试记录 record
{ id, tplId, examName, kind, durationMin, startAt, endAt,
  status:'done'|'exit', startLabel }

// 计划 plan
{ id, title, type:'考试备考|日常学习|运动健康|兴趣技能|其他',
  targetDate:'YYYY-MM-DD', dailyMin, desc, done, doneAt, createdAt, updatedAt }

// 打卡 checkin / 专注 focus / 心情日记 diary
{ date:'YYYY-MM-DD', ts }
{ id, date, activity, type:'stopwatch|countdown|pomodoro', minutes, startAt, endAt, createdAt }
{ id, date, mood:1-5, text, createdAt, updatedAt }

// 勋章解锁记录（值 = 解锁时间戳）
state.achievements = { 'early-bird': 1712345678901, ... }

// 时钟偏好
clock: { preset:'ink', bgKey:null, showSeconds:true, showDate:true,
         noise:'off', noiseVol:0.35, mode:'clock' }

// 商城：通用 { owned:[], equipped:null } 结构
skins:  { owned:['bi'], equipped:'bi' }        // 打卡按钮（默认已拥有）
glass:  { owned:false, equipped:false }        // 毛玻璃 Dock（布尔结构，与其它槽不同）
mark:   { owned:['yelloV'], equipped:'yelloV' }// 标识徽章
```

`atType` 与 `value` 的对应关系见 [5.4](#54-想改新考试默认带哪些节点--默认音)。考试记录的 `status` 语义：`done` = 倒计时走完正常结束；`exit` = 主动退出或考试中离开页面（记为"提前退出"），只有 `done` 计入勋章统计。

---

## 九、积分与商城

### 9.1 积分获取规则

| 行为 | 积分 | 说明 |
| --- | --- | --- |
| 初始赠送 | **+5** | 首次使用即为 5 分 |
| 完善头像 + 姓名 | **+5** | 一次性；需同时设置头像和非空姓名，由 `profile.setupReward` 记录 |
| 每天打卡 | **+2** | 每个自然日**只发一次**（记录在 `dailyRewarded`）；当天取消打卡后再打卡**不会**再得 |
| 连续打卡里程碑 | **+10** | 每满 **10 / 20 / 30…** 天各一次（记录在 `streakRewarded`）；判定基于**历史最长连续天数**，断签后也无法重复领取 |

积分也可在开发者解锁后手动修改（见[第十五节](#十五开发者--隐藏项请勿展示给普通用户)）。积分与已购皮肤、毛玻璃等都会随备份一起导出。

### 9.2 商城商品（定义与价格集中在 `src/lib/skins.js`）

商城页 `src/views/ShopView.vue` 共 **8 个分类**（顶部吸顶导航可跳转）：

| 分类 | 数据 | 价格 | 素材 / 渲染方式 |
| --- | --- | --- | --- |
| 打卡按钮皮肤 | `SKINS`（6 款）+ `CUSTOM_BUTTONS` | 0 / 10 | `CheckinButton.vue` 内各自的手写动画组件；自定义按钮为参数化样式 |
| 毛玻璃 Dock | `GLASS_PRICE` | 15 | `GlassSurface.vue` 磨砂质感，替换底部导航背景 |
| 时钟工作台背景 | `CLOCK_SKINS`（3 款） | 20 / 25 | CSS 背景渐变 |
| 主页主题色 | `THEME_SKINS`（3 款） | 18 | 覆盖 10 个 CSS 变量（`--accent* / --bg* / --surface* / --line*`） |
| 打卡天数卡片 | `CARD_SKINS`（3 款） | 15 | `ShopView.vue` / `CheckinDaysCard.vue` 里的 `cp-<id>` 样式 |
| 头像框 | `AVATAR_FRAMES`（6 款） | 12 / 18 | 图片 `public/img/<id>.png`，或 `type:"ring"` 的 CSS 光环 |
| 标识徽章 | `MARK_BADGES`（7 款） | 8 | 图片 `public/img/chenghao/<id>.png`（另有开发者专属 `DEV_MARKS`，当前为空） |
| 白噪音音频 | `NOISE_SKINS`（3 款） | 5 | 音频 `public/img/baizaoyin/<id>.mp3` |

**购买 / 装备规则**：购买（扣积分、永久拥有、购买后自动装备）→ 之后可随时切换装备；每个已购分类都提供"默认"按钮用于取消装备。
逻辑在 `src/store/state.js`：`buySkin / equipSkin`（按钮皮肤）、`buyGlass / equipGlass`（毛玻璃，布尔结构）、以及通用的 `buyExtra(slot, id, price) / equipExtra(slot, id) / unequipExtra(slot)`（时钟 / 主题 / 天数卡 / 头像框 / 标识 / 白噪音）。

**商城入口**：底部或侧栏的「商城」（`#/shop`）。
**商城数据管理**：用图形工具 `python manage_shop.py`，或在 Vue 管理后台里编辑（见下一节）。

---

## 十、勋章系统

勋章定义与判定集中在 `src/lib/achievements.js`（`ACHIEVEMENTS` 数组），共 **20 枚**，分 4 个等级：`1 铜` / `2 银` / `3 金` / `4 曜`。判定由 `computeStats()` + `evaluateAchievements()` 自动完成，解锁时间写入 `state.achievements`。

| id | 名称 | 图标 | 等级 | 达成条件 |
| --- | --- | --- | --- | --- |
| `check-1` | 第一次打卡 | shield | 铜 | 完成第一次学习打卡 |
| `check-7` | 七日签到 | award | 银 | 累计打卡满 7 天 |
| `check-30` | 月月不辍 | award | 金 | 累计打卡满 30 天 |
| `streak-3` | 小步连击 | clock | 铜 | 连续打卡达到 3 天 |
| `streak-7` | 一周到底 | clock | 银 | 连续打卡达到 7 天 |
| `streak-30` | 铁打三十天 | medal | 曜 | 连续打卡达到 30 天 |
| `net-fisher` | 三天打鱼两天晒网 | cert | 铜 | 累计打卡满 5 天，却从未连续坚持 3 天（一种诚实） |
| `early-bird` | 早起的鸟儿 | sunrise | 金 | 在 5:00 – 7:00 之间完成过打卡 |
| `night-owl` | 夜行侠 | moon | 银 | 在 23:00 之后完成过一次学习 / 打卡 |
| `focus-60` | 专注一小时 | timer | 铜 | 单次专注达到 60 分钟 |
| `focus-120` | 专注大师 | timer | 金 | 单次专注达到 120 分钟 |
| `focus-600` | 日拱一卒 | flame | 曜 | 累计专注满 10 小时 |
| `exam-1` | 旗开得胜 | exam | 铜 | 完成第一场考试 |
| `exam-10` | 考场常客 | exam | 金 | 累计完成 10 场考试 |
| `plan-1` | 说到做到 | panel | 银 | 完成第一个学习计划 |
| `cert-1` | 初绽证书 | cert | 铜 | 收录第一份证书 |
| `cert-5` | 证书收藏家 | medal | 金 | 收录 5 份证书 |
| `award-1` | 荣誉之始 | award | 铜 | 收录第一张奖状 |
| `diary-1` | 写下心情 | note | 铜 | 写下第一篇心情日记 |
| `diary-30` | 日记成册 | note | 金 | 累计写下 30 篇心情日记 |

**新增勋章**：往 `ACHIEVEMENTS` 加一条 `{ id, name, icon, tier, req, cond(stats) }` 即可，`req` 是展示文案，`cond(stats)` 返回布尔值。
`stats` 可用字段：`checkinTotal`、`maxStreak`、`curStreak`、`earlyBird`、`nightOwl`、`totalFocusMin`、`focusCount`、`longestFocus`、`examDone`、`plansDone`、`certCount`、`awardCount`、`diaryCount`。
`icon` 需存在于 `src/components/Icon.vue` 的 `ICONS` 里（当前共 50 个图标：`medal / award / cert / exam / clock / shield / moon / sunrise / timer / flame / note / panel / coin / trophy / bag / lock …`）。

> 勋章墙页面标题会显示「N / 20 已解锁」，新增勋章后请同步更新 `BadgesSection.vue` 里的总数文案。
> **成就卡**：`BadgesSection` 与 `PlansView` 都提供「导出成就卡」按钮，由 `src/lib/exportImage.js` 用 `exportStyle.js` 的颜色与尺寸（默认 1080×1560）绘制 PNG，含姓名、6 项统计与最多 6 枚勋章。

---

## 十一、管理后台（独立入口，App 内不可达）

管理后台是**单独入口 `admin.html`**，与 App 完全分离：App 的 `index.html` 里**没有任何按钮或路由指向后台**，普通用户从 App 里找不到入口；同时便携版构建（`release/dist`）**不包含**后台代码。

> 说明：`npm run build` 产出的 `dist/` 里**确实会生成 `admin.html` 与对应的 `admin-*.js/css`**（因为 `vite.config.js` 配了双入口），`cap sync` 后也会进入 APK 的 `assets/public/`。它们只是**没有入口、不可达**；若要发布不含后台的包，请使用 `npm run build:portable` 的输出。

### 11.1 Vue 管理后台（推荐）

```bash
python shop_admin_server.py
```

它会自动：① 启动 vite dev（5173，若已占用则复用）；② 启动本地 API（`http://localhost:8700`）；③ 打开浏览器到 `http://localhost:5173/admin.html`。

**三个 Tab**：

- **商城**：每个商品用**真实组件**渲染（打卡按钮动画、头像框真图 / 光环、标识真图、时钟背景、主题色板、天数卡、白噪音），直接改 id / 名称 / 价格 / 描述（时钟改背景 CSS、主题改色板 JSON、头像框切图片 / 光环）。
  保存 → `POST /api/shop` 改写 `src/lib/skins.js`（`DEV_MARKS` 会保留）。
  - **自定义按钮模板**：点「下载按钮模板」拿到 `button-template.json`（含 `style`：`bg / color / radius / minW / minH / fontSize / border / shadow / label`），在外部改样式与尺寸 →「上传按钮模板」导入即生成一个新按钮皮肤；保存后写入 `CUSTOM_BUTTONS`，`CheckinButton` 会按参数渲染，商城页也会列出。
- **勋章**：增删改勋章（名称 / 图标 / 等级 / 达成条件说明），条件用「指标 + 运算符 + 数值 + 可选 且 / 或 第二条件」结构化编辑，并实时预览判定 JS；保存 → `POST /api/achievements` 改写 `src/lib/achievements.js`，保证 `evaluateAchievements()` 正确判定。
- **导出样式**：改成就卡导出的画布尺寸与颜色，右侧实时预览；保存 → `POST /api/export-style` 改写 `src/lib/exportStyle.js`（`exportImage.js` 读取它）。

> 停止：终端 **Ctrl+C**（会一并关掉它启动的 vite dev）。
> 改完想装到手机：`npm run build && npx cap sync android`，再在 Android Studio 点 Run。

### 11.2 Python 图形工具 `manage_shop.py`

无后端，用 tkinter 图形界面**直接改写 `src/lib/skins.js`**。需要 Python 3（标准库 `tkinter`，无额外依赖）。

```bash
python manage_shop.py
```

- 顶部选分类（8 类）；左边点条目，右边改 **id / 名称 / 价格 / 描述**。
- **可视化预览**：选中商品即在上方预览——头像框 / 标识显示真实图片缩略图、主题显示色板色块、时钟皮肤显示渐变、按钮皮肤 / 天数卡 / 毛玻璃显示样式示意、白噪音显示音频图标。
- **「浏览器看真实商城」按钮**：一键启动 vite dev 并打开 `#/shop`，看到与 App 完全一致的真实渲染（含 CSS 动画）——tkinter 画布无法还原 CSS 动画，精确效果请看浏览器。
- **新增 / 删除 / 保存**单个商品；素材类商品支持一键导入：头像框图片 → `public/img/<id>.png`（自动加 `type:"image"`）、标识徽章 → `public/img/chenghao/<id>.png`、白噪音音频 → `public/img/baizaoyin/<id>.mp3`（自动填 `file`）。
- 点「生成并保存 skins.js」：拷贝素材 + 重写 `src/lib/skins.js`。

> 打卡按钮与天数卡的**新增**需要额外写 Vue 组件或 `cp-<id>` 样式，工具里只开放价格 / 名称 / 描述，避免生成无法渲染的条目。

### 11.3 `manage_admin.py`

`manage_shop.py` 与后台服务共用的**解析 / 生成库**（可单独运行自测），负责 `src/lib/achievements.js` 与 `src/lib/exportStyle.js` 的读写；它本身**不启动服务、不占端口**。

---

## 十二、打包成 Android APK

本机需 **Android Studio**（含 Android SDK）；项目已配好国内镜像。

```bash
npm install
npm run build                       # 前端 → dist/
npx cap add android                 # 首次：生成 android/ 工程
npm run assets                      # 用 resources/ 生成图标 + 启动页
npx cap sync android                # 同步 dist + 插件
npm run android:open                # 打开 Android Studio，点 Run ▶ 出 APK
```

**当前工程配置（供参考）**

| 项 | 值 |
| --- | --- |
| appId / 包名 | `com.zhishi.pad` |
| 应用名 | 知时（`android/app/src/main/res/values/strings.xml`） |
| webDir | `dist` |
| versionCode / versionName | `1` / `"1.0"` |
| minSdk / targetSdk / compileSdk | 22 / 34 / 34 |
| AGP / Gradle | 8.2.1 / 8.2.1 |
| 启动页 | 显示 2500ms、自动隐藏、背景 `#f1f0ea`、`CENTER_CROP` |
| 权限 | 仅 `android.permission.INTERNET`（Capacitor 默认，应用本身不联网） |
| 屏幕方向 | 未锁定，随设备自由旋转（竖屏 ↔ 横屏） |

**要点**

- **图标 / 启动页**：源图在 `resources/`（`icon.png` 1024²、`splash.png` 2732²、自适应前景 / 背景）。`npm run assets` 用 `scripts/generate-android-res.ps1`（System.Drawing）写入 `android/app/src/main/res/`，**无需** `@capacitor/assets` 或 `sharp`（免去本地编译原生库）。需先 `npx cap add android` 生成 `android/` 再执行；脚本还会把自适应背景色固定为 `#0E2A22`。
- **国内加速（已配好）**：
  - Gradle 下载源 → **华为云**：`android/gradle/wrapper/gradle-wrapper.properties` 的 `distributionUrl`（`mirrors.huaweicloud.com/gradle/gradle-8.2.1-all.zip`）。
  - Maven 仓库加**阿里云**镜像：`android/build.gradle` 的 `repositories`。
  - **JDK 17**：Android Studio 的 **Gradle JDK** 必须选 JDK 17（Gradle 8.2.1 不支持 Java 25）。`android/gradle.properties` 已有 `org.gradle.java.home=C:/Program Files/Eclipse Adoptium/jdk-17.0.20.101-hotspot`，若你的 JDK 路径不同请改成自己的。
- **状态栏 / 主题**：`android/app/src/main/res/values/styles.xml` —— 状态栏透明、深色图标，启动后切回主主题；运行时用 `@capacitor/status-bar`（`src/main.js`）把内容铺到状态栏下 + 深色图标。
- **横屏 / 锁方向**：`MainActivity` 默认不锁方向。想锁定：在 `AndroidManifest.xml` 的 `<activity android:name=".MainActivity" ...>` 上加 `android:screenOrientation="sensor"`（不限方向）/ `"portrait"` / `"landscape"`。
- **签名**：工程的 `android/app/build.gradle` **没有 `signingConfigs` 配置块，仓库里也没有 keystore 文件**。发布正式包前需要自行创建 keystore 并补上签名配置。

**改前端后的重新构建**

```bash
npm run build
npx cap sync android
```

再在 Android Studio 点 **Run ▶**。开发时可用 `npm run dev` + `npx cap run android --live-reload` 热更新（真机需把 `capacitor.config.ts` 的 `server.url` 指向电脑局域网 IP）。

---

## 十三、便携版单文件 exe

给普通用户用的版本：**一个 exe 文件，双击就能用**，无需安装 Node.js 或 Python，程序内已内置运行库。

- 纯前端、无后台：只含主应用（`index.html` 及其资源），**不含** `admin.html` 与管理工具。
- 全程本机运行：启动时在 `127.0.0.1` 上临时选一个空闲端口开本地静态服务并打开浏览器，离线可用、不上传任何数据。
- 数据仍保存在浏览器的 localStorage / IndexedDB 里（与网页版一致），换设备不共享。

**最终用户怎么用**：把 `知时-便携版.exe` 发给对方 → 双击 → 弹出黑色小窗口（本地服务）并自动打开知时页面 → 用完直接关掉黑色窗口即退出。
> 若杀毒软件误报，通常是单文件打包程序的常见现象，点"允许运行"即可。

**开发者如何重新打包**

```bash
npm run build:portable        # ① 只重建纯前端到 release/dist（不含后台）
# ② 用 PyInstaller 打成单文件 exe
.venv\Scripts\python -m PyInstaller --onefile --name "知时-便携版" ^
  --add-data "release\dist;dist" scripts\portable_server.py
```

产物在 `release\`（当前仓库中已有 `release/知时-便携版.exe`，约 34MB，Python 3.9 + PyInstaller 6.22 打包）。

> **注意**：`README-便携版.md` 里提到的 `打包即用版.bat` **目前不在仓库中**，请按上面两条命令手动打包，或自行补一个 bat。`portable_server.py` 在打包后会从 `sys._MEIPASS/dist` 读取资源（源目录运行时读 `../release/dist`），所以 `--add-data` 的目标目录必须叫 `dist`。
> 首次打包需要 `.venv`（Python 虚拟环境）且已安装 PyInstaller；若没有，先 `python -m venv .venv` 再 `pip install pyinstaller`。

---

## 十四、外观与常见自定义

| 想改什么 | 改哪里 |
| --- | --- |
| 主题色 / 圆角 / 阴影 / 字体 | `src/styles/main.css` 顶部的 `:root` 设计令牌 |
| 主页主题色（商城可买） | `src/lib/skins.js` → `THEME_SKINS`（覆盖 10 个 CSS 变量） |
| 时钟预设背景 | `src/config.js` → `CLOCK_PRESETS` |
| 黄V 图标 | `src/config.js` → `V_ICON_URL`（或替换 `public/img/yelloV.png`） |
| 应用名 / 副标题 | `src/config.js` → `APP_NAME` / `APP_TAG`（原生端还需改 `capacitor.config.ts` 与 `strings.xml`） |
| 管理员 / 开发者口令 | `src/config.js` → `ADMIN_PASS`；`src/components/profile/DataSection.vue` → `DEV_PASS` |
| 白噪音种类 | 合成分支在 `src/audio/noise.js` 的 `play()`；选择列表在 `src/views/ClockView.vue` 的 `NOISE_TYPES` |
| 默认称号 | `src/store/state.js` → `defaultProfile().title` |
| 考试默认节点 / 时长 | `src/store/state.js` → `createTemplate()` |
| 内置提示音 | `src/config.js` → `BUILTIN_TONES` + `src/audio/engine.js` → `playBuiltin()` |
| 考试专栏音效 | `src/config.js` → `EXAM_SOUNDS` + `public/audio/kaoshi/` |
| 勋章清单 | `src/lib/achievements.js` → `ACHIEVEMENTS`（或用管理后台） |
| 成就卡样式 | `src/lib/exportStyle.js`（或用管理后台的"导出样式"页） |
| 心情档位 | `src/components/profile/DiarySection.vue` → `MOODS`（配图在 `public/img/xingqin/`） |
| 导航图标 | `src/App.vue` → `NAV_ICONS`（`public/img/*.png`） |
| 菜单项 / 页面顺序 | `src/App.vue` → `navItems` |

---

## 十五、开发者 / 隐藏项（请勿展示给普通用户）

- **考试听力控制口令**：`ADMIN_PASS = "000"`。考试进行页点「管理员控制」输入口令后，可对听力音频执行**播放 / 暂停、从头重播、跳转进度、调节音量**。考生端不提供任何暂停与回放入口。
  > 提示：该口令目前直接写在 `ListeningUpload.vue` 的界面提示文案里（"输入管理员口令 000 后可控制播放"），若要保密请一并修改。
- **称号 / 数据看板地址 / 积分数量**默认只读：点击后弹「联系开发者」。解锁入口隐藏在弹层内——在「我的 → 设置」页**连点顶部「设置」按钮 5 下**（每次点击重置 2.4 秒计时）即弹出口令框，界面不提示；输入口令通过后**仅当次编辑会话**有效，点保存自动重新上锁（解锁状态只存在内存里，刷新页面即失效）。
- **恢复出厂**必须输入 `我已知道上述操作风险`。
- **路由器行为**：`src/router.js` 会拦截浏览器返回 / 前进 / 侧滑，页面切换只能通过点导航完成（避免误触退出考试）。考试进行中还会挂 `beforeunload` 防止误关页面。

---

## 十六、常见问题

- **下载 / 导出没反应**：优先用「导出数据文件」（Chromium 会弹"选择保存位置"）；被环境拦截时用「查看 / 复制备份文本」手动存 `.json`。
- **新增的文件夹音频看不到**：确认已写 `manifest.json`，且文件名与格式浏览器支持；打包版要重新 build。若文件放在子目录（如 `kaoshi/`），`file` 要写成 `"kaoshi/xxx.mp3"`。
- **考试听不到提示音**：确认节点没有设为"静音"；浏览器需要一次用户交互后才允许播放音频，请先在页面上点一下「开始」。
- **图片 / 音频读取异常或导出报错**：读取层依赖 IndexedDB（`src/store/media.js`），若仍异常请提供控制台红字。
- **数据丢失恢复**：用备份 json「导入」即可一键恢复全部内容（含图片音频）；注意导入是**覆盖式**的。
- **刷新后时间/打卡数据不对**：本应用的时间判断全部基于**本机系统时间**，请确认设备时间正确。
- **`file://` 打开没反应**：请改用静态服务器（`npm run preview` 或 `npx http-server dist`）。

---

## 十七、已知限制与注意事项

以下是当前实现中值得知情的边界（不影响正常使用）：

- **考试进行页没有全屏功能**：只有时钟工作台提供全屏 / 退出全屏按钮。考试页的约束是 `beforeunload` 拦截 + 路由防回退 + 退出记为"提前退出"，没有防切屏 / 防录屏检测。
- **时长为整数分钟**：倒计时基于 `Date.now()` 绝对时间戳，因此**改系统时间会影响倒计时**。
- **倒计时 / 番茄钟 / 正计时的参数不持久化**：离开时钟页后，倒计时时长、番茄钟的专注与休息分钟数等会重置为默认值（背景、白噪音、显示秒等偏好是持久化的）。
- **`clock.showDate` 字段已废弃**：日期行始终显示，该字段不再被任何视图读取。
- **"全部停止"以外的音频停止**：exam run 的管理员"停止"按钮实际行为是回到开头继续播放（`stop()` 后紧跟 `play()`）。
- **图标回退**：`Icon.vue` 中不存在的图标名会静默显示为 `info` 图标（例如 `bell`、`audio` 两个名字目前就未定义）。
- **无媒体体积限制**：IndexedDB 里没有配额检查或压缩，备份文件会把所有媒体转成 base64，体积可能较大。
- **仓库未初始化 git**：项目根目录当前没有 `.git`，根 `.gitignore` 只忽略了 `node_modules/ dist/ *.local` —— **未忽略 `.venv/`、`__pycache__/`、`release/`、`android/build/`、`android/app/build/`、`android/app/src/main/assets/public/`**。若要推送到 GitHub，建议先补齐这些忽略项，并考虑加上 LICENSE。
- **发布包缺少签名材料**：见[第十二节](#十二打包成-android-apk)。

---

## 其它文档

| 文件 | 内容 |
| --- | --- |
| [README.md](README.md) | 英文说明（GitHub 默认显示） |
| [README-便携版.md](README-便携版.md) | 便携版 exe 的使用与打包说明 |
| [resources/README.md](resources/README.md) | App 图标与启动页源图说明 |
| [public/audio/README.md](public/audio/README.md) | 音频文件夹与 manifest 说明 |

**联系方式**：`rainycrew@qq.com`
