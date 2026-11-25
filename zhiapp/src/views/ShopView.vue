<script setup>
import { ref, computed } from "vue";
import { state, store } from "../store/state.js";
import {
  SKINS,
  CUSTOM_BUTTONS,
  CLOCK_SKINS,
  THEME_SKINS,
  CARD_SKINS,
  AVATAR_FRAMES,
  MARK_BADGES,
  DEFAULT_MARK,
  markImgUrl,
  NOISE_SKINS,
  GLASS_PRICE
} from "../lib/skins.js";
import Icon from "../components/Icon.vue";
import Avatar from "../components/Avatar.vue";
import CheckinButton from "../components/CheckinButton.vue";
import { toast } from "../ui.js";
import { usePageMotion } from "../composables/useMotion.js";

const root = ref(null);
usePageMotion(root);

const points = computed(() => state.points);
const JIFEN = (import.meta.env.BASE_URL || "./") + "img/jifen.png";

// ---- 打卡按钮皮肤（含自定义按钮） ----
const skins = computed(() => {
  const all = SKINS.concat(CUSTOM_BUTTONS);
  return all.map((s) => ({
    ...s,
    owned: state.skins.owned.includes(s.id),
    equipped: state.skins.equipped === s.id
  }));
});

function buySkin(s) {
  if (s.owned) {
    store.equipSkin(s.id);
    toast("已装备 " + s.name);
    return;
  }
  const r = store.buySkin(s.id, s.price);
  if (r.ok) toast("已购买并装备 " + s.name);
  else if (r.reason === "points") toast("积分不足，去打卡攒一攒吧", "err");
  else toast("已拥有", "ok");
}

// ---- 毛玻璃 Dock ----
function equipGlass(on) {
  if (on && !state.glass.owned) return;
  store.equipGlass(on);
  toast(on ? "已启用毛玻璃 Dock" : "已还原默认 Dock");
}
function buyGlass() {
  if (state.glass.owned) return equipGlass(true);
  const r = store.buyGlass();
  if (r.ok) toast("已购买并启用毛玻璃 Dock");
  else if (r.reason === "points") toast("积分不足，去打卡攒一攒吧", "err");
  else toast("已拥有", "ok");
}

// ---- 通用：时钟/主题/天数卡/头像框 ----
function slotItems(name, list) {
  return list.map((s) => ({
    ...s,
    owned: state[name].owned.includes(s.id),
    equipped: state[name].equipped === s.id
  }));
}
const clockSkins = computed(() => slotItems("clockskin", CLOCK_SKINS));
const themes = computed(() => slotItems("theme", THEME_SKINS));
const cardSkins = computed(() => slotItems("cardskin", CARD_SKINS));
const frames = computed(() => slotItems("avatarframe", AVATAR_FRAMES));
// 标识徽章：默认黄V + 商城 7 款
const marks = computed(() => {
  const list = [
    { id: DEFAULT_MARK, name: "默认黄V", desc: "初始默认标识", price: 0, owned: true, equipped: state.mark.equipped === DEFAULT_MARK }
  ];
  for (const b of MARK_BADGES) {
    list.push({ ...b, owned: state.mark.owned.includes(b.id), equipped: state.mark.equipped === b.id });
  }
  return list;
});
// 白噪音皮肤（购买后时钟白噪音可选）
const noises = computed(() => slotItems("noiseskin", NOISE_SKINS));
function buyNoise(s) {
  if (s.owned) {
    toast("已拥有，去「时钟」白噪音里使用", "ok");
    return;
  }
  const r = store.buyExtra("noiseskin", s.id, s.price);
  if (r.ok) toast("已购买白噪音：" + s.name);
  else if (r.reason === "points") toast("积分不足，去打卡攒一攒吧", "err");
  else toast("已拥有", "ok");
}

