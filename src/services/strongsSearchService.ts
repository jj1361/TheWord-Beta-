import { BIBLE_BOOKS } from '../types/bible';
import { PATHS } from '../config/paths';

interface VerseReference {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  osisRef: string;
}

class StrongsSearchService {
  private cache: Map<string, VerseReference[]> = new Map();

  /**
   * Search for all verses containing a specific Strong's number
   */
  async searchByStrongsId(strongsId: string): Promise<VerseReference[]> {
    // Check cache first
    if (this.cache.has(strongsId)) {
      return this.cache.get(strongsId)!;
    }

    const results: VerseReference[] = [];
    const normalizedStrongsId = this.normalizeStrongsId(strongsId);

    try {
      // Determine which testament to search based on prefix
      const isOldTestament = normalizedStrongsId.startsWith('H');
      const isNewTestament = normalizedStrongsId.startsWith('G');

      // If no prefix, we'll search both testaments
      const booksToSearch = isOldTestament
        ? BIBLE_BOOKS.filter(b => b.id >= 1 && b.id <= 39)
        : isNewTestament
        ? BIBLE_BOOKS.filter(b => b.id >= 40 && b.id <= 66)
        : BIBLE_BOOKS.filter(b => b.id >= 1 && b.id <= 66); // Search all canonical books

      // Search through each book
      for (const book of booksToSearch) {
        for (let chapterNum = 1; chapterNum <= book.chapters; chapterNum++) {
          const chapterResults = await this.searchChapter(
            book.id,
            book.name,
            chapterNum,
            normalizedStrongsId
          );
          results.push(...chapterResults);
        }
      }

      // Cache the results
      this.cache.set(strongsId, results);
    } catch (error) {
      console.error('Error searching by Strong\'s ID:', error);
    }

    return results;
  }

  /**
   * Normalize Strong's ID to include prefix (H or G)
   */
  private normalizeStrongsId(strongsId: string): string {
    const trimmed = strongsId.trim();
    // If it already has a prefix, return it
    if (trimmed.match(/^[HG]\d+$/i)) {
      return trimmed.toUpperCase();
    }
    // If it's just a number, we can't determine the prefix
    // Return as-is and search both testaments
    return trimmed;
  }

  /**
   * Search a specific chapter for verses containing the Strong's ID
   */
  private async searchChapter(
    bookId: number,
    bookName: string,
    chapterNum: number,
    strongsId: string
  ): Promise<VerseReference[]> {
    const results: VerseReference[] = [];

    try {
      // Construct the path to the KJV chapter XML file
      const paddedBookId = String(bookId).padStart(2, '0');
      const bookFolder = `${paddedBookId}-${bookName.replace(/ /g, '-')}`;
      const chapterFile = `chapter-${String(chapterNum).padStart(3, '0')}.xml`;
      const xmlPath = `${PATHS.BIBLE_DATA}/KJVs/${bookFolder}/${chapterFile}`;

      // Fetch and parse the XML
      const response = await fetch(xmlPath);
      if (!response.ok) {
        // Chapter file doesn't exist, skip it
        return results;
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        console.error('XML parsing error:', parserError.textContent);
        return results;
      }

      // Find all verses in this chapter
      const verses = xmlDoc.querySelectorAll('verse');

      verses.forEach((verse) => {
        const verseNum = parseInt(verse.getAttribute('num') || '0', 10);

        // Check if any phrase in this verse has the matching Strong's ID
        const phrases = verse.querySelectorAll('phrase');
        let hasStrongsId = false;
        const phraseTexts: string[] = [];

        phrases.forEach((phrase) => {
          const phraseStrongs = phrase.getAttribute('strongs');
          const phraseText = phrase.textContent || '';
          phraseTexts.push(phraseText);

          // Check if this phrase matches the Strong's ID
          if (phraseStrongs) {
            // Normalize the Strong's ID from the phrase
            const normalizedPhraseStrongs = phraseStrongs.match(/^[HG]/)
              ? phraseStrongs
              : (bookId <= 39 ? 'H' : 'G') + phraseStrongs;

            // Remove prefix from search if needed for comparison
            const searchIdWithoutPrefix = strongsId.replace(/^[HG]/, '');
            const phraseIdWithoutPrefix = normalizedPhraseStrongs.replace(/^[HG]/, '');

            if (
              normalizedPhraseStrongs === strongsId ||
              phraseIdWithoutPrefix === searchIdWithoutPrefix
            ) {
              hasStrongsId = true;
            }
          }
        });

        if (hasStrongsId) {
          const verseText = phraseTexts.join(' ').trim();
          const osisRef = `${bookName.replace(/ /g, '')}.${chapterNum}.${verseNum}`;

          results.push({
            bookId,
            bookName,
            chapter: chapterNum,
            verse: verseNum,
            text: verseText,
            osisRef,
          });
        }
      });
    } catch (error) {
      // Silently fail for missing chapters
      // console.error(`Error loading chapter ${bookName} ${chapterNum}:`, error);
    }

    return results;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const strongsSearchService = new StrongsSearchService();
