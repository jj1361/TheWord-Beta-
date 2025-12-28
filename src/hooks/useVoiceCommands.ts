/**
 * useVoiceCommands Hook
 * Manages Web Speech API integration for voice command recognition
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  VoiceRecognitionState,
  VoiceCommandFeedback,
  VoiceSettings,
  DEFAULT_VOICE_SETTINGS,
  ParsedVoiceCommand,
  VoiceCommandHandlers,
} from '../types/voiceCommands';
import {
  parseVoiceCommand,
  getCommandDescription,
  getSuggestions,
} from '../services/voiceCommandService';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseVoiceCommandsOptions {
  handlers: Partial<VoiceCommandHandlers>;
  settings?: Partial<VoiceSettings>;
  onCommand?: (command: ParsedVoiceCommand) => void;
  onFeedback?: (feedback: VoiceCommandFeedback) => void;
  currentVerse?: number;
}

interface UseVoiceCommandsReturn {
  state: VoiceRecognitionState;
  isListening: boolean;
  isAlwaysOn: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  lastCommand: ParsedVoiceCommand | null;
  feedback: VoiceCommandFeedback | null;
  suggestions: string[];
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  toggleAlwaysOn: () => void;
  settings: VoiceSettings;
  updateSettings: (newSettings: Partial<VoiceSettings>) => void;
}

export function useVoiceCommands(options: UseVoiceCommandsOptions): UseVoiceCommandsReturn {
  const { handlers, settings: userSettings, onCommand, onFeedback, currentVerse } = options;

  // State
  const [state, setState] = useState<VoiceRecognitionState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<ParsedVoiceCommand | null>(null);
  const [feedback, setFeedback] = useState<VoiceCommandFeedback | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAlwaysOn, setIsAlwaysOn] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings>({
    ...DEFAULT_VOICE_SETTINGS,
    ...userSettings,
  });

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const alwaysOnRef = useRef(false);
  const intentionalStopRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support
  const isSupported = typeof window !== 'undefined' &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Show feedback with auto-clear
  const showFeedback = useCallback((newFeedback: VoiceCommandFeedback) => {
    setFeedback(newFeedback);
    onFeedback?.(newFeedback);

    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
    }, 3000);
  }, [onFeedback]);

  // Execute a parsed command
  const executeCommand = useCallback((command: ParsedVoiceCommand) => {
    setLastCommand(command);
    onCommand?.(command);

    const { action, params } = command;

    try {
      switch (action) {
        // Navigation
        case 'NAVIGATE_TO_SCRIPTURE':
          if (params.bookId && params.chapter) {
            handlers.navigateToScripture?.(params.bookId, params.chapter, params.verse);
            showFeedback({
              type: 'success',
              message: getCommandDescription(command),
              action,
            });
          } else {
            showFeedback({
              type: 'error',
              message: 'Could not parse scripture reference',
              action,
            });
          }
          break;

        case 'NEXT_CHAPTER':
          handlers.nextChapter?.();
          showFeedback({ type: 'success', message: 'Next chapter', action });
          break;

        case 'PREVIOUS_CHAPTER':
          handlers.previousChapter?.();
          showFeedback({ type: 'success', message: 'Previous chapter', action });
          break;

        case 'GO_TO_VERSE':
          if (params.verse) {
            handlers.goToVerse?.(params.verse);
            showFeedback({ type: 'success', message: `Going to verse ${params.verse}`, action });
          }
          break;

        case 'GO_BACK':
          handlers.goBack?.();
          showFeedback({ type: 'success', message: 'Going back', action });
          break;

        case 'GO_FORWARD':
          handlers.goForward?.();
          showFeedback({ type: 'success', message: 'Going forward', action });
          break;

        // Mode toggles
        case 'ENABLE_WEBCAM':
          handlers.setWebcamEnabled?.(true);
          showFeedback({ type: 'success', message: 'Webcam enabled', action });
          break;

        case 'DISABLE_WEBCAM':
          handlers.setWebcamEnabled?.(false);
          showFeedback({ type: 'success', message: 'Webcam disabled', action });
          break;

        case 'TOGGLE_WEBCAM':
          // This would need current state - handled at App level
          showFeedback({ type: 'info', message: 'Toggling webcam', action });
          break;

        case 'ENABLE_DARK_MODE':
          handlers.setDarkMode?.(true);
          showFeedback({ type: 'success', message: 'Dark mode enabled', action });
          break;

        case 'DISABLE_DARK_MODE':
          handlers.setDarkMode?.(false);
          showFeedback({ type: 'success', message: 'Light mode enabled', action });
          break;

        case 'TOGGLE_DARK_MODE':
          showFeedback({ type: 'info', message: 'Toggling dark mode', action });
          break;

        case 'ENABLE_STUDY_MODE':
          handlers.setStudyMode?.(true);
          showFeedback({ type: 'success', message: 'Study mode enabled', action });
          break;

        case 'DISABLE_STUDY_MODE':
          handlers.setStudyMode?.(false);
          showFeedback({ type: 'success', message: 'Study mode disabled', action });
          break;

        case 'TOGGLE_STUDY_MODE':
          showFeedback({ type: 'info', message: 'Toggling study mode', action });
          break;

        case 'ENABLE_YOUTH_MODE':
          handlers.setYouthMode?.(true);
          showFeedback({ type: 'success', message: 'Youth mode enabled', action });
          break;

        case 'DISABLE_YOUTH_MODE':
          handlers.setYouthMode?.(false);
          showFeedback({ type: 'success', message: 'Youth mode disabled', action });
          break;

        case 'TOGGLE_YOUTH_MODE':
          showFeedback({ type: 'info', message: 'Toggling youth mode', action });
          break;

        case 'ENABLE_FULLSCREEN':
          handlers.setFullscreen?.(true);
          showFeedback({ type: 'success', message: 'Entering fullscreen', action });
          break;

        case 'DISABLE_FULLSCREEN':
          handlers.setFullscreen?.(false);
          showFeedback({ type: 'success', message: 'Exiting fullscreen', action });
          break;

        // Person profile
        case 'SHOW_PERSON_PROFILE':
          if (params.personName) {
            // Convert name to ID (simple lowercase, replace spaces)
            const personId = params.personName.toLowerCase().replace(/\s+/g, '-');
            handlers.showPersonProfile?.(personId);
            showFeedback({ type: 'success', message: `Showing ${params.personName}'s profile`, action });
          }
          break;

        // Study tools
        case 'LOOKUP_STRONGS':
          if (params.strongsId) {
            handlers.lookupStrongs?.(params.strongsId);
            showFeedback({ type: 'success', message: `Looking up Strong's ${params.strongsId}`, action });
          }
          break;

        case 'SEARCH_TEXT':
          if (params.searchQuery) {
            handlers.searchText?.(params.searchQuery);
            showFeedback({ type: 'success', message: `Searching for "${params.searchQuery}"`, action });
          }
          break;

        case 'ADD_BOOKMARK':
          handlers.addBookmark?.();
          showFeedback({ type: 'success', message: 'Bookmark added', action });
          break;

        case 'CREATE_NOTE':
          handlers.createNote?.();
          showFeedback({ type: 'success', message: 'Opening note editor', action });
          break;

        // Text size
        case 'INCREASE_TEXT_SIZE':
          handlers.increaseTextSize?.();
          showFeedback({ type: 'success', message: 'Text size increased', action });
          break;

        case 'DECREASE_TEXT_SIZE':
          handlers.decreaseTextSize?.();
          showFeedback({ type: 'success', message: 'Text size decreased', action });
          break;

        case 'SET_TEXT_SIZE':
          if (params.textSize) {
            handlers.setTextSize?.(params.textSize);
            showFeedback({ type: 'success', message: `Text size set to ${params.textSize}`, action });
          }
          break;

        // Reading (TTS)
        case 'READ_CHAPTER':
          handlers.readChapter?.();
          showFeedback({ type: 'success', message: 'Reading chapter', action });
          break;

        case 'READ_VERSE':
          handlers.readVerse?.(params.verse || currentVerse || 1);
          showFeedback({ type: 'success', message: `Reading verse ${params.verse || currentVerse || 1}`, action });
          break;

        case 'READ_VERSE_RANGE':
          if (params.verse && params.endVerse) {
            handlers.readVerseRange?.(params.verse, params.endVerse);
            showFeedback({ type: 'success', message: `Reading verses ${params.verse}-${params.endVerse}`, action });
          }
          break;

        case 'READ_BOOK':
          handlers.readBook?.();
          showFeedback({ type: 'success', message: 'Reading book', action });
          break;

        case 'STOP_READING':
          handlers.stopReading?.();
          showFeedback({ type: 'success', message: 'Stopped reading', action });
          break;

        case 'PAUSE_READING':
          handlers.pauseReading?.();
          showFeedback({ type: 'success', message: 'Reading paused', action });
          break;

        case 'RESUME_READING':
          handlers.resumeReading?.();
          showFeedback({ type: 'success', message: 'Resuming reading', action });
          break;

        case 'SET_REPEAT_COUNT':
          if (params.repeatCount) {
            handlers.setRepeatCount?.(params.repeatCount);
            showFeedback({ type: 'success', message: `Will repeat ${params.repeatCount} times`, action });
          }
          break;

        // Footnotes
        case 'SHOW_FOOTNOTES':
          handlers.setShowFootnotes?.(true);
          showFeedback({ type: 'success', message: 'Showing footnotes', action });
          break;

        case 'HIDE_FOOTNOTES':
          handlers.setShowFootnotes?.(false);
          showFeedback({ type: 'success', message: 'Hiding footnotes', action });
          break;

        case 'SHOW_CROSS_REFERENCES':
          handlers.showCrossReferences?.(params.verse || currentVerse || 1);
          showFeedback({ type: 'success', message: `Showing cross references for verse ${params.verse || currentVerse || 1}`, action });
          break;

        case 'SHOW_INTERLINEAR':
          handlers.showInterlinear?.(params.verse || currentVerse || 1);
          showFeedback({ type: 'success', message: `Showing interlinear for verse ${params.verse || currentVerse || 1}`, action });
          break;

        // Unknown
        case 'UNKNOWN':
          const commandSuggestions = getSuggestions(command.rawTranscript);
          setSuggestions(commandSuggestions);
          showFeedback({
            type: 'error',
            message: `Didn't understand: "${command.rawTranscript}"`,
            action,
          });
          break;

        default:
          showFeedback({
            type: 'info',
            message: getCommandDescription(command),
            action,
          });
      }
    } catch (error) {
      console.error('Error executing voice command:', error);
      showFeedback({
        type: 'error',
        message: 'Error executing command',
        action,
      });
    }
  }, [handlers, currentVerse, showFeedback, onCommand]);

  // Refs to hold current values for callbacks
  const executeCommandRef = useRef(executeCommand);
  const showFeedbackRef = useRef(showFeedback);
  const settingsRef = useRef(settings);

  // Keep refs updated
  useEffect(() => {
    executeCommandRef.current = executeCommand;
  }, [executeCommand]);

  useEffect(() => {
    showFeedbackRef.current = showFeedback;
  }, [showFeedback]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Initialize speech recognition (only once)
  useEffect(() => {
    if (!isSupported) {
      setState('not_supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false; // We'll handle restarting manually
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState('listening');
      isListeningRef.current = true;
      setInterimTranscript('');
      if (settingsRef.current.visualFeedback && !alwaysOnRef.current) {
        showFeedbackRef.current({ type: 'listening', message: 'Listening...' });
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      setInterimTranscript(interimText);

      if (finalTranscript) {
        setTranscript(finalTranscript);
        setState('processing');

        // In always-on mode, wake word is always required
        const requireWakeWord = alwaysOnRef.current || settingsRef.current.requireWakeWord;

        // Check for wake word if required
        if (requireWakeWord && settingsRef.current.wakeWord) {
          const wakeWordLower = settingsRef.current.wakeWord.toLowerCase();
          const transcriptLower = finalTranscript.toLowerCase();

          if (!transcriptLower.startsWith(wakeWordLower)) {
            // In always-on mode, just keep listening without feedback
            if (alwaysOnRef.current) {
              setState('listening');
            } else {
              setState('listening');
            }
            return;
          }

          // Remove wake word from transcript
          finalTranscript = finalTranscript
            .substring(settingsRef.current.wakeWord.length)
            .trim();
        }

        // Parse and execute command
        const command = parseVoiceCommand(finalTranscript);
        executeCommandRef.current(command);

        // In always-on mode, don't stop - just restart listening
        // In regular mode, stop recognition after command
        if (!alwaysOnRef.current) {
          recognition.stop();
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Ignore 'aborted' errors - they occur when we intentionally stop
      if (event.error === 'aborted') {
        return;
      }

      // Handle 'no-speech' gracefully
      if (event.error === 'no-speech') {
        // In always-on mode, just restart without feedback
        if (alwaysOnRef.current && !intentionalStopRef.current) {
          // onend will handle restart
          return;
        }
        // Regular mode: silently return to idle
        setState('idle');
        isListeningRef.current = false;
        return;
      }

      console.error('Speech recognition error:', event.error);

      // For always-on mode, try to recover from non-fatal errors
      if (alwaysOnRef.current && !intentionalStopRef.current) {
        if (event.error === 'network') {
          // Network error - will retry on onend
          return;
        }
      }

      if (event.error === 'audio-capture') {
        showFeedbackRef.current({ type: 'error', message: 'Microphone not available' });
        // Disable always-on if mic becomes unavailable
        alwaysOnRef.current = false;
      } else if (event.error === 'not-allowed') {
        showFeedbackRef.current({ type: 'error', message: 'Microphone access denied' });
        // Disable always-on if permission denied
        alwaysOnRef.current = false;
      } else {
        showFeedbackRef.current({ type: 'error', message: `Error: ${event.error}` });
      }

      setState('error');
      isListeningRef.current = false;
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setInterimTranscript('');

      // Auto-restart in always-on mode (unless intentionally stopped)
      if (alwaysOnRef.current && !intentionalStopRef.current) {
        // Small delay before restarting to prevent rapid cycling
        restartTimeoutRef.current = setTimeout(() => {
          if (alwaysOnRef.current && !intentionalStopRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.warn('Failed to restart recognition:', e);
            }
          }
        }, 100);
        // Keep state as listening since we're restarting
        setState('listening');
      } else {
        setState('idle');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      alwaysOnRef.current = false;
    };
  }, [isSupported]); // Only depend on isSupported - this runs once

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      showFeedback({ type: 'error', message: 'Voice recognition not supported' });
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (e) {
      // Already started
      console.warn('Recognition already started');
    }
  }, [isSupported, showFeedback]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      recognitionRef.current.stop();
      setState('idle');
      setInterimTranscript('');
    }
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  // Toggle always-on mode
  const toggleAlwaysOn = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      showFeedback({ type: 'error', message: 'Voice recognition not supported' });
      return;
    }

    if (alwaysOnRef.current) {
      // Turning off always-on mode
      alwaysOnRef.current = false;
      setIsAlwaysOn(false);
      intentionalStopRef.current = true;

      // Clear any pending restart
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }

      // Stop recognition if running
      if (isListeningRef.current) {
        recognitionRef.current.stop();
      }

      showFeedback({ type: 'info', message: 'Always-on listening disabled' });
      setState('idle');
      intentionalStopRef.current = false;
    } else {
      // Turning on always-on mode
      alwaysOnRef.current = true;
      setIsAlwaysOn(true);
      intentionalStopRef.current = false;

      showFeedback({ type: 'success', message: 'Always-on listening enabled. Say "Hey Bible" to activate.' });

      // Start listening if not already
      if (!isListeningRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Failed to start recognition:', e);
        }
      }
    }
  }, [isSupported, showFeedback]);

  return {
    state,
    isListening: state === 'listening',
    isAlwaysOn,
    isSupported,
    transcript,
    interimTranscript,
    lastCommand,
    feedback,
    suggestions,
    startListening,
    stopListening,
    toggleListening,
    toggleAlwaysOn,
    settings,
    updateSettings,
  };
}

export default useVoiceCommands;
