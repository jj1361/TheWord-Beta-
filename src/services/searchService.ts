import { PATHS } from '../config/paths';
import { getBookById } from '../utils/bookLookup';
import { TranslationId, TAGALOG_BOOK_NAMES, BRENTON_BOOK_NAMES } from '../types/translation';

export interface SearchResult {
  bookId: number;
  bookName: string;
  chapterNum: number;
  verseNum: number;
  text: string;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  hasMore: boolean;
}

// Pre-built index structure (compact format from build script)
interface PrebuiltIndex {
  version: number;
  generatedAt: string;
  stats: {
    totalVerses: number;
    totalChapters: number;
    uniqueWords: number;
    prefixCount: number;
  };
  wordIndex: { [word: string]: Array<[number, number, number]> }; // [bookId, chapter, verse]
  verseCache: { [key: string]: string }; // "bookId:chapter:verse" -> text
  prefixIndex: { [prefix: string]: string[] }; // prefix -> words
}

// Cache for translation data used in search
interface TranslationSearchCache {
  [translationId: string]: {
    [bookId: number]: {
      bookName: string;
      chapters: {
        [chapterNum: number]: Array<{ num: number; text: string }>;
      };
    };
  };
}

export class SearchService {
  private prebuiltIndex: PrebuiltIndex | null = null;
  private indexLoading = false;
  private indexLoadPromise: Promise<void> | null = null;
  private translationCache: TranslationSearchCache = {};
  private translationLoadPromises: Map<string, Promise<void>> = new Map();

  /**
   * Load the pre-built search index from JSON file
   * This is MUCH faster than building at runtime
   */
  async loadPrebuiltIndex(): Promise<void> {
    // Already loaded
    if (this.prebuiltIndex) {
      return;
    }

    // Already loading
    if (this.indexLoading && this.indexLoadPromise) {
      return this.indexLoadPromise;
    }

    this.indexLoading = true;
    console.log('Loading pre-built search index...');
    const startTime = performance.now();

    this.indexLoadPromise = (async () => {
      try {
        const response = await fetch(PATHS.SEARCH_INDEX);
        if (!response.ok) {
          throw new Error(`Failed to load search index: ${response.status}`);
        }

        this.prebuiltIndex = await response.json();

        const endTime = performance.now();
        console.log(`Search index loaded in ${((endTime - startTime) / 1000).toFixed(2)}s`);
        console.log(`Index stats:`, this.prebuiltIndex?.stats);
      } catch (error) {
        console.error('Error loading pre-built search index:', error);
        throw error;
      } finally {
        this.indexLoading = false;
        this.indexLoadPromise = null;
      }
    })();

    return this.indexLoadPromise;
  }

  /**
   * Load translation data for searching
   */
  private async loadTranslationForSearch(translationId: TranslationId): Promise<void> {
    if (translationId === 'kjv') return; // KJV uses pre-built index

    const cacheKey = translationId;

    // Already loaded
    if (this.translationCache[cacheKey]) return;

    // Already loading
    if (this.translationLoadPromises.has(cacheKey)) {
      return this.translationLoadPromises.get(cacheKey);
    }

    const loadPromise = (async () => {
      try {
        // Load the full translation file for faster searching
        const response = await fetch(`${PATHS.TRANSLATIONS}/${translationId}/${translationId}-bible.json`);
        if (!response.ok) {
          throw new Error(`Failed to load ${translationId} translation for search`);
        }

        const data = await response.json();
        this.translationCache[cacheKey] = data;
        console.log(`Loaded ${translationId} translation for search`);
      } finally {
        this.translationLoadPromises.delete(cacheKey);
      }
    })();

    this.translationLoadPromises.set(cacheKey, loadPromise);
    return loadPromise;
  }

  /**
   * Get book name for a translation
   */
  private getBookNameForTranslation(bookId: number, translationId: TranslationId): string {
    if (translationId === 'tagalog') {
      return TAGALOG_BOOK_NAMES[bookId] || getBookById(bookId)?.name || `Book ${bookId}`;
    }
    if (translationId === 'brenton') {
      return BRENTON_BOOK_NAMES[bookId] || getBookById(bookId)?.name || `Book ${bookId}`;
    }
    return getBookById(bookId)?.name || `Book ${bookId}`;
  }

