// Pure procedural Web Audio API ambient drone
// Generates a deep, meditative, ethereal void soundscape without any external assets.

class VoidAmbience {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private noiseNode: AudioBufferSourceNode | null = null;

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();
  }

  public toggle(): boolean {
    if (!this.ctx) {
      this.init();
    }
    if (!this.ctx) return false;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private start() {
    if (!this.ctx) return;
    this.stop();

    const now = this.ctx.currentTime;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.3, now + 3);
    this.masterGain.connect(this.ctx.destination);

    // Warm sub-bass fundamental drone (D1 ~ 36.71 Hz)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(36.71, now);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.4, now);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start();
    this.oscillators.push(subOsc);

    // Minor third / fifth ethereal mid drone (A1 ~ 55 Hz & F2 ~ 87.3 Hz)
    const midOsc1 = this.ctx.createOscillator();
    midOsc1.type = 'triangle';
    midOsc1.frequency.setValueAtTime(55.0, now);
    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(220, now);
    const midGain1 = this.ctx.createGain();
    midGain1.gain.setValueAtTime(0.2, now);
    midOsc1.connect(filter1);
    filter1.connect(midGain1);
    midGain1.connect(this.masterGain);
    midOsc1.start();
    this.oscillators.push(midOsc1);

    // Soft chorus detuned drone
    const midOsc2 = this.ctx.createOscillator();
    midOsc2.type = 'sine';
    midOsc2.frequency.setValueAtTime(55.6, now);
    const midGain2 = this.ctx.createGain();
    midGain2.gain.setValueAtTime(0.15, now);
    midOsc2.connect(midGain2);
    midGain2.connect(this.masterGain);
    midOsc2.start();
    this.oscillators.push(midOsc2);

    // Low-passed wind noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(140, now);
    noiseFilter.Q.setValueAtTime(1.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);

    this.noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    this.noiseNode.start();

    this.isPlaying = true;
  }

  private stop() {
    if (!this.ctx || !this.masterGain) {
      this.isPlaying = false;
      return;
    }
    const now = this.ctx.currentTime;
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
    setTimeout(() => {
      this.oscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      this.oscillators = [];
      if (this.noiseNode) {
        try {
          this.noiseNode.stop();
          this.noiseNode.disconnect();
        } catch {}
        this.noiseNode = null;
      }
      this.isPlaying = false;
    }, 1550);
  }
}

export const voidAudio = new VoidAmbience();
