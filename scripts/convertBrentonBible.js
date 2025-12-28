/**
 * Script to convert the Brenton Septuagint HTML files to JSON format
 * The Brenton Septuagint is an English translation of the Greek Old Testament (LXX)
 *
 * Usage: node scripts/convertBrentonBible.js
 */

const fs = require('fs');
const path = require('path');

// Book abbreviation to book ID and name mapping
// Standard Protestant OT books use IDs 1-39, Apocryphal books use IDs 70+
const BRENTON_BOOK_MAPPING = {
  'GEN': { id: 1, name: 'Genesis' },
  'EXO': { id: 2, name: 'Exodus' },
  'LEV': { id: 3, name: 'Leviticus' },
  'NUM': { id: 4, name: 'Numbers' },
  'DEU': { id: 5, name: 'Deuteronomy' },
  'JOS': { id: 6, name: 'Joshua' },
  'JDG': { id: 7, name: 'Judges' },
  'RUT': { id: 8, name: 'Ruth' },
  '1SA': { id: 9, name: '1 Samuel (Kings I)' },
  '2SA': { id: 10, name: '2 Samuel (Kings II)' },
  '1KI': { id: 11, name: '1 Kings (Kings III)' },
  '2KI': { id: 12, name: '2 Kings (Kings IV)' },
  '1CH': { id: 13, name: '1 Chronicles' },
  '2CH': { id: 14, name: '2 Chronicles' },
  'EZR': { id: 15, name: 'Ezra' },
  'NEH': { id: 16, name: 'Nehemiah' },
  // Note: Esther is ESG in Brenton (Greek Esther), we'll map to standard ID
  'JOB': { id: 18, name: 'Job' },
  'PSA': { id: 19, name: 'Psalms' },
  'PRO': { id: 20, name: 'Proverbs' },
  'ECC': { id: 21, name: 'Ecclesiastes' },
  'SNG': { id: 22, name: 'Song of Solomon' },
  'ISA': { id: 23, name: 'Isaiah (Esaias)' },
  'JER': { id: 24, name: 'Jeremiah (Jeremias)' },
  'LAM': { id: 25, name: 'Lamentations' },
  'EZK': { id: 26, name: 'Ezekiel (Jezekiel)' },
  // Note: Daniel is DAG in Brenton (Greek Daniel)
  'HOS': { id: 28, name: 'Hosea (Osee)' },
  'JOL': { id: 29, name: 'Joel' },
  'AMO': { id: 30, name: 'Amos' },
  'OBA': { id: 31, name: 'Obadiah (Obdias)' },
  'JON': { id: 32, name: 'Jonah (Jonas)' },
  'MIC': { id: 33, name: 'Micah (Micheas)' },
  'NAM': { id: 34, name: 'Nahum (Naum)' },
  'HAB': { id: 35, name: 'Habakkuk (Ambacum)' },
  'ZEP': { id: 36, name: 'Zephaniah (Sophonias)' },
  'HAG': { id: 37, name: 'Haggai (Aggaeus)' },
  'ZEC': { id: 38, name: 'Zechariah (Zacharias)' },
  'MAL': { id: 39, name: 'Malachi (Malachias)' },
  // Greek versions of canonical books
  'ESG': { id: 17, name: 'Esther (Greek)' },
  'DAG': { id: 27, name: 'Daniel (Greek)' },
  // Apocryphal/Deuterocanonical books (IDs 70+)
  'TOB': { id: 70, name: 'Tobit' },
  'JDT': { id: 71, name: 'Judith' },
  'WIS': { id: 72, name: 'Wisdom of Solomon' },
  'SIR': { id: 73, name: 'Sirach (Ecclesiasticus)' },
  'BAR': { id: 74, name: 'Baruch' },
  'LJE': { id: 75, name: 'Epistle of Jeremy' },
  'SUS': { id: 76, name: 'Susanna' },
  'BEL': { id: 77, name: 'Bel and the Dragon' },
  '1MA': { id: 78, name: '1 Maccabees' },
  '2MA': { id: 79, name: '2 Maccabees' },
  '1ES': { id: 80, name: '1 Esdras' },
  'MAN': { id: 81, name: 'Prayer of Manasseh' },
  '3MA': { id: 82, name: '3 Maccabees' },
  '4MA': { id: 83, name: '4 Maccabees' },
};

