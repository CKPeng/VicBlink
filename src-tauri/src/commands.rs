use tauri::{AppHandle, State};
use crate::timer::{SharedTimer, TimerSnapshot};
use crate::screen::ScreenManager;

#[tauri::command]
pub async fn get_timer_state(timer: State<'_, SharedTimer>) -> Result<TimerSnapshot, String> {
    let engine = timer.lock().await;
    Ok(engine.snapshot())
}

#[tauri::command]
pub async fn pause_timer(timer: State<'_, SharedTimer>, duration_secs: u32) -> Result<TimerSnapshot, String> {
    let mut engine = timer.lock().await;
    engine.pause_for(duration_secs);
    Ok(engine.snapshot())
}

#[tauri::command]
pub async fn resume_timer(timer: State<'_, SharedTimer>) -> Result<TimerSnapshot, String> {
    let mut engine = timer.lock().await;
    engine.resume();
    Ok(engine.snapshot())
}

#[tauri::command]
pub async fn skip_break(app: AppHandle, timer: State<'_, SharedTimer>) -> Result<TimerSnapshot, String> {
    let mut engine = timer.lock().await;
    engine.skip_break();
    ScreenManager::hide_all_overlays(&app);
    Ok(engine.snapshot())
}

#[tauri::command]
pub async fn reset_timer(app: AppHandle, timer: State<'_, SharedTimer>) -> Result<TimerSnapshot, String> {
    let mut engine = timer.lock().await;
    engine.reset();
    ScreenManager::hide_all_overlays(&app);
    Ok(engine.snapshot())
}

#[tauri::command]
pub async fn set_test_mode(
    app: AppHandle,
    timer: State<'_, SharedTimer>,
    enabled: bool,
) -> Result<TimerSnapshot, String> {
    let mut engine = timer.lock().await;
    engine.set_test_mode(enabled);
    ScreenManager::hide_all_overlays(&app);
    Ok(engine.snapshot())
}

#[tauri::command]
pub async fn trigger_break_now(app: AppHandle, timer: State<'_, SharedTimer>) -> Result<TimerSnapshot, String> {
    let mut engine = timer.lock().await;
    engine.mode = crate::timer::TimerMode::BREAK;
    engine.total_duration = engine.break_duration;
    engine.time_remaining = engine.break_duration;
    let _ = ScreenManager::show_all_overlays(&app);
    Ok(engine.snapshot())
}