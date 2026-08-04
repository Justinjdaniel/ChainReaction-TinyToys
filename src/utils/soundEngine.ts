class SoundEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private bgSequenceId: number | null = null;
  private synthLoopActive: boolean = false;

  constructor() {
    // Read persisted setting
    const saved = localStorage.getItem('chain_reaction_sound_enabled');
    if (saved !== null) {
      this.isEnabled = saved === 'true';
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleSound(force?: boolean): boolean {
    this.isEnabled = force !== undefined ? force : !this.isEnabled;
    localStorage.setItem('chain_reaction_sound_enabled', String(this.isEnabled));

    if (!this.isEnabled) {
      this.stopBackgroundMusic();
    } else {
      this.initContext();
      this.startBackgroundMusic();
    }
    return this.isEnabled;
  }

  public getSoundEnabled(): boolean {
    return this.isEnabled;
  }

  public playClick() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public playPlaceOrb() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(250, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  public playExplode() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    // We synthesize explosion with dual oscillators (sawtooth + lowpass filter frequency sweep)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.35);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(20, this.ctx.currentTime + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.35);
    filter.Q.setValueAtTime(8, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.4);
    osc2.stop(this.ctx.currentTime + 0.4);
  }

  public playVictory() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const playNote = (freq: number, startTime: number, duration: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = this.ctx.currentTime;
    // Arpeggio: C4 (261.63), E4 (329.63), G4 (392.00), C5 (523.25)
    playNote(261.63, now, 0.4);
    playNote(329.63, now + 0.1, 0.4);
    playNote(392.00, now + 0.2, 0.4);
    playNote(523.25, now + 0.3, 0.6);
  }

  public playDefeat() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const playNote = (freq: number, startTime: number, duration: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, startTime);

      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = this.ctx.currentTime;
    // Descending Minor Arpeggio: A4 (440.00), F4 (349.23), C4 (261.63), A3 (220.00)
    playNote(440.00, now, 0.4);
    playNote(349.23, now + 0.12, 0.4);
    playNote(261.63, now + 0.24, 0.4);
    playNote(220.00, now + 0.36, 0.7);
  }

  public playSecretEasterEggSong() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    const delays = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delays[idx]);
      gain.gain.setValueAtTime(0.08, now + delays[idx]);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delays[idx] + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + delays[idx]);
      osc.stop(now + delays[idx] + 0.25);
    });
  }

  public startBackgroundMusic() {
    if (!this.isEnabled || this.synthLoopActive) return;
    this.initContext();
    if (!this.ctx) return;

    this.synthLoopActive = true;
    let index = 0;
    // Ambient minor-pentatonic loop notes
    const melody = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];

    const scheduler = () => {
      if (!this.isEnabled || !this.synthLoopActive || !this.ctx) return;

      const now = this.ctx.currentTime;
      // Synthesize a background drone/melody pad node
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Pick note from melody
      const freq = melody[index % melody.length];
      index++;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);
      filter.Q.setValueAtTime(4, now);

      // Super soft backing sound
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.025, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 5.0);

      // Schedule next event in 4 seconds
      this.bgSequenceId = window.setTimeout(scheduler, 4000);
    };

    scheduler();
  }

  public stopBackgroundMusic() {
    this.synthLoopActive = false;
    if (this.bgSequenceId) {
      clearTimeout(this.bgSequenceId);
      this.bgSequenceId = null;
    }
  }
}

export const soundEngine = new SoundEngine();
