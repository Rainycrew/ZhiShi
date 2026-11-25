<template>
  <div class="adm">
    <div class="adm-top">
      <div>
        <div class="eb">ZHISHI · 管理后台</div>
        <h1 class="adm-title">知时 · 后台</h1>
        <p class="adm-sub">独立入口（App 不含此代码）。改完点对应「保存」，由本地 API 写回源码文件。</p>
      </div>
      <div class="adm-tabs">
        <button v-for="t in tabs" :key="t.k" class="tab" :class="{ on: tab === t.k }" @click="tab = t.k">{{ t.n }}</button>
      </div>
    </div>

    <!-- ================= 商城 ================= -->
    <section v-if="tab === 'shop'">
      <div class="bar">
        <span class="st" :class="{ ok: status.shop.startsWith('已保存') }">{{ status.shop }}</span>
        <button class="btn btn-primary" @click="saveShop">保存商城</button>
      </div>

      <h2 class="h">毛玻璃 Dock</h2>
      <div class="card inline">
        <div class="pv"><div class="glassdemo">home · exam · clock · plan · me</div></div>
        <div class="f"><label>价格</label><input v-model.number="glassPrice" type="number" /></div>
      </div>

      <h2 class="h">打卡按钮皮肤</h2>
      <div class="grid">
        <div v-for="s in d.SKINS" :key="s.id" class="card">
          <div class="pv"><CheckinButton :skin="s.id" :done="false" demo /></div>
          <div class="f">
            <label>id</label><input v-model="s.id" />
            <label>名称</label><input v-model="s.name" />
            <label>价格</label><input v-model.number="s.price" type="number" />
            <label>描述</label><input v-model="s.desc" />
          </div>
        </div>
      </div>

      <h2 class="h">自定义按钮（下载模板→改样式→上传）</h2>
      <div class="bar">
        <button class="btn" @click="downloadTemplate">下载按钮模板</button>
        <button class="btn" @click="fileInput.click()">上传按钮模板</button>
        <button class="btn" @click="addCustomBtn">+ 新增空模板</button>
        <input ref="fileInput" type="file" accept=".json" style="display:none" @change="importTemplate" />
      </div>
      <div class="grid">
        <div v-for="(b, i) in d.CUSTOM_BUTTONS" :key="i" class="card">
          <div class="pv"><button class="adb" :style="admCustomStyle(b)">{{ b.style.label || "今日打卡" }}</button></div>
          <div class="f">
            <label>id</label><input v-model="b.id" /><label>名称</label><input v-model="b.name" />
            <label>价格</label><input v-model.number="b.price" type="number" /><label>描述</label><input v-model="b.desc" />
            <label>背景 bg</label><input v-model="b.style.bg" /><label>文字色 color</label><input v-model="b.style.color" />
            <label>圆角 radius</label><input v-model="b.style.radius" />
            <div class="row2"><label>最小宽/高</label><input v-model="b.style.minW" /><input v-model="b.style.minH" /></div>
            <label>字号 fontSize</label><input v-model="b.style.fontSize" />
            <label>边框 border</label><input v-model="b.style.border" /><label>阴影 shadow</label><input v-model="b.style.shadow" />
            <label>文案 label</label><input v-model="b.style.label" />
            <button class="btn btn-danger" @click="delCustomBtn(i)">删除</button>
          </div>
        </div>
        <div v-if="!d.CUSTOM_BUTTONS.length" class="card muted">还没有自定义按钮。点「下载按钮模板」拿去外部改，或「上传按钮模板」导入。</div>
      </div>

      <h2 class="h">时钟工作台背景</h2>
      <div class="grid">
        <div v-for="s in d.CLOCK_SKINS" :key="s.id" class="card">
          <div class="pv"><div class="clockpv" :style="{ background: s.css }"></div></div>
          <div class="f">
            <label>id</label><input v-model="s.id" /><label>名称</label><input v-model="s.name" />
            <label>价格</label><input v-model.number="s.price" type="number" /><label>描述</label><input v-model="s.desc" />
            <label>背景 CSS</label><textarea v-model="s.css" rows="3"></textarea>
          </div>
        </div>
      </div>

      <h2 class="h">主页主题色</h2>
      <div class="grid">
        <div v-for="s in d.THEME_SKINS" :key="s.id" class="card">
          <div class="pv theme" :style="{ background: s.vars['--bg'] }">
            <span class="tp-accent" :style="{ background: s.vars['--accent'] }"></span>
            <span class="tp-card" :style="{ background: s.vars['--surface'], borderColor: s.vars['--line'] }">
              <i :style="{ background: s.vars['--accent'] }"></i><i :style="{ background: s.vars['--accent-tint'] }"></i>
            </span>
          </div>
          <div class="f">
            <label>id</label><input v-model="s.id" /><label>名称</label><input v-model="s.name" />
            <label>价格</label><input v-model.number="s.price" type="number" /><label>描述</label><input v-model="s.desc" />
            <label>色板变量(JSON)</label><textarea v-model="varsJSON[s.id]" rows="6"></textarea>
          </div>
        </div>
      </div>

      <h2 class="h">打卡天数卡片</h2>
      <div class="grid">
        <div v-for="s in d.CARD_SKINS" :key="s.id" class="card">
          <div class="pv"><div class="cardpv" :class="'cp-' + s.id"><b class="n">7</b><span class="w">天</span></div></div>
          <div class="f">
            <label>id</label><input v-model="s.id" /><label>名称</label><input v-model="s.name" />
            <label>价格</label><input v-model.number="s.price" type="number" /><label>描述</label><input v-model="s.desc" />
          </div>
        </div>
      </div>

      <h2 class="h">头像框</h2>
      <div class="grid">
        <div v-for="s in d.AVATAR_FRAMES" :key="s.id" class="card">
          <div class="pv"><Avatar name="知" :size="60" :frame="s.id" /></div>
          <div class="f">
            <label>id</label><input v-model="s.id" /><label>名称</label><input v-model="s.name" />
            <label>价格</label><input v-model.number="s.price" type="number" /><label>描述</label><input v-model="s.desc" />
            <label>类型</label><select v-model="s.type"><option value="image">图片</option><option value="ring">光环</option></select>
          </div>
        </div>
      </div>

      <h2 class="h">标识徽章</h2>
      <div class="grid">
        <div v-for="s in d.MARK_BADGES" :key="s.id" class="card">
          <div class="pv"><img :src="markImgUrl(s.id)" class="markpv" alt="" /></div>
          <div class="f">
            <label>id</label><input v-model="s.id" /><label>名称</label><input v-model="s.name" />
            <label>价格</label><input v-model.number="s.price" type="number" /><label>描述</label><input v-model="s.desc" />
          </div>
        </div>
      </div>

      <h2 class="h">白噪音</h2>
      <div class="grid">
        <div v-for="s in d.NOISE_SKINS" :key="s.id" class="card">
          <div class="pv"><div class="noisepv"><Icon name="volume" :size="30" /><span>{{ s.name }}</span></div></div>
          <div class="f">
            <label>id</label><input v-model="s.id" /><label>名称</label><input v-model="s.name" />
            <label>价格</label><input v-model.number="s.price" type="number" /><label>描述</label><input v-model="s.desc" />
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 勋章 ================= -->
    <section v-if="tab === 'ach'">
      <div class="bar">
        <span class="st" :class="{ ok: status.ach.startsWith('已保存') }">{{ status.ach }}</span>
        <button class="btn" @click="addAch">新增勋章</button>
        <button class="btn btn-primary" @click="saveAch">保存勋章</button>
      </div>
      <div class="grid">
        <div v-for="(a, i) in ach" :key="i" class="card ach">
          <div class="ach-ic"><Icon :name="a.icon || 'award'" :size="26" /></div>
          <div class="f">
            <label>id</label><input v-model="a.id" />
            <label>名称</label><input v-model="a.name" />
            <div class="row2"><label>图标</label><input v-model="a.icon" list="icons" /></div>
            <datalist id="icons">
              <option v-for="ic in ICON_LIST" :key="ic" :value="ic"></option>
            </datalist>
            <label>等级</label>
            <select v-model.number="a.tier"><option :value="1">铜</option><option :value="2">银</option><option :value="3">金</option><option :value="4">曜</option></select>
            <label>达成条件（说明文字）</label><input v-model="a.req" />
            <label>判定逻辑（指标）</label>
            <div class="cond">
              <select v-model="a.cond.a.metric"><option v-for="m in METRICS" :key="m[0]" :value="m[0]">{{ m[1] }}</option></select>
              <select v-model="a.cond.a.op"><option v-for="o in OPS" :key="o[0]" :value="o[0]">{{ o[1] }}</option></select>
              <input v-model.number="a.cond.a.value" type="number" placeholder="数值" :disabled="isBool(a.cond.a)" />
              <select v-model="a.cond.j">
                <option value="">（无第二条件）</option><option value="&&">且 AND</option><option value="||">或 OR</option>
              </select>
            </div>
            <div v-if="a.cond.j" class="cond">
              <select v-model="a.cond.b.metric"><option v-for="m in METRICS" :key="m[0]" :value="m[0]">{{ m[1] }}</option></select>
              <select v-model="a.cond.b.op"><option v-for="o in OPS" :key="o[0]" :value="o[0]">{{ o[1] }}</option></select>
              <input v-model.number="a.cond.b.value" type="number" placeholder="数值" :disabled="isBool(a.cond.b)" />
            </div>
            <div class="cprev">判定: <code>{{ condPreview(a) }}</code></div>
            <button class="btn btn-danger" @click="delAch(i)">删除</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 导出样式 ================= -->
    <section v-if="tab === 'style'">
      <div class="bar">
        <span class="st" :class="{ ok: status.style.startsWith('已保存') }">{{ status.style }}</span>
        <button class="btn btn-primary" @click="saveStyle">保存导出样式</button>
      </div>
      <div class="card style">
        <div class="f">
          <label>画布宽 (px)</label><input v-model.number="style.w" type="number" />
          <label>画布高 (px)</label><input v-model.number="style.h" type="number" />
          <h3 class="h">颜色（#hex）</h3>
          <div class="row2" v-for="k in COLOR_KEYS" :key="k">
            <label>{{ k }}</label><input v-model="style.colors[k]" />
            <span class="sw" :style="{ background: style.colors[k] }"></span>
          </div>
        </div>
        <div class="pv export-preview">
          <svg :width="220" :height="300" viewBox="0 0 300 440">
            <rect x="0" y="0" width="300" height="440" :fill="style.colors.bg2" />
            <circle cx="240" cy="60" r="70" :fill="style.colors.accent" opacity="0.15" />
            <text x="24" y="60" :fill="style.colors.txt" font-size="22" font-weight="800">知时用户</text>
            <rect x="24" y="110" width="120" height="84" rx="14" :fill="style.colors.card" />
            <text x="84" y="164" :fill="style.colors.accent" font-size="26" font-weight="800" text-anchor="middle">2时</text>
            <text x="84" y="184" :fill="style.colors.sub" font-size="10" text-anchor="middle">专注时长</text>
            <rect x="156" y="110" width="120" height="84" rx="14" :fill="style.colors.card" />
            <text x="216" y="164" :fill="style.colors.gold" font-size="26" font-weight="800" text-anchor="middle">8 天</text>
            <text x="216" y="184" :fill="style.colors.sub" font-size="10" text-anchor="middle">打卡天数</text>
          </svg>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import {
  SKINS, GLASS_PRICE, CUSTOM_BUTTONS, CLOCK_SKINS, THEME_SKINS, CARD_SKINS,
  AVATAR_FRAMES, MARK_BADGES, NOISE_SKINS, DEV_MARKS, markImgUrl
} from "../lib/skins.js";
import CheckinButton from "../components/CheckinButton.vue";
import Avatar from "../components/Avatar.vue";
import Icon from "../components/Icon.vue";

