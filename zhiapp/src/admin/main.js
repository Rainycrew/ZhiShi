import { createApp } from "vue";
import "../styles/main.css";      // 复用全局设计令牌（--bg / --accent 等）
import AdminRoot from "./AdminRoot.vue";

createApp(AdminRoot).mount("#admin-app");
