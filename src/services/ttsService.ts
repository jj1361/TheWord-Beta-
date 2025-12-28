/**
 * Text-to-Speech Service
 * Provides functionality to read Bible text aloud using Web Speech API
 */

export interface TTSSettings {
  rate: number;         // Speech rate (0.1 to 10)
  pitch: number;        // Speech pitch (0 to 2)
  volume: number;       // Volume (0 to 1)
  voice: SpeechSynthesisVoice | null;
  repeatCount: number;  // Number of times to repeat (1 = play once, 2 = repeat once, etc.)
}

export interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  currentVerse: number | null;
  currentRepeat: number;      // Current repeat iteration (1-based)
  totalRepeats: number;       // Total repeats requested
  progress: {
    currentVerse: number;
    totalVerses: number;
    currentBook?: string;
    currentChapter?: number;
  } | null;
}

export type TTSEventType =
  | 'start'
  | 'end'
  | 'pause'
  | 'resume'
  | 'verse-start'
  | 'verse-end'
  | 'repeat-start'
  | 'error';

export interface TTSEvent {
  type: TTSEventType;
  verse?: number;
  repeatNumber?: number;
  error?: string;
}

type TTSEventCallback = (event: TTSEvent) => void;

// Default TTS settings
export const DEFAULT_TTS_SETTINGS: TTSSettings = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  voice: null,
  repeatCount: 1,
};

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private settings: TTSSettings = { ...DEFAULT_TTS_SETTINGS };
  private state: TTSState = {
    isPlaying: false,
    isPaused: false,
    currentVerse: null,
    currentRepeat: 0,
    totalRepeats: 1,
    progress: null,
  };

  // Queue for verses to read
  private verseQueue: { num: number; text: string }[] = [];
  private queueIndex: number = 0;
  private currentRepeatCount: number = 0;

  // Event listeners
  private eventListeners: TTSEventCallback[] = [];

  // Reading context
  private readingContext: {
    bookName?: string;
    chapter?: number;
  } = {};

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;

      // Load saved settings from localStorage
      this.loadSettings();

      // Wait for voices to load
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.selectDefaultVoice();
        };
      }

      // Initial voice selection
      setTimeout(() => this.selectDefaultVoice(), 100);
    }
  }

  /**
   * Check if TTS is supported in the current browser
   */
  get isSupported(): boolean {
    return this.synth !== null;
  }

  /**
   * Get current TTS state
   */
  get currentState(): TTSState {
    return { ...this.state };
  }

  /**
   * Get current TTS settings
   */
  get currentSettings(): TTSSettings {
    return { ...this.settings };
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  /**
   * Get English voices only
   */
  getEnglishVoices(): SpeechSynthesisVoice[] {
    return this.getVoices().filter(voice =>
      voice.lang.startsWith('en')
    );
  }

  /**
   * Select a default English voice (preferring male voices)
   */
  private selectDefaultVoice(): void {
    const voices = this.getEnglishVoices();
    if (voices.length > 0 && !this.settings.voice) {
      // Common male voice name indicators
      const maleIndicators = ['Male', 'David', 'Daniel', 'James', 'Mark', 'Thomas', 'Aaron', 'Alex', 'Guy'];

      // First, try to find a male voice
      const maleVoice = voices.find(v =>
        maleIndicators.some(indicator => v.name.includes(indicator))
      );

      if (maleVoice) {
        this.settings.voice = maleVoice;
        return;
      }

      // Fallback: prefer voices with these characteristics in order
      const preferredVoice = voices.find(v =>
        v.name.includes('Google') ||
        v.name.includes('Premium') ||
        v.name.includes('Enhanced')
      ) || voices.find(v =>
        v.name.includes('UK') ||
        v.name.includes('US')
      ) || voices[0];

      this.settings.voice = preferredVoice;
    }
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('ttsSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = {
          ...DEFAULT_TTS_SETTINGS,
          rate: parsed.rate ?? DEFAULT_TTS_SETTINGS.rate,
          pitch: parsed.pitch ?? DEFAULT_TTS_SETTINGS.pitch,
          volume: parsed.volume ?? DEFAULT_TTS_SETTINGS.volume,
          repeatCount: parsed.repeatCount ?? DEFAULT_TTS_SETTINGS.repeatCount,
          voice: null, // Voice must be selected from available voices
        };

        // Try to restore voice by name
        if (parsed.voiceName) {
          setTimeout(() => {
            const voice = this.getVoices().find(v => v.name === parsed.voiceName);
            if (voice) {
              this.settings.voice = voice;
            }
          }, 200);
        }
      }
    } catch (error) {
      console.error('Error loading TTS settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('ttsSettings', JSON.stringify({
        rate: this.settings.rate,
        pitch: this.settings.pitch,
        volume: this.settings.volume,
        repeatCount: this.settings.repeatCount,
        voiceName: this.settings.voice?.name,
      }));
    } catch (error) {
      console.error('Error saving TTS settings:', error);
    }
  }

  /**
   * Update TTS settings
   */
  updateSettings(updates: Partial<TTSSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
  }

  /**
   * Set repeat count
   */
  setRepeatCount(count: number): void {
    const validCount = Math.max(1, Math.min(10, count)); // Limit to 1-10 repeats
    this.settings.repeatCount = validCount;
    this.saveSettings();
  }

  /**
   * Add event listener
   */
  addEventListener(callback: TTSEventCallback): void {
    this.eventListeners.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(callback: TTSEventCallback): void {
    this.eventListeners = this.eventListeners.filter(cb => cb !== callback);
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: TTSEvent): void {
    this.eventListeners.forEach(cb => cb(event));
  }

  /**
   * Prepare text for reading (clean up special characters, etc.)
   */
  private prepareText(text: string): string {
    return text
      // Remove HTML tags if any
      .replace(/<[^>]*>/g, '')
      // Replace special quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Read a single verse
   */
  readVerse(verseNum: number, text: string, bookName?: string, chapter?: number): void {
    this.verseQueue = [{ num: verseNum, text }];
    this.readingContext = { bookName, chapter };
    this.startReading();
  }

  /**
   * Read a range of verses
   */
  readVerseRange(
    verses: { num: number; text: string }[],
    startVerse: number,
    endVerse: number,
    bookName?: string,
    chapter?: number
  ): void {
    this.verseQueue = verses.filter(v => v.num >= startVerse && v.num <= endVerse);
    this.readingContext = { bookName, chapter };
    this.startReading();
  }

  /**
   * Read an entire chapter
   */
  readChapter(verses: { num: number; text: string }[], bookName?: string, chapter?: number): void {
    this.verseQueue = [...verses];
    this.readingContext = { bookName, chapter };
    this.startReading();
  }

  /**
   * Start reading from the queue
   */
  private startReading(): void {
    if (!this.synth || this.verseQueue.length === 0) return;

    // Cancel any current speech
    this.synth.cancel();

    // Reset state
    this.queueIndex = 0;
    this.currentRepeatCount = 1;
    this.state = {
      isPlaying: true,
      isPaused: false,
      currentVerse: this.verseQueue[0].num,
      currentRepeat: 1,
      totalRepeats: this.settings.repeatCount,
      progress: {
        currentVerse: 1,
        totalVerses: this.verseQueue.length,
        currentBook: this.readingContext.bookName,
        currentChapter: this.readingContext.chapter,
      },
    };

    this.emitEvent({ type: 'start' });
    this.speakNext();
  }

  /**
   * Speak the next verse in the queue
   */
  private speakNext(): void {
    if (!this.synth) return;

    if (this.queueIndex >= this.verseQueue.length) {
      // Check if we need to repeat
      if (this.currentRepeatCount < this.settings.repeatCount) {
        this.currentRepeatCount++;
        this.queueIndex = 0;
        this.state.currentRepeat = this.currentRepeatCount;
        this.emitEvent({ type: 'repeat-start', repeatNumber: this.currentRepeatCount });
        this.speakNext();
        return;
      }

      // All done
      this.state = {
        isPlaying: false,
        isPaused: false,
        currentVerse: null,
        currentRepeat: 0,
        totalRepeats: this.settings.repeatCount,
        progress: null,
      };
      this.emitEvent({ type: 'end' });
      return;
    }

    const verse = this.verseQueue[this.queueIndex];
    const text = this.prepareText(verse.text);

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.rate = this.settings.rate;
    this.utterance.pitch = this.settings.pitch;
    this.utterance.volume = this.settings.volume;

    if (this.settings.voice) {
      this.utterance.voice = this.settings.voice;
    }

    // Update state
    this.state.currentVerse = verse.num;
    if (this.state.progress) {
      this.state.progress.currentVerse = this.queueIndex + 1;
    }

    // Event handlers
    this.utterance.onstart = () => {
      this.emitEvent({ type: 'verse-start', verse: verse.num });
    };

    this.utterance.onend = () => {
      this.emitEvent({ type: 'verse-end', verse: verse.num });
      this.queueIndex++;

      // Small pause between verses
      setTimeout(() => {
        if (this.state.isPlaying && !this.state.isPaused) {
          this.speakNext();
        }
      }, 300);
    };

    this.utterance.onerror = (event) => {
      // Ignore 'interrupted' and 'canceled' errors as they're expected when stopping
      if (event.error === 'interrupted' || event.error === 'canceled') {
        return;
      }
      console.error('TTS error:', event.error);
      this.emitEvent({ type: 'error', error: event.error });
    };

    this.synth.speak(this.utterance);
  }

  /**
   * Pause reading
   */
  pause(): void {
    if (!this.synth || !this.state.isPlaying) return;

    this.synth.pause();
    this.state.isPaused = true;
    this.emitEvent({ type: 'pause' });
  }

  /**
   * Resume reading
   */
  resume(): void {
    if (!this.synth || !this.state.isPaused) return;

    this.synth.resume();
    this.state.isPaused = false;
    this.emitEvent({ type: 'resume' });
  }

  /**
   * Stop reading
   */
  stop(): void {
    if (!this.synth) return;

    this.synth.cancel();
    this.verseQueue = [];
    this.queueIndex = 0;
    this.currentRepeatCount = 0;
    this.state = {
      isPlaying: false,
      isPaused: false,
      currentVerse: null,
      currentRepeat: 0,
      totalRepeats: this.settings.repeatCount,
      progress: null,
    };
    this.emitEvent({ type: 'end' });
  }

  /**
   * Toggle play/pause
   */
  togglePlayPause(): void {
    if (this.state.isPaused) {
      this.resume();
    } else if (this.state.isPlaying) {
      this.pause();
    }
  }

  /**
   * Skip to next verse
   */
  skipToNextVerse(): void {
    if (!this.synth || !this.state.isPlaying) return;

    // Cancel current speech and move to next
    this.synth.cancel();
    this.queueIndex++;

    if (this.queueIndex < this.verseQueue.length) {
      this.speakNext();
    } else {
      this.stop();
    }
  }

  /**
   * Skip to previous verse
   */
  skipToPreviousVerse(): void {
    if (!this.synth || !this.state.isPlaying) return;

    // Cancel current speech and go back
    this.synth.cancel();
    this.queueIndex = Math.max(0, this.queueIndex - 1);
    this.speakNext();
  }

  /**
   * Jump to a specific verse in the queue
   */
  jumpToVerse(verseNum: number): void {
    if (!this.synth || !this.state.isPlaying) return;

    const index = this.verseQueue.findIndex(v => v.num === verseNum);
    if (index !== -1) {
      this.synth.cancel();
      this.queueIndex = index;
      this.speakNext();
    }
  }
}

// Export singleton instance
export const ttsService = new TTSService();
export default ttsService;
