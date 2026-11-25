#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
知时 · 便携版静态服务器（纯标准库，供 PyInstaller 打包成单个 .exe 用）

- 在本机启动一个 http://127.0.0.1:<port> 的静态服务器，提供纯前端资源（仅主应用，不含后台）；
- 自动打开默认浏览器；全程离线、不上传任何数据；关闭本窗口即停止（本机运行）。
- 源码运行时读取项目根目录的 release/dist；被打包成 exe 后读取打包进去的 dist。
"""
import os
import sys
import socket
import time
import mimetypes
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial

# Windows 的 mimetypes 对部分音频/矢量类型可能给错，这里显式补全
for _ext, _t in (
    (".m4a", "audio/mp4"),
    (".aac", "audio/aac"),
    (".flac", "audio/flac"),
    (".ogg", "audio/ogg"),
    (".wav", "audio/wav"),
    (".svg", "image/svg+xml"),
    (".webp", "image/webp"),
):
    mimetypes.add_type(_t, _ext, strict=True)


def dist_root():
    """返回待服务的 dist 目录：PyInstaller 打包后为解压目录里的 dist，否则为 release/dist。"""
    base = getattr(sys, "_MEIPASS", None)
    if base:
        return os.path.join(base, "dist")
    return os.path.normpath(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "release", "dist")
    )


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def free_port():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


def main():
    # 让中文控制台提示正常显示（Windows 默认代码页可能是 GBK）
    try:
        if os.name == "nt":
            os.system("chcp 65001 >nul")
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    root = os.path.abspath(dist_root())
    if not os.path.exists(os.path.join(root, "index.html")):
        print("缺少应用资源（找不到 dist/index.html），无法启动。")
        sys.exit(1)

    port = free_port()
    httpd = ThreadingHTTPServer(
        ("127.0.0.1", port), partial(QuietHandler, directory=root)
    )
    url = "http://127.0.0.1:%d/" % port

    print("=" * 60)
    print("  知时 · 便携版  已启动")
    print("  地址: " + url)
    print("  全程本机运行、离线，不上传任何数据。")
    print("  使用完毕直接关闭本窗口即可停止。")
    print("=" * 60)

    def _open_browser():
        time.sleep(1.2)
        try:
            webbrowser.open(url)
        except Exception:
            pass

    threading.Thread(target=_open_browser, daemon=True).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
