/**
 * Notes, Highlights, and Topics Types
 *
 * Defines types for user annotations, highlights, and topic organization.
 */

/**
 * Represents a verse reference that can be a single verse or a range
 */
export interface VerseReference {
  bookId: number;
  bookName: string;
  chapter: number;
  startVerse: number;
  endVerse?: number; // Optional for verse ranges
  osisRef: string;
}

/**
 * Highlight colors available for marking verses
 */
export type HighlightColor =
  | 'yellow'
  | 'green'
  | 'blue'
  | 'pink'
  | 'orange'
  | 'purple';

/**
 * Represents a highlight on a verse or verse range
 */
export interface VerseHighlight {
  id: string;
  verses: VerseReference;
  color: HighlightColor;
  timestamp: number;
  updatedAt?: number;
}

/**
 * Text formatting style options
 */
export interface TextFormatStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontColor?: string;
  backgroundColor?: string;
}

/**
 * Represents rich text formatting applied to specific text within a verse
 */
export interface TextFormatting {
  id: string;
  bookId: number;
  chapter: number;
  verse: number;
  startOffset: number;   // Character offset from start of verse text
  endOffset: number;     // End character offset
  selectedText: string;  // The actual text that was selected (for validation)
  style: TextFormatStyle;
  timestamp: number;
  updatedAt?: number;
}

/**
 * Represents a topic/tag for organizing notes and verses
 */
export interface Topic {
  id: string;
  name: string;
  color?: string;
  description?: string;
  timestamp: number;
  updatedAt?: number;
}

/**
 * Rich text content format for notes
 */
export interface RichTextContent {
  html: string;
  plainText: string;
}

/**
 * Represents a note attached to verses or a topic
 */
export interface Note {
  id: string;
  title?: string;
  content: RichTextContent;
  verses?: VerseReference[]; // Can attach to multiple verses/ranges
  topicIds?: string[]; // Can belong to multiple topics
  timestamp: number;
  updatedAt?: number;
}

/**
 * State for the notes feature
 */
export interface NotesState {
  notes: Note[];
  highlights: VerseHighlight[];
  topics: Topic[];
  textFormatting: TextFormatting[];
}

/**
 * Highlight color configurations with display values
 * hexLight: color for light mode (pastel)
 * hexDark: color for dark mode (richer, semi-transparent)
 * hex: legacy field, same as hexLight for backwards compatibility
 */
export const HIGHLIGHT_COLORS: { value: HighlightColor; label: string; hex: string; hexLight: string; hexDark: string }[] = [
  { value: 'yellow', label: 'Yellow', hex: '#fff3cd', hexLight: '#fff3cd', hexDark: 'rgba(250, 204, 21, 0.35)' },
  { value: 'green', label: 'Green', hex: '#d4edda', hexLight: '#d4edda', hexDark: 'rgba(74, 222, 128, 0.35)' },
  { value: 'blue', label: 'Blue', hex: '#cce5ff', hexLight: '#cce5ff', hexDark: 'rgba(96, 165, 250, 0.35)' },
  { value: 'pink', label: 'Pink', hex: '#f8d7da', hexLight: '#f8d7da', hexDark: 'rgba(244, 114, 182, 0.35)' },
  { value: 'orange', label: 'Orange', hex: '#ffeeba', hexLight: '#ffeeba', hexDark: 'rgba(251, 146, 60, 0.35)' },
  { value: 'purple', label: 'Purple', hex: '#e2d5f1', hexLight: '#e2d5f1', hexDark: 'rgba(192, 132, 252, 0.35)' },
];

/**
 * Default topics that can be pre-populated
 */
export const DEFAULT_TOPICS: Omit<Topic, 'id' | 'timestamp'>[] = [
  { name: 'Prayer', color: '#6366f1', description: 'Verses about prayer' },
  { name: 'Faith', color: '#22c55e', description: 'Verses about faith' },
  { name: 'Love', color: '#ec4899', description: 'Verses about love' },
  { name: 'Wisdom', color: '#f59e0b', description: 'Verses about wisdom' },
  { name: 'Salvation', color: '#3b82f6', description: 'Verses about salvation' },
  { name: 'Prophecy', color: '#8b5cf6', description: 'Prophetic verses' },
];
