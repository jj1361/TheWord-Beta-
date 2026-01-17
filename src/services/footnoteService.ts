/**
 * Footnote Service
 * Loads and queries 1611 KJV marginal notes (footnotes) data
 * Data is stored per-book for lazy loading
 */

import { PATHS } from '../config/paths';
import { FootnoteEntry, FootnoteType, BookFootnotes } from '../types/bible';

// Book ID to filename mapping (lowercase, no spaces)
const BOOK_ID_TO_FILENAME: Record<number, string> = {
  1: 'genesis', 2: 'exodus', 3: 'leviticus', 4: 'numbers', 5: 'deuteronomy',
  6: 'joshua', 7: 'judges', 8: 'ruth', 9: '1samuel', 10: '2samuel',
  11: '1kings', 12: '2kings', 13: '1chronicles', 14: '2chronicles', 15: 'ezra',
  16: 'nehemiah', 17: 'esther', 18: 'job', 19: 'psalms', 20: 'proverbs',
  21: 'ecclesiastes', 22: 'songofsolomon', 23: 'isaiah', 24: 'jeremiah', 25: 'lamentations',
  26: 'ezekiel', 27: 'daniel', 28: 'hosea', 29: 'joel', 30: 'amos',
  31: 'obadiah', 32: 'jonah', 33: 'micah', 34: 'nahum', 35: 'habakkuk',
  36: 'zephaniah', 37: 'haggai', 38: 'zechariah', 39: 'malachi',
  40: 'matthew', 41: 'mark', 42: 'luke', 43: 'john', 44: 'acts',
  45: 'romans', 46: '1corinthians', 47: '2corinthians', 48: 'galatians', 49: 'ephesians',
  50: 'philippians', 51: 'colossians', 52: '1thessalonians', 53: '2thessalonians', 54: '1timothy',
  55: '2timothy', 56: 'titus', 57: 'philemon', 58: 'hebrews', 59: 'james',
  60: '1peter', 61: '2peter', 62: '1john', 63: '2john', 64: '3john',
  65: 'jude', 66: 'revelation'
};

class FootnoteService {
  // Cache of loaded book footnotes: bookId -> BookFootnotes
  private cache: Map<number, BookFootnotes> = new Map();
  // Loading promises to prevent duplicate fetches
  private loading: Map<number, Promise<BookFootnotes | null>> = new Map();

  /**
   * Load footnotes for a specific book
   */
  async loadBook(bookId: number): Promise<BookFootnotes | null> {
    // Return from cache if available
    if (this.cache.has(bookId)) {
      return this.cache.get(bookId)!;
    }

    // Return existing loading promise if in progress
    if (this.loading.has(bookId)) {
      return this.loading.get(bookId)!;
    }

    const filename = BOOK_ID_TO_FILENAME[bookId];
    if (!filename) {
      console.warn(`No filename mapping for book ID ${bookId}`);
      return null;
    }

    const loadPromise = (async (): Promise<BookFootnotes | null> => {
      try {
        const response = await fetch(`${PATHS.FOOTNOTES}/${filename}.json`);
        if (!response.ok) {
          if (response.status === 404) {
            // No footnotes for this book - this is normal
            console.log(`No footnotes file for ${filename}`);
            return null;
          }
          throw new Error(`Failed to load footnotes: ${response.status}`);
        }
        const data: BookFootnotes = await response.json();
        this.cache.set(bookId, data);
        console.log(`Footnotes loaded for ${filename}`);
        return data;
      } catch (error) {
        console.error(`Error loading footnotes for ${filename}:`, error);
        return null;
      } finally {
        this.loading.delete(bookId);
      }
    })();

    this.loading.set(bookId, loadPromise);
    return loadPromise;
  }

  /**
   * Get footnotes for a specific verse
   */
  async getVerseFootnotes(bookId: number, chapter: number, verse: number): Promise<FootnoteEntry[]> {
    const bookData = await this.loadBook(bookId);
    if (!bookData) return [];

    const chapterData = bookData.chapters[chapter];
    if (!chapterData) return [];

    return chapterData[verse] || [];
  }

  /**
   * Get all footnotes for a chapter
   */
  async getChapterFootnotes(bookId: number, chapter: number): Promise<Map<number, FootnoteEntry[]>> {
    const result = new Map<number, FootnoteEntry[]>();
    const bookData = await this.loadBook(bookId);

    if (!bookData) return result;

    const chapterData = bookData.chapters[chapter];
    if (!chapterData) return result;

    for (const [verseStr, footnotes] of Object.entries(chapterData)) {
      const verse = parseInt(verseStr, 10);
      if (!isNaN(verse) && footnotes.length > 0) {
        result.set(verse, footnotes);
      }
    }

    return result;
  }

  /**
   * Check if a verse has any footnotes
   */
  async hasFootnotes(bookId: number, chapter: number, verse: number): Promise<boolean> {
    const footnotes = await this.getVerseFootnotes(bookId, chapter, verse);
    return footnotes.length > 0;
  }

  /**
   * Get footnote type label for display
   */
  getTypeLabel(type: FootnoteType): string {
    const labels: Record<FootnoteType, string> = {
      hebrew: 'Hebrew',
      greek: 'Greek',
      alternative: 'Or',
      meaning: 'Meaning',
      clarification: 'Note'
    };
    return labels[type] || 'Note';
  }

  /**
   * Get footnote type abbreviation for superscript
   */
  getTypeAbbrev(type: FootnoteType): string {
    const abbrevs: Record<FootnoteType, string> = {
      hebrew: 'H',
      greek: 'G',
      alternative: 'Or',
      meaning: '=',
      clarification: '†'
    };
    return abbrevs[type] || '†';
  }

  /**
   * Format a footnote for display
   */
  formatFootnote(footnote: FootnoteEntry): string {
    const typeLabel = this.getTypeLabel(footnote.type);
    return `${typeLabel}: ${footnote.note}`;
  }

  /**
   * Check if a book's footnotes are loaded
   */
  isBookLoaded(bookId: number): boolean {
    return this.cache.has(bookId);
  }

  /**
   * Preload footnotes for a book (useful for chapter navigation)
   */
  preloadBook(bookId: number): void {
    if (!this.cache.has(bookId) && !this.loading.has(bookId)) {
      this.loadBook(bookId);
    }
  }

  /**
   * Clear cache (useful for memory management)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get count of cached books
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

export const footnoteService = new FootnoteService();
export type { FootnoteEntry, FootnoteType };
