import { Chapter, BIBLE_BOOKS } from '../types/bible';
import { XMLParser } from '../utils/xmlParser';
import { apocryphaService } from './apocryphaService';
import { PATHS } from '../config/paths';

export class BibleService {
  private basePath: string;

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

  async loadChapter(bookId: number, chapterNum: number): Promise<Chapter> {
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

      try {
        const kjvsPath = `${this.basePath}/KJVs/${bookFolder}/${chapterFile}`;
        const kjvsResponse = await fetch(kjvsPath);
        const kjvsXml = await kjvsResponse.text();
        kjvsVerses = XMLParser.parseKJVsChapter(kjvsXml);
      } catch (error) {
        console.warn(`Could not load KJVs for ${book.name} ${chapterNum}`);
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
