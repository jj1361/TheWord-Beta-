import { BIBLE_BOOKS } from '../types/bible';

export interface ParsedReference {
  bookId: number;
  bookName: string;
  chapter: number;
  verse?: number;
}

// Common book abbreviations mapping
const BOOK_ABBREVIATIONS: Record<string, number> = {
  // Old Testament
  'gen': 1, 'genesis': 1,
  'ex': 2, 'exo': 2, 'exod': 2, 'exodus': 2,
  'lev': 3, 'leviticus': 3,
  'num': 4, 'numbers': 4,
  'deut': 5, 'dt': 5, 'deuteronomy': 5,
  'josh': 6, 'jos': 6, 'joshua': 6,
  'judg': 7, 'jdg': 7, 'judges': 7,
  'ruth': 8,
  '1 sam': 9, '1sam': 9, '1 samuel': 9, '1samuel': 9,
  '2 sam': 10, '2sam': 10, '2 samuel': 10, '2samuel': 10,
  '1 kings': 11, '1kings': 11, '1 ki': 11, '1ki': 11,
  '2 kings': 12, '2kings': 12, '2 ki': 12, '2ki': 12,
  '1 chron': 13, '1chron': 13, '1 chronicles': 13, '1chronicles': 13, '1 chr': 13,
  '2 chron': 14, '2chron': 14, '2 chronicles': 14, '2chronicles': 14, '2 chr': 14,
  'ezra': 15,
  'neh': 16, 'nehemiah': 16,
  'esth': 17, 'esther': 17,
  'job': 18,
  'ps': 19, 'psa': 19, 'psalm': 19, 'psalms': 19,
  'prov': 20, 'proverbs': 20,
  'eccl': 21, 'ecc': 21, 'ecclesiastes': 21,
  'song': 22, 'sos': 22, 'song of solomon': 22, 'song of songs': 22,
  'isa': 23, 'isaiah': 23,
  'jer': 24, 'jeremiah': 24,
  'lam': 25, 'lamentations': 25,
  'ezek': 26, 'eze': 26, 'ezekiel': 26,
  'dan': 27, 'daniel': 27,
  'hos': 28, 'hosea': 28,
  'joel': 29,
  'amos': 30,
  'obad': 31, 'obadiah': 31,
  'jonah': 32,
  'mic': 33, 'micah': 33,
  'nah': 34, 'nahum': 34,
  'hab': 35, 'habakkuk': 35,
  'zeph': 36, 'zephaniah': 36,
  'hag': 37, 'haggai': 37,
  'zech': 38, 'zec': 38, 'zechariah': 38,
  'mal': 39, 'malachi': 39,

  // New Testament
  'matt': 40, 'mt': 40, 'matthew': 40,
  'mark': 41, 'mk': 41, 'mar': 41,
  'luke': 42, 'lk': 42, 'luk': 42,
  'john': 43, 'jn': 43, 'joh': 43,
  'acts': 44, 'act': 44,
  'rom': 45, 'romans': 45,
  '1 cor': 46, '1cor': 46, '1 corinthians': 46, '1corinthians': 46,
  '2 cor': 47, '2cor': 47, '2 corinthians': 47, '2corinthians': 47,
  'gal': 48, 'galatians': 48,
  'eph': 49, 'ephesians': 49,
  'phil': 50, 'php': 50, 'philippians': 50,
  'col': 51, 'colossians': 51,
  '1 thess': 52, '1thess': 52, '1 thessalonians': 52, '1thessalonians': 52,
  '2 thess': 53, '2thess': 53, '2 thessalonians': 53, '2thessalonians': 53,
  '1 tim': 54, '1tim': 54, '1 timothy': 54, '1timothy': 54,
  '2 tim': 55, '2tim': 55, '2 timothy': 55, '2timothy': 55,
  'titus': 56, 'tit': 56,
  'philem': 57, 'phm': 57, 'philemon': 57,
  'heb': 58, 'hebrews': 58,
  'james': 59, 'jas': 59, 'jam': 59,
  '1 pet': 60, '1pet': 60, '1 peter': 60, '1peter': 60,
  '2 pet': 61, '2pet': 61, '2 peter': 61, '2peter': 61,
  '1 john': 62, '1john': 62, '1 jn': 62, '1jn': 62,
  '2 john': 63, '2john': 63, '2 jn': 63, '2jn': 63,
  '3 john': 64, '3john': 64, '3 jn': 64, '3jn': 64,
  'jude': 65,
  'rev': 66, 'revelation': 66, 'revelations': 66,
};

/**
 * Parse a scripture reference string into book, chapter, and verse
 * Supports formats like:
 * - "John 3:16"
 * - "Genesis 1"
 * - "Gen 1:1"
 * - "1 Corinthians 13:4-7"
 * - "Psalm 23"
 * - "Rev 21:1"
 */
export function parseScriptureReference(input: string): ParsedReference | null {
  if (!input || typeof input !== 'string') return null;

  // Clean and normalize the input
  const normalized = input.trim().toLowerCase();

  // Pattern 1: Book Chapter:Verse (e.g., "John 3:16", "Gen 1:1")
  // Pattern 2: Book Chapter (e.g., "John 3", "Genesis 1")
  const refPattern = /^(.+?)\s+(\d+)(?::(\d+))?/;
  const match = normalized.match(refPattern);

  if (!match) return null;

  const bookPart = match[1].trim();
  const chapterStr = match[2];
  const verseStr = match[3];

  // Try to find the book by abbreviation or full name
  let bookId = BOOK_ABBREVIATIONS[bookPart];

  // If not found, try to match against full book names
  if (!bookId) {
    const book = BIBLE_BOOKS.find(b =>
      b.name.toLowerCase() === bookPart ||
      b.name.toLowerCase().startsWith(bookPart)
    );
    if (book) {
      bookId = book.id;
    }
  }

  if (!bookId) return null;

  const chapter = parseInt(chapterStr, 10);
  const verse = verseStr ? parseInt(verseStr, 10) : undefined;

  // Validate chapter exists for this book
  const book = BIBLE_BOOKS.find(b => b.id === bookId);
  if (!book || chapter < 1 || chapter > book.chapters) {
    return null;
  }

  return {
    bookId,
    bookName: book.name,
    chapter,
    verse,
  };
}

/**
 * Check if a string looks like a scripture reference
 * (as opposed to a search query)
 */
export function isScriptureReference(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  const normalized = input.trim().toLowerCase();

  // Check if it matches the pattern: "word(s) number(:number)?"
  const refPattern = /^[a-z0-9\s]+\s+\d+(?::\d+)?$/;
  if (!refPattern.test(normalized)) return false;

  // Try to parse it
  const parsed = parseScriptureReference(input);
  return parsed !== null;
}
