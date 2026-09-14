# 知时 · Zhishi

**English** | [简体中文](README.zh-CN.md)

![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-6-119eff?logo=capacitor&logoColor=white)
![Backend](https://img.shields.io/badge/backend-none-22604f)
![Offline](https://img.shields.io/badge/offline--first-yes-f2bf1e)

> **A fully local, backend-free Vue 3 tablet app**: an exam broadcast system + a clock workstation (flip clock / stopwatch / countdown / Pomodoro / white noise) + study plans, check-ins and badges + a personal archive (certificates, awards, mood diary, data backup).
>
> Built for **tablet landscape, phone portrait and desktop widescreen**. **No server, no login, no network, no data ever leaves the device** — everything is stored in the local browser (localStorage + IndexedDB).

---

## Table of Contents

- [1. Features at a Glance](#1-features-at-a-glance)
- [2. Tech Stack & Requirements](#2-tech-stack--requirements)
- [3. Quick Start](#3-quick-start)
- [4. Project Structure](#4-project-structure)
- [5. The Audio System: Five Sources & How to Replace Them](#5-the-audio-system-five-sources--how-to-replace-them)
- [6. Configuration Reference (src/config.js)](#6-configuration-reference-srcconfigjs)
- [7. Data Storage, Backup & Reset](#7-data-storage-backup--reset)
- [8. Data Structures Cheat Sheet](#8-data-structures-cheat-sheet)
- [9. Points & Shop](#9-points--shop)
- [10. Achievements](#10-achievements)
- [11. Admin Back Office (Separate Entry, Unreachable from the App)](#11-admin-back-office-separate-entry-unreachable-from-the-app)
- [12. Building an Android APK](#12-building-an-android-apk)
- [13. Portable Single-File EXE](#13-portable-single-file-exe)
- [14. Theming & Common Customizations](#14-theming--common-customizations)
- [15. Developer / Hidden Features](#15-developer--hidden-features)
- [16. FAQ](#16-faq)
- [17. Known Limitations & Notes](#17-known-limitations--notes)

---

## 1. Features at a Glance

There are **6 pages** in the bottom dock / side rail: `Home` · `Exam` · `Clock` · `Plans` · `Shop` · `Me`.
The responsive breakpoint is a **window width of 900px**: at `≥900px` a 232px left rail is shown; below that a bottom dock is used (`--nav-h: 64px`, safe-area aware via `env(safe-area-inset-*)`). The running-exam page and the phone-portrait clock page are **chrome-less immersive pages**.

| Module | What it does |
| --- | --- |
| **Exam broadcast** | Two template kinds (standard / English listening). Cue sounds fire from **absolute timestamps** at 4 kinds of cue point (exam start, N minutes before the end, exam end, and an arbitrary Nth second). Listening audio autoplays at start and candidates cannot pause it; an admin password unlocks playback control |
| **Clock workstation** | Flip clock, stopwatch, countdown, Pomodoro; 6 free dark presets + shop background skins + a custom background image; 4 white-noise options (off / white / rain / wind) + purchasable audio skins; fullscreen |
| **Plans & check-ins** | 5 plan categories, target-date countdown, daily check-in, a 30-day check-in heat strip, streak statistics |
| **Points & shop** | Earn points by checking in and spend them on 8 categories of cosmetics (button skins / frosted-glass dock / clock backgrounds / themes / day cards / avatar frames / mark badges / white noise). Purchases are permanent |
| **Achievements** | 20 badges in 4 tiers (Bronze / Silver / Gold / Obsidian), covering check-ins, focus, exams, certificates and diary entries |
| **Personal archive** | Certificates and awards (with images), focus log + 7-day bar chart, mood diary (5 moods with artwork), avatar and title, backup export/import, category-by-category cleanup, factory reset |
| **Achievement card export** | One tap renders your study statistics to a 1080×1560 PNG via Canvas (save or share through the OS) |

**Why "no backend" still works**: every cue sound is either synthesized live with WebAudio or read from a local file, and all data lives in the local browser — so the app runs completely offline with no server.

---

## 2. Tech Stack & Requirements

| Item | Detail |
| --- | --- |
| Framework | Vue 3 (`^3.5.13`, Composition API + `<script setup>`) |
| Build | Vite 6 (`^6.0.7`) + `@vitejs/plugin-vue` |
| Mobile | Capacitor 6 (core / android / splash-screen / status-bar / filesystem / share) |
| Motion | GSAP `^3.15.0` (page entrances, check-in celebration particles, achievement-card popups) |
| Routing | **Hand-rolled minimal hash router** (`src/router.js`) — no vue-router |
| Persistence | localStorage + IndexedDB. No database, no API, no account |
| Node.js | **≥ 18 (20 LTS or newer recommended)** |

**Browser requirements**: `localStorage`, `IndexedDB`, `WebAudio` and `requestFullscreen` support.
Opening `dist/index.html` over `file://` may be blocked by browser security policy (IndexedDB and the manifest fetch will fail) — **serve it from any static server** instead: `npm run preview` or `npx http-server dist`.

---

## 3. Quick Start

```bash
# 1. Enter the project
cd zhishi-app

# 2. Install dependencies (first time only)
npm install

# 3. Generate placeholder cue sounds (optional; writes sample wavs into public/audio/)
npm run gen:audio

# 4. Dev server → http://localhost:5173
npm run dev

# 5. Production build → dist/ (pure static, deployable anywhere)
npm run build

# 6. Preview the build locally → http://localhost:4173
npm run preview
```

**All npm scripts**

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server (`host: true`, port 5173) |
| `npm run build` | Production build to `dist/` (multi-entry: `index.html` **and** `admin.html`) |
| `npm run preview` | Preview the `dist/` build |
| `npm run gen:audio` | Generate placeholder cue sounds (`scripts/generate-placeholder-audio.mjs`) |
| `npm run build:portable` | Build only the main app (no back office) into `release/dist`, for the portable EXE |
| `npm run assets` | Generate Android icons and splash screens from `resources/` (System.Drawing, no sharp) |
| `npm run android:sync` | `cap sync android` (copy `dist/` + plugins into the native project) |
| `npm run android:open` | Open Android Studio |

> **Windows tip**: if `npm` fails with an execution-policy error, use `npm.cmd ...` instead.

---

## 4. Project Structure

```
zhishi-app/
├─ index.html                    # Main app entry (the app itself)
├─ admin.html                    # Admin back-office entry (separate Vite entry)
├─ vite.config.js                # Two entries (main + admin)
├─ vite.dist.config.js           # Portable build (main only → release/dist)
├─ capacitor.config.ts           # Capacitor config (appId / name / splash / orientation notes)
├─ package.json
├─ README.md                     # English docs (shown by default on GitHub)
├─ README.zh-CN.md               # Chinese docs
├─ README-便携版.md              # Portable EXE docs (Chinese)
├─ manage_shop.py                # Shop data tool (tkinter, rewrites src/lib/skins.js)
├─ manage_admin.py               # Achievements & export-style parser/generator (library + self-test, no server)
├─ shop_admin_server.py          # Admin launcher (vite dev + local API on 8700 + opens admin.html)
├─ resources/                    # App icon / splash source images (icon.png 1024², splash.png 2732²)
│  └─ README.md
├─ android/                      # Native Android project (created by npx cap add android)
├─ public/
│  ├─ audio/                     # Generic cue-sound folder
│  │  ├─ manifest.json           # File registry (read by the app at runtime)
│  │  ├─ README.md
│  │  ├─ *.wav                   # Placeholder tones (npm run gen:audio)
│  │  └─ kaoshi/                 # The "exam column" real audio (referenced by EXAM_SOUNDS)
│  ├─ img/                       # Icons, avatar frames, badges, noise, moods, nav icons
│  └─ favicon.png / favicon.svg
├─ scripts/
│  ├─ generate-placeholder-audio.mjs
│  ├─ generate-android-res.ps1   # Builds Android icons/splash with System.Drawing
│  └─ portable_server.py         # Local static server for the portable EXE (127.0.0.1 only)
├─ release/                      # Portable artifacts (release/dist + 知时-便携版.exe)
└─ src/
   ├─ main.js / App.vue / router.js / ui.js / uiUnlocks.js / config.js / utils.js
   ├─ styles/main.css            # Global design tokens (:root) + component styles
   ├─ lib/
   │  ├─ skins.js                # Shop catalog (8 categories) — rewritten by the back office
   │  ├─ achievements.js         # 20 badge definitions and conditions — rewritten by the back office
   │  ├─ exportStyle.js          # Achievement-card style — rewritten by the back office
   │  ├─ exportImage.js          # Draws and exports the achievement card on a Canvas
   │  ├─ backup.js               # Backup export / import restore
   │  ├─ focus.js                # Writes focus records + broadcasts badge evaluation
   │  └─ celebrate.js            # GSAP celebration particles / rings
   ├─ store/  (state.js / media.js / dev.js)
   ├─ audio/  (engine.js / noise.js / manifest.js)
   ├─ composables/ (useNow.js / useMotion.js)
   ├─ components/                # Shared components + clock/ and profile/ subfolders
   ├─ admin/                     # Admin back office (entry: admin.html)
   └─ views/                     # HomeView / ExamCenterView / ExamEditView / ExamRunView
                                 # ClockView / PlansView / ShopView / ProfileView
```

---

## 5. The Audio System: Five Sources & How to Replace Them

An exam cue can come from **4 different sources**, plus the white noise the clock page synthesizes live:

| Source | Where the audio comes from | Needs a file? | Mutable? |
| --- | --- | --- | --- |
| **Built-in tone** `builtin` | Synthesized live with WebAudio | No | Yes — each node can be muted individually |
| **Exam column** `folder` (kaoshi) | The 4 real MP3s in `public/audio/kaoshi/`, registered by `EXAM_SOUNDS` in `config.js` | Yes (shipped) | Yes |
| **Audio folder** `folder` | Files in `public/audio/`, which must be registered in `public/audio/manifest.json` | Yes | Yes |
| **My audio library** `library` | Uploaded in-app, stored in IndexedDB (kind=`audio`), reusable across exams | No (uploaded in-app) | Yes |
| **Listening-exam audio** | Uploaded in-app (IndexedDB, kind=`listen`) or picked from the library | No (uploaded in-app) | Candidates cannot pause it; an admin password unlocks control |
| **Clock white noise** | Synthesized live with WebAudio (white / rain / wind), or purchased audio skins | No for synthesis | Can be turned off; volume adjustable |

The sound picker (`src/components/SoundPicker.vue`) has **4 tabs**: `Built-in tones` · `Exam` · `Audio folder` · `My audio library`. It ultimately emits one of these four descriptors:

```js
null                                              // muted
{ mode: 'builtin', tone: 'begin' }                // synthesized tone
{ mode: 'folder',  file: 'kaoshi/action.MP3' }    // file (may include a subfolder)
{ mode: 'library', key: 'audio:xxx', name: 'xxx.mp3' }  // audio library
```

### 5.1 Built-in Synthesized Tones (no files needed)

| id | Label | Sound design (WebAudio) |
| --- | --- | --- |
| `begin` | Exam start · rising two-note | 659Hz → 659Hz → 988Hz, rising |
| `warn` | Reminder · triple short beep | 880Hz triangle × 3, 0.24s apart |
| `end` | Exam end · descending long tone | 523Hz → 392Hz → 330Hz, descending |
| `ding` | Cue · single tone | 784Hz + 1175Hz |

- Label list: `BUILTIN_TONES` in `src/config.js`. Synthesis: `playBuiltin()` in `src/audio/engine.js`.
- **To add a built-in tone**: add a branch in `playBuiltin()` (combine `tone(freq, t0, dur, peak)`) and append `{ id, name }` to `BUILTIN_TONES`.

### 5.2 Replace the Placeholder Tones (no code changes)

1. Open `public/audio/` and **overwrite a placeholder with a real file of the same name** (e.g. replace `start.wav` with your `start.mp3`), **or** change the `file` field in `manifest.json` to your new filename.
2. In dev mode just refresh the page. For a **packaged build**, put the new file into `dist/audio/` or re-run `npm run build`.
3. Supported formats depend on the browser: `.mp3 .wav .m4a(.aac) .ogg .flac` all work.

`public/audio/manifest.json` currently registers 4 entries: `start.wav` (exam start), `warn.wav` (reminder), `end.wav` (exam end), `custom.wav` (custom cue).

### 5.3 Add a New Audio File

Example: an invigilator voice file `teacher-note.mp3`.

```bash
# 1) Drop the file into the audio folder
public/audio/teacher-note.mp3
```

```jsonc
// 2) Append an entry to public/audio/manifest.json:
[
  // ...existing entries, then append:
  { "file": "teacher-note.mp3", "label": "Invigilator voice" }
]
```

3. To use it: refresh in dev mode → `Exam Center → edit an exam → a cue node → choose sound → Audio folder`.
   The app reads `manifest.json` at runtime (`no-store`, cached for the session — use the **Refresh** button in the picker to re-read it), so **new files need no Vue changes**; just rebuild for a packaged build.

> The 4 MP3s in `public/audio/kaoshi/` are **not** listed in `manifest.json`. They are registered separately by `EXAM_SOUNDS` in `src/config.js` and appear on the picker's `Exam` tab:
> `kaoshi/action.MP3` (exam starts), `kaoshi/15min.MP3` (15 minutes left), `kaoshi/end.MP3` (exam ends), `kaoshi/timeend.mp3` (alarm / countdown finished).

### 5.4 Change the Default Nodes / Default Sounds of a New Exam

- Location: `createTemplate(kind)` in `src/store/state.js`.
  - Standard exam default nodes: `Start (start, builtin begin)`, `Last 15 minutes (beforeEnd 15, warn)`, `End (end, end)`; default duration 60 minutes.
  - Listening exam default nodes: `Reminder (beforeEnd 5, warn)`, `End (end, end)`; default duration 30 minutes.
- Node data structure (stored inside the template in localStorage):

```js
{
  id: 'uuid', label: '最后15分钟',
  atType: 'start' | 'beforeEnd' | 'end' | 'atSec',
  value: 0,               // beforeEnd = minutes before the end; atSec = seconds after the start
  sound: null | { mode:'builtin', tone:'begin'|'warn'|'end'|'ding' }
        | { mode:'folder', file:'start.wav' }
        | { mode:'library', key:'audio:...', name:'xxx.mp3' }
}
```

- Cue-time mapping: `start` = 0s; `end` = total seconds; `beforeEnd` = total seconds − value×60; `atSec` = value (the Nth second after the start).
- Timing is judged from an **absolute timestamp** (`tick()` in `src/views/ExamRunView.vue`, every 200ms), so a backgrounded tab never misses a cue; each node fires exactly once.

### 5.5 Regenerate the Placeholder Audio

```bash
npm run gen:audio
```

This runs `scripts/generate-placeholder-audio.mjs`, which synthesizes `start.wav / warn.wav / end.wav / custom.wav` as 22050Hz mono 16-bit PCM.
To add another placeholder, generate it the same way in that script and register it in `manifest.json`.

---

## 6. Configuration Reference (src/config.js)

| Constant | Purpose | Current default |
| --- | --- | --- |
| `APP_NAME` | App name | `"知时"` |
| `APP_TAG` | Subtitle / tagline | `"考试 · 时钟 · 档案"` |
| `ADMIN_PASS` | Exam admin password (listening audio control) | `"000"` |
| `PANEL_URL` | Default dashboard URL (editable on the profile page with developer unlock) | `""` |
| `V_ICON_URL` | **Yellow-V icon**: defaults to `img/yelloV.png`; point it at your own square transparent PNG/SVG to replace it | `` `${BASE}img/yelloV.png` `` |
| `DEV_CONTACT` | Developer contact, shown when an unlock fails | `"rainycrew@qq.com"` |
| `AUDIO_DIR` | Audio folder, relative path | `"audio/"` |
| `CLOCK_PRESETS` | Clock preset backgrounds (array of CSS gradients) | 6 dark presets: 墨夜 / 深黛 / 松影 / 绛紫 / 暖褐 / 烟青 |
| `BUILTIN_TONES` | Built-in cue-tone list | `begin / warn / end / ding` |
| `EXAM_SOUNDS` | Exam-column sounds (`public/audio/kaoshi/`) | exam start / 15 min left / exam end / alarm |

Other important defaults:

- The default title is `"普通用户"`, defined in `defaultProfile()` in `src/store/state.js` (old data with `"认证用户"` is migrated automatically to `"普通用户"`).
- The admin password and the developer password are both currently `"000"`, but they are **two independent settings**: `ADMIN_PASS` in `config.js` (listening-audio control) and `DEV_PASS` inside `DataSection.vue` (developer unlock).

---

## 7. Data Storage, Backup & Reset

### 7.1 Where data lives

- **localStorage**: a single key, **`zhishi.pad.v1`**, holding all structured data.
  Fields: `profile` / `templates` (exam templates) / `records` (exam records) / `certs` / `awards` / `clock` / `plans` / `checkins` / `focus` / `diary` / `achievements` (unlock timestamps) / `points` / `streakRewarded` / `dailyRewarded` / `skins` / `glass` / `clockskin` / `theme` / `cardskin` / `avatarframe` / `mark` / `noiseskin`.
  Writes happen automatically through `watch(state, persist, { deep: true })`, and a `storage` listener keeps **multiple tabs in sync**.
- **IndexedDB**: database `zhishi-media`, version 1, object store `files` (`keyPath: "key"`). Files are stored by `key`, and the key prefix is the media category:

  | Prefix | Contents |
  | --- | --- |
  | `avatar:*` | Avatar |
  | `img:*` | Certificate / award images, custom clock backgrounds |
  | `audio:*` | My audio library (cue ringtones) |
  | `listen:*` | Listening-exam audio |

  There is no size cap, compression or quota check, and object URLs returned by `media.url()` are the caller's responsibility to release.

### 7.2 Export / Import (Me → Settings → Data management)

- **Export data file**: produces `zhishi-backup-YYYY-MM-DD.json`.
  Format (**version 2**): `{ app: "zhishi-pad", version: 2, exportedAt, state: {...22 fields...}, media: [{ key, name, mime, size, addedAt, dataUrl }] }`.
  On native it uses Capacitor Filesystem plus the system share sheet; on the web it prefers `showSaveFilePicker` and otherwise falls back to a browser download. If the environment blocks it, use **"View / copy backup text"** and save the `.json` by hand.
- **Import data file**: pick a backup → **overwrite restore** (not a merge):
  1. It validates `app === "zhishi-pad"` and the required fields, and errors out otherwise;
  2. It **deletes every existing media file first**, then writes the media from the backup;
  3. Structured data is replaced wholesale, badges are re-evaluated, and the page reloads.
  > So: **always export before importing**. Any media file that is not in the backup is permanently lost after an import.
- **Clear storage**: 11 categories (exam records / exam templates / certificates & awards / plans & check-ins / focus records / mood diary / badge unlocks / audio library / listening files / images / all data), each requiring **two confirmations**.
  Note: clearing "plans & check-ins" also empties check-in history; clearing "audio library" or "listening files" nulls the exam nodes / templates that referenced them.
- **Factory reset**: wipes everything (name, all records, media…). You must type **`我已知道上述操作风险`** verbatim to proceed.

---

## 8. Data Structures Cheat Sheet

```js
// profile
{ name, title:'普通用户', vEnabled:true, avatarKey:null, panelUrl:'', setupReward:false }

// exam template
{ id, kind:'standard'|'listening', name, durationMin, createdAt, updatedAt,
  listeningKey, listeningName,            // listening exams only
  nodes:[ { id, label, atType, value, sound } ] }

// exam record
{ id, tplId, examName, kind, durationMin, startAt, endAt,
  status:'done'|'exit', startLabel }

// plan
{ id, title, type:'考试备考|日常学习|运动健康|兴趣技能|其他',
  targetDate:'YYYY-MM-DD', dailyMin, desc, done, doneAt, createdAt, updatedAt }

// check-in / focus / diary
{ date:'YYYY-MM-DD', ts }
{ id, date, activity, type:'stopwatch|countdown|pomodoro', minutes, startAt, endAt, createdAt }
{ id, date, mood:1-5, text, createdAt, updatedAt }

// badge unlocks (value = unlock timestamp)
state.achievements = { 'early-bird': 1712345678901, ... }

// clock preferences
clock: { preset:'ink', bgKey:null, showSeconds:true, showDate:true,
         noise:'off', noiseVol:0.35, mode:'clock' }

// shop slots — mostly a shared { owned:[], equipped:null } shape
skins:  { owned:['bi'], equipped:'bi' }        // check-in button (owned by default)
glass:  { owned:false, equipped:false }        // frosted-glass dock (booleans, unlike other slots)
mark:   { owned:['yelloV'], equipped:'yelloV' }// mark badge
```

See [5.4](#54-change-the-default-nodes--default-sounds-of-a-new-exam) for the `atType` ↔ `value` mapping. Exam record `status` semantics: `done` = the countdown reached zero and the exam ended normally; `exit` = the user quit, or left the page during the exam (recorded as "left early"). Only `done` counts toward badge statistics.

---

## 9. Points & Shop

### 9.1 Earning points

| Action | Points | Notes |
| --- | --- | --- |
| Initial gift | **+5** | You start with 5 points |
| Complete avatar + name | **+5** | One-off; requires both an avatar and a non-empty name, tracked by `profile.setupReward` |
| Daily check-in | **+2** | **Once per calendar day** (tracked in `dailyRewarded`). Cancelling the check-in and checking in again the same day grants nothing |
| Streak milestone | **+10** | Once per multiple of **10 / 20 / 30…** days (tracked in `streakRewarded`). Computed from the **all-time longest streak**, so it cannot be re-farmed after a break |

Points can also be edited manually after a developer unlock (see [section 15](#15-developer--hidden-features)). Points and all owned skins are included in backups.

### 9.2 Shop catalog (all definitions and prices live in `src/lib/skins.js`)

The shop page (`src/views/ShopView.vue`) has **8 categories** with a sticky nav:

| Category | Data | Price | Assets / rendering |
| --- | --- | --- | --- |
| Check-in button skins | `SKINS` (6) + `CUSTOM_BUTTONS` | 0 / 10 | Hand-written animation components inside `CheckinButton.vue`; custom buttons are parameterised styles |
| Frosted-glass dock | `GLASS_PRICE` | 15 | `GlassSurface.vue` frosted material replacing the dock background |
| Clock backgrounds | `CLOCK_SKINS` (3) | 20 / 25 | CSS background gradients |
| Home themes | `THEME_SKINS` (3) | 18 | Overrides 10 CSS variables (`--accent* / --bg* / --surface* / --line*`) |
| Check-in day cards | `CARD_SKINS` (3) | 15 | `cp-<id>` styles in `ShopView.vue` / `CheckinDaysCard.vue` |
| Avatar frames | `AVATAR_FRAMES` (6) | 12 / 18 | Images `public/img/<id>.png`, or CSS rings with `type:"ring"` |
| Mark badges | `MARK_BADGES` (7) | 8 | Images `public/img/chenghao/<id>.png` (plus developer-only `DEV_MARKS`, currently empty) |
| White noise | `NOISE_SKINS` (3) | 5 | Audio `public/img/baizaoyin/<id>.mp3` |

**Buying / equipping**: buying deducts points, grants permanent ownership and auto-equips; you can switch equipment at any time, and every owned category has a "default" button to unequip.
The logic lives in `src/store/state.js`: `buySkin / equipSkin` (button skins), `buyGlass / equipGlass` (the dock, boolean-shaped), and the generic `buyExtra(slot, id, price) / equipExtra(slot, id) / unequipExtra(slot)` (clock / theme / day card / avatar frame / mark / noise).

**Shop entry**: the `Shop` item in the dock or rail (`#/shop`).
**Managing shop data**: use the GUI tool `python manage_shop.py`, or edit it in the Vue admin back office (next section).

---

## 10. Achievements

Badge definitions and conditions live in `src/lib/achievements.js` (the `ACHIEVEMENTS` array): **20 badges** in 4 tiers — `1 Bronze` / `2 Silver` / `3 Gold` / `4 Obsidian`. `computeStats()` + `evaluateAchievements()` evaluate them automatically and write unlock timestamps into `state.achievements`.

| id | Name | Icon | Tier | Requirement |
| --- | --- | --- | --- | --- |
| `check-1` | First check-in | shield | Bronze | Complete your first study check-in |
| `check-7` | Seven-day sign-in | award | Silver | 7 total check-in days |
| `check-30` | Never a month missed | award | Gold | 30 total check-in days |
| `streak-3` | Small combo | clock | Bronze | A 3-day streak |
| `streak-7` | A full week | clock | Silver | A 7-day streak |
| `streak-30` | Iron thirty | medal | Obsidian | A 30-day streak |
| `net-fisher` | Three days fishing, two days drying nets | cert | Bronze | 5+ total check-ins but never a 3-day streak (a kind of honesty) |
| `early-bird` | Early bird | sunrise | Gold | Check in between 5:00 and 7:00 |
| `night-owl` | Night owl | moon | Silver | Complete a study/check-in session after 23:00 |
| `focus-60` | One focused hour | timer | Bronze | A single focus session of 60 minutes |
| `focus-120` | Focus master | timer | Gold | A single focus session of 120 minutes |
| `focus-600` | A little every day | flame | Obsidian | 10 hours of cumulative focus |
| `exam-1` | First victory | exam | Bronze | Finish your first exam |
| `exam-10` | Exam regular | exam | Gold | Finish 10 exams |
| `plan-1` | As good as your word | panel | Silver | Complete your first study plan |
| `cert-1` | First bloom | cert | Bronze | File your first certificate |
| `cert-5` | Certificate collector | medal | Gold | File 5 certificates |
| `award-1` | Where honors begin | award | Bronze | File your first award |
| `diary-1` | Write it down | note | Bronze | Write your first mood diary entry |
| `diary-30` | A bound diary | note | Gold | Write 30 mood diary entries |

**Adding a badge**: append `{ id, name, icon, tier, req, cond(stats) }` to `ACHIEVEMENTS`, where `req` is the display text and `cond(stats)` returns a boolean.
Available `stats` fields: `checkinTotal`, `maxStreak`, `curStreak`, `earlyBird`, `nightOwl`, `totalFocusMin`, `focusCount`, `longestFocus`, `examDone`, `plansDone`, `certCount`, `awardCount`, `diaryCount`.
`icon` must exist in `ICONS` in `src/components/Icon.vue` (50 icons today: `medal / award / cert / exam / clock / shield / moon / sunrise / timer / flame / note / panel / coin / trophy / bag / lock …`).

> The badge wall header reads "N / 20 unlocked" — update that total in `BadgesSection.vue` when you add badges.
> **Achievement card**: both `BadgesSection` and `PlansView` offer an "Export achievement card" button. `src/lib/exportImage.js` draws a PNG using the colors and canvas size from `exportStyle.js` (1080×1560 by default), containing the name, 6 statistics and up to 6 badges.

---

## 11. Admin Back Office (Separate Entry, Unreachable from the App)

The back office is a **separate entry, `admin.html`**, fully decoupled from the app: `index.html` contains **no button or route pointing at it**, so ordinary users cannot find a way in from the app. The portable build (`release/dist`) **excludes** the back-office code entirely.

> Note: the `dist/` produced by `npm run build` **does contain `admin.html` and its `admin-*.js/css` bundles** (because `vite.config.js` declares two entries), and `cap sync` copies them into the APK's `assets/public/`. They are simply **unreachable**. To ship a build with no back office, use the output of `npm run build:portable`.

### 11.1 Vue Admin Back Office (Recommended)

```bash
python shop_admin_server.py
```

It automatically: (1) starts vite dev on 5173 (reusing it if already running); (2) starts the local API on `http://localhost:8700`; (3) opens `http://localhost:5173/admin.html` in your browser.

**Three tabs**:

- **Shop**: every product is rendered with its **real component** (button animations, real avatar-frame images / rings, real badge images, clock backgrounds, theme swatches, day cards, white noise). Edit id / name / price / description directly (clock backgrounds as CSS, themes as JSON swatches, avatar frames switched between image and ring).
  Save → `POST /api/shop` rewrites `src/lib/skins.js` (preserving `DEV_MARKS`).
  - **Custom button templates**: "Download button template" gives you `button-template.json` (with `style`: `bg / color / radius / minW / minH / fontSize / border / shadow / label`). Edit the styling and size externally → "Upload button template" to generate a new button skin. On save it is written into `CUSTOM_BUTTONS`, `CheckinButton` renders it from those parameters, and the shop lists it too.
- **Badges**: add, edit and delete badges (name / icon / tier / requirement text). Conditions are edited structurally as "metric + operator + value + optional AND/OR second clause", with a live preview of the generated JS. Save → `POST /api/achievements` rewrites `src/lib/achievements.js` so `evaluateAchievements()` keeps working.
- **Export style**: edit the achievement card's canvas size and colors with a live preview on the right. Save → `POST /api/export-style` rewrites `src/lib/exportStyle.js` (read by `exportImage.js`).

> Stop it with **Ctrl+C** in the terminal (this also stops the vite dev server it started).
> To get changes onto a phone: `npm run build && npx cap sync android`, then press Run in Android Studio.

### 11.2 Python GUI Tool `manage_shop.py`

Backend-free: a tkinter GUI that **rewrites `src/lib/skins.js` directly**. Requires Python 3 (standard-library `tkinter`, no extra dependencies).

```bash
python manage_shop.py
```

- Pick a category at the top (8 categories); click an entry on the left and edit **id / name / price / description** on the right.
- **Visual preview**: selecting a product previews it above — avatar frames and badges show real thumbnails, themes show color swatches, clock skins show gradients, button skins / day cards / the glass dock show a style mock-up, and white noise shows an audio icon.
- **"View the real shop in a browser" button**: starts vite dev and opens `#/shop` so you can see the exact same rendering as the app (including CSS animations — a tkinter canvas cannot reproduce those, so check the browser for precision).
- **Add / delete / save** individual products. Asset-based products support one-click import: avatar frame images → `public/img/<id>.png` (adds `type:"image"` automatically), badges → `public/img/chenghao/<id>.png`, white-noise audio → `public/img/baizaoyin/<id>.mp3` (fills in `file` automatically).
- Click **"Generate and save skins.js"** to copy assets and rewrite `src/lib/skins.js`.

> **Adding** check-in buttons or day cards requires writing a Vue component or a `cp-<id>` style by hand; the tool only exposes price / name / description for them, so it never generates entries that cannot render.

### 11.3 `manage_admin.py`

The **parser / generator library** shared by `manage_shop.py` and the back-office server (it can also be run standalone as a self-test). It reads and writes `src/lib/achievements.js` and `src/lib/exportStyle.js`, and it **does not start a server or bind a port**.

---

## 12. Building an Android APK

You need **Android Studio** (with the Android SDK) locally. This project is already set up with mainland-China mirrors.

```bash
npm install
npm run build                       # frontend → dist/
npx cap add android                 # first time: generate the android/ project
npm run assets                      # generate icons + splash from resources/
npx cap sync android                # sync dist + plugins
npm run android:open                # open Android Studio, press Run ▶ to produce an APK
```

**Current project configuration (for reference)**

| Item | Value |
| --- | --- |
| appId / package | `com.zhishi.pad` |
| App name | 知时 (`android/app/src/main/res/values/strings.xml`) |
| webDir | `dist` |
| versionCode / versionName | `1` / `"1.0"` |
| minSdk / targetSdk / compileSdk | 22 / 34 / 34 |
| AGP / Gradle | 8.2.1 / 8.2.1 |
| Splash screen | shown for 2500ms, auto-hides, background `#f1f0ea`, `CENTER_CROP` |
| Permissions | only `android.permission.INTERNET` (Capacitor default; the app itself makes no network calls) |
| Orientation | unlocked, rotates freely with the device (portrait ↔ landscape) |

**Key points**

- **Icons / splash**: source images live in `resources/` (`icon.png` 1024², `splash.png` 2732², plus adaptive foreground/background). `npm run assets` runs `scripts/generate-android-res.ps1` (System.Drawing) and writes into `android/app/src/main/res/`, requiring **neither** `@capacitor/assets` **nor** `sharp` (no native libraries to compile). Run `npx cap add android` first so `android/` exists; the script also forces the adaptive background color to `#0E2A22`.
- **China acceleration (already configured)**:
  - Gradle downloads → **Huawei Cloud**: the `distributionUrl` in `android/gradle/wrapper/gradle-wrapper.properties` (`mirrors.huaweicloud.com/gradle/gradle-8.2.1-all.zip`).
  - Maven repositories add **Aliyun** mirrors: the `repositories` block in `android/build.gradle`.
  - **JDK 17**: Android Studio's **Gradle JDK** must be JDK 17 (Gradle 8.2.1 does not support Java 25). `android/gradle.properties` already contains `org.gradle.java.home=C:/Program Files/Eclipse Adoptium/jdk-17.0.20.101-hotspot` — change it if your JDK lives elsewhere.
- **Status bar / theme**: `android/app/src/main/res/values/styles.xml` — transparent status bar with dark icons, switching back to the main theme after launch. At runtime `@capacitor/status-bar` (in `src/main.js`) extends content under the status bar and sets dark icons.
- **Orientation locking**: `MainActivity` does not lock orientation by default. To lock it, add `android:screenOrientation="sensor"` (free) / `"portrait"` / `"landscape"` to the `<activity android:name=".MainActivity" ...>` element in `AndroidManifest.xml`.
- **Signing**: `android/app/build.gradle` has **no `signingConfigs` block, and there is no keystore file in the repository**. Create a keystore and add a signing config before publishing a release build.

**Rebuilding after frontend changes**

```bash
npm run build
npx cap sync android
```

Then press **Run ▶** in Android Studio. For development you can use `npm run dev` together with `npx cap run android --live-reload` (point `server.url` in `capacitor.config.ts` at your computer's LAN IP for a physical device).

---

## 13. Portable Single-File EXE

The end-user edition: **one .exe file, just double-click it**. No Node.js or Python installation required — the runtime is bundled.

- Pure frontend, no back office: it contains only the main app (`index.html` and its assets), **not** `admin.html` or the management tools.
- Fully local: on launch it serves files from an ephemeral free port bound to `127.0.0.1` and opens your browser. Works offline; uploads nothing.
- Data still lives in the browser's localStorage / IndexedDB (identical to the web version), so it is not shared across devices.

**For end users**: send them `知时-便携版.exe` → they double-click it → a small black console window appears (the local server) and the 知时 page opens automatically → when done, closing that window exits.

> If antivirus software flags it, that is a common false positive for single-file executables — "allow" is usually all that is needed.

**Rebuilding it (developers)**

```bash
npm run build:portable        # (1) rebuild the pure frontend into release/dist (no back office)
# (2) package a single-file exe with PyInstaller
.venv\Scripts\python -m PyInstaller --onefile --name "知时-便携版" ^
  --add-data "release\dist;dist" scripts\portable_server.py
```

The artifact lands in `release\` (the repo already ships `release/知时-便携版.exe`, ~34MB, built with Python 3.9 + PyInstaller 6.22).

> **Note**: the `打包即用版.bat` mentioned in `README-便携版.md` is **not currently in the repository** — use the two commands above, or add your own batch file. When frozen, `portable_server.py` reads its assets from `sys._MEIPASS/dist` (and from `../release/dist` when run from source), so the `--add-data` destination directory must be named `dist`.
> Packaging for the first time needs a `.venv` Python virtualenv with PyInstaller installed; if you do not have one, run `python -m venv .venv` and then `pip install pyinstaller`.

---

## 14. Theming & Common Customizations

| What you want to change | Where |
| --- | --- |
| Theme color / radii / shadows / fonts | The `:root` design tokens at the top of `src/styles/main.css` |
| Home theme (also sold in the shop) | `src/lib/skins.js` → `THEME_SKINS` (overrides 10 CSS variables) |
| Clock preset backgrounds | `src/config.js` → `CLOCK_PRESETS` |
| Yellow-V icon | `src/config.js` → `V_ICON_URL` (or replace `public/img/yelloV.png`) |
| App name / tagline | `src/config.js` → `APP_NAME` / `APP_TAG` (native also needs `capacitor.config.ts` and `strings.xml`) |
| Admin / developer passwords | `src/config.js` → `ADMIN_PASS`; `src/components/profile/DataSection.vue` → `DEV_PASS` |
| White-noise types | Synthesis branches in `play()` in `src/audio/noise.js`; the selection list is `NOISE_TYPES` in `src/views/ClockView.vue` |
| Default title | `src/store/state.js` → `defaultProfile().title` |
| Default exam nodes / duration | `src/store/state.js` → `createTemplate()` |
| Built-in cue tones | `src/config.js` → `BUILTIN_TONES` + `src/audio/engine.js` → `playBuiltin()` |
| Exam-column sounds | `src/config.js` → `EXAM_SOUNDS` + `public/audio/kaoshi/` |
| Badge list | `src/lib/achievements.js` → `ACHIEVEMENTS` (or the admin back office) |
| Achievement card style | `src/lib/exportStyle.js` (or the back office's "Export style" tab) |
| Mood tiers | `src/components/profile/DiarySection.vue` → `MOODS` (artwork in `public/img/xingqin/`) |
| Navigation icons | `src/App.vue` → `NAV_ICONS` (`public/img/*.png`) |
| Menu items / page order | `src/App.vue` → `navItems` |

---

## 15. Developer / Hidden Features

- **Exam listening-control password**: `ADMIN_PASS = "000"`. On the running-exam page, tap "Admin control" and enter it to **play / pause, replay from the start, seek and adjust the volume** of the listening audio. The candidate UI exposes no pause or replay control at all.
  > Heads-up: the password is currently printed in the interface hint text in `ListeningUpload.vue` ("enter admin password 000 to control playback"). Change that too if you want it secret.
- **Title / dashboard URL / points** are read-only by default: tapping them shows a "contact the developer" notice. The unlock entry is hidden inside that dialog — tap the **"Settings" button at the top of Me → Settings 5 times** (each tap resets a 2.4s timer) to reveal a password box; nothing in the UI hints at it. A correct password unlocks editing **for the current session only**, and saving re-locks it immediately (the unlocked flag lives in memory, so a page refresh also clears it).
- **Factory reset** requires typing `我已知道上述操作风险` verbatim.
- **Router behaviour**: `src/router.js` intercepts browser back / forward / swipe-back so that page changes only happen through nav taps (preventing accidental exits from an exam). While an exam is running, a `beforeunload` handler also guards against accidentally closing the page.

---

## 16. FAQ

- **Download / export does nothing**: prefer "Export data file" (Chromium shows a save-location dialog). If the environment blocks it, use "View / copy backup text" and save the `.json` manually.
- **A new audio file does not show up**: make sure it is registered in `manifest.json` and that the browser supports the format; rebuild for a packaged build. For files in a subfolder (e.g. `kaoshi/`), write `file` as `"kaoshi/xxx.mp3"`.
- **No cue sound during an exam**: check that the node is not muted. Browsers only allow audio after a user interaction, so tap "Start" on the page first.
- **Image / audio reads fail or export errors**: the read layer relies on IndexedDB (`src/store/media.js`). If it still fails, share the red console errors.
- **Recovering lost data**: import a backup `.json` to restore everything at once (images and audio included). Remember that import **overwrites**.
- **Time or check-in data looks wrong after a refresh**: all timing is based on the **local system clock**; verify the device time.
- **Nothing happens when opened over `file://`**: serve it from a static server instead (`npm run preview` or `npx http-server dist`).

---

## 17. Known Limitations & Notes

Boundaries worth knowing about the current implementation (none of them break normal use):

- **The running-exam page has no fullscreen mode**: only the clock workstation offers fullscreen / exit-fullscreen buttons. The exam page's safeguards are the `beforeunload` guard, route suppression, and recording an "early exit" — there is no screen-switch or screen-recording detection.
- **Durations are whole minutes**: the countdown is driven by `Date.now()` absolute timestamps, so **changing the system clock affects it**.
- **Countdown / Pomodoro / stopwatch settings are not persisted**: after leaving the clock page, the countdown duration and the Pomodoro focus/break minutes reset to their defaults (background, white noise and "show seconds" preferences *are* persisted).
- **`clock.showDate` is effectively dead**: the date line always renders, and no view reads that field any more.
- **The admin "stop" button**: for listening audio it actually restarts from the beginning (it calls `stop()` immediately followed by `play()`).
- **Icon fallback**: an icon name missing from `Icon.vue` silently renders the `info` glyph (for example `bell` and `audio` are currently undefined).
- **No media size limits**: there is no quota check or compression in IndexedDB, and a backup converts every media file to base64, so the file can grow large.
- **The repository is not a git repo yet**: there is no `.git` at the project root, and the root `.gitignore` only ignores `node_modules/ dist/ *.local` — it does **not** ignore `.venv/`, `__pycache__/`, `release/`, `android/build/`, `android/app/build/` or `android/app/src/main/assets/public/`. Add those before pushing to GitHub, and consider adding a LICENSE.
- **Release builds lack signing material**: see [section 12](#12-building-an-android-apk).

---

## Other Documents

| File | Contents |
| --- | --- |
| [README.zh-CN.md](README.zh-CN.md) | Chinese documentation |
| [README-便携版.md](README-便携版.md) | Portable EXE usage and packaging guide (Chinese) |
| [resources/README.md](resources/README.md) | App icon and splash source images |
| [public/audio/README.md](public/audio/README.md) | Audio folder and manifest guide |

**Contact**: `rainycrew@qq.com`
