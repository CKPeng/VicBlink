// 基于 Web Audio API 实现纯代码合成的轻柔空灵音效与原生态自然白噪音
export type AmbientSoundType = 'none' | 'ocean' | 'rain' | 'wind' | 'fire';

class SoundPlayer {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private activeNodes: { stop?: () => void; disconnect: () => void }[] = [];
  private currentAmbient: AmbientSoundType = 'none';

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

  getCurrentAmbient(): AmbientSoundType {
    return this.currentAmbient;
  }

  // 休息开始：空灵舒缓的磬声/和弦 (Tibetan Singing Bowl 质感)
  playBreakStart() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const freqs = [349.23, 523.25, 880.00];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

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
      console.warn('Audio playback error:', e);
    }
  }

  // 休息结束：清脆双重上扬提示音
  playBreakEnd() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
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
      console.warn('Audio playback error:', e);
    }
  }

  // 算法级生成白/粉红噪声缓冲区
  private createNoiseBuffer(isPink = false, duration = 5): AudioBuffer {
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (isPink) {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        data[i] = white * 0.35;
      }
    }
    return buffer;
  }

  // 场景化自然白噪音渐入播放
  playAmbient(type: AmbientSoundType, fadeDuration = 1.5) {
    this.stopAmbient(0.5);
    if (type === 'none') return;

    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      this.currentAmbient = type;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.22, now + fadeDuration);
      masterGain.connect(ctx.destination);
      this.ambientGain = masterGain;

      if (type === 'ocean') {
        // 海浪微风：粉红噪声 + 低通周期性调制
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = this.createNoiseBuffer(true, 6);
        noiseSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        // LFO 潮涌调制
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.12, now); // ~8秒一个浪潮

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(320, now);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        noiseSource.connect(filter);
        filter.connect(masterGain);

        noiseSource.start(now);
        lfo.start(now);
        this.activeNodes.push(noiseSource, lfo, filter, lfoGain);
      } else if (type === 'rain') {
        // 山间晨雨：带通高频水声 + 柔和底噪
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = this.createNoiseBuffer(false, 5);
        noiseSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.Q.setValueAtTime(1.2, now);

        noiseSource.connect(filter);
        filter.connect(masterGain);
        noiseSource.start(now);
        this.activeNodes.push(noiseSource, filter);
      } else if (type === 'wind') {
        // 林间风声：共振粉噪
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = this.createNoiseBuffer(true, 6);
        noiseSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(380, now);
        filter.Q.setValueAtTime(2.8, now);

        noiseSource.connect(filter);
        filter.connect(masterGain);
        noiseSource.start(now);
        this.activeNodes.push(noiseSource, filter);
      } else if (type === 'fire') {
        // 壁炉柴火：低频底噪
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = this.createNoiseBuffer(true, 5);
        noiseSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(220, now);

        noiseSource.connect(filter);
        filter.connect(masterGain);
        noiseSource.start(now);
        this.activeNodes.push(noiseSource, filter);
      }
    } catch (e) {
      console.warn('Ambient playback error:', e);
    }
  }

  // 平滑淡出并停止白噪音
  stopAmbient(fadeDuration = 1.2) {
    if (!this.ambientGain || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.ambientGain.gain.cancelScheduledValues(now);
      this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
      this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, now + fadeDuration);

      const nodesToClear = [...this.activeNodes];
      this.activeNodes = [];
      setTimeout(() => {
        nodesToClear.forEach((node) => {
          try {
            if (node.stop) node.stop();
            node.disconnect();
          } catch (_) {}
        });
      }, fadeDuration * 1000 + 100);
    } catch (e) {
      console.warn('Stop ambient error:', e);
    }
    this.currentAmbient = 'none';
  }
}

export const sound = new SoundPlayer();