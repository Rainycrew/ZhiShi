import { createApp } from "vue";
import App from "./App.vue";
import { syncRoute } from "./router.js";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import "./styles/main.css";

syncRoute();

// 状态栏：内容铺到底（透明背景）+ 深色图标，配合浅色页面。
// 仅在原生 App 内生效；web 预览时跳过，避免报错。
if (Capacitor.isNativePlatform()) {
  try {
    StatusBar.setOverlaysWebView({ overlay: true });
    StatusBar.setStyle({ style: Style.Dark });
  } catch (e) {
    console.warn("status-bar 初始化失败（忽略）", e);
  }
}

createApp(App).mount("#app");
