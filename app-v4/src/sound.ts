export class ObservatorySound {
  private context: AudioContext | null = null;
  private bus: GainNode | null = null;
  private closing: number | undefined;

  async enable() {
    if (this.context && this.bus) {
      window.clearTimeout(this.closing);
      await this.context.resume();
      return;
    }
    const context = new AudioContext();
    this.context = context;
    const bus = context.createGain();
    this.bus = bus;
    bus.gain.value = 0;
    bus.connect(context.destination);
    const drone = context.createBiquadFilter();
    drone.type = 'lowpass';
    drone.frequency.value = 176;
    drone.connect(bus);
    for (const [frequency, volume] of [[55, .16], [82.4, .07], [110.12, .033]]) {
      const voice = context.createOscillator();
      const gain = context.createGain();
      voice.type = frequency === 55 ? 'sine' : 'triangle';
      voice.frequency.value = frequency;
      gain.gain.value = volume;
      voice.connect(gain).connect(drone);
      voice.start();
    }
    try { await context.resume(); } catch (error) { this.disable(); throw error; }
  }

  audible(value: boolean) {
    if (!this.context || !this.bus) return;
    const now = this.context.currentTime;
    this.bus.gain.cancelScheduledValues(now);
    this.bus.gain.setTargetAtTime(value ? .16 : 0, now, .16);
  }

  cue(kind: 'wake' | 'resonate' | 'arrival' | 'cat') {
    const context = this.context;
    if (!context || !this.bus || context.state !== 'running') return;
    const notes = kind === 'resonate' ? [293.66, 440, 587.32] : kind === 'wake' ? [146.83, 220, 329.63] : kind === 'cat' ? [349.23, 261.63] : [261.63, 392];
    notes.forEach((frequency, index) => {
      const voice = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + .11 * index;
      voice.frequency.value = frequency;
      gain.gain.setValueAtTime(.001, start);
      gain.gain.exponentialRampToValueAtTime(.036, start + .085);
      gain.gain.exponentialRampToValueAtTime(.001, start + .72);
      voice.connect(gain).connect(this.bus!);
      voice.start(start);
      voice.stop(start + .74);
      voice.onended = () => { voice.disconnect(); gain.disconnect(); };
    });
  }

  disable() {
    if (!this.context) return;
    this.audible(false);
    window.clearTimeout(this.closing);
    this.closing = window.setTimeout(() => {
      const context = this.context;
      this.context = null;
      this.bus = null;
      if (context?.state !== 'closed') void context?.close().catch(() => {});
    }, 480);
  }
}
