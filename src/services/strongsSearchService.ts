import { PATHS } from '../config/paths';
import { getBookById } from '../utils/bookLookup';

interface VerseReference {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  osisRef: string;
}

// Pre-built Strong's index structure
interface StrongsIndex {
  version: number;
  generatedAt: string;
  stats: {
    totalVerses: number;
    totalStrongsEntries: number;
    uniqueStrongsIds: number;
    hebrewIds: number;
    greekIds: number;
  };
  strongsIndex: { [strongsId: string]: Array<[number, number, number]> }; // [bookId, chapter, verse]
  verseTexts: { [key: string]: string }; // "bookId:chapter:verse" -> text
}

class StrongsSearchService {
  private prebuiltIndex: StrongsIndex | null = null;
  private indexLoading = false;
  private indexLoadPromise: Promise<void> | null = null;

  /**
   * Load the pre-built Strong's index from JSON file
   */
  async loadPrebuiltIndex(): Promise<void> {
    if (this.prebuiltIndex) {
      return;
    }

    if (this.indexLoading && this.indexLoadPromise) {
      return this.indexLoadPromise;
    }

    this.indexLoading = true;
    console.log('Loading pre-built Strong\'s index...');
    const startTime = performance.now();

    this.indexLoadPromise = (async () => {
      try {
        const response = await fetch(PATHS.STRONGS_INDEX);
        if (!response.ok) {
          throw new Error(`Failed to load Strong's index: ${response.status}`);
        }

        this.prebuiltIndex = await response.json();

        const endTime = performance.now();
        console.log(`Strong's index loaded in ${((endTime - startTime) / 1000).toFixed(2)}s`);
        console.log(`Index stats:`, this.prebuiltIndex?.stats);
      } catch (error) {
        console.error('Error loading pre-built Strong\'s index:', error);
        throw error;
      } finally {
        this.indexLoading = false;
        this.indexLoadPromise = null;
      }
    })();

    return this.indexLoadPromise;
  }

  /**
   * Normalize Strong's ID to include prefix (H or G)
   */
  private normalizeStrongsId(strongsId: string): string {
    const trimmed = strongsId.trim().toUpperCase();
    // If it already has a prefix, return it
    if (trimmed.match(/^[HG]\d+$/)) {
      return trimmed;
    }
    // If it's just a number, return as-is (will search both H and G)
    return trimmed;
  }

  /**
   * Search for all verses containing a specific Strong's number
   * Now uses pre-built index for instant results
   */
  async searchByStrongsId(strongsId: string): Promise<VerseReference[]> {
    // Ensure index is loaded
    if (!this.prebuiltIndex) {
      await this.loadPrebuiltIndex();
    }

    if (!this.prebuiltIndex) {
      console.error('Strong\'s index not available');
      return [];
    }

    const normalizedId = this.normalizeStrongsId(strongsId);
    const results: VerseReference[] = [];

    // Determine which IDs to search
    let idsToSearch: string[] = [];

    if (normalizedId.match(/^[HG]\d+$/)) {
      // Has prefix - search exact ID
      idsToSearch = [normalizedId];
    } else if (normalizedId.match(/^\d+$/)) {
      // Just a number - search both H and G versions
      idsToSearch = [`H${normalizedId}`, `G${normalizedId}`];
    } else {
      return results;
    }

    // Look up each ID in the index
    for (const searchId of idsToSearch) {
      const locations: Array<[number, number, number]> | undefined = this.prebuiltIndex.strongsIndex[searchId];
      if (!locations) continue;

      for (const [bookId, chapter, verse] of locations) {
        const verseKey = `${bookId}:${chapter}:${verse}`;
        const text = this.prebuiltIndex.verseTexts[verseKey] || '';
        const book = getBookById(bookId);

        if (book) {
          const osisRef = `${book.name.replace(/ /g, '')}.${chapter}.${verse}`;
          results.push({
            bookId,
            bookName: book.name,
            chapter,
            verse,
            text,
            osisRef,
          });
        }
      }
    }

    // Sort by book order, then chapter, then verse
    results.sort((a, b) => {
      if (a.bookId !== b.bookId) return a.bookId - b.bookId;
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.verse - b.verse;
    });

    return results;
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

export const strongsSearchService = new StrongsSearchService();

// Start loading index when the app loads (non-blocking)
if (typeof window !== 'undefined') {
  // Delay slightly to prioritize main search index
  setTimeout(() => {
    strongsSearchService.loadPrebuiltIndex().catch(err => {
      console.error('Failed to load Strong\'s index:', err);
    });
  }, 1000);
}
