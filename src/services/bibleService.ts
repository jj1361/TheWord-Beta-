import { Chapter, BIBLE_BOOKS, KJVVerse } from '../types/bible';
import { XMLParser } from '../utils/xmlParser';
import { apocryphaService } from './apocryphaService';
import { kjvStrongsService } from './kjvStrongsService';
import { PATHS } from '../config/paths';
import { TranslationId, TAGALOG_BOOK_NAMES, getTranslationById } from '../types/translation';

// Cache for loaded translation data
interface TranslationCache {
  [translationId: string]: {
    [bookId: number]: {
      bookName: string;
      chapters: {
        [chapterNum: number]: Array<{ num: number; text: string }>;
      };
    };
  };
}

export class BibleService {
  private basePath: string;
  private translationCache: TranslationCache = {};
  private loadingPromises: Map<string, Promise<void>> = new Map();

  constructor(basePath: string = PATHS.BIBLE_DATA) {
    this.basePath = basePath;
  }

  private getBookFolder(bookId: number): string {
    const book = BIBLE_BOOKS.find(b => b.id === bookId);
    if (!book) throw new Error(`Book with id ${bookId} not found`);

    const paddedId = bookId.toString().padStart(2, '0');
    return `${paddedId}-${book.name}`;
  }

  private getChapterFileName(chapterNum: number): string {
    return `chapter-${chapterNum.toString().padStart(3, '0')}.xml`;
  }

  /**
   * Load a translation's book data (lazy loading per book)
   */
  private async loadTranslationBook(translationId: TranslationId, bookId: number): Promise<void> {
    const cacheKey = `${translationId}-${bookId}`;

    // Return existing promise if loading is in progress
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    // Check if already cached
    if (this.translationCache[translationId]?.[bookId]) {
      return;
    }

    const loadPromise = (async () => {
      try {
        const paddedBookId = bookId.toString().padStart(2, '0');
        const response = await fetch(`${PATHS.TRANSLATIONS}/${translationId}/books/book-${paddedBookId}.json`);

        if (!response.ok) {
          throw new Error(`Failed to load ${translationId} book ${bookId}`);
        }

        const bookData = await response.json();

        // Initialize cache structure
        if (!this.translationCache[translationId]) {
          this.translationCache[translationId] = {};
        }

        this.translationCache[translationId][bookId] = bookData;
      } finally {
        this.loadingPromises.delete(cacheKey);
      }
    })();

    this.loadingPromises.set(cacheKey, loadPromise);
    return loadPromise;
  }

  /**
   * Load chapter for a specific translation
   */
  async loadChapter(bookId: number, chapterNum: number, translationId: TranslationId = 'kjv'): Promise<Chapter> {
    // For KJV, use the original XML-based loading
    if (translationId === 'kjv') {
      return this.loadKJVChapter(bookId, chapterNum);
    }

    // For other translations, load from JSON
    return this.loadTranslationChapter(bookId, chapterNum, translationId);
  }

  /**
   * Load chapter from KJV (original XML format)
   */
  private async loadKJVChapter(bookId: number, chapterNum: number): Promise<Chapter> {
    const book = BIBLE_BOOKS.find(b => b.id === bookId);
    if (!book) throw new Error(`Book with id ${bookId} not found`);

    // Check if this is an Apocrypha book
    if (book.isApocrypha) {
      const apocryphaChapter = await apocryphaService.loadChapter(bookId, chapterNum);
      if (apocryphaChapter) {
        return apocryphaChapter;
      }
      throw new Error(`Failed to load Apocrypha chapter: ${book.name} ${chapterNum}`);
    }

    const bookFolder = this.getBookFolder(bookId);
    const chapterFile = this.getChapterFileName(chapterNum);

    try {
      const kjvPath = `${this.basePath}/KJV/${bookFolder}/${chapterFile}`;
      const kjvResponse = await fetch(kjvPath);
      const kjvXml = await kjvResponse.text();
      const kjvVerses = XMLParser.parseKJVChapter(kjvXml);

      let kjvsVerses;
      let interlinearVerses;

      // Use CSV-based Strong's data instead of XML (fixes text errors in XML files)
      try {
        kjvsVerses = await kjvStrongsService.getChapter(bookId, chapterNum);
      } catch (error) {
        console.warn(`Could not load KJVs from CSV for ${book.name} ${chapterNum}`);
      }

      try {
        const interlinearPath = `${this.basePath}/Interlinear/${bookFolder}/${chapterFile}`;
        const interlinearResponse = await fetch(interlinearPath);
        const interlinearXml = await interlinearResponse.text();
        interlinearVerses = XMLParser.parseInterlinearChapter(interlinearXml);
      } catch (error) {
        console.warn(`Could not load Interlinear for ${book.name} ${chapterNum}`);
      }

      return {
        bookName: book.name,
        bookId,
        chapterNum,
        kjvVerses,
        kjvsVerses,
        interlinearVerses,
      };
    } catch (error) {
      throw new Error(`Failed to load chapter: ${error}`);
    }
  }

