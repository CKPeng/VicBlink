use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItem::with_id(app, "show", "控制中心", true, None::<&str>)?;
    let break_item = MenuItem::with_id(app, "break_now", "立即开始 20 秒远眺", true, None::<&str>)?;
    let pause_1h = MenuItem::with_id(app, "pause_1h", "暂停专注 1 小时 (开会/排障)", true, None::<&str>)?;
    let pause_2h = MenuItem::with_id(app, "pause_2h", "暂停专注 2 小时", true, None::<&str>)?;
    let resume_item = MenuItem::with_id(app, "resume", "恢复倒计时", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "退出 VicBlink", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show_item,
            &break_item,
            &pause_1h,
            &pause_2h,
            &resume_item,
            &quit_item,
        ],
    )?;

    let _tray = TrayIconBuilder::with_id("main-tray")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                toggle_main_window(app);
            }
            "break_now" => {
                let app_clone = app.clone();
                tauri::async_runtime::spawn(async move {
                    if let Some(timer) = app_clone.try_state::<crate::timer::SharedTimer>() {
                        let mut engine = timer.lock().await;
                        engine.mode = crate::timer::TimerMode::BREAK;
                        engine.total_duration = engine.break_duration;
                        engine.time_remaining = engine.break_duration;
                        let _ = crate::screen::ScreenManager::show_all_overlays(&app_clone);
                    }
                });
            }
            "pause_1h" => {
                let app_clone = app.clone();
                tauri::async_runtime::spawn(async move {
                    if let Some(timer) = app_clone.try_state::<crate::timer::SharedTimer>() {
                        let mut engine = timer.lock().await;
                        engine.pause_for(3600);
                    }
                });
            }
            "pause_2h" => {
                let app_clone = app.clone();
                tauri::async_runtime::spawn(async move {
                    if let Some(timer) = app_clone.try_state::<crate::timer::SharedTimer>() {
                        let mut engine = timer.lock().await;
                        engine.pause_for(7200);
                    }
                });
            }
            "resume" => {
                let app_clone = app.clone();
                tauri::async_runtime::spawn(async move {
                    if let Some(timer) = app_clone.try_state::<crate::timer::SharedTimer>() {
                        let mut engine = timer.lock().await;
                        engine.resume();
                    }
                });
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                toggle_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

fn toggle_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if let Ok(is_visible) = window.is_visible() {
            if is_visible {
                let _ = window.hide();
            } else {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    }
}