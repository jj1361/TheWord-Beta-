/**
 * User Cross Reference Types
 *
 * Defines types for user-created cross references, categories, and display settings.
 */

/**
 * Represents a category for organizing user cross references
 */
export interface CrossRefCategory {
  id: string;
  name: string;
  color: string; // Hex color code
  description?: string;
  sortOrder: number;
  timestamp: number;
  updatedAt?: number;
}

/**
 * Verse reference for cross references
 */
export interface CrossRefVerseReference {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  verseEnd?: number; // For verse ranges
}

/**
 * Represents a user-created cross reference
 */
export interface UserCrossReference {
  id: string;
  // Source verse (where the cross ref is anchored)
  sourceVerse: CrossRefVerseReference;
  // Target verse (what the cross ref points to)
  targetVerse: CrossRefVerseReference;
  // Category this cross ref belongs to
  categoryId?: string;
  // User-defined sort order within the verse
  sortOrder: number;
  // Optional word or phrase this cross ref is associated with
  word?: string;
  // Optional note explaining the connection
  note?: string;
  timestamp: number;
  updatedAt?: number;
}

/**
 * Sort modes for cross references
 */
export type CrossRefSortMode = 'biblical' | 'custom' | 'recent';

/**
 * Display settings for cross references
 */
export interface CrossRefDisplaySettings {
  showTSK: boolean;
  showUserRefs: boolean;
  sortMode: CrossRefSortMode;
  // Order of categories to display (category IDs)
  categorySortOrder: string[];
}

/**
 * State for the user cross references feature
 */
export interface UserCrossRefState {
  categories: CrossRefCategory[];
  crossRefs: UserCrossReference[];
  displaySettings: CrossRefDisplaySettings;
}

/**
 * Default display settings
 */
export const DEFAULT_DISPLAY_SETTINGS: CrossRefDisplaySettings = {
  showTSK: true,
  showUserRefs: true,
  sortMode: 'biblical',
  categorySortOrder: [],
};

/**
 * Default categories that can be pre-populated
 */
export const DEFAULT_CATEGORIES: Omit<CrossRefCategory, 'id' | 'timestamp' | 'sortOrder'>[] = [
  { name: 'Prophecy Fulfilled', color: '#8b5cf6', description: 'Old Testament prophecies fulfilled in the New Testament' },
  { name: 'Type & Antitype', color: '#f59e0b', description: 'Old Testament types and their New Testament fulfillments' },
  { name: 'Parallel Passages', color: '#3b82f6', description: 'Similar accounts or teachings in different books' },
  { name: 'Thematic Connection', color: '#22c55e', description: 'Verses connected by theme or topic' },
  { name: 'Word Study', color: '#ec4899', description: 'Cross references based on shared Hebrew/Greek words' },
  { name: 'Quotation', color: '#06b6d4', description: 'Direct quotations from other Scripture' },
];

/**
 * Predefined colors for category selection
 */
export const CATEGORY_COLORS: { value: string; label: string }[] = [
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#84cc16', label: 'Lime' },
  { value: '#22c55e', label: 'Green' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#d946ef', label: 'Fuchsia' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#f43f5e', label: 'Rose' },
  { value: '#78716c', label: 'Stone' },
];
