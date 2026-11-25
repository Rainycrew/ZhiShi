import { reactive } from "vue";

// 极简 hash 路由：路径格式
//   /                    首页
//   /exam                考试中心（模板列表）
//   /exam/edit/:id       编辑模板
//   /exam/run/:id        考试进行页
//   /clock               时钟工作台
//   /plan                计划中心
//   /profile             个人主页

const route = reactive({ name: "home", params: {}, query: {} });

function parseHashFrom(raw) {
  const clean = (raw || "").replace(/^#/, "");
  const pathPart = clean.split("?")[0];
  const queryPart = clean.includes("?") ? clean.split("?").slice(1).join("?") : "";
  const segs = pathPart.split("/").filter(Boolean);
  const q = new URLSearchParams(queryPart || "");
  const out = { name: "home", params: {}, query: {} };
  q.forEach((v, k) => (out.query[k] = v));
  if (segs[0] === "exam") {
    if (segs[1] === "edit") {
      out.name = "exam-edit";
      out.params.id = segs[2] || "";
    } else if (segs[1] === "run") {
      out.name = "exam-run";
      out.params.id = segs[2] || "";
    } else {
      out.name = "exam";
    }
  } else if (segs[0] === "clock") {
    out.name = "clock";
  } else if (segs[0] === "shop") {
    out.name = "shop";
  } else if (segs[0] === "plan") {
    out.name = "plan";
  } else if (segs[0] === "profile") {
    out.name = "profile";
  }
  return out;
}

function parseHash() {
  return parseHashFrom(location.hash.replace(/^#/, "") || "/");
}

function apply(next) {
  route.name = next.name;
  route.params = next.params;
  route.query = next.query;
}

function syncFrom(raw) {
  apply(parseHashFrom((raw || "").replace(/^#/, "")));
}

// 当前“应该停留”的地址（由 navigate 维护；初始为打开时的地址）
let intendedHash = location.hash || "#/";

export function navigate(name, params = {}, query = {}) {
  const map = {
    home: "/",
    exam: "/exam",
    "exam-edit": `/exam/edit/${params.id || ""}`,
    "exam-run": `/exam/run/${params.id || ""}`,
    clock: "/clock",
    shop: "/shop",
    plan: "/plan",
    profile: "/profile"
  };
  const base = map[name] || "/";
  const q = new URLSearchParams(query);
  const qs = q.toString();
  const hash = "#" + base + (qs ? "?" + qs : "");
  intendedHash = hash;
  if (location.hash !== hash) {
    // 不产生历史记录
    try {
      history.replaceState(null, "", hash);
    } catch (e) {}
  }
  syncFrom(hash);
  window.scrollTo(0, 0);
}

function isAppHash(raw) {
  const h = (raw || "").replace(/^#/, "");
  if (!h) return false;
  const n = parseHashFrom(h).name;
  return !!n;
}

// 用户用浏览器“返回/前进”或左右滑动触发历史时：
// 只要仍在应用页面内，就强行拉回当前页 —— 页面切换只能由点导航完成。
function onHistoryNav() {
  const cur = location.hash || "";
  if (parseHashFrom(cur).name === route.name) return;
  if (intendedHash && isAppHash(cur)) {
    try {
      history.replaceState(null, "", intendedHash);
    } catch (e) {}
    syncFrom(intendedHash);
  } else if (isAppHash(cur)) {
    syncFrom(cur);
  }
}

window.addEventListener("hashchange", onHistoryNav);
window.addEventListener("popstate", onHistoryNav);

export function syncRoute() {
  const next = parseHash();
  intendedHash = location.hash || "#/";
  apply(next);
}

export function isPlainRoute() {
  return route.name === "exam-run";
}

export default route;
