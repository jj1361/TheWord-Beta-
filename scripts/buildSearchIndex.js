/**
 * Build script to generate pre-built search index JSON
 * Run with: node scripts/buildSearchIndex.js
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
const BIBLE_DATA_DIR = path.join(PUBLIC_DIR, 'xmlBible.org-main/KJV');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'search-index.json');

function getBookFolder(bookId, bookName) {
  const paddedId = bookId.toString().padStart(2, '0');
  return `${paddedId}-${bookName}`;
}

function getChapterFileName(chapterNum) {
  return `chapter-${chapterNum.toString().padStart(3, '0')}.xml`;
}

function parseXMLVerses(xmlContent) {
  const verses = [];
  // Simple regex-based XML parsing for verse elements
  const verseRegex = /<verse num="(\d+)">([\s\S]*?)<\/verse>/g;
  let match;

  while ((match = verseRegex.exec(xmlContent)) !== null) {
    const num = parseInt(match[1], 10);
    // Clean up the text - remove any nested tags and decode entities
    let text = match[2]
      .replace(/<[^>]*>/g, '') // Remove any nested tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();

    verses.push({ num, text });
  }

  return verses;
}

async function buildSearchIndex() {
  console.log('Building search index...');
  const startTime = Date.now();

  // Word index: word -> array of locations
  const wordIndex = {};
  // Verse cache: "bookId:chapter:verse" -> text
  const verseCache = {};

  let totalVerses = 0;
  let totalChapters = 0;

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
        console.warn(`Warning: Chapter file not found: ${chapterPath}`);
        continue;
      }

      try {
        // Try UTF-8 first (most common), fall back to UTF-16LE if needed
        let xmlContent;
        try {
          xmlContent = fs.readFileSync(chapterPath, 'utf8');
          // Remove BOM if present
          if (xmlContent.charCodeAt(0) === 0xFEFF) {
            xmlContent = xmlContent.slice(1);
          }
        } catch (e) {
          xmlContent = fs.readFileSync(chapterPath, 'utf16le');
        }
        const verses = parseXMLVerses(xmlContent);

        for (const verse of verses) {
          const cacheKey = `${book.id}:${chapter}:${verse.num}`;
          verseCache[cacheKey] = verse.text;
          totalVerses++;

          // Index each word
          const words = verse.text.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .split(/\s+/)
            .filter(w => w.length > 0);

          for (const word of words) {
            if (!wordIndex[word]) {
              wordIndex[word] = [];
            }
            // Store as compact array: [bookId, chapter, verse]
            wordIndex[word].push([book.id, chapter, verse.num]);
          }
        }

        totalChapters++;
      } catch (error) {
        console.error(`Error processing ${chapterPath}:`, error.message);
      }
    }

    // Progress indicator
    process.stdout.write(`\rProcessed ${book.name} (${book.id}/66)...`);
  }

  console.log('\n');

  // Build prefix index for fast partial matching
  const words = Object.keys(wordIndex);
  const prefixIndex = {};

  for (const word of words) {
    // Index prefixes of length 2-4
    for (let len = 2; len <= Math.min(4, word.length); len++) {
      const prefix = word.substring(0, len);
      if (!prefixIndex[prefix]) {
        prefixIndex[prefix] = [];
      }
      prefixIndex[prefix].push(word);
    }
  }

  // Create output structure
  const searchIndex = {
    version: 1,
    generatedAt: new Date().toISOString(),
    stats: {
      totalVerses,
      totalChapters,
      uniqueWords: words.length,
      prefixCount: Object.keys(prefixIndex).length,
    },
    wordIndex,
    verseCache,
    prefixIndex,
  };

  // Write to file
  const jsonOutput = JSON.stringify(searchIndex);
  fs.writeFileSync(OUTPUT_FILE, jsonOutput);

  const fileSizeKB = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2);
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('Search index built successfully!');
  console.log(`  - Total verses: ${totalVerses}`);
  console.log(`  - Total chapters: ${totalChapters}`);
  console.log(`  - Unique words: ${words.length}`);
  console.log(`  - Prefix entries: ${Object.keys(prefixIndex).length}`);
  console.log(`  - Output file: ${OUTPUT_FILE}`);
  console.log(`  - File size: ${fileSizeKB} KB`);
  console.log(`  - Build time: ${duration}s`);
}

buildSearchIndex().catch(console.error);
