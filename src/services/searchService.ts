import { BIBLE_BOOKS } from '../types/bible';
import { bibleService } from './bibleService';

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

interface SearchIndex {
  [word: string]: Array<{
    bookId: number;
    chapter: number;
    verse: number;
  }>;
}

export class SearchService {
  private searchIndex: SearchIndex | null = null;
  private verseCache: Map<string, string> = new Map();
  private indexingInProgress = false;
  private indexingPromise: Promise<void> | null = null;
  private abortController: AbortController | null = null;

  /**
   * Build search index in the background
   * This indexes all verses for fast searching
   */
  async buildSearchIndex(): Promise<void> {
    // If already indexing, return the existing promise
    if (this.indexingInProgress && this.indexingPromise) {
      return this.indexingPromise;
    }

    // If index already exists, return immediately
    if (this.searchIndex) {
      return Promise.resolve();
    }

    this.indexingInProgress = true;
    this.abortController = new AbortController();

    this.indexingPromise = (async () => {
      const index: SearchIndex = {};
      const cache = new Map<string, string>();

      console.log('Starting search index build...');
      const startTime = performance.now();

      try {
        for (const book of BIBLE_BOOKS) {
          if (this.abortController?.signal.aborted) {
            throw new Error('Indexing aborted');
          }

          for (let chapter = 1; chapter <= book.chapters; chapter++) {
            try {
              const chapterData = await bibleService.loadChapter(book.id, chapter);

              chapterData.kjvVerses.forEach(verse => {
                const cacheKey = `${book.id}:${chapter}:${verse.num}`;
                cache.set(cacheKey, verse.text);

                // Index each word in the verse
                const words = verse.text.toLowerCase()
                  .replace(/[^\w\s]/g, '') // Remove punctuation
                  .split(/\s+/)
                  .filter(w => w.length > 0);

                words.forEach(word => {
                  if (!index[word]) {
                    index[word] = [];
                  }
                  index[word].push({
                    bookId: book.id,
                    chapter,
                    verse: verse.num
                  });
                });
              });
            } catch (error) {
              console.error(`Error indexing ${book.name} ${chapter}:`, error);
            }
          }
        }

        this.searchIndex = index;
        this.verseCache = cache;

        const endTime = performance.now();
        console.log(`Search index built in ${((endTime - startTime) / 1000).toFixed(2)}s`);
        console.log(`Indexed ${Object.keys(index).length} unique words`);
        console.log(`Cached ${cache.size} verses`);
      } finally {
        this.indexingInProgress = false;
        this.indexingPromise = null;
        this.abortController = null;
      }
    })();

    return this.indexingPromise;
  }

  /**
   * Cancel ongoing index building
   */
  cancelIndexing(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Fast search using the index - returns results with total count
   */
  async searchIndexed(query: string, maxResults: number = 100): Promise<SearchResponse> {
    // Wait for indexing to complete if in progress
    if (this.indexingInProgress && this.indexingPromise) {
      await this.indexingPromise;
    }

    // If no index, fall back to sequential search
    if (!this.searchIndex) {
      console.warn('Search index not available, using sequential search');
      return this.searchSequential(query, maxResults);
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
      if (this.searchIndex![word]) {
        this.searchIndex![word].forEach(loc => {
          matches.add(`${loc.bookId}:${loc.chapter}:${loc.verse}`);
        });
      }

      // Partial word match (for words that start with the query word)
      Object.keys(this.searchIndex!).forEach(indexedWord => {
        if (indexedWord.startsWith(word) || indexedWord.includes(word)) {
          this.searchIndex![indexedWord].forEach(loc => {
            matches.add(`${loc.bookId}:${loc.chapter}:${loc.verse}`);
          });
        }
      });

      return matches;
    });

    // Intersect all sets to find verses containing all words
    const intersection = verseSets.reduce((acc, set) => {
      if (acc.size === 0) return set;
      const accArray = Array.from(acc);
      return new Set(accArray.filter(x => set.has(x)));
    });

    // Build all matching results first to get total count
    const allMatchingResults: SearchResult[] = [];
    const verseKeys = Array.from(intersection);

    for (const verseKey of verseKeys) {
      const text = this.verseCache.get(verseKey);
      if (!text) continue;

      // Verify the verse actually contains the full query (case-insensitive)
      if (!text.toLowerCase().includes(queryLower)) {
        // Check if it contains all words
        const containsAllWords = queryWords.every(word =>
          text.toLowerCase().includes(word)
        );
        if (!containsAllWords) continue;
      }

      const [bookId, chapter, verse] = verseKey.split(':').map(Number);
      const book = BIBLE_BOOKS.find(b => b.id === bookId);

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
   * Sequential search (fallback when index not available)
   * Limited to first N results for performance
   */
  async searchSequential(query: string, maxResults: number = 50): Promise<SearchResponse> {
    const results: SearchResult[] = [];
    const searchLower = query.toLowerCase();
    let totalFound = 0;

    for (const book of BIBLE_BOOKS) {
      for (let chapter = 1; chapter <= book.chapters; chapter++) {
        try {
          const chapterData = await bibleService.loadChapter(book.id, chapter);
          chapterData.kjvVerses.forEach(verse => {
            if (verse.text.toLowerCase().includes(searchLower)) {
              totalFound++;
              if (results.length < maxResults) {
                results.push({
                  bookId: book.id,
                  bookName: book.name,
                  chapterNum: chapter,
                  verseNum: verse.num,
                  text: verse.text,
                });
              }
            }
          });
        } catch (error) {
          console.error(`Error searching ${book.name} ${chapter}:`, error);
        }
      }
    }

    return {
      results,
      totalCount: totalFound,
      hasMore: totalFound > results.length
    };
  }

  /**
   * Main search method - returns SearchResponse with results and total count
   */
  async search(query: string, maxResults: number = 100): Promise<SearchResponse> {
    if (!query || query.trim().length === 0) {
      return { results: [], totalCount: 0, hasMore: false };
    }

    // Use indexed search if available, otherwise sequential
    if (this.searchIndex) {
      return this.searchIndexed(query, maxResults);
    } else {
      return this.searchSequential(query, maxResults);
    }
  }

  /**
   * Search for all results (no limit) - useful for "View All" functionality
   */
  async searchAll(query: string): Promise<SearchResponse> {
    return this.search(query, 0); // 0 means no limit
  }

  /**
   * Check if index is ready
   */
  isIndexReady(): boolean {
    return this.searchIndex !== null;
  }

  /**
   * Get indexing progress
   */
  isIndexing(): boolean {
    return this.indexingInProgress;
  }
}

export const searchService = new SearchService();

// Start building index when the app loads (non-blocking)
if (typeof window !== 'undefined') {
  // Delay index building slightly to not block initial page load
  setTimeout(() => {
    searchService.buildSearchIndex().catch(err => {
      console.error('Failed to build search index:', err);
    });
  }, 2000);
}
