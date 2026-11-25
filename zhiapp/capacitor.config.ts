import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.zhishi.pad",
  appName: "知时",
  webDir: "dist",
  // 启动页（SplashScreen）配置：自定义启动图见 resources/splash.png，用 capacitor-assets 生成
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      launchFadeOutDuration: 400,
      backgroundColor: "#f1f0ea",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    }
  },
  android: {
    allowMixedContent: false
  }
  // 横屏：App 布局按宽度自适应（>=900px 用侧边 rail，否则底部 dock），设备旋转即可在横/竖屏间切换。
  // 生成 android/ 后，若发现被锁竖屏：在 android/app/src/main/AndroidManifest.xml 的
  //   <activity android:name=".MainActivity" ... />
  // 增加一个属性  android:screenOrientation="sensor"  （不限方向，随设备自动转）。
  // 如需锁定：用 "portrait"（竖屏）或 "landscape"（横屏）；"sensor"+"unspecified" 允许两者。
};

export default config;
