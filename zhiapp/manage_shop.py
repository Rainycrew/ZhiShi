#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
manage_shop.py — 知时 App 商城管理工具（无后端，直接改前端源码文件）

功能：
  - 用一个图形界面管理「知时」商城的 8 类商品与价格：
      打卡按钮 / 毛玻璃 / 时钟 / 主题 / 天数卡 / 头像框 / 标识 / 白噪音
  - 增/删/改商品（id、名称、价格、描述）。
  - 对「按素材文件」生效的类型（头像框图片、标识徽章、白噪音音频），
    提供「选择文件 → 一键导入到标准路径」：按 id 自动放到
      public/img/<id>.png          头像框图片
      public/img/chenghao/<id>.png 标识徽章
      public/img/baizaoyin/<id>.mp3 白噪音音频
    并生成对应的商城条目 —— 这样“已上传就兼容”，App 会自动识别。
  - 一键「生成并保存」：拷贝素材 + 重写 src/lib/skins.js。

用法：
  python manage_shop.py
"""

import os
import re
import shutil
import json
import time
import socket
import webbrowser
import subprocess
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from pathlib import Path

# Pillow（可选）：装了就用来生成清晰的缩略图；没有则回退到 Tk 原生加载
try:
    from PIL import Image, ImageTk
    HAS_PIL = True
except Exception:
    HAS_PIL = False

# ---------------------------------------------------------------- 路径
ROOT = Path(__file__).resolve().parent            # 项目根目录（zhishi-app/）
SKINS_JS = ROOT / "src" / "lib" / "skins.js"       # 生成的商城数据文件
PUBLIC_IMG = ROOT / "public" / "img"

# 分类元信息：key -> (数组名, 显示名, 类型)
#  type: 'asset-image' 头像框图片  'asset-mark' 标识  'asset-noise' 音频
#        'css'  时钟(css背景)      'vars'  主题(色板变量)   'meta' 仅元数据
CATEGORIES = [
    ("SKINS",        "打卡按钮", "meta"),
    ("GLASS",        "毛玻璃",   "meta"),
    ("CLOCK_SKINS",  "时钟",     "css"),
    ("THEME_SKINS",  "主题",     "vars"),
    ("CARD_SKINS",   "天数卡",   "meta"),
    ("AVATAR_FRAMES","头像框",   "asset-image"),
    ("MARK_BADGES",  "标识",     "asset-mark"),
    ("NOISE_SKINS",  "白噪音",   "asset-noise"),
]

# 数组常量名 -> 对应的资产子目录（资产类）
ASSET_DIR = {
    "AVATAR_FRAMES": "",                 # public/img/<id>.png
    "MARK_BADGES":   "chenghao",         # public/img/chenghao/<id>.png
    "NOISE_SKINS":   "baizaoyin",        # public/img/baizaoyin/<id>.mp3
}

# ---------------------------------------------------------------- JS 解析
def _tokenize(s):
    """把 JS 片段切成 token，处理双引号字符串、{}、[]、:、,、数字、布尔、标识符。"""
    toks = []
    i, n = 0, len(s)
    while i < n:
        c = s[i]
        if c in " \t\r\n":
            i += 1
            continue
        if c in "{}[],:":
            toks.append((c, c)); i += 1; continue
        if c == '"':
            j, buf = i + 1, []
            while j < n:
                if s[j] == "\\" and j + 1 < n:
                    buf.append(s[j + 1]); j += 2; continue
                if s[j] == '"':
                    break
                buf.append(s[j]); j += 1
            toks.append(("str", "".join(buf))); i = j + 1; continue
        if c.isdigit() or (c == "-" and i + 1 < n and s[i + 1].isdigit()):
            m = re.match(r"-?\d+(\.\d+)?", s[i:])
            g = m.group()
            toks.append(("num", float(g) if "." in g else int(g)))
            i += len(g); continue
        m = re.match(r"[A-Za-z_$][A-Za-z0-9_$]*", s[i:])
        if m:
            w = m.group()
            if w == "true": toks.append(("bool", True))
            elif w == "false": toks.append(("bool", False))
            elif w == "null": toks.append(("bool", None))
            else: toks.append(("name", w))
            i += len(w); continue
        raise ValueError("unexpected char: %r" % c)
    return toks


class _Parser:
    def __init__(self, toks, consts):
        self.t = toks; self.i = 0; self.consts = consts

    def peek(self):
        return self.t[self.i] if self.i < len(self.t) else None

    def eat(self, c):
        if self.peek() and self.peek()[0] == c:
            self.i += 1; return True
        return False

    def value(self):
        k, v = self.peek()
        if k == "str": self.i += 1; return v
        if k == "num": self.i += 1; return v
        if k == "bool": self.i += 1; return v
        if k == "name":
            self.i += 1
            return self.consts.get(v, v)     # 把 SKIN_PRICE 等常量换成数值
        if k == "{":
            return self.object()
        if k == "[":
            return self.array()
        raise ValueError("unexpected value token: %r" % (k,))

    def object(self):
        self.eat("{")
        obj = {}
        while not self.eat("}"):
            key = self.value()                    # key 可能是 str/name -> 纯值
            key = str(key)
            self.eat(":")
            obj[key] = self.value()
            if not self.eat(","):
                self.eat("}")
                break
        return obj

    def array(self):
        self.eat("[")
        arr = []
        while not self.eat("]"):
            arr.append(self.value())
            if not self.eat(","):
                self.eat("]")
                break
        return arr


PRICE_CONSTANTS = ["SKIN_PRICE", "GLASS_PRICE", "MARK_PRICE", "NOISE_PRICE"]


def parse_js_array(text):
    """解析一个 `[...]` 数组文本为 Python list[dict]（含嵌套 vars 对象）。"""
    toks = _tokenize(text)
    p = _Parser(toks, {"SKIN_PRICE": 10, "GLASS_PRICE": 15, "MARK_PRICE": 8, "NOISE_PRICE": 5})
    return p.value()


def load_skins():
    """从 skins.js 读出所有分类数组 + 价格常量。返回 (data, consts)。"""
    src = SKINS_JS.read_text(encoding="utf-8")
    data = {}
    # 需要解析的所有“数组”导出（GLASS 是单值价格，DEV_MARKS 不上商城但必须保留）
    PARSE_LIST = ["SKINS", "CUSTOM_BUTTONS", "CLOCK_SKINS", "THEME_SKINS", "CARD_SKINS",
                  "AVATAR_FRAMES", "MARK_BADGES", "DEV_MARKS", "NOISE_SKINS"]
    for key in PARSE_LIST:
        # 用括号配平定位该 export 的数组
        m = re.search(r"export\s+const\s+%s\s*=\s*(\[)" % key, src)
        if not m:
            data[key] = []
            continue
        start = m.end() - 1                       # 指向 '['
        # 手动配平找闭合 ']'
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
        data[key] = parse_js_array(src[start:j + 1])
    consts = {}
    for name in PRICE_CONSTANTS + ["DEFAULT_MARK"]:
        m = re.search(r"export\s+const\s+%s\s*=\s*([^;]+);" % name, src)
        if m:
            val = m.group(1).strip().strip('"')
            if val.isdigit():
                val = int(val)
            consts[name] = val
    return data, consts


# ---------------------------------------------------------------- JS 生成
def js_str(s):
    """把字符串转成 JS 双引号字面量。"""
    s = s.replace("\\", "\\\\").replace('"', '\\"')
    return '"%s"' % s


def js_obj(item):
    """把 dict 序列化为 JS 对象字面量（保持 key 顺序；vars 的 "--xx" 键加引号）。"""
    parts = []
    for k, v in item.items():
        if isinstance(v, dict):
            parts.append("%s: {%s}" % (k, ", ".join(
                "%s: %s" % (js_str(kk), js_str(vv)) for kk, vv in v.items())))
        elif isinstance(v, bool):
            parts.append("%s: %s" % (k, "true" if v else "false"))
        elif isinstance(v, (int, float)):
            parts.append("%s: %s" % (k, v))
        elif isinstance(v, str):
            parts.append("%s: %s" % (k, js_str(v)))
        else:
            parts.append("%s: %s" % (k, js_str(str(v))))
    return "{%s}" % ", ".join(parts)


def js_array(items):
    return "[\n  %s\n]" % ",\n  ".join(js_obj(it) for it in items)


# 固定的辅助函数（与源码一致，生成时原样保留，避免破坏 App 依赖）
HELPERS = r"""
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
"""

HEADER = """// ============ 商城 · 皮肤/装扮 统一目录（由 manage_shop.py 生成，请勿手改结构）============
// 每类商品都符合：购买(扣积分、永久拥有) → 装备/切换。不同类别落到不同渲染点。
"""


def build_skins(data, consts):
    """根据 data 生成新的 skins.js 文本。"""
    pr = consts.get("SKIN_PRICE", 10)
    gp = consts.get("GLASS_PRICE", 15)
    mp = consts.get("MARK_PRICE", 8)
    np_ = consts.get("NOISE_PRICE", 5)
    dm = consts.get("DEFAULT_MARK", "yelloV")

    parts = [HEADER]
    parts.append("export const SKIN_PRICE = %s;" % pr)
    parts.append("export const GLASS_PRICE = %s;" % gp)
    parts.append("")
    parts.append("// ---- 打卡按钮皮肤 ----")
    parts.append("export const SKINS = %s;" % js_array(data.get("SKINS", [])))
    parts.append("")
    parts.append("// ---- 自定义按钮皮肤（后台下载模板->改样式->上传生成） ----")
    parts.append("export const CUSTOM_BUTTONS = %s;" % js_array(data.get("CUSTOM_BUTTONS", [])))
    parts.append("export function customButtonById(id) {")
    parts.append("  return CUSTOM_BUTTONS.find((s) => s.id === id) || null;")
    parts.append("}")
    parts.append("")
    parts.append("// ---- 时钟工作台皮肤（背景） ----")
    parts.append("export const CLOCK_SKINS = %s;" % js_array(data.get("CLOCK_SKINS", [])))
    parts.append("")
    parts.append("// ---- 主题 / 强调色皮肤 ----")
    parts.append("export const THEME_SKINS = %s;" % js_array(data.get("THEME_SKINS", [])))
    parts.append("")
    parts.append("// ---- 打卡天数卡片皮肤 ----")
    parts.append("export const CARD_SKINS = %s;" % js_array(data.get("CARD_SKINS", [])))
    parts.append("")
    parts.append("// ---- 头像框 ----")
    parts.append("export const AVATAR_FRAMES = %s;" % js_array(data.get("AVATAR_FRAMES", [])))
    parts.append("")
    parts.append("// ---- 标识徽章 ----")
    parts.append("export const MARK_PRICE = %s;" % mp)
    parts.append('export const DEFAULT_MARK = "%s";' % dm)
    parts.append("export const MARK_BADGES = %s;" % js_array(data.get("MARK_BADGES", [])))
    parts.append("// 开发者专属标识（不上架商城）")
    parts.append("export const DEV_MARKS = %s;" % js_array(data.get("DEV_MARKS", [])))
    parts.append("")
    parts.append("// ---- 白噪音皮肤 ----")
    parts.append("export const NOISE_PRICE = %s;" % np_)
    parts.append("export const NOISE_SKINS = %s;" % js_array(data.get("NOISE_SKINS", [])))
    parts.append(HELPERS)
    return "\n".join(parts)


# ---------------------------------------------------------------- 资产导入
def import_asset(cat, item_id, src_file):
    """把素材文件复制到标准路径，返回 (目标路径, 相对public的路径)。"""
    item_id = (item_id or "").strip() or "item"
    if cat == "NOISE_SKINS":
        rel = "img/baizaoyin/%s.mp3" % item_id
        dest = PUBLIC_IMG / "baizaoyin" / ("%s.mp3" % item_id)
    elif cat == "MARK_BADGES":
        rel = "img/chenghao/%s.png" % item_id
        dest = PUBLIC_IMG / "chenghao" / ("%s.png" % item_id)
    else:  # AVATAR_FRAMES
        rel = "img/%s.png" % item_id
        dest = PUBLIC_IMG / ("%s.png" % item_id)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src_file, dest)
    return dest, rel


# ---------------------------------------------------------------- GUI
CAT_LABEL = {key: "%s (%s)" % (lbl, key) for key, lbl, _ty in CATEGORIES}


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("知时 · 商城管理")
        self.geometry("860x560")
        self.data, self.consts = load_skins()
        self.current = "SKINS"
        self.pending_asset = None   # 待导入的素材源文件（绝对路径）
        self.dev_proc = None
        self._build()
        self.protocol("WM_DELETE_WINDOW", self.on_close)
        self.select_category("SKINS")

    def on_close(self):
        if self.dev_proc:
            try:
                self.dev_proc.terminate()
            except Exception:
                pass
        self.destroy()

    def open_shop_browser(self):
        """启动 vite dev 服务器并打开真实商城页（和前端一模一样的渲染）。"""
        url = "http://localhost:5173/#/shop"
        try:
            s = socket.socket(); s.settimeout(1)
            in_use = s.connect_ex(("127.0.0.1", 5173)) == 0
            s.close()
            if not in_use:
                self.dev_proc = subprocess.Popen("npm run dev", cwd=str(ROOT), shell=True)
                time.sleep(3.5)
            webbrowser.open(url)
            self.note.config(text="已在浏览器打开商城（真实效果）。改完后在浏览器刷新即可看到最新。")
        except Exception as e:
            self.note.config(text="打开失败：%s" % e)

    # ---- UI 搭建 ----
    def _build(self):
        top = ttk.Frame(self); top.pack(fill="x", padx=8, pady=6)
        ttk.Label(top, text="分类：").pack(side="left")
        self.cat_var = tk.StringVar()
        self.cat_box = ttk.Combobox(top, textvariable=self.cat_var, state="readonly",
                                    values=[CAT_LABEL[k] for k, _, _ in CATEGORIES], width=22)
        self.cat_box.pack(side="left", padx=4)
        self.cat_box.bind("<<ComboboxSelected>>", lambda e: self.select_category(self.cat_var.get().split(" (")[-1].rstrip(")")))

        ttk.Button(top, text="重新加载", command=self.reload).pack(side="left", padx=4)
        ttk.Button(top, text="生成并保存 skins.js", command=self.save).pack(side="left", padx=4)
        ttk.Button(top, text="浏览器看真实商城", command=self.open_shop_browser).pack(side="left", padx=4)

        body = ttk.Frame(self); body.pack(fill="both", expand=True, padx=8, pady=4)

        # 左：条目列表
        left = ttk.Frame(body); left.pack(side="left", fill="both", expand=True)
        self.tree = ttk.Treeview(left, columns=("id", "name", "price"), show="headings", height=20)
        self.tree.heading("id", text="id"); self.tree.heading("name", text="名称"); self.tree.heading("price", text="价格")
        self.tree.column("id", width=120); self.tree.column("name", width=180); self.tree.column("price", width=60, anchor="center")
        self.tree.pack(side="left", fill="both", expand=True)
        sb = ttk.Scrollbar(left, orient="vertical", command=self.tree.yview)
        sb.pack(side="right", fill="y"); self.tree.configure(yscrollcommand=sb.set)
        self.tree.bind("<<TreeviewSelect>>", lambda e: self.on_select())

        # 右：表单
        right = ttk.Frame(body, width=360); right.pack(side="left", fill="y", padx=10)
        right.pack_propagate(False)

        # 预览区（可视化看到商品效果）
        pv = ttk.LabelFrame(right, text="预览")
        pv.pack(fill="x", pady=(0, 6))
        self.preview = tk.Canvas(pv, height=138, bg="#f4f3ee", highlightthickness=0)
        self.preview.pack(fill="x", padx=2, pady=2)
        self.preview_img = None

        self.form = {}
        def add_row(label, key, widget):
            ttk.Label(right, text=label).pack(anchor="w", pady=(6, 0))
            widget.pack(fill="x")
            self.form[key] = widget
            return widget

        add_row("id（slug，英文）", "id", ttk.Entry(right))
        add_row("名称", "name", ttk.Entry(right))
        add_row("价格（整数）", "price", ttk.Entry(right))
        add_row("描述", "desc", ttk.Entry(right))

        # 资产类：选择文件
        self.asset_lbl = ttk.Label(right, text="（本类不需要素材）", foreground="#666")
        self.asset_lbl.pack(anchor="w", pady=(10, 0))
        self.asset_btn = ttk.Button(right, text="选择素材文件…", command=self.pick_asset)
        self.asset_btn.pack(fill="x", pady=2)
        self.asset_val = ttk.Label(right, text="", foreground="#0a7a52")
        self.asset_val.pack(anchor="w")

        # css / vars：多行原始编辑器
        self.css_text = tk.Text(right, height=6, wrap="none")
        self.css_lbl = ttk.Label(right, text="")
        self.css_lbl.pack(anchor="w", pady=(8, 0))
        self.css_text.pack(fill="x")

        # 操作按钮
        btns = ttk.Frame(right); btns.pack(fill="x", pady=12)
        ttk.Button(btns, text="新增", command=self.add_item).pack(side="left", expand=True, fill="x", padx=2)
        ttk.Button(btns, text="删除", command=self.delete_item).pack(side="left", expand=True, fill="x", padx=2)
        ttk.Button(btns, text="保存修改", command=self.update_item).pack(side="left", expand=True, fill="x", padx=2)

        self.note = ttk.Label(right, text="", foreground="#b23", wraplength=350, justify="left")
        self.note.pack(anchor="w", pady=6)

    # ---- 行为 ----
    def cat_key(self):
        return self.cat_var.get().split(" (")[-1].rstrip(")")

    def select_category(self, key=None):
        keys = [k for k, _lbl, _ty in CATEGORIES]
        if key in keys:
            self.current = key
        elif self.current not in keys:
            self.current = "SKINS"
        self.refresh_list()
        self.clear_form()
        self.pending_asset = None

    def refresh_list(self):
        self.tree.delete(*self.tree.get_children())
        if self.current == "GLASS":
            self.tree.insert("", "end", values=("(整体)", "毛玻璃 Dock", self.consts.get("GLASS_PRICE", 15)))
            return
        for it in self.data.get(self.current, []):
            self.tree.insert("", "end", values=(it.get("id"), it.get("name", ""), it.get("price", "")))

    def _select_id(self, item_id):
        """在列表里选中指定 id 的那一行（会触发预览刷新）。"""
        for cid in self.tree.get_children():
            vals = self.tree.item(cid)["values"]
            if vals and str(vals[0]) == str(item_id):
                self.tree.selection_set(cid); self.tree.focus(cid)
                break

    def _fields(self):
        return "id", "name", "price", "desc"

    def clear_form(self):
        for k in self._fields():
            self.form[k].delete(0, "end")
        self.css_text.delete("1.0", "end")
        self.css_lbl.config(text="")
        self.asset_val.config(text="")
        self.pending_asset = None
        ty = self._cat_type()
        # 显示哪些扩展控件
        if ty == "css":
            self.css_lbl.config(text="背景 css（background 值）")
            self.asset_lbl.config(text="（时钟皮肤用 CSS，不需要素材文件）"); self.asset_btn.config(state="disabled")
        elif ty == "vars":
            self.css_lbl.config(text="主题变量（JSON，如 {\"--accent\": \"#1f6f8b\", ...}）")
            self.asset_lbl.config(text="（主题用色板变量，不需要素材文件）"); self.asset_btn.config(state="disabled")
        elif ty == "asset-image":
            self.css_lbl.config(text=""); self.asset_lbl.config(text="头像框图片：将放到 public/img/<id>.png")
            self.asset_btn.config(state="normal")
        elif ty == "asset-mark":
            self.css_lbl.config(text=""); self.asset_lbl.config(text="标识徽章：将放到 public/img/chenghao/<id>.png")
            self.asset_btn.config(state="normal")
        elif ty == "asset-noise":
            self.css_lbl.config(text=""); self.asset_lbl.config(text="白噪音音频：将放到 public/img/baizaoyin/<id>.mp3")
            self.asset_btn.config(state="normal")
        else:
            self.css_lbl.config(text="")
            tt = {  # 需要代码才能渲染的分类
                "SKINS": "新增按钮皮肤需在 src/components/CheckinButton.vue 里写样式；此处仅管理价格/名称/描述。",
                "CARD_SKINS": "新增天数卡皮肤需在 src/views/ShopView.vue 里加 cp-<id> 样式；此处仅管理价格/名称/描述。",
                "GLASS": "毛玻璃是整体开关，仅能改价格（GLASS_PRICE）。",
            }.get(self.current, "")
            self.asset_lbl.config(text=tt)
            self.asset_btn.config(state="disabled")
        self.note.config(text="")
        self.render_preview(None)

    def _cat_type(self):
        for k, _l, ty in CATEGORIES:
            if k == self.current:
                return ty
        return "meta"

    def on_select(self):
        sel = self.tree.selection()
        if not sel:
            return
        if self.current == "GLASS":
            return
        item_id = self.tree.item(sel[0])["values"][0]
        item = next((x for x in self.data.get(self.current, []) if x.get("id") == item_id), None)
        if not item:
            return
        self.form["id"].delete(0, "end"); self.form["id"].insert(0, item.get("id", ""))
        self.form["name"].delete(0, "end"); self.form["name"].insert(0, item.get("name", ""))
        self.form["price"].delete(0, "end"); self.form["price"].insert(0, str(item.get("price", "")))
        self.form["desc"].delete(0, "end"); self.form["desc"].insert(0, item.get("desc", ""))
        self.css_text.delete("1.0", "end")
        ty = self._cat_type()
        if ty == "css":
            self.css_text.insert("1.0", item.get("css", ""))
        elif ty == "vars":
            self.css_text.insert("1.0", json.dumps(item.get("vars", {}), ensure_ascii=False, indent=2))
        self.pending_asset = None
        self.asset_val.config(text="")
        self.render_preview(item)

    # ---- 可视化预览 ----
    def render_preview(self, item=None):
        c = self.preview
        c.delete("all")
        self.preview_img = None
        w = max(c.winfo_width(), 320); h = 136
        c.config(bg="#f4f3ee")
        ty = self._cat_type()
        if self.current == "GLASS":
            self._pv_glass(); return
        if item is None:
            c.create_text(w / 2, h / 2, text="← 在左边选一个商品", fill="#999")
            return
        iid = str(item.get("id", ""))
        name = str(item.get("name", ""))
        if ty == "asset-image":
            if str(item.get("type", "")) == "ring":
                self._pv_ring(iid, name)
            else:
                self._pv_image(PUBLIC_IMG / ("%s.png" % iid), name, "头像框")
        elif ty == "asset-mark":
            self._pv_image(PUBLIC_IMG / "chenghao" / ("%s.png" % iid), name, "标识")
        elif ty == "asset-noise":
            self._pv_noise(name)
        elif ty == "vars":
            self._pv_vars(item.get("vars", {}), name, item.get("price"))
        elif ty == "css":
            self._pv_gradient(item.get("css", ""), name, item.get("price"))
        else:
            if self.current == "SKINS":
                self._pv_button(iid, name, item.get("price"))
            elif self.current == "CARD_SKINS":
                self._pv_card(iid, name)
            else:
                self._pv_plain(name, item.get("desc", ""))

    def _show_image(self, path, size=100):
        """加载并缩略图片到 canvas；Pillow 优先，失败回退 Tk。返回是否成功。"""
        if not os.path.exists(path):
            return False
        try:
            if HAS_PIL:
                im = Image.open(str(path))
                im = im.convert("RGBA") if im.mode in ("P", "LA") else im.convert("RGBA")
                im.thumbnail((size * 2, size * 2), Image.LANCZOS)
                self.preview_img = ImageTk.PhotoImage(im)
            else:
                im = tk.PhotoImage(file=str(path))
                w, hh = im.width(), im.height()
                if w <= 0 or hh <= 0:
                    return False
                scale = max(1, int(max(w / size, hh / size)))
                if scale > 1:
                    im = im.subsample(scale, scale)
                self.preview_img = im
            cx = self.preview.winfo_width() / 2 if self.preview.winfo_width() > 1 else 170
            self.preview.create_image(cx, 62, image=self.preview_img)
            return True
        except Exception:
            return False

    def _pv_image(self, path, name, tag):
        c = self.preview
        c.delete("all")
        if not self._show_image(path):
            c.create_text(170, 50, text="（未找到图片）\n%s" % path.name, fill="#b00", justify="center")
        c.create_text(170, 122, text="%s · %s" % (tag, name), fill="#444")

    def _pv_ring(self, iid, name):
        c = self.preview; c.delete("all")
        ring = {"gold": "#e2ab25", "silver": "#b8c2cf", "aurora": "#6a8cff"}.get(iid, "#22604f")
        c.create_oval(65, 28, 145, 108, outline=ring, width=6)          # 外环
        c.create_oval(82, 45, 128, 91, fill="#b6d0c2", outline="#fff", width=2)  # 内头像
        c.create_text(105, 68, text="知", fill="#22604f", font=("", 18, "bold"))
        c.create_text(170, 122, text="光环 · %s" % name, fill="#444")

    def _pv_vars(self, vars_, name, price):
        c = self.preview; c.delete("all")
        x = 14
        for key in ("--accent", "--bg", "--surface", "--line", "--accent-tint", "--accent-ink"):
            col = (vars_ or {}).get(key)
            if not col:
                continue
            c.create_rectangle(x, 30, x + 44, 84, fill=col, outline="#888")
            c.create_text(x + 22, 96, text=key.replace("--", ""), fill="#555", font=("", 8))
            x += 52
        c.create_text(170, 122, text="%s · %s 分" % (name, price), fill="#444")

    def _hexes(self, css):
        return re.findall(r"#[0-9a-fA-F]{6}", css or "")

    def _pv_gradient(self, css, name, price):
        c = self.preview; c.delete("all")
        hexes = self._hexes(css)
        if hexes:
            x0, y0, x1, y1 = 14, 10, 326, 92
            c.create_rectangle(x0, y0, x1, y1, outline="#888")
            n = max(1, len(hexes))
            for i, hx in enumerate(hexes):
                xx0 = x0 + (x1 - x0) * i / n
                xx1 = x0 + (x1 - x0) * (i + 1) / n
                c.create_rectangle(xx0, y0, xx1, y1, fill=hx, outline="")
        else:
            c.create_text(170, 50, text="（无 CSS 颜色）", fill="#999")
        c.create_text(170, 104, text="%s · %s 分" % (name, price), fill="#444")

    def _pv_noise(self, name):
        c = self.preview; c.delete("all")
        c.create_rectangle(60, 18, 280, 70, fill="#e6efe9", outline="#b6d0c2")
        cx, cy = 140, 44
        c.create_polygon(cx, cy - 12, cx, cy + 12, cx + 16, cy, fill="#22604f")     # 播放三角
        for r in (18, 30, 42):
            c.create_arc(cx - r, cy - r, cx + r, cy + r, start=-85, extent=170, style="arc", outline="#22604f", width=2)
        c.create_text(170, 104, text="白噪音 · %s" % name, fill="#444")

    def _pv_button(self, iid, name, price):
        c = self.preview; c.delete("all")
        # 每个皮肤给个大致配色（近似，非动画还原）
        bg, fg = {
            "bi":        ("#efe9dc", "#3a3a3a"),
            "graffiti":  ("#ffea00", "#111111"),
            "astronaut": ("#14162b", "#9aa7ff"),
            "lighton":   ("#fff2d6", "#b9822e"),
            "heartstar": ("#ffd9e6", "#e05c86"),
            "beach":     ("#2f7edb", "#ffffff"),
        }.get(iid, ("#22604f", "#eaf3ef"))
        c.create_rectangle(40, 16, 300, 92, fill=bg, outline="#333", width=2)
        c.create_text(170, 44, text="√  打卡", fill=fg, font=("", 14, "bold"))
        c.create_text(170, 72, text="%s · %s 分" % (name, price), fill=fg)

    def _pv_card(self, iid, name):
        c = self.preview; c.delete("all")
        # 简单按 id 给个底色
        base = {"obsidian": ("#1c1e24", "#e2b543"), "sakura": ("#fff6f8", "#e05c86"), "starlight": ("#10162e", "#8fb4ff")}.get(iid, ("#f0efe9", "#22604f"))
        c.create_rectangle(60, 16, 280, 90, fill=base[0], outline="#888")
        c.create_text(170, 46, text="7", fill=base[1], font=("", 26, "bold"))
        c.create_text(190, 52, text="天", fill=base[1], font=("", 14, "bold"))
        c.create_text(170, 108, text="天数卡 · %s" % name, fill="#444")

    def _pv_glass(self):
        c = self.preview; c.delete("all")
        c.create_rectangle(40, 20, 300, 92, fill="#2a2e33", outline="#111", width=2)
        # 磨砂质感提示
        c.create_text(170, 40, text="● ● ● ● ●", fill="#eaf3ef", font=("", 12))
        c.create_text(170, 72, text="毛玻璃 Dock · %s 分" % self.consts.get("GLASS_PRICE", 15), fill="#cfe3d8")

    def _pv_plain(self, name, desc):
        c = self.preview; c.delete("all")
        c.create_text(170, 52, text=name or "", fill="#22604f", font=("", 14, "bold"))
        c.create_text(170, 76, text=(desc or "")[:40], fill="#555")

    def pick_asset(self):
        ty = self._cat_type()
        if ty == "asset-noise":
            f = filedialog.askopenfilename(title="选择音频", filetypes=[("MP3", "*.mp3"), ("音频", "*.mp3 *.wav *.ogg"), ("所有", "*.*")])
        else:
            f = filedialog.askopenfilename(title="选择图片", filetypes=[("图片", "*.png *.jpg *.jpeg *.webp"), ("所有", "*.*")])
        if f:
            self.pending_asset = f
            self.asset_val.config(text=os.path.basename(f))

    def _read_form(self, require_id=True):
        item = {}
        item["id"] = self.form["id"].get().strip()
        item["name"] = self.form["name"].get().strip()
        p = self.form["price"].get().strip()
        item["price"] = int(p) if p.isdigit() else (p or 0)
        desc = self.form["desc"].get().strip()
        if desc:
            item["desc"] = desc
        if require_id and not item["id"]:
            return None
        ty = self._cat_type()
        if ty == "css" and self.css_text.get("1.0", "end").strip():
            item["css"] = self.css_text.get("1.0", "end").strip()
        elif ty == "vars" and self.css_text.get("1.0", "end").strip():
            try:
                item["vars"] = json.loads(self.css_text.get("1.0", "end"))
            except Exception as e:
                messagebox.showerror("格式错误", "主题变量 JSON 解析失败：%s" % e)
                return None
        # 资产类：保留 type / file，拷贝素材在 save() 时统一做
        if ty == "asset-image":
            item["type"] = "image"
        return item

    def add_item(self):
        item = self._read_form()
        if item is None:
            messagebox.showwarning("提示", "id 不能为空"); return
        lst = self.data.setdefault(self.current, [])
        if any(x.get("id") == item["id"] for x in lst):
            messagebox.showwarning("提示", "已存在 id：%s" % item["id"]); return
        # 资产类：无文件就提示
        ty = self._cat_type()
        if ty in ("asset-image", "asset-mark", "asset-noise") and not self.pending_asset:
            messagebox.showinfo("提示", "这是一张/一段素材商品，请先点「选择素材文件…」"); return
        ty = self._cat_type()
        if ty == "asset-image":
            # 头像框 type=image 才能被 Avatar 渲染
            item.setdefault("type", "image")
        if ty == "asset-noise":
            item["file"] = "img/baizaoyin/%s.mp3" % item["id"]
        lst.append(item)
        self.refresh_list()
        self._select_id(item["id"])
        self.note.config(text="已新增。点「生成并保存」后才真正写入文件中。")

    def update_item(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showinfo("提示", "先在左边选中一个条目"); return
        item_id = self.tree.item(sel[0])["values"][0]
        item = self._read_form()
        if item is None:
            messagebox.showwarning("提示", "id 不能为空"); return
        lst = self.data.get(self.current, [])
        for i, x in enumerate(lst):
            if x.get("id") == item_id:
                if item["id"] != item_id and any(y.get("id") == item["id"] for y in lst):
                    messagebox.showwarning("提示", "已有该 id"); return
                # 保留原对象的其它字段（如 short、ownedByDefault、vars、file、type）
                merged = dict(x)
                merged.update(item)
                lst[i] = merged
                break
        self.refresh_list()
        self._select_id(item_id)
        self.note.config(text="已保存修改。点「生成并保存」写入文件。")

    def delete_item(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showinfo("提示", "先在左边选中一个条目"); return
        item_id = self.tree.item(sel[0])["values"][0]
        if not messagebox.askyesno("确认", "删除 %s？" % item_id):
            return
        lst = self.data.get(self.current, [])
        self.data[self.current] = [x for x in lst if x.get("id") != item_id]
        self.refresh_list()
        self.render_preview(None)
        self.note.config(text="已删除。点「生成并保存」写入文件。")

    def save(self):
        try:
            # 1. 拷贝待导入素材
            ty = self._cat_type()
            if self.pending_asset and ty in ("asset-image", "asset-mark", "asset-noise"):
                item_id = self.form["id"].get().strip() or "item"
                dest, rel = import_asset(self.current, item_id, self.pending_asset)
                self.asset_val.config(text="已导入 → %s" % dest)
                # 同步 data 里的 file 字段
                lst = self.data.setdefault(self.current, [])
                for x in lst:
                    if x.get("id") == item_id:
                        if ty == "asset-noise":
                            x["file"] = rel
                        x["type"] = "image" if ty == "asset-image" else x.get("type")
                self.pending_asset = None
            # 2. 写回 skins.js
            text = build_skins(self.data, self.consts)
            SKINS_JS.write_text(text, encoding="utf-8")
            self.note.config(text="已写入 %s" % SKINS_JS.name)
            messagebox.showinfo("完成", "已生成 src/lib/skins.js 并同步素材。\n\n重新打包即可让 App 识别新的商城条目。")
        except Exception as e:
            messagebox.showerror("保存失败", str(e))

    def reload(self):
        self.data, self.consts = load_skins()
        self.select_category(self.current)
        self.note.config(text="已重新从 skins.js 载入。")


if __name__ == "__main__":
    App().mainloop()
