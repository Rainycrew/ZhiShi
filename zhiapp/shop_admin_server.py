#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
shop_admin_server.py — 一键启动「知时」商城管理后台（Vue 真实渲染 + 改价格写回）

用一条命令：
  1. 启动 vite dev 服务器（前端真实渲染，含管理页 #/admin）；
  2. 启动本地 API（http://localhost:8700），接收管理页提交的商品数据并改写 src/lib/skins.js；
  3. 打开浏览器到 http://localhost:5173/#/admin 。

用法：
  python shop_admin_server.py
停止：按 Ctrl+C（会一并关掉 vite dev）。
"""

import json
import time
import socket
import webbrowser
import subprocess
import threading
import http.server

import manage_shop as ms          # 复用 skins.js 的解析/生成逻辑
import manage_admin as ma         # 勋章 & 导出样式

ROOT = ms.ROOT
ADMIN_PORT = 8700
VITE_PORT = 5173


def _port_in_use(port):
    s = socket.socket(); s.settimeout(1)
    try:
        return s.connect_ex(("127.0.0.1", port)) == 0
    finally:
        s.close()


def _cors(self):
    self.send_header("Access-Control-Allow-Origin", "*")
    self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    self.send_header("Access-Control-Allow-Headers", "Content-Type")


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        _cors(self)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        _cors(self)
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/shop":
            try:
                data, consts = ms.load_skins()
                self._json({"ok": True, "data": data, "glassPrice": consts.get("GLASS_PRICE", 15)})
            except Exception as e:
                self._json({"ok": False, "error": str(e)}, 500)
        elif self.path == "/api/achievements":
            try:
                self._json({"ok": True, "data": ma.load_achievements()})
            except Exception as e:
                self._json({"ok": False, "error": str(e)}, 500)
        elif self.path == "/api/export-style":
            try:
                self._json({"ok": True, "style": ma.load_export_style()})
            except Exception as e:
                self._json({"ok": False, "error": str(e)}, 500)
        else:
            self._json({"ok": False, "error": "unknown path"}, 404)

    def do_POST(self):
        try:
            n = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(n).decode("utf-8"))
        except Exception as e:
            self._json({"ok": False, "error": "bad json: %s" % e}, 400)
            return
        if self.path == "/api/shop":
            try:
                data = payload.get("data", {})
                # 保护开发者标识，避免误删
                if "DEV_MARKS" not in data or not data["DEV_MARKS"]:
                    data["DEV_MARKS"] = ms.load_skins()[0].get("DEV_MARKS", [])
                consts = ms.load_skins()[1]
                gp = payload.get("glassPrice")
                if gp is not None:
                    consts = dict(consts)
                    consts["GLASS_PRICE"] = int(gp)
                text = ms.build_skins(data, consts)
                ms.SKINS_JS.write_text(text, encoding="utf-8")
                self._json({"ok": True})
            except Exception as e:
                self._json({"ok": False, "error": str(e)}, 500)
        elif self.path == "/api/achievements":
            try:
                items = payload.get("data", [])
                text = ma.build_achievements(items)
                ma.ACHIEVEMENTS_JS.write_text(text, encoding="utf-8")
                self._json({"ok": True})
            except Exception as e:
                self._json({"ok": False, "error": str(e)}, 500)
        elif self.path == "/api/export-style":
            try:
                style = payload.get("style", {})
                text = ma.build_export_style(style)
                ma.EXPORT_STYLE_JS.write_text(text, encoding="utf-8")
                self._json({"ok": True})
            except Exception as e:
                self._json({"ok": False, "error": str(e)}, 500)
        else:
            self._json({"ok": False, "error": "unknown path"}, 404)


def main():
    print("=" * 52)
    print(" 知时 · 管理后台（独立入口，App 不含此代码）")
    print(" 后台: http://localhost:%d/admin.html  (自动打开)" % VITE_PORT)
    print(" API : http://localhost:%d/api/{shop,achievements,export-style}" % ADMIN_PORT)
    print(" 保存会改写 src/lib/skins.js / achievements.js / exportStyle.js；Ctrl+C 停止")
    print("=" * 52)

    # 1) 启动 vite dev
    if not _port_in_use(VITE_PORT):
        subprocess.Popen("npm run dev", cwd=str(ROOT), shell=True)
        time.sleep(3.5)
        print("[vite] dev 服务器已启动 :%d" % VITE_PORT)
    else:
        print("[vite] :%d 已在运行，复用" % VITE_PORT)

    # 2) API 服务器
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", ADMIN_PORT), Handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    print("[api ] 已启动 :%d" % ADMIN_PORT)

    # 3) 打开浏览器
    webbrowser.open("http://localhost:%d/admin.html" % VITE_PORT)

    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        print("\n正在关闭…")
        httpd.shutdown()


if __name__ == "__main__":
    main()
