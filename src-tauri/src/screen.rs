use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub struct ScreenManager;

impl ScreenManager {
    /// 在检测到的所有屏幕上弹出全屏毛玻璃遮罩窗口
    pub fn show_all_overlays(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
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
        // 如果窗口已存在，直接激活并置顶全屏
        if let Some(window) = app.get_webview_window(label) {
            let _ = window.show();
            let _ = window.set_focus();
            let _ = window.set_always_on_top(true);
            return Ok(());
        }

        let mut builder = WebviewWindowBuilder::new(
            app,
            label,
            WebviewUrl::App("/#overlay".into()),
        )
        .title("VicBlink - 远眺休息")
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .focused(true);

        if let Some(m) = monitor {
            let pos = m.position();
            let size = m.size();
            builder = builder
                .position(pos.x as f64, pos.y as f64)
                .inner_size(size.width as f64, size.height as f64);
        }

        let window = builder.build()?;
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