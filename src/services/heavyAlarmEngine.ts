/**
 * HeavyAlarmEngine: Peaceful Morning Alarm, Background Ambient Music,
 * and Robust Devotional Audio Player (HTML5 Audio + Web Audio API).
 *
 * Designed to provide:
 * 1. Peaceful, resonant wake-up tone (Tibetan singing bowl & morning temple bell)
 *    with max-volume override (volume = 1.0) for heavy sleepers without harshness.
 * 2. Serene background ambient tanpura instrumental at subtle volume (0.2).
 * 3. Robust HTML5 devotional audio queue (Kanda Sashti Kavasam -> Sivapuranam auto-transition).
 */

export interface DevotionalQueueTrack {
  id: 'kanda_sashti_kavasam' | 'sivapuranam';
  titleEn: string;
  titleTa: string;
  localUrls: string[];
  fallbackCdnUrl: string;
  durationSeconds: number;
}

const DEVOTIONAL_QUEUE: Record<'kanda_sashti_kavasam' | 'sivapuranam', DevotionalQueueTrack> = {
  kanda_sashti_kavasam: {
    id: 'kanda_sashti_kavasam',
    titleEn: 'Kanda Sashti Kavasam',
    titleTa: 'கந்த சஷ்டி கவசம்',
    localUrls: ['/audio/kandha-sashti-kavasam.mp3', '/audio/kanda-sashti-kavasam.mp3'],
    fallbackCdnUrl:
      'https://archive.org/download/skandha-sashti-kavacham-and-sri-skandha-guru-kavacham/Skandha%20Sashti%20Kavacham%20and%20Sri%20Skandha%20Guru%20Kavacham/01-Skandha%20Sashti%20Kavasam.mp3',
    durationSeconds: 380,
  },
  sivapuranam: {
    id: 'sivapuranam',
    titleEn: 'Sivapuranam (Thiruvasagam)',
    titleTa: 'சிவபுராணம் (திருவாசகம்)',
    localUrls: ['/audio/sivapuranam.mp3'],
    fallbackCdnUrl:
      'https://archive.org/download/thiruvasagam-soolamangalam-sisters/02-Thiruvasagam-Sivapuranam.mp3',
    durationSeconds: 420,
  },
};

class HeavyAlarmEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyzerNode: AnalyserNode | null = null;
  private masterVolume: number = 1.0;

  // 1. Peaceful Alarm State
  private alarmAudio: HTMLAudioElement | null = null;
  private isAlarmActive: boolean = false;
  private alarmInterval: any = null;
  private alarmOscs: OscillatorNode[] = [];

  // 2. Ambient Background Tanpura State
  private ambientAudio: HTMLAudioElement | null = null;
  private isAmbientActive: boolean = false;
  private ambientGain: GainNode | null = null;
  private ambientOscs: OscillatorNode[] = [];

  // 3. Devotional Audio Player State
  private devotionalAudio: HTMLAudioElement | null = null;
  private currentTrackId: 'kanda_sashti_kavasam' | 'sivapuranam' = 'kanda_sashti_kavasam';
  private isDevotionalActive: boolean = false;
  private isDevotionalPaused: boolean = false;
  private devotionalTimer: any = null;
  private devotionalOscs: OscillatorNode[] = [];
  private devotionalGain: GainNode | null = null;

  private onVerseProgressCb: ((verseIndex: number, progressPct: number) => void) | null = null;
  private onTrackChangeCb: ((trackId: 'kanda_sashti_kavasam' | 'sivapuranam') => void) | null = null;
  private onDevotionalCompleteCb: (() => void) | null = null;

  /**
   * Unlock and initialize Web Audio context on user gesture
   */
  public async ensureContext(): Promise<AudioContext> {
    if (typeof window === 'undefined') {
      return null as any;
    }

    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }

    if (!this.analyzerNode) {
      this.analyzerNode = this.ctx.createAnalyser();
      this.analyzerNode.fftSize = 64;
      this.analyzerNode.smoothingTimeConstant = 0.8;
      this.masterGain.connect(this.analyzerNode);
      this.analyzerNode.connect(this.ctx.destination);
    }

    return this.ctx;
  }

  // =========================================================================
  // 1. PEACEFUL MORNING WAKE-UP ALARM
  // =========================================================================

  /**
   * Play the peaceful wakeup alarm:
   * Uses serene Tibetan singing bowl / morning temple bell audio with maximum volume override (1.0),
   * providing physical awakening across the room without harsh, grating buzzer tones.
   */
  public async startAssertiveAlarm(onTick?: (secondsRemaining: number) => void): Promise<void> {
    await this.ensureContext();
    this.stopAllAudio();

    this.isAlarmActive = true;
    let secondsPassed = 0;
    const maxAlarmSeconds = 60; // 60s max auto-limit if unacknowledged

    // Attempt HTML5 Audio with peaceful bell audio
    let audioLoaded = false;
    try {
      if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
        this.alarmAudio = new Audio();
        (this.alarmAudio as any).playsInline = true;
        this.alarmAudio.src = '/audio/peaceful-morning-bell.mp3';
        this.alarmAudio.loop = true;
        this.alarmAudio.volume = Math.max(0, Math.min(1.0, this.masterVolume));

        const playPromise = this.alarmAudio.play();
        if (playPromise !== undefined) {
          await playPromise
            .then(() => {
              audioLoaded = true;
            })
            .catch((e) => {
              console.warn('Peaceful bell audio element notice (falling back to resonant acoustic model):', e);
            });
        }
      }
    } catch (e) {
      console.warn('Peaceful bell init notice:', e);
    }

    // Resonant Tibetan Singing Bowl & Temple Bell Web Audio Physical Model
    // (Active as primary if audio element didn't play, or as acoustic harmonic layer)
    const playResonantSingingBowl = () => {
      if (!this.ctx || !this.isAlarmActive) return;

      const now = this.ctx.currentTime;
      // Resonant harmonic frequencies: 216Hz fundamental, 594Hz (2.75x), 1166Hz (5.4x), 1922Hz (8.9x)
      const bowlFreqs = [216, 594, 1166, 1922];
      const bowlGains = [0.55, 0.28, 0.14, 0.08];

      const strikeGain = this.ctx.createGain();
      strikeGain.gain.setValueAtTime(0.001, now);
      strikeGain.gain.linearRampToValueAtTime(0.85 * this.masterVolume, now + 0.04);
      strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);

      strikeGain.connect(filter);
      filter.connect(this.masterGain || this.ctx.destination);

      bowlFreqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const subGain = this.ctx!.createGain();

        osc.type = 'sine';
        // Subtle detune for rich natural shimmer
        const detune = idx % 2 === 0 ? 1.5 : -1.5;
        osc.frequency.setValueAtTime(freq + detune, now);

        subGain.gain.setValueAtTime(bowlGains[idx], now);
        osc.connect(subGain);
        subGain.connect(strikeGain);

        osc.start(now);
        osc.stop(now + 3.8);
      });
    };

    if (!audioLoaded) {
      playResonantSingingBowl();
    }

    // Periodic strike & countdown timer
    this.alarmInterval = setInterval(() => {
      if (!this.isAlarmActive) {
        clearInterval(this.alarmInterval);
        return;
      }

      secondsPassed++;
      if (onTick) {
        onTick(Math.max(0, maxAlarmSeconds - secondsPassed));
      }

      // If relying on acoustic physical model, strike every 3.8 seconds
      if (!audioLoaded && secondsPassed % 4 === 0) {
        playResonantSingingBowl();
      }

      if (secondsPassed >= maxAlarmSeconds) {
        this.stopAlarm();
      }
    }, 1000);
  }

  public stopAlarm(): void {
    this.isAlarmActive = false;
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }

    if (this.alarmAudio) {
      try {
        this.alarmAudio.pause();
        this.alarmAudio.currentTime = 0;
        this.alarmAudio.src = '';
      } catch (e) {}
      this.alarmAudio = null;
    }

    this.alarmOscs.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.alarmOscs = [];
  }

  // =========================================================================
  // 2. UPGRADED BACKGROUND AMBIENT TANPURA MUSIC
  // =========================================================================

  /**
   * Play calming background ambient tanpura instrumental during voice briefing.
   * Kept subtle at volume = 0.2 to support, rather than overpower, speech synthesis.
   */
  public async startBackgroundInstrumental(volume: number = 0.2): Promise<void> {
    await this.ensureContext();
    this.stopAlarm();
    this.stopBackgroundInstrumental();

    this.isAmbientActive = true;
    const targetVol = Math.min(0.2, Math.max(0.05, volume));

    // Try HTML5 Audio with peaceful ambient tanpura loop
    let audioLoaded = false;
    try {
      if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
        this.ambientAudio = new Audio();
        (this.ambientAudio as any).playsInline = true;
        this.ambientAudio.src = '/audio/ambient-tanpura.mp3';
        this.ambientAudio.loop = true;
        this.ambientAudio.volume = targetVol;

        const p = this.ambientAudio.play();
        if (p !== undefined) {
          await p
            .then(() => {
              audioLoaded = true;
            })
            .catch(() => {
              // fallback to acoustic pad
            });
        }
      }
    } catch (e) {
      // fallback
    }

    // Acoustic Tanpura Warm Sine Pad (C# Pa-Sa-Sa strings through 350Hz warm lowpass filter)
    if (!audioLoaded && this.ctx && this.masterGain) {
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 1.2);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, this.ctx.currentTime);

      this.ambientGain.connect(filter);
      filter.connect(this.masterGain);

      // C#3 = 138.59Hz, G#3 = 207.65Hz, C#4 = 277.18Hz
      const tanpuraNotes = [138.59, 207.65, 277.18, 277.8];
      tanpuraNotes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

        // Gentle lfo shimmer (0.18Hz)
        const lfo = this.ctx!.createOscillator();
        const lfoG = this.ctx!.createGain();
        lfo.frequency.setValueAtTime(0.18 + idx * 0.05, this.ctx!.currentTime);
        lfoG.gain.setValueAtTime(1.8, this.ctx!.currentTime);
        lfo.connect(osc.frequency);
        lfo.start();

        g.gain.setValueAtTime(0.25 / tanpuraNotes.length, this.ctx!.currentTime);
        osc.connect(g);
        g.connect(this.ambientGain!);

        osc.start();
        this.ambientOscs.push(osc);
      });
    }
  }

  public stopBackgroundInstrumental(): void {
    this.isAmbientActive = false;

    if (this.ambientAudio) {
      try {
        this.ambientAudio.pause();
        this.ambientAudio.currentTime = 0;
        this.ambientAudio.src = '';
      } catch (e) {}
      this.ambientAudio = null;
    }

    this.ambientOscs.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.ambientOscs = [];

    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect();
      } catch (e) {}
      this.ambientGain = null;
    }
  }

  // =========================================================================
  // 3. ROBUST DEVOTIONAL AUDIO QUEUE (Kanda Sashti -> Sivapuranam)
  // =========================================================================

  /**
   * Play devotional track with automatic queue progression:
   * Plays Kanda Sashti Kavasam first -> upon `onended`, seamlessly transitions into Sivapuranam.
   */
  public async playDevotionalTrack(
    trackId: 'kanda_sashti_kavasam' | 'sivapuranam',
    durationSeconds: number = 380,
    callbacks?: {
      onVerseProgress?: (verseIndex: number, progressPct: number) => void;
      onTrackChange?: (trackId: 'kanda_sashti_kavasam' | 'sivapuranam') => void;
      onComplete?: () => void;
    }
  ): Promise<void> {
    await this.ensureContext();
    this.stopBackgroundInstrumental();
    this.stopDevotionalTrack();

    this.currentTrackId = trackId;
    this.isDevotionalActive = true;
    this.isDevotionalPaused = false;

    if (callbacks?.onVerseProgress) this.onVerseProgressCb = callbacks.onVerseProgress;
    if (callbacks?.onTrackChange) this.onTrackChangeCb = callbacks.onTrackChange;
    if (callbacks?.onComplete) this.onDevotionalCompleteCb = callbacks.onComplete;

    const trackConfig = DEVOTIONAL_QUEUE[trackId];
    let audioSuccess = false;

    // 1. Attempt to play via HTML5 Audio
    try {
      if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
        this.devotionalAudio = new Audio();
        (this.devotionalAudio as any).playsInline = true;
        this.devotionalAudio.volume = Math.max(0, Math.min(1.0, this.masterVolume * 0.75));

        // Attempt local paths first, then fallback CDN URL
        const candidateSources = [...trackConfig.localUrls, trackConfig.fallbackCdnUrl];
        let currentSourceIdx = 0;

        const loadNextSource = () => {
          if (!this.devotionalAudio || currentSourceIdx >= candidateSources.length) {
            // All remote/local sources failed; fall back to raga chant model
            this.startDevotionalHarmonicFallback(trackId, durationSeconds);
            return;
          }
          this.devotionalAudio.src = candidateSources[currentSourceIdx];
          currentSourceIdx++;
        };

        this.devotionalAudio.onerror = () => {
          console.warn(`Devotional audio source notice for ${trackId}, trying fallback...`);
          loadNextSource();
        };

        // Real-time progress tracker
        this.devotionalAudio.ontimeupdate = () => {
          if (!this.devotionalAudio) return;
          const cur = this.devotionalAudio.currentTime;
          const dur = this.devotionalAudio.duration || trackConfig.durationSeconds;
          const progress = Math.min(100, Math.round((cur / dur) * 100));
          const verseIndex = Math.floor((cur / 30) % 11);

          if (this.onVerseProgressCb) {
            this.onVerseProgressCb(verseIndex, progress);
          }
        };

        // Automatic Queue Transition upon onended!
        this.devotionalAudio.onended = () => {
          if (this.currentTrackId === 'kanda_sashti_kavasam') {
            console.debug('Kanda Sashti Kavasam ended, transitioning to Sivapuranam...');
            if (this.onTrackChangeCb) {
              this.onTrackChangeCb('sivapuranam');
            }
            this.playDevotionalTrack('sivapuranam', DEVOTIONAL_QUEUE.sivapuranam.durationSeconds, {
              onVerseProgress: this.onVerseProgressCb || undefined,
              onTrackChange: this.onTrackChangeCb || undefined,
              onComplete: this.onDevotionalCompleteCb || undefined,
            });
          } else {
            console.debug('Sivapuranam completed.');
            this.stopDevotionalTrack();
            if (this.onDevotionalCompleteCb) {
              this.onDevotionalCompleteCb();
            }
          }
        };

        loadNextSource();

        const p = this.devotionalAudio.play();
        if (p !== undefined) {
          await p
            .then(() => {
              audioSuccess = true;
            })
            .catch(() => {
              // will trigger onerror or loadNextSource
            });
        }
      }
    } catch (e) {
      console.warn('Devotional HTML5 Audio initiation notice:', e);
    }

    if (!audioSuccess && !this.devotionalAudio?.src) {
      this.startDevotionalHarmonicFallback(trackId, durationSeconds);
    }
  }

  /**
   * Resilient fallback: Raga Chants harmonic progression
   */
  private startDevotionalHarmonicFallback(
    trackId: 'kanda_sashti_kavasam' | 'sivapuranam',
    durationSeconds: number
  ): void {
    if (!this.ctx || !this.masterGain) return;

    this.devotionalGain = this.ctx.createGain();
    this.devotionalGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    this.devotionalGain.gain.linearRampToValueAtTime(0.65 * this.masterVolume, this.ctx.currentTime + 1.0);
    this.devotionalGain.connect(this.masterGain);

    const baseFreqs =
      trackId === 'kanda_sashti_kavasam'
        ? [130.81, 138.59, 164.81, 196.0]
        : [130.81, 146.83, 164.81, 196.0];

    baseFreqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, this.ctx!.currentTime);
      g.gain.setValueAtTime(0.2 / baseFreqs.length, this.ctx!.currentTime);
      osc.connect(g);
      g.connect(this.devotionalGain!);
      osc.start();
      this.devotionalOscs.push(osc);
    });

    const startTime = this.ctx.currentTime;
    let elapsed = 0;

    this.devotionalTimer = setInterval(() => {
      if (!this.isDevotionalActive || !this.ctx) {
        clearInterval(this.devotionalTimer);
        return;
      }

      elapsed = this.ctx.currentTime - startTime;
      const progress = Math.min(100, Math.round((elapsed / durationSeconds) * 100));
      const verseIndex = Math.floor((elapsed / 30) % 11);

      if (this.onVerseProgressCb) {
        this.onVerseProgressCb(verseIndex, progress);
      }

      if (elapsed >= durationSeconds) {
        if (this.currentTrackId === 'kanda_sashti_kavasam') {
          if (this.onTrackChangeCb) this.onTrackChangeCb('sivapuranam');
          this.playDevotionalTrack('sivapuranam', DEVOTIONAL_QUEUE.sivapuranam.durationSeconds, {
            onVerseProgress: this.onVerseProgressCb || undefined,
            onTrackChange: this.onTrackChangeCb || undefined,
            onComplete: this.onDevotionalCompleteCb || undefined,
          });
        } else {
          this.stopDevotionalTrack();
          if (this.onDevotionalCompleteCb) {
            this.onDevotionalCompleteCb();
          }
        }
      }
    }, 1000);
  }

  public pauseDevotional(): void {
    this.isDevotionalPaused = true;
    if (this.devotionalAudio) {
      try {
        this.devotionalAudio.pause();
      } catch (e) {}
    }
  }

  public resumeDevotional(): void {
    this.isDevotionalPaused = false;
    if (this.devotionalAudio) {
      try {
        this.devotionalAudio.play();
      } catch (e) {}
    }
  }

  public stopDevotionalTrack(): void {
    this.isDevotionalActive = false;
    this.isDevotionalPaused = false;

    if (this.devotionalAudio) {
      try {
        this.devotionalAudio.onended = null;
        this.devotionalAudio.onerror = null;
        this.devotionalAudio.ontimeupdate = null;
        this.devotionalAudio.pause();
        this.devotionalAudio.currentTime = 0;
        this.devotionalAudio.src = '';
      } catch (e) {}
      this.devotionalAudio = null;
    }

    if (this.devotionalTimer) {
      clearInterval(this.devotionalTimer);
      this.devotionalTimer = null;
    }

    this.devotionalOscs.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.devotionalOscs = [];

    if (this.devotionalGain) {
      try {
        this.devotionalGain.disconnect();
      } catch (e) {}
      this.devotionalGain = null;
    }
  }

  // =========================================================================
  // MASTER AUDIO CONTROLS & VISUALIZER
  // =========================================================================

  public setMasterVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1.0, vol));
    this.masterVolume = clamped;

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
    if (this.alarmAudio) {
      this.alarmAudio.volume = clamped;
    }
    if (this.ambientAudio) {
      this.ambientAudio.volume = Math.min(0.2, clamped * 0.2);
    }
    if (this.devotionalAudio) {
      this.devotionalAudio.volume = Math.max(0, Math.min(1.0, clamped * 0.75));
    }
  }

  public stopAllAudio(): void {
    this.stopAlarm();
    this.stopBackgroundInstrumental();
    this.stopDevotionalTrack();
  }

  public getAudioFrequencyData(): number[] {
    if (!this.analyzerNode) {
      return new Array(16).fill(0);
    }

    const buffer = new Uint8Array(this.analyzerNode.frequencyBinCount);
    this.analyzerNode.getByteFrequencyData(buffer);

    const bars: number[] = [];
    const step = Math.floor(buffer.length / 16) || 1;
    for (let i = 0; i < 16; i++) {
      bars.push(buffer[i * step] || 0);
    }
    return bars;
  }

  public getIsAlarmActive(): boolean {
    return this.isAlarmActive;
  }

  public getIsInstrumentalActive(): boolean {
    return this.isAmbientActive;
  }

  public getIsDevotionalActive(): boolean {
    return this.isDevotionalActive;
  }

  public getIsDevotionalPaused(): boolean {
    return this.isDevotionalPaused;
  }

  public getCurrentTrackId(): 'kanda_sashti_kavasam' | 'sivapuranam' {
    return this.currentTrackId;
  }
}

export const heavyAlarmEngine = new HeavyAlarmEngine();
