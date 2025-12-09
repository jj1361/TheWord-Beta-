export interface Word {
  num: number;
  strongs: string;
  pos: string;
  parse: string;
  transliteration: string;
  hebrew?: string;
  greek?: string;
  english: string;
}

export interface InterlinearVerse {
  num: number;
  words: Word[];
}

export interface KJVVerse {
  num: number;
  text: string;
  mdText?: string;
  people?: string;
}

export interface KJVsPhrase {
  strongs: string;
  text: string;
}

export interface KJVsVerse {
  num: number;
  phrases: KJVsPhrase[];
}

export interface Chapter {
  bookName: string;
  bookId: number;
  chapterNum: number;
  kjvVerses: KJVVerse[];
  kjvsVerses?: KJVsVerse[];
  interlinearVerses?: InterlinearVerse[];
}

export interface Book {
  id: number;
  name: string;
  chapters: number;
  startChapter?: number; // For books like Additions to Esther that start at chapter 10
  code?: string;
  isApocrypha?: boolean;
}

export const BIBLE_BOOKS: Book[] = [
  { id: 1, name: "Genesis", chapters: 50 },
  { id: 2, name: "Exodus", chapters: 40 },
  { id: 3, name: "Leviticus", chapters: 27 },
  { id: 4, name: "Numbers", chapters: 36 },
  { id: 5, name: "Deuteronomy", chapters: 34 },
  { id: 6, name: "Joshua", chapters: 24 },
  { id: 7, name: "Judges", chapters: 21 },
  { id: 8, name: "Ruth", chapters: 4 },
  { id: 9, name: "1 Samuel", chapters: 31 },
  { id: 10, name: "2 Samuel", chapters: 24 },
  { id: 11, name: "1 Kings", chapters: 22 },
  { id: 12, name: "2 Kings", chapters: 25 },
  { id: 13, name: "1 Chronicles", chapters: 29 },
  { id: 14, name: "2 Chronicles", chapters: 36 },
  { id: 15, name: "Ezra", chapters: 10 },
  { id: 16, name: "Nehemiah", chapters: 13 },
  { id: 17, name: "Esther", chapters: 10 },
  { id: 18, name: "Job", chapters: 42 },
  { id: 19, name: "Psalms", chapters: 150 },
  { id: 20, name: "Proverbs", chapters: 31 },
  { id: 21, name: "Ecclesiastes", chapters: 12 },
  { id: 22, name: "Song of Solomon", chapters: 8 },
  { id: 23, name: "Isaiah", chapters: 66 },
  { id: 24, name: "Jeremiah", chapters: 52 },
  { id: 25, name: "Lamentations", chapters: 5 },
  { id: 26, name: "Ezekiel", chapters: 48 },
  { id: 27, name: "Daniel", chapters: 12 },
  { id: 28, name: "Hosea", chapters: 14 },
  { id: 29, name: "Joel", chapters: 3 },
  { id: 30, name: "Amos", chapters: 9 },
  { id: 31, name: "Obadiah", chapters: 1 },
  { id: 32, name: "Jonah", chapters: 4 },
  { id: 33, name: "Micah", chapters: 7 },
  { id: 34, name: "Nahum", chapters: 3 },
  { id: 35, name: "Habakkuk", chapters: 3 },
  { id: 36, name: "Zephaniah", chapters: 3 },
  { id: 37, name: "Haggai", chapters: 2 },
  { id: 38, name: "Zechariah", chapters: 14 },
  { id: 39, name: "Malachi", chapters: 4 },
  { id: 40, name: "Matthew", chapters: 28 },
  { id: 41, name: "Mark", chapters: 16 },
  { id: 42, name: "Luke", chapters: 24 },
  { id: 43, name: "John", chapters: 21 },
  { id: 44, name: "Acts", chapters: 28 },
  { id: 45, name: "Romans", chapters: 16 },
  { id: 46, name: "1 Corinthians", chapters: 16 },
  { id: 47, name: "2 Corinthians", chapters: 13 },
  { id: 48, name: "Galatians", chapters: 6 },
  { id: 49, name: "Ephesians", chapters: 6 },
  { id: 50, name: "Philippians", chapters: 4 },
  { id: 51, name: "Colossians", chapters: 4 },
  { id: 52, name: "1 Thessalonians", chapters: 5 },
  { id: 53, name: "2 Thessalonians", chapters: 3 },
  { id: 54, name: "1 Timothy", chapters: 6 },
  { id: 55, name: "2 Timothy", chapters: 4 },
  { id: 56, name: "Titus", chapters: 3 },
  { id: 57, name: "Philemon", chapters: 1 },
  { id: 58, name: "Hebrews", chapters: 13 },
  { id: 59, name: "James", chapters: 5 },
  { id: 60, name: "1 Peter", chapters: 5 },
  { id: 61, name: "2 Peter", chapters: 3 },
  { id: 62, name: "1 John", chapters: 5 },
  { id: 63, name: "2 John", chapters: 1 },
  { id: 64, name: "3 John", chapters: 1 },
  { id: 65, name: "Jude", chapters: 1 },
  { id: 66, name: "Revelation", chapters: 22 },
  // Apocrypha
  { id: 67, name: "Tobit", chapters: 14, code: "Tob", isApocrypha: true },
  { id: 68, name: "Judith", chapters: 16, code: "Jdt", isApocrypha: true },
  { id: 69, name: "Additions to Esther", chapters: 7, startChapter: 10, code: "Aes", isApocrypha: true },
  { id: 70, name: "Wisdom of Solomon", chapters: 19, code: "Wis", isApocrypha: true },
  { id: 71, name: "Sirach", chapters: 51, code: "Sir", isApocrypha: true },
  { id: 72, name: "Baruch", chapters: 5, code: "Bar", isApocrypha: true },
  { id: 73, name: "Letter of Jeremiah", chapters: 1, code: "Epj", isApocrypha: true },
  { id: 74, name: "Prayer of Azariah", chapters: 1, code: "Aza", isApocrypha: true },
  { id: 75, name: "Susanna", chapters: 1, code: "Sus", isApocrypha: true },
  { id: 76, name: "Bel and the Dragon", chapters: 1, code: "Bel", isApocrypha: true },
  { id: 77, name: "Prayer of Manasseh", chapters: 1, code: "Man", isApocrypha: true },
  { id: 78, name: "1 Maccabees", chapters: 16, code: "Ma1", isApocrypha: true },
  { id: 79, name: "2 Maccabees", chapters: 15, code: "Ma2", isApocrypha: true },
  { id: 80, name: "1 Esdras", chapters: 9, code: "Es1", isApocrypha: true },
  { id: 81, name: "2 Esdras", chapters: 16, code: "Es2", isApocrypha: true },
  { id: 82, name: "Epistle to Laodiceans", chapters: 1, code: "Lao", isApocrypha: true },
];
