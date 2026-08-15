/**
 * WingRush Audio System
 * Programmatically synthesizes arcade-style sounds using the Web Audio API.
 * No external audio files needed!
 */

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.hasUnlocked = false;
  }

  /**
   * Initializes the AudioContext on first user gesture to satisfy browser autoplay policies.
   */
  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.hasUnlocked = true;
      }
    } catch (e) {
      console.warn("Web Audio API is not supported in this browser:", e);
    }
  }

  /**
   * Toggles the mute state.
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    // Resume context if suspended
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.isMuted;
  }

  /**
   * Safe check to resume AudioContext (required due to browser autoplay protections).
   */
  _resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Play dynamic upward sweep for flapping wings.
   */
  playFlap() {
    this._resume();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle'; // Smooth, organic retro sound
    osc.frequency.setValueAtTime(320, now);
    // Sweet sweep upwards
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * Play two-tone positive chime on clearing obstacles.
   */
  playScore() {
    this._resume();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;

    // Note 1: C5 (523.25 Hz)
    this._playTone(523.25, 0.08, now, 'sine');
    // Note 2: G5 (783.99 Hz) played shortly after
    this._playTone(783.99, 0.15, now + 0.08, 'sine');
  }

  /**
   * Play an ascending futuristic arpeggio when game starts.
   */
  playStart() {
    this._resume();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    // C4 -> E4 -> G4 -> C5 rapid arpeggio
    this._playTone(261.63, 0.06, now, 'sine');
    this._playTone(329.63, 0.06, now + 0.06, 'sine');
    this._playTone(392.00, 0.06, now + 0.12, 'sine');
    this._playTone(523.25, 0.15, now + 0.18, 'sine');
  }

  /**
   * Play retro noise crash on collision.
   */
  playCollision() {
    this._resume();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;

    // Low sub rumble frequency sweep
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(180, now);
    subOsc.frequency.linearRampToValueAtTime(30, now + 0.55);

    subGain.gain.setValueAtTime(0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.005, now + 0.55);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 0.55);

    // Mid punch crash explosion sweep
    const crashOsc = this.ctx.createOscillator();
    const crashGain = this.ctx.createGain();

    crashOsc.type = 'triangle';
    crashOsc.frequency.setValueAtTime(400, now);
    crashOsc.frequency.exponentialRampToValueAtTime(80, now + 0.3);

    crashGain.gain.setValueAtTime(0.4, now);
    crashGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    crashOsc.connect(crashGain);
    crashGain.connect(this.ctx.destination);

    crashOsc.start(now);
    crashOsc.stop(now + 0.3);

    // Dynamic noise burst simulating crash impact explosion
    this._playNoise(0.28, 0.45, now);
  }

  /**
   * Play clean UI click sound.
   */
  playClick() {
    this._resume();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    this._playTone(880, 0.06, now, 'triangle');
  }

  /**
   * Play high-pitched chord success arpeggio when a high score is achieved.
   */
  playHighScore() {
    this._resume();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    // C5 -> E5 -> G5 -> C6 high-pitch rapid success chime
    this._playTone(523.25, 0.08, now, 'sine');
    this._playTone(659.25, 0.08, now + 0.08, 'sine');
    this._playTone(783.99, 0.08, now + 0.16, 'sine');
    this._playTone(1046.50, 0.28, now + 0.24, 'sine');
  }

  /**
   * Internal helper to play a simple synth tone.
   */
  _playTone(frequency, duration, startTime, type = 'sine') {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(0.12, startTime);
    gain.gain.exponentialRampToValueAtTime(0.005, startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  /**
   * Internal helper to generate a synthesized noise burst.
   */
  _playNoise(volume, duration, startTime) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Populate with white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Filter to make crash sounding rather than static
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, startTime);
    filter.frequency.exponentialRampToValueAtTime(150, startTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseSource.start(startTime);
    noiseSource.stop(startTime + duration);
  }
}

// Global audio singleton
const gameAudio = new AudioSystem();
window.gameAudio = gameAudio;
