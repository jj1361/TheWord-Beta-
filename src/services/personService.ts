import { PersonData, VerseData, BookData } from '../types/person';
import { PATHS } from '../config/paths';

export class PersonService {
  private peopleCache: Map<string, PersonData> = new Map();
  private versesCache: Map<string, VerseData> = new Map();
  private booksCache: Map<string, BookData> = new Map();
  private peopleLoaded = false;
  private versesLoaded = false;
  private booksLoaded = false;

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);

    return result.map(field => field.trim());
  }

  async loadPeople(): Promise<void> {
    if (this.peopleLoaded) return;

    try {
      const response = await fetch(`${PATHS.DATA}/people-completed_records.csv`);
      const csvText = await response.text();
      const lines = csvText.split('\n');

      // Skip header (BOM + header line)
      const headers = this.parseCSVLine(lines[0].replace(/^\uFEFF/, ''));

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = this.parseCSVLine(line);
        if (values.length < headers.length) continue;

        const person: PersonData = {
          personLookup: values[0] || '',
          status: values[1] || '',
          personID: values[2] || '',
          displayTitle: values[3] || '',
          alsoCalled: values[4] || '',
          slug: values[5] || '',
          name: values[6] || '',
          surname: values[7] || '',
          isProperName: values[8] || '',
          gender: values[9] || '',
          birthYear: values[10] || '',
          deathYear: values[11] || '',
          birthPlace: values[12] || '',
          deathPlace: values[13] || '',
          memberOf: values[14] || '',
          dictionaryLink: values[15] || '',
          dictionaryText: values[16] || '',
          events: values[17] || '',
          eventGroups: values[18] || '',
          verseCount: values[19] || '',
          verses: values[20] || '',
          mother: values[21] || '',
          father: values[22] || '',
          children: values[23] || '',
          siblings: values[24] || '',
          halfSiblingsSameMother: values[25] || '',
          halfSiblingsSameFather: values[26] || '',
          chaptersWritten: values[27] || '',
          eastons: values[28] || ''
        };

        // Use personLookup as the key since that's what verses reference (e.g., "god_1324")
        if (person.personLookup) {
          this.peopleCache.set(person.personLookup, person);
        }
      }

      this.peopleLoaded = true;
    } catch (error) {
      console.error('Error loading people data:', error);
    }
  }

  async loadVerses(): Promise<void> {
    if (this.versesLoaded) return;

    try {
      const response = await fetch(`${PATHS.DATA}/verses-completed_records.csv`);
      const csvText = await response.text();
      const lines = csvText.split('\n');

      // Skip header (BOM + header line)
      const headers = this.parseCSVLine(lines[0].replace(/^\uFEFF/, ''));

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = this.parseCSVLine(line);
        if (values.length < 14) continue;

        const verse: VerseData = {
          osisRef: values[0] || '',
          status: values[1] || '',
          book: values[2] || '',
          chapter: values[3] || '',
          verseNum: values[4] || '',
          verseText: values[5] || '',
          mdText: values[6] || '',
          people: values[7] || '',
          peopleCount: values[8] || '',
          places: values[9] || '',
          placesCount: values[10] || '',
          yearNum: values[11] || '',
          quotesFrom: values[12] || '',
          peopleGroups: values[13] || '',
          eventsDescribed: values[14] || ''
        };

        if (verse.osisRef) {
          this.versesCache.set(verse.osisRef, verse);
        }
      }

      this.versesLoaded = true;
    } catch (error) {
      console.error('Error loading verses data:', error);
    }
  }

  async loadBooks(): Promise<void> {
    if (this.booksLoaded) return;

    try {
      const response = await fetch(`${PATHS.DATA}/books-Grid view.csv`);
      const csvText = await response.text();
      const lines = csvText.split('\n');

      // Skip header (BOM + header line)
      const headers = this.parseCSVLine(lines[0].replace(/^\uFEFF/, ''));

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = this.parseCSVLine(line);
        if (values.length < 15) continue;

        const book: BookData = {
          osisName: values[0] || '',
          bookOrder: values[1] || '',
          bookName: values[2] || '',
          bookDiv: values[3] || '',
          testament: values[4] || '',
          shortName: values[5] || '',
          slug: values[6] || '',
          yearWritten: values[7] || '',
          placeWritten: values[8] || '',
          chapters: values[9] || '',
          chapterCount: values[10] || '',
          verseCount: values[11] || '',
          writers: values[12] || '',
          peopleCount: values[13] || '',
          placeCount: values[14] || ''
        };

        if (book.osisName) {
          this.booksCache.set(book.osisName, book);
        }
      }

      this.booksLoaded = true;
    } catch (error) {
      console.error('Error loading books data:', error);
    }
  }

  async getPersonByID(personID: string): Promise<PersonData | null> {
    await this.loadPeople();
    console.log('Looking for personID:', personID);
    console.log('Total people in cache:', this.peopleCache.size);
    console.log('Sample IDs from cache:', Array.from(this.peopleCache.keys()).slice(0, 10));
    const result = this.peopleCache.get(personID) || null;
    console.log('Found person:', result ? result.displayTitle : 'NOT FOUND');
    return result;
  }

  async getVerseByRef(osisRef: string): Promise<VerseData | null> {
    await this.loadVerses();
    return this.versesCache.get(osisRef) || null;
  }

  async getBookByOsis(osisName: string): Promise<BookData | null> {
    await this.loadBooks();
    return this.booksCache.get(osisName) || null;
  }

  async getVersesByPerson(personID: string): Promise<VerseData[]> {
    await this.loadVerses();
    const verses: VerseData[] = [];

    const allVerses = Array.from(this.versesCache.values());
    for (let i = 0; i < allVerses.length; i++) {
      const verse = allVerses[i];
      if (verse.people && verse.people.includes(personID)) {
        verses.push(verse);
      }
    }

    return verses;
  }

  async getBooksByWriter(personID: string): Promise<BookData[]> {
    await this.loadBooks();
    const books: BookData[] = [];

    const allBooks = Array.from(this.booksCache.values());
    for (let i = 0; i < allBooks.length; i++) {
      const book = allBooks[i];
      if (book.writers && book.writers.includes(personID)) {
        books.push(book);
      }
    }

    return books;
  }

  parsePeopleList(peopleString: string): string[] {
    if (!peopleString) return [];
    return peopleString.split(',').map(id => id.trim()).filter(id => id);
  }

  parseVerseList(versesString: string): string[] {
    if (!versesString) return [];
    return versesString.split(',').map(ref => ref.trim()).filter(ref => ref);
  }

  // Convert markdown text to HTML with clickable person links
  convertMarkdownToHTML(mdText: string, onPersonClick?: (personID: string) => void): string {
    if (!mdText) return '';

    // Replace [Name]([/person/personID) with clickable spans
    const personLinkPattern = /\[([^\]]+)\]\(\[\/person\/([^\)]+)\)/g;

    return mdText.replace(personLinkPattern, (match, name, personID) => {
      return `<span class="person-link" data-person-id="${personID}">${name}</span>`;
    });
  }
}

export const personService = new PersonService();
