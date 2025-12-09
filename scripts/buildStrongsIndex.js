/**
 * Build script to generate pre-built Strong's concordance index JSON
 * Run with: node scripts/buildStrongsIndex.js
 */

const fs = require('fs');
const path = require('path');

// Bible books configuration (canonical only, no Apocrypha)
const BIBLE_BOOKS = [
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
];

const PUBLIC_DIR = path.join(__dirname, '../public');
const BIBLE_DATA_DIR = path.join(PUBLIC_DIR, 'xmlBible.org-main/KJVs');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'strongs-index.json');

function getBookFolder(bookId, bookName) {
  const paddedId = bookId.toString().padStart(2, '0');
  return `${paddedId}-${bookName}`;
}

function getChapterFileName(chapterNum) {
  return `chapter-${chapterNum.toString().padStart(3, '0')}.xml`;
}

function parseStrongsFromXML(xmlContent, bookId, chapterNum) {
  const results = [];

  // Parse verses with Strong's phrases
  const verseRegex = /<verse num="(\d+)">([\s\S]*?)<\/verse>/g;
  let verseMatch;

  while ((verseMatch = verseRegex.exec(xmlContent)) !== null) {
    const verseNum = parseInt(verseMatch[1], 10);
    const verseContent = verseMatch[2];

    // Extract all phrases with Strong's numbers
    const phraseRegex = /<phrase strongs="([^"]+)">([^<]*)<\/phrase>/g;
    let phraseMatch;
    const strongsInVerse = new Set();
    const phrases = [];

    while ((phraseMatch = phraseRegex.exec(verseContent)) !== null) {
      const strongsNum = phraseMatch[1];
      const phraseText = phraseMatch[2];
      phrases.push(phraseText);

      if (strongsNum) {
        // Add prefix based on testament (H for OT books 1-39, G for NT books 40-66)
        const prefix = bookId <= 39 ? 'H' : 'G';
        const fullStrongsId = `${prefix}${strongsNum}`;
        strongsInVerse.add(fullStrongsId);
      }
    }

    if (strongsInVerse.size > 0) {
      const verseText = phrases.join(' ').trim();
      results.push({
        verseNum,
        strongsIds: Array.from(strongsInVerse),
        text: verseText
      });
    }
  }

  return results;
}

async function buildStrongsIndex() {
  console.log('Building Strong\'s concordance index...');
  const startTime = Date.now();

  // Strong's index: strongsId -> array of [bookId, chapter, verse]
  const strongsIndex = {};
  // Verse text cache: "bookId:chapter:verse" -> text
  const verseTexts = {};

  let totalVerses = 0;
  let totalStrongsEntries = 0;
  let uniqueStrongsIds = new Set();

  for (const book of BIBLE_BOOKS) {
    const bookFolder = getBookFolder(book.id, book.name);
    const bookPath = path.join(BIBLE_DATA_DIR, bookFolder);

    if (!fs.existsSync(bookPath)) {
      console.warn(`Warning: Book folder not found: ${bookPath}`);
      continue;
    }

    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      const chapterFile = getChapterFileName(chapter);
      const chapterPath = path.join(bookPath, chapterFile);

      if (!fs.existsSync(chapterPath)) {
        // KJVs files may not exist for all chapters
        continue;
      }

      try {
        // Read file as UTF-8 (with BOM handling)
        let xmlContent = fs.readFileSync(chapterPath, 'utf8');
        if (xmlContent.charCodeAt(0) === 0xFEFF) {
          xmlContent = xmlContent.slice(1);
        }

        const versesWithStrongs = parseStrongsFromXML(xmlContent, book.id, chapter);

        for (const verse of versesWithStrongs) {
          const verseKey = `${book.id}:${chapter}:${verse.verseNum}`;
          verseTexts[verseKey] = verse.text;
          totalVerses++;

          for (const strongsId of verse.strongsIds) {
            uniqueStrongsIds.add(strongsId);

            if (!strongsIndex[strongsId]) {
              strongsIndex[strongsId] = [];
            }

            // Store as compact array: [bookId, chapter, verse]
            // Check for duplicates (same Strong's can appear multiple times in a verse)
            const exists = strongsIndex[strongsId].some(
              entry => entry[0] === book.id && entry[1] === chapter && entry[2] === verse.verseNum
            );

            if (!exists) {
              strongsIndex[strongsId].push([book.id, chapter, verse.verseNum]);
              totalStrongsEntries++;
            }
          }
        }
      } catch (error) {
        console.error(`Error processing ${chapterPath}:`, error.message);
      }
    }

    // Progress indicator
    process.stdout.write(`\rProcessed ${book.name} (${book.id}/66)...`);
  }

  console.log('\n');

  // Create output structure
  const index = {
    version: 1,
    generatedAt: new Date().toISOString(),
    stats: {
      totalVerses,
      totalStrongsEntries,
      uniqueStrongsIds: uniqueStrongsIds.size,
      hebrewIds: Array.from(uniqueStrongsIds).filter(id => id.startsWith('H')).length,
      greekIds: Array.from(uniqueStrongsIds).filter(id => id.startsWith('G')).length,
    },
    strongsIndex,
    verseTexts,
  };

  // Write to file
  const jsonOutput = JSON.stringify(index);
  fs.writeFileSync(OUTPUT_FILE, jsonOutput);

  const fileSizeKB = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2);
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('Strong\'s index built successfully!');
  console.log(`  - Total verses with Strong's: ${totalVerses}`);
  console.log(`  - Total Strong's entries: ${totalStrongsEntries}`);
  console.log(`  - Unique Strong's IDs: ${uniqueStrongsIds.size}`);
  console.log(`  - Hebrew IDs (H): ${index.stats.hebrewIds}`);
  console.log(`  - Greek IDs (G): ${index.stats.greekIds}`);
  console.log(`  - Output file: ${OUTPUT_FILE}`);
  console.log(`  - File size: ${fileSizeKB} KB`);
  console.log(`  - Build time: ${duration}s`);
}

buildStrongsIndex().catch(console.error);
