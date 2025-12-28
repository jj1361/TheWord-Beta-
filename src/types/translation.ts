// Translation type definitions for multi-translation support

export type TranslationId = 'kjv' | 'tagalog' | 'brenton';

export interface TranslationMetadata {
  id: TranslationId;
  name: string;
  abbreviation: string;
  language: string;
  languageCode: string;
  publishYear?: number;
  copyright?: string;
  hasStrongsNumbers: boolean;
  hasInterlinear: boolean;
  description?: string;
}

// All available translations
export const TRANSLATIONS: TranslationMetadata[] = [
  {
    id: 'kjv',
    name: 'King James Version',
    abbreviation: 'KJV',
    language: 'English',
    languageCode: 'en',
    publishYear: 1611,
    copyright: 'Public Domain',
    hasStrongsNumbers: true,
    hasInterlinear: true,
    description: 'Classic 1611 English translation with Strong\'s numbers and interlinear support'
  },
  {
    id: 'tagalog',
    name: 'Tagalog Bible',
    abbreviation: 'TAG',
    language: 'Filipino/Tagalog',
    languageCode: 'tl',
    copyright: 'Public Domain',
    hasStrongsNumbers: false,
    hasInterlinear: false,
    description: 'Filipino/Tagalog Bible translation'
  },
  {
    id: 'brenton',
    name: 'Brenton Septuagint',
    abbreviation: 'LXX',
    language: 'English',
    languageCode: 'en',
    publishYear: 1851,
    copyright: 'Public Domain',
    hasStrongsNumbers: false,
    hasInterlinear: false,
    description: 'English translation of the Greek Septuagint (Old Testament) by Sir Lancelot Charles Lee Brenton'
  }
];

// Get translation metadata by ID
export function getTranslationById(id: TranslationId): TranslationMetadata | undefined {
  return TRANSLATIONS.find(t => t.id === id);
}

// Get default translation
export function getDefaultTranslation(): TranslationMetadata {
  return TRANSLATIONS[0]; // KJV
}

// Verse structure for non-KJV translations (simpler, no Strong's)
export interface TranslationVerse {
  num: number;
  text: string;
}

// Chapter structure for translations
export interface TranslationChapter {
  translationId: TranslationId;
  bookName: string;
  bookId: number;
  chapterNum: number;
  verses: TranslationVerse[];
}

// Book name mapping from Filipino to standard book IDs
export const TAGALOG_BOOK_MAPPING: Record<string, number> = {
  'Genesis': 1,
  'Exodus': 2,
  'Lewitico': 3,
  'Mga Bilang': 4,
  'Deuteronomeo': 5,
  'Joshua': 6,
  'Mga Hukom': 7,
  'Ruth': 8,
  '1 Samuel': 9,
  '2 Samuel': 10,
  '1 Mga Hari': 11,
  '2 Mga Hari': 12,
  '1 Cronicas': 13,
  '2 Cronicas': 14,
  'Ezra': 15,
  'Nehemyah': 16,
  'Ether': 17, // Esther
  'Job': 18,
  'Mga Awit': 19, // Psalms
  'Mga Kawikaan': 20, // Proverbs
  'Ang Mangangaral': 21, // Ecclesiastes
  'Awit ni Solomon': 22, // Song of Solomon
  'Isaias': 23,
  'Jeremias': 24,
  'Mga Panaghoy': 25, // Lamentations
  'Ezekiel': 26,
  "Dani'el": 27, // Daniel
  'Hoshea': 28, // Hosea
  'Joel': 29,
  'Amos': 30,
  'Obadayah': 31, // Obadiah
  'Jonah': 32,
  'Mikah': 33, // Micah
  'Nahum': 34,
  'Habakuk': 35, // Habakkuk
  'Zephanayah': 36, // Zephaniah
  'Haggai': 37,
  'Zekarayah': 38, // Zechariah
  'Malakias': 39, // Malachi
  // New Testament
  'Mateo': 40, // Matthew
  'Marcos': 41, // Mark
  'Lukas': 42, // Luke
  'Juan': 43, // John
  'Mga Gawa': 44, // Acts
  'Roma': 45, // Romans
  '1 Corinto': 46, // 1 Corinthians
  '2 Corinto': 47, // 2 Corinthians
  'Galatia': 48, // Galatians
  'Efeso': 49, // Ephesians
  'Pilipos': 50, // Philippians
  'Colosas': 51, // Colossians
  '1 Tesalonica': 52, // 1 Thessalonians
  '2 Tesalonica': 53, // 2 Thessalonians
  '1 Timoteo': 54, // 1 Timothy
  '2 Timoteo': 55, // 2 Timothy
  'Tito': 56, // Titus
  'Philemon': 57, // Philemon
  'Hebreo': 58, // Hebrews
  'Santiago': 59, // James
  '1 Pedro': 60, // 1 Peter
  '2 Pedro': 61, // 2 Peter
  '1 John': 62, // 1 John
  '2 John': 63, // 2 John
  '3 John': 64, // 3 John
  'Judas': 65, // Jude
  'Pahayag': 66, // Revelation
  // Apocrypha
  '1 Maccabeo': 67, // 1 Maccabees
  '2 Maccabeo': 68, // 2 Maccabees
};

