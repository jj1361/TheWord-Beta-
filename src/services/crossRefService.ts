/**
 * Cross-Reference Service
 * Loads and queries the Treasury of Scripture Knowledge (TSK) cross-reference data
 */

interface CrossReference {
  bookId: number;
  chapter: number;
  verse: number;
  verseEnd?: number;
}

interface CrossRefEntry {
  order: number;
  word: string;
  refs: CrossReference[];
}

// Book ID to name mapping
const BOOK_ID_TO_NAME: Record<number, string> = {
  1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
  6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
  11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles', 15: 'Ezra',
  16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalms', 20: 'Proverbs',
  21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah', 24: 'Jeremiah', 25: 'Lamentations',
  26: 'Ezekiel', 27: 'Daniel', 28: 'Hosea', 29: 'Joel', 30: 'Amos',
  31: 'Obadiah', 32: 'Jonah', 33: 'Micah', 34: 'Nahum', 35: 'Habakkuk',
  36: 'Zephaniah', 37: 'Haggai', 38: 'Zechariah', 39: 'Malachi',
  40: 'Matthew', 41: 'Mark', 42: 'Luke', 43: 'John', 44: 'Acts',
  45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians', 48: 'Galatians', 49: 'Ephesians',
  50: 'Philippians', 51: 'Colossians', 52: '1 Thessalonians', 53: '2 Thessalonians', 54: '1 Timothy',
  55: '2 Timothy', 56: 'Titus', 57: 'Philemon', 58: 'Hebrews', 59: 'James',
  60: '1 Peter', 61: '2 Peter', 62: '1 John', 63: '2 John', 64: '3 John',
  65: 'Jude', 66: 'Revelation'
};

// Cross-reference index type
type CrossRefIndex = Record<string, CrossRefEntry[]>;

class CrossRefService {
  private index: CrossRefIndex | null = null;
  private loading: Promise<void> | null = null;

  /**
   * Load the cross-reference index
   */
  async loadIndex(): Promise<void> {
    if (this.index) return;
    if (this.loading) return this.loading;

    this.loading = (async () => {
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/crossref-index.json`);
        if (!response.ok) {
          throw new Error(`Failed to load cross-reference index: ${response.status}`);
        }
        this.index = await response.json();
        console.log('Cross-reference index loaded');
      } catch (error) {
        console.error('Error loading cross-reference index:', error);
        this.index = {};
      }
    })();

    return this.loading;
  }

  /**
   * Get cross-references for a specific verse
   */
  async getCrossRefs(bookId: number, chapter: number, verse: number): Promise<CrossRefEntry[]> {
    await this.loadIndex();
    if (!this.index) return [];

    const key = `${bookId}:${chapter}:${verse}`;
    return this.index[key] || [];
  }

  /**
   * Get all cross-references for a chapter
   */
  async getChapterCrossRefs(bookId: number, chapter: number): Promise<Map<number, CrossRefEntry[]>> {
    await this.loadIndex();
    const result = new Map<number, CrossRefEntry[]>();

    if (!this.index) return result;

    const prefix = `${bookId}:${chapter}:`;
    for (const key of Object.keys(this.index)) {
      if (key.startsWith(prefix)) {
        const verse = parseInt(key.split(':')[2], 10);
        result.set(verse, this.index[key]);
      }
    }

    return result;
  }

  /**
   * Format a cross-reference for display
   */
  formatReference(ref: CrossReference): string {
    const bookName = BOOK_ID_TO_NAME[ref.bookId] || `Book ${ref.bookId}`;
    if (ref.verseEnd && ref.verseEnd !== ref.verse) {
      return `${bookName} ${ref.chapter}:${ref.verse}-${ref.verseEnd}`;
    }
    return `${bookName} ${ref.chapter}:${ref.verse}`;
  }

  /**
   * Format a cross-reference as a short reference
   */
  formatShortReference(ref: CrossReference): string {
    const bookName = this.getShortBookName(ref.bookId);
    if (ref.verseEnd && ref.verseEnd !== ref.verse) {
      return `${bookName} ${ref.chapter}:${ref.verse}-${ref.verseEnd}`;
    }
    return `${bookName} ${ref.chapter}:${ref.verse}`;
  }

  /**
   * Get short book name
   */
  private getShortBookName(bookId: number): string {
    const shortNames: Record<number, string> = {
      1: 'Gen', 2: 'Exo', 3: 'Lev', 4: 'Num', 5: 'Deu',
      6: 'Jos', 7: 'Jdg', 8: 'Rut', 9: '1Sa', 10: '2Sa',
      11: '1Ki', 12: '2Ki', 13: '1Ch', 14: '2Ch', 15: 'Ezr',
      16: 'Neh', 17: 'Est', 18: 'Job', 19: 'Psa', 20: 'Pro',
      21: 'Ecc', 22: 'Son', 23: 'Isa', 24: 'Jer', 25: 'Lam',
      26: 'Eze', 27: 'Dan', 28: 'Hos', 29: 'Joe', 30: 'Amo',
      31: 'Oba', 32: 'Jon', 33: 'Mic', 34: 'Nah', 35: 'Hab',
      36: 'Zep', 37: 'Hag', 38: 'Zec', 39: 'Mal',
      40: 'Mat', 41: 'Mar', 42: 'Luk', 43: 'Joh', 44: 'Act',
      45: 'Rom', 46: '1Co', 47: '2Co', 48: 'Gal', 49: 'Eph',
      50: 'Php', 51: 'Col', 52: '1Th', 53: '2Th', 54: '1Ti',
      55: '2Ti', 56: 'Tit', 57: 'Phm', 58: 'Heb', 59: 'Jas',
      60: '1Pe', 61: '2Pe', 62: '1Jo', 63: '2Jo', 64: '3Jo',
      65: 'Jud', 66: 'Rev'
    };
    return shortNames[bookId] || BOOK_ID_TO_NAME[bookId] || `${bookId}`;
  }

  /**
   * Get book name from ID
   */
  getBookName(bookId: number): string {
    return BOOK_ID_TO_NAME[bookId] || `Book ${bookId}`;
  }

  /**
   * Check if cross-references are loaded
   */
  isLoaded(): boolean {
    return this.index !== null;
  }

  /**
   * Get total count of cross-reference entries
   */
  getTotalCount(): number {
    if (!this.index) return 0;
    return Object.keys(this.index).length;
  }
}

export const crossRefService = new CrossRefService();
export type { CrossReference, CrossRefEntry };