  /**
   * Fast search using the pre-built index (for KJV) or translation data
   */
  async search(query: string, maxResults: number = 100, translationId: TranslationId = 'kjv'): Promise<SearchResponse> {
    if (!query || query.trim().length === 0) {
      return { results: [], totalCount: 0, hasMore: false };
    }

    // For non-KJV translations, use translation-specific search
    if (translationId !== 'kjv') {
      return this.searchTranslation(query, maxResults, translationId);
    }

    // Ensure index is loaded
    if (!this.prebuiltIndex) {
      await this.loadPrebuiltIndex();
    }

    if (!this.prebuiltIndex) {
      console.error('Search index not available');
      return { results: [], totalCount: 0, hasMore: false };
    }

    const queryLower = query.toLowerCase().trim();
    const queryWords = queryLower
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 0);

    if (queryWords.length === 0) {
      return { results: [], totalCount: 0, hasMore: false };
    }

    // Find verses that contain all query words
    const verseSets: Set<string>[] = queryWords.map(word => {
      const matches = new Set<string>();

      // Exact word match
      const exactMatches = this.prebuiltIndex!.wordIndex[word];
      if (exactMatches) {
        for (const [bookId, chapter, verse] of exactMatches) {
          matches.add(`${bookId}:${chapter}:${verse}`);
        }
      }

      // Fast prefix-based partial matching using prefix index
      if (word.length >= 2) {
        const prefixLen = Math.min(4, word.length);
        const prefix = word.substring(0, prefixLen);
        const matchingWords = this.prebuiltIndex!.prefixIndex[prefix];

        if (matchingWords) {
          for (const indexedWord of matchingWords) {
            if (indexedWord.startsWith(word) && indexedWord !== word) {
              const locations = this.prebuiltIndex!.wordIndex[indexedWord];
              if (locations) {
                for (const [bookId, chapter, verse] of locations) {
                  matches.add(`${bookId}:${chapter}:${verse}`);
                }
              }
            }
          }
        }
      }

      return matches;
    });

    // Intersect all sets to find verses containing all words
    let intersection: Set<string>;
    if (verseSets.length === 0) {
      intersection = new Set();
    } else if (verseSets.length === 1) {
      intersection = verseSets[0];
    } else {
      // Start with smallest set for efficiency
      const sortedSets = [...verseSets].sort((a, b) => a.size - b.size);
      intersection = sortedSets[0];
      for (let i = 1; i < sortedSets.length && intersection.size > 0; i++) {
        const nextSet = sortedSets[i];
        intersection = new Set(Array.from(intersection).filter(x => nextSet.has(x)));
      }
    }

    // Build results - early exit when we have enough for display
    const allMatchingResults: SearchResult[] = [];
    const verseKeys = Array.from(intersection);

    for (const verseKey of verseKeys) {
      const text = this.prebuiltIndex.verseCache[verseKey];
      if (!text) continue;

      // Verify the verse actually contains the full query (case-insensitive)
      const textLower = text.toLowerCase();
      if (!textLower.includes(queryLower)) {
        // Check if it contains all words
        const containsAllWords = queryWords.every(word => textLower.includes(word));
        if (!containsAllWords) continue;
      }

      const [bookId, chapter, verse] = verseKey.split(':').map(Number);
      const book = getBookById(bookId);

      if (book) {
        allMatchingResults.push({
          bookId,
          bookName: book.name,
          chapterNum: chapter,
          verseNum: verse,
          text
        });
      }
    }

    // Sort results by book order, then chapter, then verse
    allMatchingResults.sort((a, b) => {
      if (a.bookId !== b.bookId) return a.bookId - b.bookId;
      if (a.chapterNum !== b.chapterNum) return a.chapterNum - b.chapterNum;
      return a.verseNum - b.verseNum;
    });

