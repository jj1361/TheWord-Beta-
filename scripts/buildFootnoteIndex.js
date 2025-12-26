/**
 * Build script to generate footnote JSON files from 1611 KJV marginal notes
 *
 * This script parses footnote data and creates per-book JSON files.
 *
 * Run with: node scripts/buildFootnoteIndex.js
 *
 * Input: A text file with footnotes in format:
 *   [Book Chapter:Verse] phrase: note
 *
 * Output: Per-book JSON files in public/footnotes/
 */

const fs = require('fs');
const path = require('path');

// Book name variations to ID mapping
const BOOK_NAME_TO_ID = {
  'genesis': 1, 'gen': 1,
  'exodus': 2, 'exod': 2, 'exo': 2,
  'leviticus': 3, 'lev': 3,
  'numbers': 4, 'num': 4,
  'deuteronomy': 5, 'deut': 5, 'deu': 5,
  'joshua': 6, 'josh': 6, 'jos': 6,
  'judges': 7, 'judg': 7, 'jdg': 7,
  'ruth': 8, 'rut': 8,
  '1 samuel': 9, '1samuel': 9, '1 sam': 9, '1sam': 9,
  '2 samuel': 10, '2samuel': 10, '2 sam': 10, '2sam': 10,
  '1 kings': 11, '1kings': 11, '1 ki': 11, '1ki': 11,
  '2 kings': 12, '2kings': 12, '2 ki': 12, '2ki': 12,
  '1 chronicles': 13, '1chronicles': 13, '1 chr': 13, '1chr': 13, '1 chron': 13,
  '2 chronicles': 14, '2chronicles': 14, '2 chr': 14, '2chr': 14, '2 chron': 14,
  'ezra': 15, 'ezr': 15,
  'nehemiah': 16, 'neh': 16,
  'esther': 17, 'esth': 17, 'est': 17,
  'job': 18,
  'psalms': 19, 'psalm': 19, 'psa': 19, 'ps': 19,
  'proverbs': 20, 'prov': 20, 'pro': 20,
  'ecclesiastes': 21, 'eccl': 21, 'ecc': 21, 'eccles': 21,
  'song of solomon': 22, 'song': 22, 'songs': 22, 'canticles': 22, 'cant': 22, 'sos': 22,
  'isaiah': 23, 'isa': 23,
  'jeremiah': 24, 'jer': 24,
  'lamentations': 25, 'lam': 25,
  'ezekiel': 26, 'ezek': 26, 'eze': 26,
  'daniel': 27, 'dan': 27,
  'hosea': 28, 'hos': 28,
  'joel': 29,
  'amos': 30,
  'obadiah': 31, 'obad': 31, 'oba': 31,
  'jonah': 32, 'jon': 32,
  'micah': 33, 'mic': 33,
  'nahum': 34, 'nah': 34,
  'habakkuk': 35, 'hab': 35,
  'zephaniah': 36, 'zeph': 36, 'zep': 36,
  'haggai': 37, 'hag': 37,
  'zechariah': 38, 'zech': 38, 'zec': 38,
  'malachi': 39, 'mal': 39,
  'matthew': 40, 'matt': 40, 'mat': 40,
  'mark': 41, 'mar': 41, 'mk': 41,
  'luke': 42, 'luk': 42, 'lk': 42,
  'john': 43, 'joh': 43, 'jn': 43,
  'acts': 44, 'act': 44,
  'romans': 45, 'rom': 45,
  '1 corinthians': 46, '1corinthians': 46, '1 cor': 46, '1cor': 46,
  '2 corinthians': 47, '2corinthians': 47, '2 cor': 47, '2cor': 47,
  'galatians': 48, 'gal': 48,
  'ephesians': 49, 'eph': 49,
  'philippians': 50, 'phil': 50, 'php': 50,
  'colossians': 51, 'col': 51,
  '1 thessalonians': 52, '1thessalonians': 52, '1 thess': 52, '1thess': 52, '1 th': 52,
  '2 thessalonians': 53, '2thessalonians': 53, '2 thess': 53, '2thess': 53, '2 th': 53,
  '1 timothy': 54, '1timothy': 54, '1 tim': 54, '1tim': 54,
  '2 timothy': 55, '2timothy': 55, '2 tim': 55, '2tim': 55,
  'titus': 56, 'tit': 56,
  'philemon': 57, 'phlm': 57, 'phm': 57,
  'hebrews': 58, 'heb': 58,
  'james': 59, 'jas': 59, 'jam': 59,
  '1 peter': 60, '1peter': 60, '1 pet': 60, '1pet': 60,
  '2 peter': 61, '2peter': 61, '2 pet': 61, '2pet': 61,
  '1 john': 62, '1john': 62, '1 jn': 62, '1jn': 62,
  '2 john': 63, '2john': 63, '2 jn': 63, '2jn': 63,
  '3 john': 64, '3john': 64, '3 jn': 64, '3jn': 64,
  'jude': 65, 'jud': 65,
  'revelation': 66, 'rev': 66, 'apocalypse': 66
};

