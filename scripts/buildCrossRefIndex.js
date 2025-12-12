/**
 * Build script to generate cross-reference index JSON from TSK data
 * Run with: node scripts/buildCrossRefIndex.js
 */

const fs = require('fs');
const path = require('path');

// Abbreviation to book ID mapping from TSK readme.txt
const ABBREV_TO_BOOK_ID = {
  'ge': 1, 'ex': 2, 'le': 3, 'nu': 4, 'de': 5,
  'jos': 6, 'jud': 7, 'ru': 8, '1sa': 9, '2sa': 10,
  '1ki': 11, '2ki': 12, '1ch': 13, '2ch': 14, 'ezr': 15,
  'ne': 16, 'es': 17, 'job': 18, 'ps': 19, 'pr': 20,
  'ec': 21, 'so': 22, 'isa': 23, 'jer': 24, 'la': 25,
  'eze': 26, 'da': 27, 'ho': 28, 'joe': 29, 'am': 30,
  'ob': 31, 'jon': 32, 'mic': 33, 'na': 34, 'hab': 35,
  'zep': 36, 'hag': 37, 'zec': 38, 'mal': 39,
  'mt': 40, 'mr': 41, 'lu': 42, 'joh': 43, 'ac': 44,
  'ro': 45, '1co': 46, '2co': 47, 'ga': 48, 'eph': 49,
  'php': 50, 'col': 51, '1th': 52, '2th': 53, '1ti': 54,
  '2ti': 55, 'tit': 56, 'phm': 57, 'heb': 58, 'jas': 59,
  '1pe': 60, '2pe': 61, '1jo': 62, '2jo': 63, '3jo': 64,
  'jude': 65, 're': 66
};

// Book ID to name mapping
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

/**
 * Parse a single reference string like "ge 1:1" or "ps 119:105" or "ro 8:28,29"
 * Returns array of { bookId, chapter, verse, verseEnd? }
 */
function parseReference(refStr) {
  const refs = [];

  // Match pattern: abbrev chapter:verse(s)
  // Examples: "ge 1:1", "ps 119:105", "ro 8:28,29", "isa 40:26-28"
  const match = refStr.match(/^([a-z0-9]+)\s+(\d+):(.+)$/);
  if (!match) return refs;

  const [, abbrev, chapter, versesPart] = match;
  const bookId = ABBREV_TO_BOOK_ID[abbrev];
  if (!bookId) return refs;

  const chapterNum = parseInt(chapter, 10);

  // Parse verses part - can be "1", "1,2", "1-3", "1,3-5"
  const verseParts = versesPart.split(',');
  for (const part of verseParts) {
    if (part.includes('-')) {
      // Range like "1-3"
      const [start, end] = part.split('-').map(v => parseInt(v.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        refs.push({ bookId, chapter: chapterNum, verse: start, verseEnd: end });
      }
    } else {
      // Single verse
      const verse = parseInt(part.trim(), 10);
      if (!isNaN(verse)) {
        refs.push({ bookId, chapter: chapterNum, verse });
      }
    }
  }

  return refs;
}

/**
 * Parse the reference_list field which contains semicolon-separated references
 */
function parseReferenceList(refListStr) {
  const allRefs = [];
  const parts = refListStr.split(';');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed) {
      const parsed = parseReference(trimmed);
      allRefs.push(...parsed);
    }
  }

  return allRefs;
}

async function buildCrossRefIndex() {
  console.log('Building cross-reference index from TSK data...');
  const startTime = Date.now();

  const inputPath = path.join(__dirname, '..', 'data', 'tskxref.txt');
  const outputPath = path.join(__dirname, '..', 'public', 'crossref-index.json');

  // Read the TSK file
  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  // Index structure: { "bookId:chapter:verse": [{ word, refs: [...] }] }
  const crossRefIndex = {};
  let totalEntries = 0;
  let totalRefs = 0;

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 6) continue;

    const [bookKeyStr, chapterStr, verseStr, sortOrderStr, word, refList] = parts;
    const bookId = parseInt(bookKeyStr, 10);
    const chapter = parseInt(chapterStr, 10);
    const verse = parseInt(verseStr, 10);
    const sortOrder = parseInt(sortOrderStr, 10);

    if (isNaN(bookId) || isNaN(chapter) || isNaN(verse)) continue;

    // Create verse key
    const verseKey = `${bookId}:${chapter}:${verse}`;

    // Parse references
    const refs = parseReferenceList(refList || '');

    // Initialize array for this verse if needed
    if (!crossRefIndex[verseKey]) {
      crossRefIndex[verseKey] = [];
    }

    // Add this cross-reference entry
    crossRefIndex[verseKey].push({
      order: sortOrder,
      word: word || '',
      refs: refs
    });

    totalEntries++;
    totalRefs += refs.length;
  }

  // Sort entries within each verse by order
  for (const verseKey of Object.keys(crossRefIndex)) {
    crossRefIndex[verseKey].sort((a, b) => a.order - b.order);
  }

  // Count verses with cross-references
  const versesWithRefs = Object.keys(crossRefIndex).length;

  // Write the index
  fs.writeFileSync(outputPath, JSON.stringify(crossRefIndex));

  const endTime = Date.now();
  const fileSizeKB = (fs.statSync(outputPath).size / 1024).toFixed(2);

  console.log(`\nCross-reference index built successfully!`);
  console.log(`  - Total TSK entries: ${totalEntries}`);
  console.log(`  - Total references: ${totalRefs}`);
  console.log(`  - Verses with cross-refs: ${versesWithRefs}`);
  console.log(`  - Output file: ${outputPath}`);
  console.log(`  - File size: ${fileSizeKB} KB`);
  console.log(`  - Build time: ${((endTime - startTime) / 1000).toFixed(2)}s`);
}

buildCrossRefIndex().catch(console.error);
