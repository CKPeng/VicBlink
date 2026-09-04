# 👁️ VicBlink — 极简桌面护眼守卫 (20-20-20 法则)

基于国际公认的眼科护眼法则 **“20-20-20”** 开发的桌面应用：
> **每看屏幕 20 分钟 ➔ 将视线移开看向 20 英尺（约 6 米）外的远方 ➔ 保持至少 20 秒。**

基于 **Tauri v2 (Rust) + React + Tailwind CSS** 打造，极致轻量（~30MB 内存占用），专为程序员与深度电脑工作者设计。

---

## ✨ 核心特性

- ⏳ **双轨状态机计时器 (Core Timer)**：20 分钟专注倒计时 + 20 秒远眺倒计时，循环往复。
- 🖥️ **强打断全屏多屏遮罩 (Multi-Monitor Overlay)**：
  - 自动检测所有连接的外接副屏与主显示器，在**所有屏幕上同时弹出全屏置顶毛玻璃遮罩**，彻底阻断视线转移到副屏继续看代码。
  - 20 秒平滑呼吸光环倒计时，指引眨眼深呼吸、放松睫状肌。
  - 支持温和逃生（右上角跳过或按 `Esc` 键即时恢复）。
- 🔔 **空灵双和弦提示音 (Web Audio Synthesis)**：
  - 休息开始：自动生成空灵舒缓的西藏颂钵泛音和弦（F4 + C5 + A5），瞬间舒缓神经。
  - 休息结束：清脆上扬的双音符提示，唤醒并恢复专注心流。
  - 零外部 mp3 文件依赖，体积极小且零网络请求。
- 🍵 **托盘轻量交互与会议防打扰**：
  - 系统托盘实时动态显示当前剩余时间（Mac 顶部菜单栏动态指示器）。
  - 快捷弹出面板提供：**暂停 1 小时 / 暂停 2 小时**（用于线上排查紧急 Bug 或长会）。
  - **开发测试加速模式**：一键切换为“10 秒专注 + 5 秒休息”，几秒内即可体验完整流转与遮罩。
- 🚀 **自动化云端打包 (GitHub Actions)**：
  - 无需在本地安装数 GB 的复杂编译工具链。
  - 代码推送到 GitHub 打 Tag（如 `v1.0.0`），云端自动使用免费 Mac 虚拟机编译生成原生 macOS `.dmg` / `.app` 安装包以及 Windows `.exe`！

---

## 🛠️ 本地开发与体验

### 1. 启动即时热重载（网页/前端预览）
```bash
npm install
npm run dev
```
打开浏览器访问 `http://localhost:5173`，即可完整体验：
- 20 分钟倒计时与 20 秒远眺流转；
- 点击面板上的“加速模式”（10s工作 / 5s休息）极速体验遮罩与声音；
- 点击“现在就去远眺 20s”或“预览遮罩”可即时呼出全屏毛玻璃与 Esc 退出。

### 2. 本地原生打包（可选）
如果您在已安装 Rust 的机器（如 Mac 或配置了 C++ 构建环境的 Windows）上：
```bash
npm run build
npx @tauri-apps/cli build
```

---

## 📂 工程架构目录

```
VicBlink/
├── .github/workflows/
│   └── build.yml              # GitHub Actions 自动化云打包 (macOS DMG / Win EXE)
├── src-tauri/                 # Rust 桌面底座
│   ├── src/
│   │   ├── timer.rs           # 双轨计时器状态机与事件分发
│   │   ├── screen.rs          # 多显示器枚举与动态全屏毛玻璃遮罩
│   │   ├── tray.rs            # 系统托盘与动态文字指示
│   │   ├── commands.rs        # Tauri IPC 命令接口
│   │   ├── lib.rs             # Tauri 核心引导与异步时钟循环
│   │   └── main.rs            # 程序主入口
│   ├── capabilities/          # Tauri v2 权限配置
│   ├── Cargo.toml
│   └── tauri.conf.json        # 窗口、托盘与包配置
├── src/                       # React 前端
│   ├── components/
│   │   ├── OverlayView.tsx    # 全屏毛玻璃强打断遮罩 (呼吸光圈、Esc跳过)
│   │   ├── TrayPopover.tsx    # 托盘点击弹出的快捷操作面板 (暂停1h/2h/加速模式)
│   │   └── TimerRing.tsx      # SVG 动态环形倒计时进度条
│   ├── hooks/
│   │   └── useTimer.ts        # 双模计时器 Hook (Tauri 事件与纯前端模拟无缝切换)
│   ├── utils/
│   │   └── sound.ts           # Web Audio API 纯代码合成轻柔音效
│   ├── App.tsx                # 多窗口路由调度
│   └── main.tsx
└── package.json
```