// Book ID to canonical name
const BOOK_ID_TO_NAME = {
  1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
  6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
  11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles', 15: 'Ezra',
  16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalms', 20: 'Proverbs',
  21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah', 24: 'Jeremiah', 25: 'Lamentations',
  26: 'Ezekiel', 27: 'Daniel', 28: 'Hosea', 29: 'Joel', 30: 'Amos',
  31: 'Obadiah', 32: 'Jonah', 33: 'Micah', 34: 'Nahum', 35: 'Habakkuk',
  36: 'Zephaniah', 37: 'Haggai', 38: 'Zechariah', 39: 'Malachi',
  40: 'Matthew', 41: 'Mark', 42: 'Luke', 43: 'John', 44: 'Acts',
  45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians', 48: 'Galatians', 49: 'Ephesians',
  50: 'Philippians', 51: 'Colossians', 52: '1 Thessalonians', 53: '2 Thessalonians', 54: '1 Timothy',
  55: '2 Timothy', 56: 'Titus', 57: 'Philemon', 58: 'Hebrews', 59: 'James',
  60: '1 Peter', 61: '2 Peter', 62: '1 John', 63: '2 John', 64: '3 John',
  65: 'Jude', 66: 'Revelation'
};

// Book ID to filename
const BOOK_ID_TO_FILENAME = {
  1: 'genesis', 2: 'exodus', 3: 'leviticus', 4: 'numbers', 5: 'deuteronomy',
  6: 'joshua', 7: 'judges', 8: 'ruth', 9: '1samuel', 10: '2samuel',
  11: '1kings', 12: '2kings', 13: '1chronicles', 14: '2chronicles', 15: 'ezra',
  16: 'nehemiah', 17: 'esther', 18: 'job', 19: 'psalms', 20: 'proverbs',
  21: 'ecclesiastes', 22: 'songofsolomon', 23: 'isaiah', 24: 'jeremiah', 25: 'lamentations',
  26: 'ezekiel', 27: 'daniel', 28: 'hosea', 29: 'joel', 30: 'amos',
  31: 'obadiah', 32: 'jonah', 33: 'micah', 34: 'nahum', 35: 'habakkuk',
  36: 'zephaniah', 37: 'haggai', 38: 'zechariah', 39: 'malachi',
  40: 'matthew', 41: 'mark', 42: 'luke', 43: 'john', 44: 'acts',
  45: 'romans', 46: '1corinthians', 47: '2corinthians', 48: 'galatians', 49: 'ephesians',
  50: 'philippians', 51: 'colossians', 52: '1thessalonians', 53: '2thessalonians', 54: '1timothy',
  55: '2timothy', 56: 'titus', 57: 'philemon', 58: 'hebrews', 59: 'james',
  60: '1peter', 61: '2peter', 62: '1john', 63: '2john', 64: '3john',
  65: 'jude', 66: 'revelation'
};

/**
 * Determine footnote type from note content
 */
function determineType(note) {
  const lowerNote = note.toLowerCase().trim();

  if (lowerNote.startsWith('heb.') || lowerNote.startsWith('hebrew')) {
    return 'hebrew';
  }
  if (lowerNote.startsWith('gr.') || lowerNote.startsWith('greek')) {
    return 'greek';
  }
  if (lowerNote.startsWith('or,') || lowerNote.startsWith('or ')) {
    return 'alternative';
  }
  if (lowerNote.startsWith('that is,') || lowerNote.startsWith('i.e.') || lowerNote.includes('meaning')) {
    return 'meaning';
  }
  return 'clarification';
}

/**
 * Parse book name from reference
 */
function parseBookName(bookStr) {
  const normalized = bookStr.toLowerCase().trim();
  return BOOK_NAME_TO_ID[normalized] || null;
}

/**
 * Parse a single footnote line
 * Format: "Book Chapter:Verse phrase: note"
 * Example: "Genesis 1:4 divided the light from the darkness: Heb. between the light and between the darkness"
 */