    const totalCount = allMatchingResults.length;
    const results = maxResults > 0 ? allMatchingResults.slice(0, maxResults) : allMatchingResults;

    return {
      results,
      totalCount,
      hasMore: totalCount > results.length
    };
  }

  /**
   * Search within a non-KJV translation
   */
  private async searchTranslation(
    query: string,
    maxResults: number,
    translationId: TranslationId
  ): Promise<SearchResponse> {
    // Load translation data
    await this.loadTranslationForSearch(translationId);

    const translationData = this.translationCache[translationId];
    if (!translationData) {
      console.error(`Translation ${translationId} not available for search`);
      return { results: [], totalCount: 0, hasMore: false };
    }

    const queryLower = query.toLowerCase().trim();
    const queryWords = queryLower
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 0);

    if (queryWords.length === 0) {
      return { results: [], totalCount: 0, hasMore: false };
    }

    const allMatchingResults: SearchResult[] = [];

    // Iterate through all books
    for (const bookIdStr of Object.keys(translationData)) {
      const bookId = parseInt(bookIdStr, 10);
      const bookData = translationData[bookId];

      if (!bookData || !bookData.chapters) continue;

      // Iterate through all chapters
      for (const chapterNumStr of Object.keys(bookData.chapters)) {
        const chapterNum = parseInt(chapterNumStr, 10);
        const verses = bookData.chapters[chapterNum];

        if (!verses) continue;

        // Search each verse
        for (const verse of verses) {
          const textLower = verse.text.toLowerCase();

          // Check if verse contains all query words
          const containsAllWords = queryWords.every(word => textLower.includes(word));
          if (!containsAllWords) continue;

          allMatchingResults.push({
            bookId,
            bookName: this.getBookNameForTranslation(bookId, translationId),
            chapterNum,
            verseNum: verse.num,
            text: verse.text
          });
        }
      }
    }

    // Sort results by book order, then chapter, then verse
    allMatchingResults.sort((a, b) => {
      if (a.bookId !== b.bookId) return a.bookId - b.bookId;
      if (a.chapterNum !== b.chapterNum) return a.chapterNum - b.chapterNum;
      return a.verseNum - b.verseNum;
    });

    const totalCount = allMatchingResults.length;
    const results = maxResults > 0 ? allMatchingResults.slice(0, maxResults) : allMatchingResults;

    return {
      results,
      totalCount,
      hasMore: totalCount > results.length
    };
  }

  /**
   * Search for all results (no limit) - useful for "View All" functionality
   */
  async searchAll(query: string, translationId: TranslationId = 'kjv'): Promise<SearchResponse> {
    return this.search(query, 0, translationId);
  }

  /**
   * Check if index is ready
   */
  isIndexReady(): boolean {
    return this.prebuiltIndex !== null;
  }

  /**
   * Check if index is loading
   */
  isIndexing(): boolean {
    return this.indexLoading;
  }

  /**
   * Get verse text by reference
   */
  async getVerseText(bookId: number, chapter: number, verse: number): Promise<string | null> {
    await this.loadPrebuiltIndex();
    if (!this.prebuiltIndex) return null;

    const key = `${bookId}:${chapter}:${verse}`;
    return this.prebuiltIndex.verseCache[key] || null;
  }

  /**
   * Get multiple verse texts at once
   */
  async getVerseTexts(refs: Array<{ bookId: number; chapter: number; verse: number }>): Promise<Map<string, string>> {
    await this.loadPrebuiltIndex();
    const result = new Map<string, string>();

    if (!this.prebuiltIndex) return result;

    for (const ref of refs) {
      const key = `${ref.bookId}:${ref.chapter}:${ref.verse}`;
      const text = this.prebuiltIndex.verseCache[key];
      if (text) {
        result.set(key, text);
      }
    }

    return result;
  }
}

export const searchService = new SearchService();

// Start loading index when the app loads (non-blocking)
if (typeof window !== 'undefined') {
  // Small delay to not block initial page render
  setTimeout(() => {
    searchService.loadPrebuiltIndex().catch(err => {
      console.error('Failed to load search index:', err);
    });
  }, 500);
}
