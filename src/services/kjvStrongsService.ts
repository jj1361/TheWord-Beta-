import { KJVsVerse, KJVsPhrase } from '../types/bible';

interface BookChapterData {
  [chapter: number]: KJVsVerse[];
}

interface BookData {
  [bookId: number]: BookChapterData;
}

/**
 * Service to load and parse KJV with Strong's numbers from CSV file
 * This replaces the faulty XML files in the KJVs folder
 */
class KJVStrongsService {
  private data: BookData = {};
  private loaded = false;
  private loadingPromise: Promise<void> | null = null;

  /**
   * Parse inline Strong's notation from CSV text
   * Input: "In the beginning{H7225} God{H430} created{H1254}{(H8804)}{H853} the heaven{H8064}"
   * Output: [{ strongs: "H7225", text: "In the beginning" }, { strongs: "H430", text: "God" }, ...]
   *
   * Note: Strong's numbers follow the word they annotate, e.g., "met{H6293}" means "met" has Strong's H6293
   */
  private parseStrongsText(text: string): KJVsPhrase[] {
    const phrases: KJVsPhrase[] = [];

    // Split on Strong's patterns while preserving the structure
    const parts = text.split(/(\{[HG()\d]+\})/g).filter(p => p);

    let currentText = '';
    let currentStrongs: string[] = [];

    for (const part of parts) {
      // Check if this is a Strong's reference (H#### or G####)
      const strongsMatch = part.match(/^\{([HG]\d+)\}$/);
      // Check if this is a tense/grammar marker like (H8804)
      const tenseMatch = part.match(/^\{\(([HG]\d+)\)\}$/);

      if (strongsMatch) {
        // This is a Strong's number - add to current word's strongs
        currentStrongs.push(strongsMatch[1]);
      } else if (tenseMatch) {
        // This is a tense marker - skip it (don't add to strongs)
        // Tense markers provide grammatical info but aren't primary Strong's references
      } else {
        // This is text - check if it starts with punctuation that should attach to previous phrase
        const leadingPunctMatch = part.match(/^([,;:.!?\-']+)(.*)$/);

        if (leadingPunctMatch) {
          // First, save the current phrase if we have one
          // This ensures punctuation attaches to the correct (most recent) word
          if (currentText.trim()) {
            phrases.push({
              strongs: currentStrongs.join(',') || '',
              text: currentText.trim()
            });
            currentText = '';
            currentStrongs = [];
          }

          // Now attach leading punctuation to the previous phrase
          const punctuation = leadingPunctMatch[1];
          const remainingText = leadingPunctMatch[2];

          if (phrases.length > 0) {
            phrases[phrases.length - 1].text += punctuation;
          }

          // Continue with remaining text (after punctuation)
          currentText = remainingText;
          currentStrongs = [];
        } else {
          // Normal case - save previous phrase if we have one, then start new phrase
          if (currentText.trim()) {
            phrases.push({
              strongs: currentStrongs.join(',') || '',
              text: currentText.trim()
            });
          }
          currentText = part;
          currentStrongs = [];
        }
      }
    }

    // Don't forget the last phrase
    if (currentText.trim()) {
      phrases.push({
        strongs: currentStrongs.join(',') || '',
        text: currentText.trim()
      });
    }

    return phrases;
  }

  /**
   * Parse a CSV line handling quoted fields properly
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * Load and parse the CSV file
   */
  async load(): Promise<void> {
    if (this.loaded) return;

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this._load();
    return this.loadingPromise;
  }

  private async _load(): Promise<void> {
    try {
      const response = await fetch('/kjv_strongs.csv');
      if (!response.ok) {
        throw new Error(`Failed to fetch kjv_strongs.csv: ${response.status}`);
      }

      const csvText = await response.text();
      const lines = csvText.split('\n');

      // Skip header lines (first 6 lines are metadata/headers)
      // Line 6 is: "Verse ID","Book Name","Book Number",Chapter,Verse,Text
      let dataStartIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('"Verse ID"') || lines[i].startsWith('1,Genesis')) {
          dataStartIndex = lines[i].startsWith('"Verse ID"') ? i + 1 : i;
          break;
        }
      }

      for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const fields = this.parseCSVLine(line);
        if (fields.length < 6) continue;

        // fields[0] is verseId, fields[1] is bookName (unused)
        const bookNumber = parseInt(fields[2]);
        const chapter = parseInt(fields[3]);
        const verseNum = parseInt(fields[4]);
        const text = fields[5];

        if (isNaN(bookNumber) || isNaN(chapter) || isNaN(verseNum)) continue;

        // Initialize book if needed
        if (!this.data[bookNumber]) {
          this.data[bookNumber] = {};
        }

        // Initialize chapter if needed
        if (!this.data[bookNumber][chapter]) {
          this.data[bookNumber][chapter] = [];
        }

        // Parse the text with Strong's numbers
        const phrases = this.parseStrongsText(text);

        this.data[bookNumber][chapter].push({
          num: verseNum,
          phrases
        });
      }

      this.loaded = true;
      // Log sample data to verify parsing
      const gen32 = this.data[1]?.[32];
      if (gen32 && gen32.length > 0) {
        console.log('KJV Strong\'s CSV loaded. Sample Genesis 32:1 phrases:', JSON.stringify(gen32[0].phrases));
      }
      console.log('KJV Strong\'s CSV data loaded successfully, books:', Object.keys(this.data).length);
    } catch (error) {
      console.error('Failed to load KJV Strong\'s CSV:', error);
      throw error;
    }
  }

  /**
   * Get verses for a specific book and chapter
   */
  async getChapter(bookId: number, chapterNum: number): Promise<KJVsVerse[] | undefined> {
    await this.load();
    return this.data[bookId]?.[chapterNum];
  }

  /**
   * Check if data is available for a book/chapter
   */
  async hasChapter(bookId: number, chapterNum: number): Promise<boolean> {
    await this.load();
    return !!(this.data[bookId]?.[chapterNum]);
  }
}

export const kjvStrongsService = new KJVStrongsService();