// Parse HTML and extract verses
function parseHtmlFile(htmlContent, bookAbbrev) {
  const verses = [];

  // Extract chapter number from chapterlabel
  const chapterMatch = htmlContent.match(/<div class='chapterlabel'[^>]*>\s*(\d+)\s*<\/div>/);
  if (!chapterMatch) {
    return { chapter: null, verses: [] };
  }
  const chapterNum = parseInt(chapterMatch[1], 10);

  // Find all verse spans and extract text
  // Pattern: <span class="verse" id="V1">1 </span>TEXT
  const verseRegex = /<span class="verse" id="V(\d+)">(\d+)\s*[^\s]*<\/span>([\s\S]*?)(?=<span class="verse"|<\/div>|<ul class='tnav'>)/g;

  let match;
  while ((match = verseRegex.exec(htmlContent)) !== null) {
    const verseNum = parseInt(match[2], 10);
    let verseText = match[3];

    // Clean up the verse text
    // Remove footnote markers and popups
    verseText = verseText.replace(/<a href="#FN\d+"[^>]*>[\s\S]*?<\/a>/g, '');
    // Remove span tags but keep content
    verseText = verseText.replace(/<span[^>]*>/g, '');
    verseText = verseText.replace(/<\/span>/g, '');
    // Remove any remaining HTML tags
    verseText = verseText.replace(/<[^>]+>/g, '');
    // Decode HTML entities
    verseText = verseText.replace(/&nbsp;/g, ' ');
    verseText = verseText.replace(/&#160;/g, ' ');
    verseText = verseText.replace(/&amp;/g, '&');
    verseText = verseText.replace(/&lt;/g, '<');
    verseText = verseText.replace(/&gt;/g, '>');
    verseText = verseText.replace(/&quot;/g, '"');
    verseText = verseText.replace(/&apos;/g, "'");
    // Normalize whitespace
    verseText = verseText.replace(/\s+/g, ' ').trim();

    if (verseText) {
      verses.push({
        num: verseNum,
        text: verseText
      });
    }
  }

  return { chapter: chapterNum, verses };
}

function main() {
  const sourceDir = path.join(__dirname, '../../eng-Brenton_html');
  const outputDir = path.join(__dirname, '../public/translations/brenton');

  console.log('Reading Brenton HTML files from:', sourceDir);

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get all HTML files
  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.htm'));

  // Group files by book
  const bookFiles = {};
  for (const file of files) {
    // Extract book abbreviation (e.g., GEN01.htm -> GEN, PSA001.htm -> PSA)
    const match = file.match(/^([A-Z0-9]+?)(\d+)\.htm$/i);
    if (match) {
      const bookAbbrev = match[1].toUpperCase();
      if (BRENTON_BOOK_MAPPING[bookAbbrev]) {
        if (!bookFiles[bookAbbrev]) {
          bookFiles[bookAbbrev] = [];
        }
        bookFiles[bookAbbrev].push(file);
      }
    }
  }

  // Process each book
  const bibleData = {};
  let totalVerses = 0;
  let totalChapters = 0;

  for (const [bookAbbrev, chapterFiles] of Object.entries(bookFiles)) {
    const bookInfo = BRENTON_BOOK_MAPPING[bookAbbrev];
    if (!bookInfo) continue;

    console.log(`Processing: ${bookInfo.name} (${bookAbbrev})`);

    const chapters = {};

    // Sort files numerically
    chapterFiles.sort((a, b) => {
      const numA = parseInt(a.match(/(\d+)\.htm$/)[1], 10);
      const numB = parseInt(b.match(/(\d+)\.htm$/)[1], 10);
      return numA - numB;
    });

    for (const file of chapterFiles) {
      const filePath = path.join(sourceDir, file);
      const htmlContent = fs.readFileSync(filePath, 'utf8');

      const { chapter, verses } = parseHtmlFile(htmlContent, bookAbbrev);

      if (chapter && verses.length > 0) {
        chapters[chapter] = verses;
        totalChapters++;
        totalVerses += verses.length;
      }
    }

    if (Object.keys(chapters).length > 0) {
      bibleData[bookInfo.id] = {
        bookName: bookInfo.name,
        bookId: bookInfo.id,
        chapters: chapters
      };
    }
  }

  // Write combined JSON file
  const outputFile = path.join(outputDir, 'brenton-bible.json');
  fs.writeFileSync(outputFile, JSON.stringify(bibleData, null, 2));
  console.log(`\nWritten: ${outputFile}`);

  // Write individual book files for lazy loading
  const booksDir = path.join(outputDir, 'books');
  if (!fs.existsSync(booksDir)) {
    fs.mkdirSync(booksDir, { recursive: true });
  }

  Object.keys(bibleData).forEach(bookId => {
    const bookFile = path.join(booksDir, `book-${bookId.toString().padStart(2, '0')}.json`);
    fs.writeFileSync(bookFile, JSON.stringify(bibleData[bookId], null, 2));
  });
  console.log(`Written individual book files to: ${booksDir}`);

  // Write metadata file
  const metadata = {
    id: 'brenton',
    name: 'Brenton Septuagint',
    abbreviation: 'LXX',
    language: 'English',
    languageCode: 'en',
    description: 'English translation of the Greek Septuagint (Old Testament) by Sir Lancelot Charles Lee Brenton, published in 1851',
    publishYear: 1851,
    books: Object.keys(bibleData).length,
    totalChapters: totalChapters,
    totalVerses: totalVerses,
    hasStrongsNumbers: false,
    hasInterlinear: false,
    isOldTestamentOnly: true,
    includesApocrypha: true,
    copyright: 'Public Domain',
    generatedAt: new Date().toISOString()
  };

  const metadataFile = path.join(outputDir, 'metadata.json');
  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
  console.log(`Written: ${metadataFile}`);

  console.log('\n=== Summary ===');
  console.log(`Books: ${Object.keys(bibleData).length}`);
  console.log(`Chapters: ${totalChapters}`);
  console.log(`Verses: ${totalVerses}`);

  // List books processed
  console.log('\nBooks processed:');
  Object.values(bibleData)
    .sort((a, b) => a.bookId - b.bookId)
    .forEach(book => {
      const chapterCount = Object.keys(book.chapters).length;
      console.log(`  ${book.bookId}. ${book.bookName} (${chapterCount} chapters)`);
    });
}

main();