function buyOrEquip(name, item) {
  if (item.owned) {
    store.equipExtra(name, item.id);
    toast("已装备 " + item.name);
    return;
  }
  const r = store.buyExtra(name, item.id, item.price);
  if (r.ok) toast("已购买并装备 " + item.name);
  else if (r.reason === "points") toast("积分不足，去打卡攒一攒吧", "err");
  else toast("已拥有", "ok");
}

// 还原默认：取消装备（时钟/主题/天数卡/头像框回到原样）
function resetExtra(name) {
  store.unequipExtra(name);
  toast("已恢复默认");
}

// 分区吸顶导航
const CATS = [
  { id: "sec-skins", name: "按钮" },
  { id: "sec-glass", name: "毛玻璃" },
  { id: "sec-clock", name: "时钟" },
  { id: "sec-theme", name: "主题" },
  { id: "sec-card", name: "天数卡" },
  { id: "sec-frame", name: "头像框" },
  { id: "sec-mark", name: "标识" },
  { id: "sec-noise", name: "白噪音" }
];
function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<template>
  <div ref="root">
    <div class="page-head" data-reveal>
      <div>
        <div class="eyebrow">Shop · 积分商城</div>
        <h1 class="page-title">商城</h1>
        <p class="page-sub">用积分装扮你的打卡、时钟、个人与主题。每日打卡 +2，连续每 10 天再 +10。</p>
      </div>
      <div class="head-actions">
        <div class="points-pill">
          <img :src="JIFEN" class="points-ic" alt="" />
          <b class="tnum" :data-count="points">{{ points }}</b>
          <span>积分</span>
        </div>
      </div>
    </div>

    <!-- 吸顶分类导航 -->
    <nav class="shop-nav" ref="navRef">
      <button
        v-for="n in CATS"
        :key="n.id"
        class="shop-nav-btn"
        @click="scrollTo(n.id)"
      >
        {{ n.name }}
      </button>
    </nav>

    <!-- 打卡按钮皮肤 -->
    <section id="sec-skins" class="shop-sec">
      <div class="sec-head"><h2 class="sec-title">打卡按钮皮肤</h2><span class="sec-hint">购买后永久拥有，可随时切换</span></div>
      <div class="skin-grid">
        <div v-for="s in skins" :key="s.id" class="skin-card card" data-reveal>
          <div class="skin-preview" :class="{ locked: !s.owned }">
            <CheckinButton :skin="s.id" :done="false" demo />
          </div>
          <div class="skin-meta">
            <div class="skin-name-row">
              <span class="skin-name">{{ s.name }}</span>
              <span v-if="s.owned" class="chip chip-accent"><Icon :name="s.equipped ? 'check' : 'bag'" :size="12" />{{ s.equipped ? "使用中" : "已拥有" }}</span>
              <span v-else class="chip"><Icon name="coin" :size="12" /> {{ s.price }}</span>
            </div>
            <p class="skin-desc">{{ s.desc }}</p>
          </div>
          <button class="btn btn-sm" :class="s.equipped ? 'btn-ghost' : s.owned ? 'btn-soft' : 'btn-primary'" @click="buySkin(s)">
            <Icon :name="s.equipped ? 'check' : s.owned ? 'bag' : 'coin'" :size="14" />
            {{ s.equipped ? "使用中" : s.owned ? "装备" : `购买 ${s.price} 分` }}
          </button>
        </div>
      </div>
    </section>

    <!-- 毛玻璃 Dock -->
    <section id="sec-glass" class="shop-sec">
      <div class="sec-head"><h2 class="sec-title">底部导航 · 毛玻璃皮肤</h2><span class="sec-hint">参考组件库 GlassSurface，磨砂质感</span></div>
      <div class="glass-card card" data-reveal>
        <div class="glass-preview">
          <div class="dock-demo" :class="{ glass: state.glass.equipped }">
            <span class="d-ic"><Icon name="home" :size="18" /></span>
            <span class="d-ic"><Icon name="exam" :size="18" /></span>
            <span class="d-ic"><Icon name="clock" :size="18" /></span>
            <span class="d-ic"><Icon name="panel" :size="18" /></span>
            <span class="d-ic"><Icon name="user" :size="18" /></span>
          </div>
          <span v-if="state.glass.equipped" class="glass-tag">毛玻璃已启用</span>
        </div>
        <div class="glass-meta">
          <b>{{ state.glass.owned ? "毛玻璃 Dock" : "毛玻璃 Dock（解锁后可用）" }}</b>
          <p>底部导航栏磨砂质感；默认是原始 Dock。</p>
        </div>
        <div class="glass-actions">
          <button v-if="state.glass.owned" class="btn btn-sm btn-ghost" @click="equipGlass(false)">还原默认</button>
          <button class="btn btn-sm" :class="state.glass.equipped ? 'btn-soft' : 'btn-primary'" @click="buyGlass">
            <Icon :name="state.glass.equipped ? 'check' : 'coin'" :size="14" />
            {{ state.glass.equipped ? "使用中" : state.glass.owned ? "启用毛玻璃" : `购买 ${GLASS_PRICE} 分` }}
          </button>
        </div>
      </div>
    </section>

    <!-- 时钟工作台皮肤 -->
    <section id="sec-clock" class="shop-sec">
      <div class="sec-head"><h2 class="sec-title">时钟工作台皮肤</h2><span class="sec-hint">替换时钟页背景</span></div>
      <div class="skin-grid">
        <div v-for="s in clockSkins" :key="s.id" class="skin-card card" data-reveal>
          <div class="skin-preview" :style="{ background: s.css, backgroundSize: 'cover' }"></div>
          <div class="skin-meta">
            <div class="skin-name-row">
              <span class="skin-name">{{ s.name }}</span>
              <span v-if="s.owned" class="chip chip-accent"><Icon :name="s.equipped ? 'check' : 'bag'" :size="12" />{{ s.equipped ? "使用中" : "已拥有" }}</span>
              <span v-else class="chip"><Icon name="coin" :size="12" /> {{ s.price }}</span>
            </div>
            <p class="skin-desc">{{ s.desc }}</p>
          </div>
          <div class="btn-row">
            <button class="btn btn-sm" :class="s.equipped ? 'btn-soft' : s.owned ? 'btn-ghost' : 'btn-primary'" @click="buyOrEquip('clockskin', s)">
              <Icon :name="s.equipped ? 'check' : s.owned ? 'bag' : 'coin'" :size="14" />
              {{ s.equipped ? "使用中" : s.owned ? "装备" : `购买 ${s.price} 分` }}
            </button>
            <button v-if="s.equipped" class="btn btn-sm btn-ghost" @click="resetExtra('clockskin')"><Icon name="refresh" :size="13" /> 默认</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 主题 / 强调色 -->
    <section id="sec-theme" class="shop-sec">
      <div class="sec-head"><h2 class="sec-title">主页 · 主题色</h2><span class="sec-hint">改变全局强调色与底色</span></div>
      <div class="skin-grid">
        <div v-for="s in themes" :key="s.id" class="skin-card card" data-reveal>
          <div class="theme-preview" :style="{ background: s.vars['--bg'] }">
            <span class="tp-accent" :style="{ background: s.vars['--accent'] }"></span>
            <span class="tp-card" :style="{ background: s.vars['--surface'], borderColor: s.vars['--line'] }">
              <i :style="{ background: s.vars['--accent'] }"></i><i :style="{ background: s.vars['--accent-tint'] }"></i>
            </span>
          </div>
          <div class="skin-meta">
            <div class="skin-name-row">
              <span class="skin-name">{{ s.name }}</span>
              <span v-if="s.owned" class="chip chip-accent"><Icon :name="s.equipped ? 'check' : 'bag'" :size="12" />{{ s.equipped ? "使用中" : "已拥有" }}</span>
              <span v-else class="chip"><Icon name="coin" :size="12" /> {{ s.price }}</span>
            </div>
            <p class="skin-desc">{{ s.desc }}</p>
          </div>
          <div class="btn-row">
            <button class="btn btn-sm" :class="s.equipped ? 'btn-soft' : s.owned ? 'btn-ghost' : 'btn-primary'" @click="buyOrEquip('theme', s)">
              <Icon :name="s.equipped ? 'check' : s.owned ? 'bag' : 'coin'" :size="14" />
              {{ s.equipped ? "使用中" : s.owned ? "装备" : `购买 ${s.price} 分` }}
            </button>
            <button v-if="s.equipped" class="btn btn-sm btn-ghost" @click="resetExtra('theme')"><Icon name="refresh" :size="13" /> 默认</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 打卡天数卡片皮肤 -->
    <section id="sec-card" class="shop-sec">
      <div class="sec-head"><h2 class="sec-title">打卡天数卡片皮肤</h2><span class="sec-hint">打卡成功弹窗的样式</span></div>
      <div class="skin-grid">
        <div v-for="s in cardSkins" :key="s.id" class="skin-card card" data-reveal>
          <div class="card-preview" :class="'cp-' + s.id">
            <b class="cp-num">7</b><span class="cp-word">天</span>
          </div>
          <div class="skin-meta">
            <div class="skin-name-row">
              <span class="skin-name">{{ s.name }}</span>
              <span v-if="s.owned" class="chip chip-accent"><Icon :name="s.equipped ? 'check' : 'bag'" :size="12" />{{ s.equipped ? "使用中" : "已拥有" }}</span>
              <span v-else class="chip"><Icon name="coin" :size="12" /> {{ s.price }}</span>
            </div>
            <p class="skin-desc">{{ s.desc }}</p>
          </div>
          <div class="btn-row">
            <button class="btn btn-sm" :class="s.equipped ? 'btn-soft' : s.owned ? 'btn-ghost' : 'btn-primary'" @click="buyOrEquip('cardskin', s)">
              <Icon :name="s.equipped ? 'check' : s.owned ? 'bag' : 'coin'" :size="14" />
              {{ s.equipped ? "使用中" : s.owned ? "装备" : `购买 ${s.price} 分` }}
            </button>
            <button v-if="s.equipped" class="btn btn-sm btn-ghost" @click="resetExtra('cardskin')"><Icon name="refresh" :size="13" /> 默认</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 头像框 -->
    <section id="sec-frame" class="shop-sec">
      <div class="sec-head"><h2 class="sec-title">头像框</h2><span class="sec-hint">首页 / 个人页头像外圈</span></div>
      <div class="skin-grid">
        <div v-for="s in frames" :key="s.id" class="skin-card card" data-reveal>
          <div class="frame-preview">
            <Avatar :name="state.profile.name || '知'" :size="56" :frame="s.id" />
          </div>
          <div class="skin-meta">
            <div class="skin-name-row">
              <span class="skin-name">{{ s.name }}</span>
              <span v-if="s.owned" class="chip chip-accent"><Icon :name="s.equipped ? 'check' : 'bag'" :size="12" />{{ s.equipped ? "使用中" : "已拥有" }}</span>
              <span v-else class="chip"><Icon name="coin" :size="12" /> {{ s.price }}</span>
            </div>
            <p class="skin-desc">{{ s.desc }}</p>
          </div>
          <div class="btn-row">
            <button class="btn btn-sm" :class="s.equipped ? 'btn-soft' : s.owned ? 'btn-ghost' : 'btn-primary'" @click="buyOrEquip('avatarframe', s)">
              <Icon :name="s.equipped ? 'check' : s.owned ? 'bag' : 'coin'" :size="14" />
              {{ s.equipped ? "使用中" : s.owned ? "装备" : `购买 ${s.price} 分` }}
            </button>
            <button v-if="s.equipped" class="btn btn-sm btn-ghost" @click="resetExtra('avatarframe')"><Icon name="refresh" :size="13" /> 默认</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 标识徽章 -->
    <section id="sec-mark" class="shop-sec">
      <div class="sec-head"><h2 class="sec-title">标识</h2><span class="sec-hint">称号 / 头像旁的小图标（默认黄V，可换徽章）</span></div>
      <div class="skin-grid">
        <div v-for="s in marks" :key="s.id" class="skin-card card" data-reveal>
          <div class="mark-preview">
            <img :src="markImgUrl(s.id)" class="mark-prev-img" alt="" />
          </div>
          <div class="skin-meta">
            <div class="skin-name-row">
              <span class="skin-name">{{ s.name }}</span>
              <span v-if="s.owned" class="chip chip-accent"><Icon :name="s.equipped ? 'check' : 'bag'" :size="12" />{{ s.equipped ? "使用中" : "已拥有" }}</span>
              <span v-else class="chip"><img :src="JIFEN" class="chip-ic" /> {{ s.price }}</span>
            </div>
            <p class="skin-desc">{{ s.desc }}</p>
          </div>
          <div class="btn-row">
            <button class="btn btn-sm" :class="s.equipped ? 'btn-soft' : s.owned ? 'btn-ghost' : 'btn-primary'" @click="buyOrEquip('mark', s)">
              <Icon :name="s.equipped ? 'check' : s.owned ? 'bag' : 'coin'" :size="14" />
              {{ s.equipped ? "使用中" : s.owned ? "装备" : `购买 ${s.price} 分` }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 白噪音 -->
    <section id="sec-noise" class="shop-sec">
      <div class="sec-head"><h2 class="sec-title">白噪音</h2><span class="sec-hint">购买后「时钟」白噪音里可选</span></div>
      <div class="skin-grid">
        <div v-for="s in noises" :key="s.id" class="skin-card card" data-reveal>
          <div class="noise-preview">
            <Icon name="volume" :size="30" />
            <span class="np-name">{{ s.name }}</span>
          </div>
          <div class="skin-meta">
            <div class="skin-name-row">
              <span class="skin-name">{{ s.name }}</span>
              <span v-if="s.owned" class="chip chip-accent"><Icon name="check" :size="12" />已拥有</span>
              <span v-else class="chip"><img :src="JIFEN" class="chip-ic" /> {{ s.price }}</span>
            </div>
            <p class="skin-desc">{{ s.desc }}</p>
          </div>
          <button class="btn btn-sm" :class="s.owned ? 'btn-ghost' : 'btn-primary'" @click="buyNoise(s)">
            <Icon :name="s.owned ? 'check' : 'coin'" :size="14" />
            {{ s.owned ? "已拥有" : `购买 ${s.price} 分` }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.head-actions { display: flex; align-items: center; }
.points-pill { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 999px; background: linear-gradient(180deg, #ffeeb0, #f7cf49); color: #4a3500; font-weight: 800; box-shadow: 0 10px 22px -14px rgba(150,100,20,0.8); }
.points-pill b { font-size: 20px; }
.points-pill span { font-size: 12px; opacity: 0.75; }
.points-ic { width: 18px; height: 18px; object-fit: contain; }
.chip-ic { width: 13px; height: 13px; object-fit: contain; margin-right: 3px; }
.shop-sec { margin-top: 24px; scroll-margin-top: 58px; }

/* 吸顶分类导航 */
.shop-nav {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 2px;
  margin: 0 0 4px;
  background: color-mix(in srgb, var(--bg) 84%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 14px;
}
.shop-nav-btn {
  padding: 7px 12px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--ink-2);
  font-size: 12.5px;
  font-weight: 650;
  white-space: nowrap;
  transition: all 0.18s var(--ease-out);
}
.shop-nav-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-1px);
}
.sec-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.sec-title { font-size: 17px; font-weight: 800; }
.sec-hint { font-size: 12px; color: var(--ink-3); }
.skin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }
.skin-card { display: flex; flex-direction: column; gap: 10px; padding: 14px; }
.skin-preview { border-radius: 16px; background: var(--surface-2); border: 1px solid var(--line-2); padding: 8px; display: flex; align-items: center; justify-content: center; min-height: 96px; overflow: hidden; }
.skin-preview.locked { filter: grayscale(0.85) opacity(0.75); }
.skin-meta { flex: 1; }
.skin-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.skin-name { font-weight: 750; font-size: 15px; }
.skin-desc { margin-top: 4px; font-size: 12px; color: var(--ink-2); }
.glass-card { display: flex; align-items: center; gap: 16px; padding: 16px; flex-wrap: wrap; }
.glass-preview { flex: none; position: relative; }
.dock-demo { display: flex; gap: 6px; padding: 10px 14px; border-radius: 16px; background: #2a2e33; color: #fff; transition: all 0.3s; }
.dock-demo.glass { background: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.35); backdrop-filter: blur(12px) saturate(1.6); }
.d-ic { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; background: rgba(255,255,255,0.08); }
.glass-tag { display: inline-flex; align-items: center; gap: 4px; margin-top: 8px; font-size: 11.5px; color: var(--accent); font-weight: 650; }
.glass-meta { flex: 1; min-width: 160px; }
.glass-meta p { margin-top: 4px; font-size: 12.5px; color: var(--ink-2); }
.glass-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-row { display: flex; gap: 6px; flex-wrap: wrap; }

/* 主题预览 */
.theme-preview { border-radius: 16px; height: 96px; position: relative; display: flex; align-items: flex-end; padding: 10px; flex-direction: column; gap: 8px; }
.tp-accent { width: 34px; height: 12px; border-radius: 999px; margin-top: auto; }
.tp-card { display: flex; flex-direction: column; gap: 6px; width: 72%; height: 44px; border-radius: 10px; border: 1px solid; padding: 8px; }
.tp-card i { display: block; height: 10px; border-radius: 999px; }
.tp-card i:last-child { background: var(--accent-tint) !important; opacity: 0.5; }

/* 天数卡片预览 */
.card-preview { border-radius: 14px; height: 96px; display: flex; align-items: center; justify-content: center; gap: 2px; }
.cp-num { font-size: 46px; font-weight: 800; line-height: 1; }
.cp-word { font-size: 22px; font-weight: 700; }
.cp-obsidian { background: linear-gradient(45deg, #1c1e24, #2b2f38); color: #e2b543; }
.cp-sakura { background: linear-gradient(45deg, #fff6f8, #ffd3de); color: #e05c86; }
.cp-starlight { background: linear-gradient(45deg, #10162e, #233056); color: #8fb4ff; }

/* 头像框预览 */
.frame-preview { border-radius: 16px; background: var(--surface-2); border: 1px solid var(--line-2); height: 96px; display: flex; align-items: center; justify-content: center; }

/* 标识预览 */
.mark-preview { border-radius: 16px; background: var(--surface-2); border: 1px solid var(--line-2); height: 96px; display: flex; align-items: center; justify-content: center; }
.mark-prev-img { width: 52px; height: 52px; object-fit: contain; }

/* 白噪音预览 */
.noise-preview { border-radius: 16px; background: var(--surface-2); border: 1px solid var(--line-2); height: 96px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: var(--ink-2); }
.np-name { font-size: 13px; font-weight: 650; color: var(--ink); }

@media (max-width: 640px) {
  .skin-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
  .skin-card { padding: 10px; gap: 8px; }
  .skin-preview, .theme-preview, .card-preview, .frame-preview, .mark-preview, .noise-preview { min-height: 84px; height: 84px; }
  .skin-name { font-size: 13.5px; }
  .skin-desc { font-size: 11px; }
  .skin-card .btn-sm { width: 100%; padding: 0 8px; font-size: 12px; }
  .glass-card { padding: 12px; gap: 12px; }
}
</style>
