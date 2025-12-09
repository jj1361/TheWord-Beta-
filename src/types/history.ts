/**
 * Navigation History Types
 *
 * Defines types for tracking user navigation through scripture passages.
 */

export interface HistoryEntry {
  bookId: number;
  bookName: string;
  chapter: number;
  verse?: number;
  timestamp: number;
  osisRef: string;
}

export interface NavigationHistoryState {
  entries: HistoryEntry[];
  currentIndex: number;
}

export interface Bookmark {
  id: string;
  bookId: number;
  bookName: string;
  chapter: number;
  verse?: number;
  osisRef: string;
  label?: string;
  timestamp: number;
}
