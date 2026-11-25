#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
manage_admin.py — 管理「知时」勋章(achievements) 与 导出卡片样式(exportStyle)。
直接从 src/lib/achievements.js 与 src/lib/exportStyle.js 读写，供 shop_admin_server.py 使用。
"""
import re
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ACHIEVEMENTS_JS = ROOT / "src" / "lib" / "achievements.js"
EXPORT_STYLE_JS = ROOT / "src" / "lib" / "exportStyle.js"

# 可判定的指标（对应 achievements.js 里 computeStats() 返回的字段）
METRICS = [
    ("checkinTotal", "累计打卡天数"),
    ("maxStreak", "最长连续打卡"),
    ("curStreak", "当前连续打卡"),
    ("totalFocusMin", "累计专注(分钟)"),
    ("longestFocus", "单次最长专注(分钟)"),
    ("focusCount", "专注次数"),
    ("examDone", "完成考试数"),
    ("plansDone", "完成计划数"),
    ("certCount", "证书数"),
    ("awardCount", "奖状数"),
    ("diaryCount", "日记数"),
    ("earlyBird", "早起鸟(5-7点)" ),
    ("nightOwl", "夜行侠(23点后)")
]
OPS = [(">=", "大于等于"), ("<=", "小于等于"), (">", "大于"), ("<", "小于"), ("==", "等于"), ("", "(布尔/存在)")]
METRIC_KEYS = {k for k, _ in METRICS}

# ---------------------------------------------------------------- 条件解析
def parse_cond(expr):
    """把 `s.checkinTotal >= 1 && s.maxStreak < 3` 解析为结构。"""
    expr = (expr or "").strip()
    if expr.startswith("=>"):
        expr = expr[2:].strip()
    if expr.startswith("(s)"):
        expr = expr[3:].strip()
    if expr.startswith("=>"):
        expr = expr[2:].strip()
    j = ""
    body = expr
    for joiner in ("&&", "||"):
        if joiner in expr:
            j = joiner.strip()
            parts = expr.split(joiner)
            if len(parts) == 2:
                body = parts[0].strip()
                b = _parse_clause(parts[1].strip())
                return {"a": _parse_clause(body), "j": j, "b": b}
    return {"a": _parse_clause(body), "j": "", "b": None}


def _parse_clause(text):
    text = text.strip()
    m = re.match(r"^s\.(\w+)\s*(>=|<=|==|>|<)?\s*(\d+)?$", text)
    if m:
        metric = m.group(1)
        op = m.group(2) or ""
        value = int(m.group(3)) if m.group(3) else None
        if metric not in METRIC_KEYS:
            op, value = "", None
        return {"metric": metric, "op": op, "value": value}
    # 兜底：当作布尔字段（如 s.earlyBird）
    mm = re.match(r"^s\.(\w+)$", text)
    if mm and mm.group(1) in METRIC_KEYS:
        return {"metric": mm.group(1), "op": "", "value": None}
    return {"metric": "", "op": "", "value": None}


def cond_to_js(c):
    """把条件结构还原成 JS 表达式。"""
    js = _clause_to_js(c["a"])
    if c.get("j") and c.get("b"):
        js = "%s %s %s" % (js, c["j"], _clause_to_js(c["b"]))
    return "(s) => " + js


def _clause_to_js(x):
    if not x or not x["metric"]:
        return "true"
    if x["op"]:
        return "s.%s %s %s" % (x["metric"], x["op"], x["value"])
    return "s.%s" % x["metric"]


# ---------------------------------------------------------------- 勋章读写
def _extract_array(src, name):
    m = re.search(r"export\s+const\s+%s\s*=\s*(\[)" % name, src)
    if not m:
        return None, None
    start = m.end() - 1
    j, depth, in_str, esc = start, 0, False, False
    while j < len(src):
        ch = src[j]
        if in_str:
            if esc: esc = False
            elif ch == "\\": esc = True
            elif ch == '"': in_str = False
        else:
            if ch == '"': in_str = True
            elif ch == "[": depth += 1
            elif ch == "]":
                depth -= 1
                if depth == 0:
                    break
        j += 1
    return src[start:j + 1], src[start + 1:j]


def _parse_ach_item(text):
    item = {}
    text = text.strip().rstrip(",").strip()
    item["id"] = (re.search(r'id:\s*"([^"]*)"', text) or [None, ""])[1]
    item["name"] = (re.search(r'name:\s*"([^"]*)"', text) or [None, ""])[1]
    item["icon"] = (re.search(r'icon:\s*"([^"]*)"', text) or [None, ""])[1]
    tm = re.search(r'tier:\s*(\d+)', text)
    item["tier"] = int(tm.group(1)) if tm else 1
    rr = re.search(r'req:\s*"([^"]*)"', text)
    item["req"] = rr.group(1) if rr else ""
    cm = re.search(r'cond:\s*(\(s\)\s*=>\s*.+)$', text)
    item["cond"] = parse_cond(cm.group(1)) if cm else {"a": {"metric": "", "op": "", "value": None}, "j": "", "b": None}
    return item


def load_achievements():
    src = ACHIEVEMENTS_JS.read_text(encoding="utf-8")
    arr_text = None
    m = re.search(r"export\s+const\s+ACHIEVEMENTS\s*=\s*(\[)", src)
    if m:
        _arr, arr_text = _extract_array(src, "ACHIEVEMENTS")
    out = []
    if arr_text:
        # 每条是 `{...}`，用非贪婪匹配（cond 里没有大括号）
        for item_text in re.findall(r"\{([^{}]*)\}", arr_text):
            out.append(_parse_ach_item(item_text))
    return out


def js_str(s):
    return '"%s"' % s.replace("\\", "\\\\").replace('"', '\\"')


ACH_HELPERS = """
export const TIER_NAME = { 1: "铜", 2: "银", 3: "金", 4: "曜" };

