// 基于 Web Audio API 实现纯代码合成的轻柔空灵音效与原生态自然白噪音
export type AmbientSoundType = 'none' | 'ocean' | 'rain' | 'wind' | 'fire';
export type StartChimeType = 'bowl' | 'bell' | 'gong' | 'wood' | 'none';
export type EndChimeType = 'marimba' | 'crystal' | 'harp' | 'ding' | 'none';

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

  // ================= 提示音合成 ================= //

  // 播放开始远眺提示音
  playStartChime(type: StartChimeType = 'bowl') {
    if (type === 'none') return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      switch (type) {
        case 'bowl': {
          // 西藏颂钵和弦：F4 (349Hz) + C5 (523Hz) + A5 (880Hz)
          [349.23, 523.25, 880.0].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            const decay = 3.2 - idx * 0.4;
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.16 / (idx + 1), now + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + decay + 0.1);
          });
          break;
        }
        case 'bell': {
          // 东方禅意磬音 (440Hz + 880Hz + 1320Hz 轻微颤音)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, now); // D5
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.2, now + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 2.9);
          break;
        }
        case 'gong': {
          // 深沉和缓铜锣 (低音基频 196Hz + 丰富泛音)
          [196.0, 392.0, 587.3].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.25 / (idx + 1), now + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 3.6);
          });
          break;
        }
        case 'wood': {
          // 清心木鱼双敲击
          [0, 0.16].forEach((delay) => {
            const t = now + delay;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(450, t + 0.08);
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.15);
          });
          break;
        }
      }
    } catch (e) {
      console.warn('Start chime error:', e);
    }
  }

  // 播放结束远眺提示音
  playEndChime(type: EndChimeType = 'marimba') {
    if (type === 'none') return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      switch (type) {
        case 'marimba': {
          // 上扬马林巴：C5 (523Hz) -> E5 (659Hz)
          [
            { freq: 523.25, time: now },
            { freq: 659.25, time: now + 0.14 },
          ].forEach(({ freq, time }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(0.0001, time);
            gain.gain.exponentialRampToValueAtTime(0.2, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.55);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(time);
            osc.stop(time + 0.6);
          });
          break;
        }
        case 'crystal': {
          // 水晶水滴音：快速滑频高音
          [
            { f1: 1046.5, f2: 1318.5, time: now },
            { f1: 1318.5, f2: 1567.9, time: now + 0.12 },
          ].forEach(({ f1, f2, time }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f1, time);
            osc.frequency.exponentialRampToValueAtTime(f2, time + 0.06);
            gain.gain.setValueAtTime(0.18, time);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(time);
            osc.stop(time + 0.45);
          });
          break;
        }
        case 'harp': {
          // 流光竖琴琶音：C5 -> E5 -> G5 -> C6
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const t = now + idx * 0.08;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.15, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.85);
          });
          break;
        }
        case 'ding': {
          // 清脆晨钟双音：明快轻亮
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(880, now);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.3);
          break;
        }
      }
    } catch (e) {
      console.warn('End chime error:', e);
    }
  }

  // ================= 自然白噪音合成 ================= //

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
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        data[i] = white * 0.35;
      }
    }
    return buffer;
  }

  playAmbient(type: AmbientSoundType, fadeDuration = 1.5) {
    if (this.currentAmbient === type && this.ambientGain) return;
    this.stopAmbient(0.4);
    if (type === 'none') {
      this.currentAmbient = 'none';
      return;
    }

    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      this.currentAmbient = type;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.2, now + fadeDuration);
      masterGain.connect(ctx.destination);
      this.ambientGain = masterGain;

      if (type === 'ocean') {
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = this.createNoiseBuffer(true, 6);
        noiseSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.12, now);

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

  stopAmbient(fadeDuration = 1.0) {
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