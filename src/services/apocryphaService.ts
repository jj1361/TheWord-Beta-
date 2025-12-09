import { Chapter, KJVVerse, BIBLE_BOOKS } from '../types/bible';
import { PATHS } from '../config/paths';

export class ApocryphaService {
  private apocryphaData: Map<string, KJVVerse[]> = new Map();
  private dataLoaded = false;

  async loadApocryphaData(): Promise<void> {
    if (this.dataLoaded) return;

    try {
      const response = await fetch(`${PATHS.APOCRYPHA}/apodat.csv`);
      const csvText = await response.text();

      // Parse CSV: BookCode|Chapter|Verse|Text
      const lines = csvText.trim().split('\n');

      for (const line of lines) {
        const parts = line.split('|');
        if (parts.length < 4) continue;

        const [bookCode, chapterStr, verseStr, ...textParts] = parts;
        const chapter = parseInt(chapterStr, 10);
        const verseNum = parseInt(verseStr, 10);
        const text = textParts.join('|').trim(); // Rejoin in case text contains |

        const key = `${bookCode}:${chapter}`;

        if (!this.apocryphaData.has(key)) {
          this.apocryphaData.set(key, []);
        }

        const verses = this.apocryphaData.get(key)!;
        verses.push({
          num: verseNum,
          text: text
        });
      }

      this.dataLoaded = true;
    } catch (error) {
      console.error('Error loading Apocrypha data:', error);
    }
  }

  async loadChapter(bookId: number, chapterNum: number): Promise<Chapter | null> {
    const book = BIBLE_BOOKS.find(b => b.id === bookId);
    if (!book || !book.isApocrypha || !book.code) {
      return null;
    }

    await this.loadApocryphaData();

    const key = `${book.code}:${chapterNum}`;
    const verses = this.apocryphaData.get(key);

    if (!verses || verses.length === 0) {
      console.warn(`No verses found for ${book.name} chapter ${chapterNum}`);
      return null;
    }

    // Sort verses by verse number
    const sortedVerses = [...verses].sort((a, b) => a.num - b.num);

    return {
      bookName: book.name,
      bookId,
      chapterNum,
      kjvVerses: sortedVerses
    };
  }
}

export const apocryphaService = new ApocryphaService();
