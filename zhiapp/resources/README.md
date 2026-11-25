# App 图标与启动页资源（Capacitor）

`npm run assets` 读取本文件夹的图片，用 **System.Drawing**（Windows 自带，无需 `sharp` / `@capacitor/assets`）
生成 Android 的各尺寸图标、自适应图标与启动页，写入 `android/app/src/main/res/`。

## 需要准备（替换占位图即可）
| 文件 | 尺寸 | 用途 |
| --- | --- | --- |
| `resources/icon.png` | **1024 × 1024**（正方形，圆角外留透明底） | App 图标（常规 + 自适应前景） |
| `resources/splash.png` | **2732 × 2732**（正方形） | 启动页背景图 |
| `resources/icon-foreground.png` | 1024 × 1024 | （可选）自适应前景备用 |
| `resources/icon-background.png` | 1024 × 1024 | （可选）自适应背景备用 |

> 当前 `icon.png` / `splash.png` 用的是**墨绿底 + 磨砂玻璃时钟**图标。你覆盖成自己的同名图，再跑 `npm run assets` 即可换掉。

## 生成（先建好 android 工程，再跑）
```powershell
npx cap add android       # 首次：生成 android/ 工程
npm run assets            # 用本文件夹图片生成 res（图标 + 自适应 + 启动页）
npx cap sync android      # 同步 web 产物与插件
npm run android:open      # 打开 Android Studio 打包
```

## 说明
- 自适应图标背景色：脚本会把 `res/values/ic_launcher_background.xml` 的色值改为 `#0E2A22`（深墨绿），
  与 `icon.png` 的背板一致，前景时钟居中无缝衔接。
- Android 启动色背景由 `capacitor.config.ts` 的 `plugins.SplashScreen.backgroundColor` 控制；
  停留时长、淡出等也在 `capacitor.config.ts` 的 `SplashScreen` 里调。
- 脚本 `scripts/generate-android-res.ps1` 只依赖 Windows 的 `System.Drawing`，跨机器可用。
