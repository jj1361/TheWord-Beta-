/**
 * Voice Command Types and Interfaces
 * Defines the structure for voice command parsing and execution
 */

// Action types for voice commands
export type VoiceCommandAction =
  // Navigation
  | 'NAVIGATE_TO_SCRIPTURE'
  | 'NEXT_CHAPTER'
  | 'PREVIOUS_CHAPTER'
  | 'GO_TO_VERSE'
  | 'GO_BACK'
  | 'GO_FORWARD'
  // Mode toggles
  | 'ENABLE_WEBCAM'
  | 'DISABLE_WEBCAM'
  | 'TOGGLE_WEBCAM'
  | 'ENABLE_DARK_MODE'
  | 'DISABLE_DARK_MODE'
  | 'TOGGLE_DARK_MODE'
  | 'ENABLE_STUDY_MODE'
  | 'DISABLE_STUDY_MODE'
  | 'TOGGLE_STUDY_MODE'
  | 'ENABLE_YOUTH_MODE'
  | 'DISABLE_YOUTH_MODE'
  | 'TOGGLE_YOUTH_MODE'
  | 'ENABLE_FULLSCREEN'
  | 'DISABLE_FULLSCREEN'
  // Person/Entity
  | 'SHOW_PERSON_PROFILE'
  // Study tools
  | 'LOOKUP_STRONGS'
  | 'SEARCH_TEXT'
  | 'ADD_BOOKMARK'
  | 'CREATE_NOTE'
  // Text size
  | 'INCREASE_TEXT_SIZE'
  | 'DECREASE_TEXT_SIZE'
  | 'SET_TEXT_SIZE'
  // Reading (TTS)
  | 'READ_CHAPTER'
  | 'READ_VERSE'
  | 'READ_VERSE_RANGE'
  | 'READ_BOOK'
  | 'STOP_READING'
  | 'PAUSE_READING'
  | 'RESUME_READING'
  | 'SET_REPEAT_COUNT'
  // UI
  | 'SHOW_FOOTNOTES'
  | 'HIDE_FOOTNOTES'
  | 'SHOW_CROSS_REFERENCES'
  | 'SHOW_INTERLINEAR'
  // Unknown
  | 'UNKNOWN';

// Parameters that can be extracted from voice commands
export interface VoiceCommandParams {
  // Scripture navigation
  bookId?: number;
  bookName?: string;
  chapter?: number;
  verse?: number;
  endVerse?: number;
  // Person
  personName?: string;
  personId?: string;
  // Strong's
  strongsId?: string;
  // Search
  searchQuery?: string;
  // Text size
  textSize?: number;
  // Reading
  repeatCount?: number;
  // Raw input
  rawInput?: string;
}

// Parsed voice command result
export interface ParsedVoiceCommand {
  action: VoiceCommandAction;
  params: VoiceCommandParams;
  confidence: number;
  rawTranscript: string;
}

// Voice command pattern definition
export interface VoiceCommandPattern {
  patterns: RegExp[];
  action: VoiceCommandAction;
  extractParams?: (match: RegExpMatchArray, fullText: string) => VoiceCommandParams;
  priority?: number; // Higher priority patterns are checked first
}

// Voice command handler function type
export type VoiceCommandHandler = (command: ParsedVoiceCommand) => void | Promise<void>;

// Voice command handlers map
export interface VoiceCommandHandlers {
  // Navigation
  navigateToScripture: (bookId: number, chapter: number, verse?: number) => void;
  nextChapter: () => void;
  previousChapter: () => void;
  goToVerse: (verse: number) => void;
  goBack: () => void;
  goForward: () => void;
  // Mode toggles
  setWebcamEnabled: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setStudyMode: (enabled: boolean) => void;
  setYouthMode: (enabled: boolean) => void;
  setFullscreen: (enabled: boolean) => void;
  // Person
  showPersonProfile: (personId: string) => void;
  // Study tools
  lookupStrongs: (strongsId: string) => void;
  searchText: (query: string) => void;
  addBookmark: () => void;
  createNote: () => void;
  // Text size
  increaseTextSize: () => void;
  decreaseTextSize: () => void;
  setTextSize: (size: number) => void;
  // Reading (TTS)
  readChapter: () => void;
  readVerse: (verse: number) => void;
  readVerseRange: (startVerse: number, endVerse: number) => void;
  readBook: () => void;
  stopReading: () => void;
  pauseReading: () => void;
  resumeReading: () => void;
  setRepeatCount: (count: number) => void;
  // Footnotes
  setShowFootnotes: (show: boolean) => void;
  // Cross references
  showCrossReferences: (verse: number) => void;
  // Interlinear
  showInterlinear: (verse: number) => void;
}

// Voice recognition state
export type VoiceRecognitionState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'error'
  | 'not_supported';

// Voice command feedback
export interface VoiceCommandFeedback {
  type: 'success' | 'error' | 'info' | 'listening';
  message: string;
  action?: VoiceCommandAction;
}

// Voice settings
export interface VoiceSettings {
  enabled: boolean;
  language: string;
  continuous: boolean;
  interimResults: boolean;
  wakeWord?: string;
  requireWakeWord: boolean;
  feedbackSound: boolean;
  visualFeedback: boolean;
  alwaysOn: boolean;  // Always-on listening mode (requires wake word)
}

// Default voice settings
export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: false,
  language: 'en-US',
  continuous: false,
  interimResults: false,
  wakeWord: 'hey bible',
  requireWakeWord: false,
  feedbackSound: true,
  visualFeedback: true,
  alwaysOn: false,
};
