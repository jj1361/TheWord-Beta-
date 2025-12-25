/**
 * Script to convert the Filipino/Tagalog Bible Excel file to JSON format
 *
 * Usage: node scripts/convertTagalogBible.js
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Book name mapping from Filipino to standard book IDs
const TAGALOG_BOOK_MAPPING = {
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
  'Ether': 17,
  'Job': 18,
  'Mga Awit': 19,
  'Mga Kawikaan': 20,
  'Ang Mangangaral': 21,
  'Awit ni Solomon': 22,
  'Isaias': 23,
  'Jeremias': 24,
  'Mga Panaghoy': 25,
  'Ezekiel': 26,
  "Dani'el": 27,
  'Hoshea': 28,
  'Joel': 29,
  'Amos': 30,
  'Obadayah': 31,
  'Jonah': 32,
  'Mikah': 33,
  'Nahum': 34,
  'Habakuk': 35,
  'Zephanayah': 36,
  'Haggai': 37,
  'Zekarayah': 38,
  'Malakias': 39,
  'Mateo': 40,
  'Marcos': 41,
  'Lukas': 42,
  'Juan': 43,
  'Mga Gawa': 44,
  'Roma': 45,
  '1 Corinto': 46,
  '2 Corinto': 47,
  'Galatia': 48,
  'Efeso': 49,
  'Pilipos': 50,
  'Colosas': 51,
  '1 Tesalonica': 52,
  '2 Tesalonica': 53,
  '1 Timoteo': 54,
  '2 Timoteo': 55,
  'Tito': 56,
  'Philemon': 57,
  'Hebreo': 58,
  'Santiago': 59,
  '1 Pedro': 60,
  '2 Pedro': 61,
  '1 John': 62,
  '2 John': 63,
  '3 John': 64,
  'Judas': 65,
  'Pahayag': 66,
  '1 Maccabeo': 67,
  '2 Maccabeo': 68,
};

// Sheet index to book ID mapping (for sheets without book name in first column)
const SHEET_TO_BOOK = {
  22: 22, // Song of Solomon (Sheet22 has undefined book name)
};

function main() {
  const excelPath = path.join(__dirname, '../../Bible Online in excel.xlsx');
  const outputDir = path.join(__dirname, '../public/translations/tagalog');

  console.log('Reading Excel file:', excelPath);
  const workbook = XLSX.readFile(excelPath);

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Process each sheet (book)
  const bibleData = {};
  let totalVerses = 0;
  let totalChapters = 0;

  workbook.SheetNames.forEach((sheetName, sheetIndex) => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length <= 1) {
      console.log(`Skipping empty sheet: ${sheetName}`);
      return;
    }

    // Get book name from first data row
    let bookName = data[1] && data[1][0];

    // Handle sheets with undefined book names
    if (!bookName && SHEET_TO_BOOK[sheetIndex + 1]) {
      // Get book name from mapping
      const bookId = SHEET_TO_BOOK[sheetIndex + 1];
      bookName = Object.keys(TAGALOG_BOOK_MAPPING).find(
        name => TAGALOG_BOOK_MAPPING[name] === bookId
      );
      if (!bookName) {
        bookName = 'Awit ni Solomon'; // Default for sheet 22
      }
    }

    if (!bookName) {
      console.log(`Skipping sheet ${sheetName}: No book name found`);
      return;
    }

    const bookId = TAGALOG_BOOK_MAPPING[bookName];
    if (!bookId) {
      console.log(`Unknown book name: ${bookName} in ${sheetName}`);
      return;
    }

    console.log(`Processing: ${bookName} (Book ID: ${bookId})`);

    // Group verses by chapter
    const chapters = {};

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const chapterNum = parseInt(row[1], 10);
      const verseNum = parseInt(row[2], 10);
      const text = (row[3] || '').trim();

      if (isNaN(chapterNum) || isNaN(verseNum) || !text) {
        continue;
      }

      if (!chapters[chapterNum]) {
        chapters[chapterNum] = [];
        totalChapters++;
      }

      chapters[chapterNum].push({
        num: verseNum,
        text: text
      });
      totalVerses++;
    }

    // Store book data
    bibleData[bookId] = {
      bookName: bookName,
      bookId: bookId,
      chapters: chapters
    };
  });

  // Write combined JSON file for the entire translation
  const outputFile = path.join(outputDir, 'tagalog-bible.json');
  fs.writeFileSync(outputFile, JSON.stringify(bibleData, null, 2));
  console.log(`\nWritten: ${outputFile}`);

  // Also write individual book files for lazy loading
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
    id: 'tagalog',
    name: 'Tagalog Bible',
    abbreviation: 'TAG',
    language: 'Filipino/Tagalog',
    languageCode: 'tl',
    books: Object.keys(bibleData).length,
    totalChapters: totalChapters,
    totalVerses: totalVerses,
    hasStrongsNumbers: false,
    hasInterlinear: false,
    generatedAt: new Date().toISOString()
  };

  const metadataFile = path.join(outputDir, 'metadata.json');
  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
  console.log(`Written: ${metadataFile}`);

  console.log('\n=== Summary ===');
  console.log(`Books: ${Object.keys(bibleData).length}`);
  console.log(`Chapters: ${totalChapters}`);
  console.log(`Verses: ${totalVerses}`);
}

main();
