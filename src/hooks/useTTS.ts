/**
 * useTTS Hook
 * React hook for using the Text-to-Speech service
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ttsService,
  TTSState,
  TTSSettings,
  TTSEvent,
  DEFAULT_TTS_SETTINGS,
} from '../services/ttsService';

interface UseTTSOptions {
  onVerseStart?: (verse: number) => void;
  onVerseEnd?: (verse: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

interface UseTTSReturn {
  // State
  isSupported: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  currentVerse: number | null;
  currentRepeat: number;
  totalRepeats: number;
  progress: TTSState['progress'];
  settings: TTSSettings;

  // Actions
  readChapter: (verses: { num: number; text: string }[], bookName?: string, chapter?: number) => void;
  readVerse: (verseNum: number, text: string, bookName?: string, chapter?: number) => void;
  readVerseRange: (
    verses: { num: number; text: string }[],
    startVerse: number,
    endVerse: number,
    bookName?: string,
    chapter?: number
  ) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  togglePlayPause: () => void;
  skipToNextVerse: () => void;
  skipToPreviousVerse: () => void;
  jumpToVerse: (verseNum: number) => void;

  // Settings
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  setVoice: (voice: SpeechSynthesisVoice) => void;
  setRepeatCount: (count: number) => void;
  getVoices: () => SpeechSynthesisVoice[];
  getEnglishVoices: () => SpeechSynthesisVoice[];
}

export function useTTS(options: UseTTSOptions = {}): UseTTSReturn {
  const [state, setState] = useState<TTSState>(ttsService.currentState);
  const [settings, setSettings] = useState<TTSSettings>(ttsService.currentSettings);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Store callbacks in refs to avoid re-registering listeners
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Subscribe to TTS events
  useEffect(() => {
    const handleEvent = (event: TTSEvent) => {
      // Update state
      setState(ttsService.currentState);

      // Call appropriate callback
      switch (event.type) {
        case 'start':
          optionsRef.current.onStart?.();
          break;
        case 'end':
          optionsRef.current.onEnd?.();
          break;
        case 'verse-start':
          if (event.verse !== undefined) {
            optionsRef.current.onVerseStart?.(event.verse);
          }
          break;
        case 'verse-end':
          if (event.verse !== undefined) {
            optionsRef.current.onVerseEnd?.(event.verse);
          }
          break;
        case 'error':
          if (event.error) {
            optionsRef.current.onError?.(event.error);
          }
          break;
      }
    };

    ttsService.addEventListener(handleEvent);

    // Load voices
    const loadVoices = () => {
      setVoices(ttsService.getVoices());
      setSettings(ttsService.currentSettings);
    };

    // Voices may load asynchronously
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      ttsService.removeEventListener(handleEvent);
    };
  }, []);

  // Actions
  const readChapter = useCallback(
    (verses: { num: number; text: string }[], bookName?: string, chapter?: number) => {
      ttsService.readChapter(verses, bookName, chapter);
      setState(ttsService.currentState);
    },
    []
  );

  const readVerse = useCallback(
    (verseNum: number, text: string, bookName?: string, chapter?: number) => {
      ttsService.readVerse(verseNum, text, bookName, chapter);
      setState(ttsService.currentState);
    },
    []
  );

  const readVerseRange = useCallback(
    (
      verses: { num: number; text: string }[],
      startVerse: number,
      endVerse: number,
      bookName?: string,
      chapter?: number
    ) => {
      ttsService.readVerseRange(verses, startVerse, endVerse, bookName, chapter);
      setState(ttsService.currentState);
    },
    []
  );

  const stop = useCallback(() => {
    ttsService.stop();
    setState(ttsService.currentState);
  }, []);

  const pause = useCallback(() => {
    ttsService.pause();
    setState(ttsService.currentState);
  }, []);

  const resume = useCallback(() => {
    ttsService.resume();
    setState(ttsService.currentState);
  }, []);

  const togglePlayPause = useCallback(() => {
    ttsService.togglePlayPause();
    setState(ttsService.currentState);
  }, []);

  const skipToNextVerse = useCallback(() => {
    ttsService.skipToNextVerse();
    setState(ttsService.currentState);
  }, []);

  const skipToPreviousVerse = useCallback(() => {
    ttsService.skipToPreviousVerse();
    setState(ttsService.currentState);
  }, []);

  const jumpToVerse = useCallback((verseNum: number) => {
    ttsService.jumpToVerse(verseNum);
    setState(ttsService.currentState);
  }, []);

  // Settings
  const setRate = useCallback((rate: number) => {
    ttsService.updateSettings({ rate });
    setSettings(ttsService.currentSettings);
  }, []);

  const setPitch = useCallback((pitch: number) => {
    ttsService.updateSettings({ pitch });
    setSettings(ttsService.currentSettings);
  }, []);

  const setVolume = useCallback((volume: number) => {
    ttsService.updateSettings({ volume });
    setSettings(ttsService.currentSettings);
  }, []);

  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    ttsService.updateSettings({ voice });
    setSettings(ttsService.currentSettings);
  }, []);

  const setRepeatCount = useCallback((count: number) => {
    ttsService.setRepeatCount(count);
    setSettings(ttsService.currentSettings);
  }, []);

  const getVoices = useCallback(() => {
    return ttsService.getVoices();
  }, []);

  const getEnglishVoices = useCallback(() => {
    return ttsService.getEnglishVoices();
  }, []);

  return {
    // State
    isSupported: ttsService.isSupported,
    isPlaying: state.isPlaying,
    isPaused: state.isPaused,
    currentVerse: state.currentVerse,
    currentRepeat: state.currentRepeat,
    totalRepeats: state.totalRepeats,
    progress: state.progress,
    settings: settings || DEFAULT_TTS_SETTINGS,

    // Actions
    readChapter,
    readVerse,
    readVerseRange,
    stop,
    pause,
    resume,
    togglePlayPause,
    skipToNextVerse,
    skipToPreviousVerse,
    jumpToVerse,

    // Settings
    setRate,
    setPitch,
    setVolume,
    setVoice,
    setRepeatCount,
    getVoices,
    getEnglishVoices,
  };
}

export default useTTS;
