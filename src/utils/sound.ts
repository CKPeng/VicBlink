// 基于 Web Audio API 实现纯代码合成的轻柔空灵音效，无任何外部音频资源依赖
class SoundPlayer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // 休息开始：空灵舒缓的磬声/和弦 (Tibetan Singing Bowl 质感)
  playBreakStart() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // 和弦基础频率：F4 (349.23Hz) + C5 (523.25Hz) + A5 (880.00Hz)
      const freqs = [349.23, 523.25, 880.00];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // 柔和起音与平滑长衰减
        const attack = 0.08 + idx * 0.03;
        const decay = 3.2 - idx * 0.4;
        const targetGain = 0.15 / (idx + 1);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(targetGain, now + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + decay + 0.1);
      });
    } catch (e) {
      console.warn('Audio playback not allowed or failed:', e);
    }
  }

  // 休息结束：清脆双重上扬提示音
  playBreakEnd() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // 两个轻快的上扬音符：523Hz -> 659Hz
      const notes = [
        { freq: 523.25, time: now },
        { freq: 659.25, time: now + 0.14 },
      ];

      notes.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(0.18, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.65);
      });
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }
}

export const sound = new SoundPlayer();