  /**
   * Load chapter from a non-KJV translation (JSON format)
   */
  private async loadTranslationChapter(
    bookId: number,
    chapterNum: number,
    translationId: TranslationId
  ): Promise<Chapter> {
    // Load the book data if not cached
    await this.loadTranslationBook(translationId, bookId);

    const bookData = this.translationCache[translationId]?.[bookId];
    if (!bookData) {
      throw new Error(`Book ${bookId} not found in ${translationId} translation`);
    }

    const chapterData = bookData.chapters[chapterNum];
    if (!chapterData) {
      throw new Error(`Chapter ${chapterNum} not found in ${translationId} book ${bookId}`);
    }

    // Get the appropriate book name for this translation
    const bookName = this.getBookNameForTranslation(bookId, translationId);

    // Convert to KJVVerse format for compatibility
    const kjvVerses: KJVVerse[] = chapterData.map(v => ({
      num: v.num,
      text: v.text
    }));

    return {
      bookName,
      bookId,
      chapterNum,
      kjvVerses,
      // Non-KJV translations don't have Strong's or interlinear data
      kjvsVerses: undefined,
      interlinearVerses: undefined,
    };
  }

  /**
   * Get appropriate book name for a translation
   */
  private getBookNameForTranslation(bookId: number, translationId: TranslationId): string {
    if (translationId === 'tagalog') {
      return TAGALOG_BOOK_NAMES[bookId] || BIBLE_BOOKS.find(b => b.id === bookId)?.name || `Book ${bookId}`;
    }

    // Default to English book names
    return BIBLE_BOOKS.find(b => b.id === bookId)?.name || `Book ${bookId}`;
  }

  /**
   * Check if a translation has a specific book
   */
  async hasBook(bookId: number, translationId: TranslationId): Promise<boolean> {
    if (translationId === 'kjv') {
      const book = BIBLE_BOOKS.find(b => b.id === bookId);
      return !!book;
    }

    try {
      await this.loadTranslationBook(translationId, bookId);
      return !!this.translationCache[translationId]?.[bookId];
    } catch {
      return false;
    }
  }

  /**
   * Get translation metadata
   */
  getTranslationInfo(translationId: TranslationId) {
    return getTranslationById(translationId);
  }

  async searchBible(searchText: string): Promise<Array<{
    bookId: number;
    bookName: string;
    chapterNum: number;
    verseNum: number;
    text: string;
  }>> {
    const results: Array<{
      bookId: number;
      bookName: string;
      chapterNum: number;
      verseNum: number;
      text: string;
    }> = [];

    const searchLower = searchText.toLowerCase();

    // Filter out Apocrypha from main search (optional - you can include them if desired)
    const booksToSearch = BIBLE_BOOKS.filter(b => !b.isApocrypha);

    for (const book of booksToSearch) {
      for (let chapter = 1; chapter <= book.chapters; chapter++) {
        try {
          const chapterData = await this.loadChapter(book.id, chapter);
          chapterData.kjvVerses.forEach(verse => {
            if (verse.text.toLowerCase().includes(searchLower)) {
              results.push({
                bookId: book.id,
                bookName: book.name,
                chapterNum: chapter,
                verseNum: verse.num,
                text: verse.text,
              });
            }
          });
        } catch (error) {
          console.error(`Error searching ${book.name} ${chapter}:`, error);
        }
      }
    }

    return results;
  }
}

export const bibleService = new BibleService();
