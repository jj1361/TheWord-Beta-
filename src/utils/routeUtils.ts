/**
 * Route utilities for URL-based navigation
 * Handles conversion between book IDs, slugs, and URLs
 */

import { BIBLE_BOOKS } from '../types/bible';

// Book name to URL slug mapping (lowercase, hyphenated)
export const BOOK_SLUGS: Record<number, string> = {
  1: 'genesis',
  2: 'exodus',
  3: 'leviticus',
  4: 'numbers',
  5: 'deuteronomy',
  6: 'joshua',
  7: 'judges',
  8: 'ruth',
  9: '1-samuel',
  10: '2-samuel',
  11: '1-kings',
  12: '2-kings',
  13: '1-chronicles',
  14: '2-chronicles',
  15: 'ezra',
  16: 'nehemiah',
  17: 'esther',
  18: 'job',
  19: 'psalms',
  20: 'proverbs',
  21: 'ecclesiastes',
  22: 'song-of-solomon',
  23: 'isaiah',
  24: 'jeremiah',
  25: 'lamentations',
  26: 'ezekiel',
  27: 'daniel',
  28: 'hosea',
  29: 'joel',
  30: 'amos',
  31: 'obadiah',
  32: 'jonah',
  33: 'micah',
  34: 'nahum',
  35: 'habakkuk',
  36: 'zephaniah',
  37: 'haggai',
  38: 'zechariah',
  39: 'malachi',
  40: 'matthew',
  41: 'mark',
  42: 'luke',
  43: 'john',
  44: 'acts',
  45: 'romans',
  46: '1-corinthians',
  47: '2-corinthians',
  48: 'galatians',
  49: 'ephesians',
  50: 'philippians',
  51: 'colossians',
  52: '1-thessalonians',
  53: '2-thessalonians',
  54: '1-timothy',
  55: '2-timothy',
  56: 'titus',
  57: 'philemon',
  58: 'hebrews',
  59: 'james',
  60: '1-peter',
  61: '2-peter',
  62: '1-john',
  63: '2-john',
  64: '3-john',
  65: 'jude',
  66: 'revelation',
  // Apocrypha
  67: 'tobit',
  68: 'judith',
  69: 'additions-to-esther',
  70: 'wisdom-of-solomon',
  71: 'sirach',
  72: 'baruch',
  73: 'letter-of-jeremiah',
  74: 'prayer-of-azariah',
  75: 'susanna',
  76: 'bel-and-the-dragon',
  77: '1-maccabees',
  78: '2-maccabees',
  79: '1-esdras',
  80: 'prayer-of-manasseh',
  81: '2-esdras',
};

// Reverse mapping: slug to book ID
export const SLUG_TO_BOOK_ID: Record<string, number> = Object.entries(BOOK_SLUGS).reduce(
  (acc, [id, slug]) => {
    acc[slug] = parseInt(id);
    return acc;
  },
  {} as Record<string, number>
);

/**
 * Get URL slug for a book ID
 */
export function getBookSlug(bookId: number): string {
  return BOOK_SLUGS[bookId] || 'genesis';
}

/**
 * Get book ID from URL slug
 */
export function getBookIdFromSlug(slug: string): number | null {
  const normalizedSlug = slug.toLowerCase().trim();
  return SLUG_TO_BOOK_ID[normalizedSlug] || null;
}

/**
 * Generate URL path for a scripture reference
 */
export function getScripturePath(bookId: number, chapter: number, verse?: number): string {
  const bookSlug = getBookSlug(bookId);
  if (verse) {
    return `/${bookSlug}/${chapter}/${verse}`;
  }
  return `/${bookSlug}/${chapter}`;
}

/**
 * Parse scripture reference from URL params
 */
export interface ScriptureParams {
  bookId: number;
  chapter: number;
  verse?: number;
}

export function parseScriptureParams(
  bookParam?: string,
  chapterParam?: string,
  verseParam?: string
): ScriptureParams | null {
  if (!bookParam) return null;

  const bookId = getBookIdFromSlug(bookParam);
  if (!bookId) return null;

  const chapter = chapterParam ? parseInt(chapterParam) : 1;
  if (isNaN(chapter) || chapter < 1) return null;

  // Validate chapter is within book's range
  const book = BIBLE_BOOKS.find(b => b.id === bookId);
  if (!book) return null;

  const startChapter = book.startChapter || 1;
  const maxChapter = startChapter + book.chapters - 1;
  if (chapter < startChapter || chapter > maxChapter) {
    return { bookId, chapter: startChapter }; // Default to first chapter if invalid
  }

  const verse = verseParam ? parseInt(verseParam) : undefined;

  return {
    bookId,
    chapter,
    verse: verse && !isNaN(verse) && verse > 0 ? verse : undefined,
  };
}

/**
 * Get a formatted reference string for display
 */
export function getDisplayReference(bookId: number, chapter: number, verse?: number): string {
  const book = BIBLE_BOOKS.find(b => b.id === bookId);
  if (!book) return '';

  if (verse) {
    return `${book.name} ${chapter}:${verse}`;
  }
  return `${book.name} ${chapter}`;
}