const API = "http://localhost:8700";
const tab = ref("shop");
const tabs = [
  { k: "shop", n: "商城" }, { k: "ach", n: "勋章" }, { k: "style", n: "导出样式" }
];

const ICON_LIST = ["medal", "award", "cert", "exam", "clock", "shield", "moon", "sunrise", "timer", "flame", "note", "panel"];
const METRICS = [
  ["checkinTotal", "累计打卡天数"], ["maxStreak", "最长连续"], ["curStreak", "当前连续"],
  ["totalFocusMin", "累计专注(分)"], ["longestFocus", "单次最长专注(分)"], ["focusCount", "专注次数"],
  ["examDone", "完成考试数"], ["plansDone", "完成计划数"], ["certCount", "证书数"],
  ["awardCount", "奖状数"], ["diaryCount", "日记数"], ["earlyBird", "早起鸟"], ["nightOwl", "夜行侠"]
];
const OPS = [[">=", "≥"], [">", "＞"], ["<=", "≤"], ["<", "＜"], ["==", "＝"], ["", "√存在"]];
const COLOR_KEYS = ["ink", "card", "accent", "gold", "txt", "sub", "bg1", "bg2"];

const status = reactive({ shop: "", ach: "", style: "" });

// 商城
const glassPrice = ref(GLASS_PRICE);
const d = reactive({
  SKINS: SKINS.map((x) => ({ ...x })),
  CUSTOM_BUTTONS: CUSTOM_BUTTONS.map((x) => ({ ...x, style: { ...x.style } })),
  CLOCK_SKINS: CLOCK_SKINS.map((x) => ({ ...x })),
  THEME_SKINS: THEME_SKINS.map((x) => ({ ...x, vars: { ...x.vars } })),
  CARD_SKINS: CARD_SKINS.map((x) => ({ ...x })),
  AVATAR_FRAMES: AVATAR_FRAMES.map((x) => ({ ...x })),
  MARK_BADGES: MARK_BADGES.map((x) => ({ ...x })),
  NOISE_SKINS: NOISE_SKINS.map((x) => ({ ...x })),
  DEV_MARKS: DEV_MARKS.map((x) => ({ ...x }))
});
const varsJSON = reactive({});
d.THEME_SKINS.forEach((s) => { varsJSON[s.id] = JSON.stringify(s.vars || {}, null, 2); });

