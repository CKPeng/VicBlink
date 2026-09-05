use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub struct ScreenManager;

impl ScreenManager {
    /// 在检测到的所有屏幕上弹出真正的全屏毛玻璃遮罩窗口
    pub fn show_all_overlays(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
        // 首先隐藏右上角的托盘小面板
        if let Some(main_win) = app.get_webview_window("main") {
            let _ = main_win.hide();
        }

        let monitors = app.available_monitors()?;
        if monitors.is_empty() {
            Self::create_overlay_window(app, "overlay_0", None)?;
            return Ok(());
        }

        for (index, monitor) in monitors.into_iter().enumerate() {
            let label = format!("overlay_{}", index);
            Self::create_overlay_window(app, &label, Some(&monitor))?;
        }

        Ok(())
    }

    fn create_overlay_window(
        app: &AppHandle,
        label: &str,
        monitor: Option<&tauri::Monitor>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // 如果窗口已存在，重设位置大小并置顶全屏
        if let Some(window) = app.get_webview_window(label) {
            if let Some(m) = monitor {
                let _ = window.set_position(m.position().clone());
                let _ = window.set_size(m.size().clone());
            }
            let _ = window.set_always_on_top(true);
            let _ = window.set_fullscreen(true);
            let _ = window.show();
            let _ = window.set_focus();
            return Ok(());
        }

        let builder = WebviewWindowBuilder::new(
            app,
            label,
            WebviewUrl::App("index.html?view=overlay".into()),
        )
        .title("VicBlink - 远眺休息")
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .focused(true);

        let window = builder.build()?;

        if let Some(m) = monitor {
            let _ = window.set_position(m.position().clone());
            let _ = window.set_size(m.size().clone());
        }

        let _ = window.set_always_on_top(true);
        let _ = window.set_fullscreen(true);
        let _ = window.show();
        let _ = window.set_focus();

        Ok(())
    }

    /// 关闭所有屏幕上的遮罩窗口
    pub fn hide_all_overlays(app: &AppHandle) {
        let windows = app.webview_windows();
        for (label, window) in windows {
            if label.starts_with("overlay_") {
                let _ = window.close();
            }
        }
    }
}