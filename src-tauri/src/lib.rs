pub mod commands;
pub mod screen;
pub mod timer;
pub mod tray;

use std::sync::Arc;
use tauri::Emitter;
use timer::{SharedTimer, TickResult, TimerEngine};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let timer: SharedTimer = Arc::new(tokio::sync::Mutex::new(TimerEngine::default()));

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--silence"]),
        ))
        .manage(timer.clone())
        .invoke_handler(tauri::generate_handler![
            commands::get_timer_state,
            commands::pause_timer,
            commands::resume_timer,
            commands::skip_break,
            commands::reset_timer,
            commands::set_test_mode,
            commands::trigger_break_now,
        ])
        .setup(move |app| {
            let handle = app.handle().clone();

            // 设置托盘菜单
            if let Err(e) = tray::setup_tray(&handle) {
                eprintln!("Failed to setup tray: {}", e);
            }

            // 启动核心计时循环
            let timer_handle = timer.clone();
            let app_handle = handle.clone();
            tauri::async_runtime::spawn(async move {
                let mut interval = tokio::time::interval(std::time::Duration::from_secs(1));
                loop {
                    interval.tick().await;

                    let (result, snapshot) = {
                        let mut engine = timer_handle.lock().await;
                        let res = engine.tick();
                        let snap = engine.snapshot();
                        (res, snap)
                    };

                    match result {
                        TickResult::StartedBreak => {
                            let _ = screen::ScreenManager::show_all_overlays(&app_handle);
                        }
                        TickResult::FinishedBreak => {
                            screen::ScreenManager::hide_all_overlays(&app_handle);
                        }
                        _ => {}
                    }

                    // 广播当前状态给前端
                    let _ = app_handle.emit("timer_tick", &snapshot);

                    // 动态更新托盘标题 (macOS 菜单栏)
                    if let Some(tray) = app_handle.tray_by_id("main-tray") {
                        let display_title = match snapshot.mode {
                            timer::TimerMode::BREAK => format!("{}s 远眺", snapshot.time_remaining),
                            timer::TimerMode::PAUSED => "已暂停".to_string(),
                            timer::TimerMode::WORKING => {
                                let m = snapshot.time_remaining / 60;
                                format!("{}m", if m == 0 { 1 } else { m })
                            }
                            timer::TimerMode::IDLE => "就绪".to_string(),
                        };
                        let _ = tray.set_title(Some(&display_title));
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running VicBlink application");
}