// ---- 自定义按钮模板：下载 / 上传 / 校验 ----
const fileInput = ref(null);
const DEFAULT_STYLE = { bg: "linear-gradient(180deg,#3f7d6b,#2b5d4f)", color: "#fff", radius: "18px", minW: "230px", minH: "72px", fontSize: "18px", border: "1px solid rgba(255,255,255,.2)", shadow: "0 10px 18px rgba(0,0,0,.2)", label: "今日打卡" };
function admCustomStyle(b) {
  const st = b.style || {};
  return { background: st.bg || DEFAULT_STYLE.bg, color: st.color || DEFAULT_STYLE.color, borderRadius: st.radius || DEFAULT_STYLE.radius, minWidth: st.minW || DEFAULT_STYLE.minW, minHeight: st.minH || DEFAULT_STYLE.minH, fontSize: st.fontSize || DEFAULT_STYLE.fontSize, border: st.border || DEFAULT_STYLE.border, boxShadow: st.shadow || DEFAULT_STYLE.shadow, padding: "0 24px", fontWeight: "800" };
}
function downloadTemplate() {
  const tpl = { id: "mystyle", name: "我的按钮", price: 10, desc: "自定义按钮", style: { ...DEFAULT_STYLE } };
  const blob = new Blob([JSON.stringify(tpl, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "button-template.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
function importTemplate(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const o = JSON.parse(rd.result);
      const b = { id: o.id || ("c" + Date.now()), name: o.name || "自定义按钮", price: o.price || 10, desc: o.desc || "", style: Object.assign({}, DEFAULT_STYLE, o.style || {}) };
      d.CUSTOM_BUTTONS.push(b);
      status.shop = "已导入按钮模板：" + b.name;
    } catch (err) { status.shop = "模板解析失败：" + err.message; }
  };
  rd.readAsText(file);
  e.target.value = "";
}
function addCustomBtn() { d.CUSTOM_BUTTONS.push({ id: "c" + Date.now(), name: "新按钮", price: 10, desc: "", style: { ...DEFAULT_STYLE } }); }
function delCustomBtn(i) { d.CUSTOM_BUTTONS.splice(i, 1); }

async function saveShop() {
  d.THEME_SKINS.forEach((s) => { try { s.vars = JSON.parse(varsJSON[s.id]); } catch (e) { status.shop = "主题「" + s.name + "」JSON 有错"; return; } });
  status.shop = "保存中…";
  const r = await post("/api/shop", { data: JSON.parse(JSON.stringify(d)), glassPrice: glassPrice.value });
  status.shop = r.ok ? "已保存商城 ✔" : "失败:" + (r.error || "");
}

// 勋章
const ach = ref([]);
async function loadAch() {
  const r = await fetch(API + "/api/achievements").then((x) => x.json());
  if (r.ok) ach.value = r.data;
}
function isBool(c) { return !c.op; }
function condPreview(a) {
  const c = a.cond; const cl = (x) => x && x.metric ? (x.op ? "s." + x.metric + " " + x.op + " " + x.value : "s." + x.metric) : "true";
  let s = cl(c.a); if (c.j && c.b) s += " " + c.j + " " + cl(c.b);
  return s;
}
function addAch() {
  ach.value.push({ id: "new-" + Date.now(), name: "新勋章", icon: "award", tier: 1, req: "", cond: { a: { metric: "checkinTotal", op: ">=", value: 1 }, j: "", b: { metric: "", op: "", value: null } } });
}
function delAch(i) { ach.value.splice(i, 1); }
async function saveAch() {
  status.ach = "保存中…";
  // 清理空条件
  const items = ach.value.map((a) => ({ id: a.id, name: a.name, icon: a.icon, tier: a.tier, req: a.req, cond: a.cond }));
  const r = await post("/api/achievements", { data: items });
  status.ach = r.ok ? "已保存勋章 ✔" : "失败:" + (r.error || "");
}

// 导出样式
const style = reactive({ w: 1080, h: 1560, colors: {} });
async function loadStyle() {
  const r = await fetch(API + "/api/export-style").then((x) => x.json());
  if (r.ok) Object.assign(style, JSON.parse(JSON.stringify(r.style)));
}
async function saveStyle() {
  status.style = "保存中…";
  const r = await post("/api/export-style", { style: JSON.parse(JSON.stringify(style)) });
  status.style = r.ok ? "已保存导出样式 ✔" : "失败:" + (r.error || "");
}

async function post(path, body) {
  try {
    const r = await fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return await r.json();
  } catch (e) {
    return { ok: false, error: "请先运行 python shop_admin_server.py" };
  }
}

onMounted(() => { loadAch(); loadStyle(); });
</script>

<style scoped>
.adm { padding: 18px 22px 60px; }
.adm-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
.eb { color: var(--accent); font-size: 11px; font-weight: 700; letter-spacing: 2px; }
.adm-title { margin: 2px 0; font-size: 22px; }
.adm-sub { color: var(--ink-2); font-size: 12.5px; }
.adm-tabs { display: flex; gap: 6px; background: var(--surface); border: 1px solid var(--line); border-radius: 999px; padding: 4px; }
.tab { padding: 8px 16px; border-radius: 999px; background: none; color: var(--ink-2); font-weight: 700; cursor: pointer; }
.tab.on { background: var(--accent); color: #fff; }
.bar { display: flex; align-items: center; gap: 12px; margin: 6px 0 16px; }
.st { font-size: 12.5px; color: #b23; }
.st.ok { color: var(--accent); }
.h { font-size: 16px; font-weight: 800; margin: 22px 0 10px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 14px; }
.card { border: 1px solid var(--line); border-radius: 14px; background: var(--surface); padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.inline { flex-direction: row; align-items: center; }
.pv { display: flex; align-items: center; justify-content: center; min-height: 96px; background: var(--surface-2); border: 1px solid var(--line-2); border-radius: 12px; padding: 10px; overflow: hidden; }
.f { display: flex; flex-direction: column; gap: 5px; }
.f label { font-size: 11px; color: var(--ink-3); }
.f input, .f select, .f textarea { font: inherit; font-size: 13px; padding: 6px 8px; border: 1px solid var(--line); border-radius: 8px; background: #fff; color: var(--ink); width: 100%; }
.f textarea { font-family: ui-monospace, monospace; }
.row2 { display: flex; gap: 8px; align-items: center; }
.row2 label { width: 48px; }
.sw { width: 20px; height: 20px; border-radius: 6px; border: 1px solid #999; flex: none; }
.glassdemo { padding: 10px 16px; border-radius: 16px; background: #2a2e33; color: #fff; font-size: 12px; }
.clockpv { width: 100%; height: 100%; min-height: 96px; border-radius: 10px; background-size: cover; }
.theme { border-radius: 12px; height: 96px; flex-direction: column; align-items: flex-end; padding: 10px; gap: 8px; width: 100%; }
.tp-accent { width: 34px; height: 12px; border-radius: 999px; }
.tp-card { display: flex; flex-direction: column; gap: 6px; width: 72%; height: 44px; border-radius: 10px; border: 1px solid; padding: 8px; }
.tp-card i { display: block; height: 10px; border-radius: 999px; }
.cardpv { width: 100%; border-radius: 14px; height: 96px; display: flex; align-items: center; justify-content: center; gap: 2px; }
.cardpv .n { font-size: 46px; font-weight: 800; line-height: 1; }
.cardpv .w { font-size: 22px; font-weight: 700; }
.cp-obsidian { background: linear-gradient(45deg, #1c1e24, #2b2f38); color: #e2b543; }
.cp-sakura { background: linear-gradient(45deg, #fff6f8, #ffd3de); color: #e05c86; }
.cp-starlight { background: linear-gradient(45deg, #10162e, #233056); color: #8fb4ff; }
.markpv { width: 60px; height: 60px; object-fit: contain; }
.noisepv { display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--ink-2); }
.ach { flex-direction: row; }
.ach-ic { width: 60px; height: 60px; flex: none; display: flex; align-items: center; justify-content: center; background: var(--surface-2); border-radius: 12px; }
.cond { display: flex; gap: 6px; }
.cond select, .cond input { font-size: 12px; padding: 5px 6px; }
.cprev { font-size: 12px; color: var(--ink-2); }
.cprev code { background: var(--surface-2); padding: 2px 6px; border-radius: 6px; }
.btn { padding: 8px 14px; border-radius: 10px; font-weight: 700; cursor: pointer; background: var(--surface); border: 1px solid var(--line); color: var(--ink); }
.btn-primary { background: var(--accent); color: #fff; border-color: var(--accent); }
.btn-danger { background: #b23; color: #fff; border-color: #b23; }
.style { flex-direction: row; gap: 20px; }
.export-preview { flex: none; }
.adb { display: inline-flex; align-items: center; justify-content: center; cursor: pointer; border: none; font: inherit; letter-spacing: 0.02em; }
.muted { color: var(--ink-3); font-size: 13px; justify-content: center; align-items: center; text-align: center; min-height: 96px; }
</style>