function parseFootnoteLine(line) {
  // Match: BookName Chapter:Verse RestOfLine
  // The tricky part is separating book name (may have spaces/numbers) from chapter:verse

  // Try to match pattern like "Genesis 1:4" or "1 Samuel 2:3" or "Song of Solomon 1:1"
  const refMatch = line.match(/^(.+?)\s+(\d+):(\d+)\s+(.+)$/);
  if (!refMatch) {
    return null;
  }

  const [, bookStr, chapterStr, verseStr, rest] = refMatch;
  const bookId = parseBookName(bookStr);

  if (!bookId) {
    console.warn(`Unknown book: "${bookStr}"`);
    return null;
  }

  const chapter = parseInt(chapterStr, 10);
  const verse = parseInt(verseStr, 10);

  // Split rest into phrase and note at the colon
  // The last colon before the note content
  const colonIndex = rest.indexOf(':');
  if (colonIndex === -1) {
    return null;
  }

  const phrase = rest.substring(0, colonIndex).trim();
  const note = rest.substring(colonIndex + 1).trim();

  if (!phrase || !note) {
    return null;
  }

  const type = determineType(note);

  return {
    bookId,
    chapter,
    verse,
    footnote: {
      phrase,
      note,
      type
    }
  };
}

/**
 * Parse footnotes from text content
 */
function parseFootnotes(content) {
  const lines = content.split('\n');
  const footnotes = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parsed = parseFootnoteLine(trimmed);
    if (parsed) {
      footnotes.push(parsed);
    }
  }

  return footnotes;
}

/**
 * Group footnotes by book
 */
function groupByBook(footnotes) {
  const books = new Map();

  for (const { bookId, chapter, verse, footnote } of footnotes) {
    if (!books.has(bookId)) {
      books.set(bookId, {
        bookId,
        bookName: BOOK_ID_TO_NAME[bookId],
        chapters: {}
      });
    }

    const book = books.get(bookId);
    if (!book.chapters[chapter]) {
      book.chapters[chapter] = {};
    }
    if (!book.chapters[chapter][verse]) {
      book.chapters[chapter][verse] = [];
    }
    book.chapters[chapter][verse].push(footnote);
  }

  return books;
}

/**
 * Write footnotes to per-book JSON files
 */
function writeFootnoteFiles(books, outputDir) {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let totalFiles = 0;
  let totalNotes = 0;

  for (const [bookId, bookData] of books) {
    const filename = BOOK_ID_TO_FILENAME[bookId];
    if (!filename) {
      console.warn(`No filename for book ID ${bookId}`);
      continue;
    }

    const filepath = path.join(outputDir, `${filename}.json`);
    const json = JSON.stringify(bookData, null, 2);
    fs.writeFileSync(filepath, json, 'utf-8');

    // Count notes
    let noteCount = 0;
    for (const chapter of Object.values(bookData.chapters)) {
      for (const verses of Object.values(chapter)) {
        noteCount += verses.length;
      }
    }

    console.log(`  ${filename}.json: ${noteCount} footnotes`);
    totalFiles++;
    totalNotes += noteCount;
  }

  console.log(`\nTotal: ${totalFiles} files, ${totalNotes} footnotes`);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('1611 KJV Marginal Notes (Footnotes) Index Builder');
    console.log('='.repeat(50));
    console.log('');
    console.log('Usage: node scripts/buildFootnoteIndex.js <input-file>');
    console.log('');
    console.log('Input file format (one footnote per line):');
    console.log('  Genesis 1:4 divided the light from the darkness: Heb. between the light and between the darkness');
    console.log('  Exodus 2:10 Moses: that is, Drawn out');
    console.log('');
    console.log('Output: JSON files in public/footnotes/ directory');
    console.log('');
    console.log('To create input file:');
    console.log('1. Copy text from https://en.literaturabautista.com/exhaustive-listing-marginal-notes-1611-edition-king-james-bible');
    console.log('2. Clean up formatting to one footnote per line');
    console.log('3. Save as footnotes-raw.txt');
    console.log('4. Run: node scripts/buildFootnoteIndex.js footnotes-raw.txt');
    return;
  }

  const inputFile = args[0];
  const outputDir = path.join(__dirname, '..', 'public', 'footnotes');

  console.log('1611 KJV Marginal Notes (Footnotes) Index Builder');
  console.log('='.repeat(50));
  console.log(`Input: ${inputFile}`);
  console.log(`Output: ${outputDir}`);
  console.log('');

  // Read input file
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(inputFile, 'utf-8');
  console.log(`Read ${content.length} characters`);

  // Parse footnotes
  const footnotes = parseFootnotes(content);
  console.log(`Parsed ${footnotes.length} footnotes`);

  if (footnotes.length === 0) {
    console.error('No footnotes parsed. Check input file format.');
    process.exit(1);
  }

  // Group by book
  const books = groupByBook(footnotes);
  console.log(`Found footnotes in ${books.size} books`);
  console.log('');

  // Write output files
  console.log('Writing files:');
  writeFootnoteFiles(books, outputDir);

  console.log('\nDone!');
}

main();
