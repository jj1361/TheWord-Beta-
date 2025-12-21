/**
 * Convert RolandBible.xlsx to e-Sword ToolTip Tool NT format
 *
 * e-Sword ToolTip Tool NT expects:
 * - RTF format for content
 * - Division markers (÷) for chapters/sections
 * - Scripture references in format like "Gen 1:1" or "John 3:16"
 *
 * Output formats:
 * 1. .txt file with markers for importing into ToolTip Tool NT
 * 2. Plain text version for reference
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Book name mappings for e-Sword format
const BOOK_ABBREV = {
  'Genesis': 'Gen', 'Exodus': 'Exod', 'Leviticus': 'Lev', 'Numbers': 'Num', 'Deuteronomy': 'Deut',
  'Joshua': 'Josh', 'Judges': 'Judg', 'Ruth': 'Ruth', '1 Samuel': '1Sam', '2 Samuel': '2Sam',
  '1 Kings': '1Kgs', '2 Kings': '2Kgs', '1 Chronicles': '1Chr', '2 Chronicles': '2Chr',
  'Ezra': 'Ezra', 'Nehemiah': 'Neh', 'Esther': 'Esth', 'Job': 'Job', 'Psalms': 'Ps',
  'Proverbs': 'Prov', 'Ecclesiastes': 'Eccl', 'Song of Solomon': 'Song', 'Isaiah': 'Isa',
  'Jeremiah': 'Jer', 'Lamentations': 'Lam', 'Ezekiel': 'Ezek', 'Daniel': 'Dan',
  'Hosea': 'Hos', 'Joel': 'Joel', 'Amos': 'Amos', 'Obadiah': 'Obad', 'Jonah': 'Jonah',
  'Micah': 'Mic', 'Nahum': 'Nah', 'Habakkuk': 'Hab', 'Zephaniah': 'Zeph', 'Haggai': 'Hag',
  'Zechariah': 'Zech', 'Malachi': 'Mal', 'Matthew': 'Matt', 'Mark': 'Mark', 'Luke': 'Luke',
  'John': 'John', 'Acts': 'Acts', 'Romans': 'Rom', '1 Corinthians': '1Cor', '2 Corinthians': '2Cor',
  'Galatians': 'Gal', 'Ephesians': 'Eph', 'Philippians': 'Phil', 'Colossians': 'Col',
  '1 Thessalonians': '1Thess', '2 Thessalonians': '2Thess', '1 Timothy': '1Tim', '2 Timothy': '2Tim',
  'Titus': 'Titus', 'Philemon': 'Phlm', 'Hebrews': 'Heb', 'James': 'Jas', '1 Peter': '1Pet',
  '2 Peter': '2Pet', '1 John': '1John', '2 John': '2John', '3 John': '3John', 'Jude': 'Jude',
  'Revelation': 'Rev'
};

// Book order for sorting
const BOOK_ORDER = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah',
  'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
  '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
  '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

function convertToESword() {
  const workbook = XLSX.readFile('RolandBible.xlsx');

  // Collect all data from all sheets
  let allVerses = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Skip header row and empty rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row && row[0] && row[1] && row[2] && row[3]) {
        allVerses.push({
          book: row[0],
          chapter: parseInt(row[1]),
          verse: parseInt(row[2]),
          text: (row[3] || '').toString().trim(),
          references: (row[4] || '').toString().trim()
        });
      }
    }
  }

  console.log(`Total verses collected: ${allVerses.length}`);

  // Sort verses by book order, chapter, verse
  allVerses.sort((a, b) => {
    const bookOrderA = BOOK_ORDER.indexOf(a.book);
    const bookOrderB = BOOK_ORDER.indexOf(b.book);
    if (bookOrderA !== bookOrderB) return bookOrderA - bookOrderB;
    if (a.chapter !== b.chapter) return a.chapter - b.chapter;
    return a.verse - b.verse;
  });

  // Generate e-Sword ToolTip Tool NT format
  // Format: Each verse on a line, chapters marked with ÷
  let output = [];
  let currentBook = '';
  let currentChapter = 0;

  // Add header for the module
  output.push('#def description=Roland Bible - Filipino Translation');
  output.push('#def abbreviation=RolandBible');
  output.push('#def version=1.0');
  output.push('');

  for (const verse of allVerses) {
    // New book marker
    if (verse.book !== currentBook) {
      currentBook = verse.book;
      currentChapter = 0;
      output.push('');
      output.push(`÷÷÷${verse.book}`);
    }

    // New chapter marker
    if (verse.chapter !== currentChapter) {
      currentChapter = verse.chapter;
      output.push('');
      output.push(`÷${verse.book} ${verse.chapter}`);
    }

    // Verse text with reference formatting
    let verseText = `${verse.verse}. ${verse.text}`;

    // Add cross-references if present
    if (verse.references) {
      verseText += ` [${verse.references}]`;
    }

    output.push(verseText);
  }

  // Write the output file for ToolTip Tool NT
  const outputPath = 'RolandBible_eSword.txt';
  fs.writeFileSync(outputPath, output.join('\n'), 'utf8');
  console.log(`Written: ${outputPath}`);

  // Also create a simple RTF version
  let rtfOutput = [];
  rtfOutput.push('{\\rtf1\\ansi\\deff0');
  rtfOutput.push('{\\fonttbl{\\f0 Times New Roman;}}');
  rtfOutput.push('\\f0\\fs24');

  currentBook = '';
  currentChapter = 0;

  for (const verse of allVerses) {
    if (verse.book !== currentBook) {
      currentBook = verse.book;
      currentChapter = 0;
      rtfOutput.push('\\par\\par');
      rtfOutput.push(`\\b\\fs32 ${verse.book}\\b0\\fs24`);
    }

    if (verse.chapter !== currentChapter) {
      currentChapter = verse.chapter;
      rtfOutput.push('\\par\\par');
      rtfOutput.push(`\\b Chapter ${verse.chapter}\\b0`);
      rtfOutput.push('\\par');
    }

    // Escape RTF special characters
    let text = verse.text
      .replace(/\\/g, '\\\\')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}');

    let verseEntry = `\\b ${verse.verse}.\\b0  ${text}`;

    if (verse.references) {
      let refs = verse.references
        .replace(/\\/g, '\\\\')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}');
      verseEntry += ` \\i [${refs}]\\i0`;
    }

    rtfOutput.push(verseEntry);
    rtfOutput.push('\\par');
  }

  rtfOutput.push('}');

  const rtfPath = 'RolandBible_eSword.rtf';
  fs.writeFileSync(rtfPath, rtfOutput.join('\n'), 'utf8');
  console.log(`Written: ${rtfPath}`);

  // Create a JSON version for the bible-app
  const jsonData = {};
  for (const verse of allVerses) {
    const bookAbbrev = BOOK_ABBREV[verse.book] || verse.book;
    const key = `${bookAbbrev}.${verse.chapter}.${verse.verse}`;
    jsonData[key] = {
      text: verse.text,
      refs: verse.references || null
    };
  }

  const jsonPath = 'RolandBible.json';
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
  console.log(`Written: ${jsonPath}`);

  // Create summary
  const books = [...new Set(allVerses.map(v => v.book))];
  console.log(`\nSummary:`);
  console.log(`- Books: ${books.length}`);
  console.log(`- Total verses: ${allVerses.length}`);
  console.log(`- Books included: ${books.join(', ')}`);
}

convertToESword();
