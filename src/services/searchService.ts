import { BIBLE_BOOKS } from '../types/bible';
import { PATHS } from '../config/paths';

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

// Create a book lookup map for O(1) access
const BOOK_MAP = new Map<number, typeof BIBLE_BOOKS[0]>();
BIBLE_BOOKS.forEach(book => BOOK_MAP.set(book.id, book));

export class SearchService {
  private prebuiltIndex: PrebuiltIndex | null = null;
  private indexLoading = false;
  private indexLoadPromise: Promise<void> | null = null;

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
   * Fast search using the pre-built index
   */
  async search(query: string, maxResults: number = 100): Promise<SearchResponse> {
    if (!query || query.trim().length === 0) {
      return { results: [], totalCount: 0, hasMore: false };
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
      const book = BOOK_MAP.get(bookId);

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
   * Search for all results (no limit) - useful for "View All" functionality
   */
  async searchAll(query: string): Promise<SearchResponse> {
    return this.search(query, 0);
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
