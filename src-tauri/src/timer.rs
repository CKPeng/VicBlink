use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TimerMode {
    IDLE,
    WORKING,
    BREAK,
    PAUSED,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerSnapshot {
    pub mode: TimerMode,
    pub time_remaining: u32,
    pub total_duration: u32,
    pub progress: f32, // 0.0 ~ 1.0
    pub is_test_mode: bool,
    pub formatted_time: String,
}

pub struct TimerEngine {
    pub mode: TimerMode,
    pub time_remaining: u32,
    pub total_duration: u32,
    pub pause_remaining: u32,
    pub work_duration: u32,   // 默认 1200 秒 (20 分钟)
    pub break_duration: u32,  // 默认 20 秒
    pub is_test_mode: bool,
}

impl Default for TimerEngine {
    fn default() -> Self {
        let work_duration = 1200;
        let break_duration = 20;
        Self {
            mode: TimerMode::WORKING,
            time_remaining: work_duration,
            total_duration: work_duration,
            pause_remaining: 0,
            work_duration,
            break_duration,
            is_test_mode: false,
        }
    }
}

pub enum TickResult {
    NoChange,
    StartedBreak,
    FinishedBreak,
    FinishedPause,
}

impl TimerEngine {
    pub fn tick(&mut self) -> TickResult {
        match self.mode {
            TimerMode::WORKING => {
                if self.time_remaining > 0 {
                    self.time_remaining -= 1;
                }
                if self.time_remaining == 0 {
                    self.mode = TimerMode::BREAK;
                    self.total_duration = self.break_duration;
                    self.time_remaining = self.break_duration;
                    return TickResult::StartedBreak;
                }
            }
            TimerMode::BREAK => {
                if self.time_remaining > 0 {
                    self.time_remaining -= 1;
                }
                if self.time_remaining == 0 {
                    self.mode = TimerMode::WORKING;
                    self.total_duration = self.work_duration;
                    self.time_remaining = self.work_duration;
                    return TickResult::FinishedBreak;
                }
            }
            TimerMode::PAUSED => {
                if self.pause_remaining > 0 {
                    self.pause_remaining -= 1;
                    self.time_remaining = self.pause_remaining;
                }
                if self.pause_remaining == 0 {
                    self.mode = TimerMode::WORKING;
                    self.total_duration = self.work_duration;
                    self.time_remaining = self.work_duration;
                    return TickResult::FinishedPause;
                }
            }
            TimerMode::IDLE => {}
        }
        TickResult::NoChange
    }

    pub fn pause_for(&mut self, secs: u32) {
        self.mode = TimerMode::PAUSED;
        self.pause_remaining = secs;
        self.total_duration = secs;
        self.time_remaining = secs;
    }

    pub fn resume(&mut self) {
        self.mode = TimerMode::WORKING;
        self.total_duration = self.work_duration;
        self.time_remaining = self.work_duration;
        self.pause_remaining = 0;
    }

    pub fn skip_break(&mut self) {
        self.mode = TimerMode::WORKING;
        self.total_duration = self.work_duration;
        self.time_remaining = self.work_duration;
    }

    pub fn reset(&mut self) {
        self.mode = TimerMode::WORKING;
        self.total_duration = self.work_duration;
        self.time_remaining = self.work_duration;
        self.pause_remaining = 0;
    }

    pub fn set_test_mode(&mut self, enabled: bool) {
        self.is_test_mode = enabled;
        if enabled {
            self.work_duration = 10;
            self.break_duration = 5;
        } else {
            self.work_duration = 1200;
            self.break_duration = 20;
        }
        self.reset();
    }

    pub fn snapshot(&self) -> TimerSnapshot {
        let progress = if self.total_duration == 0 {
            1.0
        } else {
            1.0 - (self.time_remaining as f32 / self.total_duration as f32)
        };

        let mins = self.time_remaining / 60;
        let secs = self.time_remaining % 60;
        let formatted_time = if self.mode == TimerMode::BREAK {
            format!("{}s", self.time_remaining)
        } else if mins >= 60 {
            let hours = mins / 60;
            let m = mins % 60;
            format!("{}h {:02}m", hours, m)
        } else {
            format!("{:02}:{:02}", mins, secs)
        };

        TimerSnapshot {
            mode: self.mode,
            time_remaining: self.time_remaining,
            total_duration: self.total_duration,
            progress,
            is_test_mode: self.is_test_mode,
            formatted_time,
        }
    }
}

pub type SharedTimer = Arc<Mutex<TimerEngine>>;