// ============ 汇总统计 ============
export function computeStats() {
  const checkinDates = state.checkins.map((c) => c.date);
  const early = state.checkins.some((c) => {
    const d = new Date(c.ts);
    const h = d.getHours();
    return h >= 5 && h < 7;
  });
  const night = state.checkins.some((c) => {
    const d = new Date(c.ts);
    return d.getHours() >= 23;
  }) || state.focus.some((f) => {
    const d = new Date(f.endAt || f.startAt);
    return d.getHours() >= 23;
  });
  const totalFocusMin = state.focus.reduce((s, f) => s + (Number(f.minutes) || 0), 0);
  return {
    checkinTotal: checkinDates.length,
    maxStreak: longestStreak(checkinDates),
    curStreak: currentStreak(checkinDates),
    earlyBird: early,
    nightOwl: night,
    totalFocusMin,
    focusCount: state.focus.length,
    longestFocus: state.focus.reduce((m, f) => Math.max(m, Number(f.minutes) || 0), 0),
    examDone: state.records.filter((r) => r.status === "done").length,
    plansDone: state.plans.filter((p) => p.done).length,
    certCount: state.certs.length,
    awardCount: state.awards.length,
    diaryCount: state.diary.length
  };
}

// 评估成就：返回本次新解锁列表
export function evaluateAchievements() {
  const s = computeStats();
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements[a.id] && a.cond(s)) {
      state.achievements[a.id] = Date.now();
      fresh.push(a);
    }
  }
  return fresh;
}

export function unlockedCount() {
  return Object.keys(state.achievements).length;
}

export function getAchievement(id) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
"""


def build_achievements(items):
    lines = []
    for a in items:
        parts = [
            'id: %s' % js_str(a.get("id", "")),
            'name: %s' % js_str(a.get("name", "")),
            'icon: %s' % js_str(a.get("icon", "")),
            'tier: %d' % int(a.get("tier", 1) or 1),
            'req: %s' % js_str(a.get("req", ""))
        ]
        cond = a.get("cond") or {"a": {"metric": "", "op": "", "value": None}, "j": "", "b": None}
        parts.append("cond: %s" % cond_to_js(cond))
        lines.append("  {\n    %s\n  }" % ",\n    ".join(parts))
    header = ('import { state } from "../store/state.js";\n'
              'import { currentStreak, longestStreak } from "../utils.js";\n\n'
              '// ============ 勋章定义（由 manage_admin.py 生成，请勿手改结构）============\n\n'
              'export const ACHIEVEMENTS = [\n%s\n];' % ",\n".join(lines))
    return header + "\n" + ACH_HELPERS


# ---------------------------------------------------------------- 导出样式
DEFAULT_STYLE = {
    "w": 1080, "h": 1560,
    "colors": {
        "ink": "#16181c", "card": "#20241f", "accent": "#9fd4b8",
        "gold": "#f2c14e", "txt": "#f4f3ec", "sub": "#a9ada4",
        "bg1": "#121418", "bg2": "#1c221c"
    }
}


def load_export_style():
    src = EXPORT_STYLE_JS.read_text(encoding="utf-8")
    style = json.loads(json.dumps(DEFAULT_STYLE))   # 默认
    m = re.search(r"export\s+const\s+EXPORT_STYLE\s*=\s*(\{.*?\});", src, re.S)
    if m:
        try:
            style = json.loads(m.group(1))
        except Exception:
            pass
    return style


def build_export_style(style):
    body = json.dumps(style, ensure_ascii=False, indent=2)
    return ("// 成就卡导出样式（由 manage_admin.py 生成，可后台修改）\n"
            "export const EXPORT_STYLE = %s;\n" % body)


if __name__ == "__main__":
    ach = load_achievements()
    print("勋章数:", len(ach))
    for a in ach[:3]:
        print("  ", a["id"], a["name"], "cond=", cond_to_js(a["cond"]))
    print("样式:", load_export_style())