// Tagalog book names by ID (for display)
export const TAGALOG_BOOK_NAMES: Record<number, string> = {
  1: 'Genesis',
  2: 'Exodus',
  3: 'Lewitico',
  4: 'Mga Bilang',
  5: 'Deuteronomeo',
  6: 'Joshua',
  7: 'Mga Hukom',
  8: 'Ruth',
  9: '1 Samuel',
  10: '2 Samuel',
  11: '1 Mga Hari',
  12: '2 Mga Hari',
  13: '1 Cronicas',
  14: '2 Cronicas',
  15: 'Ezra',
  16: 'Nehemyah',
  17: 'Ether',
  18: 'Job',
  19: 'Mga Awit',
  20: 'Mga Kawikaan',
  21: 'Ang Mangangaral',
  22: 'Awit ni Solomon',
  23: 'Isaias',
  24: 'Jeremias',
  25: 'Mga Panaghoy',
  26: 'Ezekiel',
  27: "Dani'el",
  28: 'Hoshea',
  29: 'Joel',
  30: 'Amos',
  31: 'Obadayah',
  32: 'Jonah',
  33: 'Mikah',
  34: 'Nahum',
  35: 'Habakuk',
  36: 'Zephanayah',
  37: 'Haggai',
  38: 'Zekarayah',
  39: 'Malakias',
  40: 'Mateo',
  41: 'Marcos',
  42: 'Lukas',
  43: 'Juan',
  44: 'Mga Gawa',
  45: 'Roma',
  46: '1 Corinto',
  47: '2 Corinto',
  48: 'Galatia',
  49: 'Efeso',
  50: 'Pilipos',
  51: 'Colosas',
  52: '1 Tesalonica',
  53: '2 Tesalonica',
  54: '1 Timoteo',
  55: '2 Timoteo',
  56: 'Tito',
  57: 'Philemon',
  58: 'Hebreo',
  59: 'Santiago',
  60: '1 Pedro',
  61: '2 Pedro',
  62: '1 John',
  63: '2 John',
  64: '3 John',
  65: 'Judas',
  66: 'Pahayag',
  67: '1 Maccabeo',
  68: '2 Maccabeo',
};

// Brenton Septuagint book names by ID (for display)
// Includes canonical OT books + Apocrypha/Deuterocanonical books
export const BRENTON_BOOK_NAMES: Record<number, string> = {
  // Pentateuch
  1: 'Genesis',
  2: 'Exodus',
  3: 'Leviticus',
  4: 'Numbers',
  5: 'Deuteronomy',
  // Historical Books
  6: 'Joshua',
  7: 'Judges',
  8: 'Ruth',
  9: '1 Samuel (Kings I)',
  10: '2 Samuel (Kings II)',
  11: '1 Kings (Kings III)',
  12: '2 Kings (Kings IV)',
  13: '1 Chronicles',
  14: '2 Chronicles',
  15: 'Ezra',
  16: 'Nehemiah',
  17: 'Esther (Greek)',
  // Wisdom Literature
  18: 'Job',
  19: 'Psalms',
  20: 'Proverbs',
  21: 'Ecclesiastes',
  22: 'Song of Solomon',
  // Major Prophets
  23: 'Isaiah (Esaias)',
  24: 'Jeremiah (Jeremias)',
  25: 'Lamentations',
  26: 'Ezekiel (Jezekiel)',
  27: 'Daniel (Greek)',
  // Minor Prophets
  28: 'Hosea (Osee)',
  29: 'Joel',
  30: 'Amos',
  31: 'Obadiah (Obdias)',
  32: 'Jonah (Jonas)',
  33: 'Micah (Micheas)',
  34: 'Nahum (Naum)',
  35: 'Habakkuk (Ambacum)',
  36: 'Zephaniah (Sophonias)',
  37: 'Haggai (Aggaeus)',
  38: 'Zechariah (Zacharias)',
  39: 'Malachi (Malachias)',
  // Apocrypha/Deuterocanonical (IDs 70+)
  70: 'Tobit',
  71: 'Judith',
  72: 'Wisdom of Solomon',
  73: 'Sirach (Ecclesiasticus)',
  74: 'Baruch',
  75: 'Epistle of Jeremy',
  76: 'Susanna',
  77: 'Bel and the Dragon',
  78: '1 Maccabees',
  79: '2 Maccabees',
  80: '1 Esdras',
  81: 'Prayer of Manasseh',
  82: '3 Maccabees',
  83: '4 Maccabees',
};
