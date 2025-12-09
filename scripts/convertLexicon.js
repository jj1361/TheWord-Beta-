/**
 * STEPBible Lexicon Conversion Script
 * Converts TBESH (Hebrew) and TBESG (Greek) TSV files to JSON format
 *
 * Usage:
 *   node scripts/convertLexicon.js hebrew
 *   node scripts/convertLexicon.js greek
 *   node scripts/convertLexicon.js all
 */

const fs = require('fs');
const path = require('path');

// Paths
const STEPBIBLE_DATA_PATH = path.join(__dirname, '../../STEPBible-Data-master');
const OUTPUT_PATH = path.join(__dirname, '../public/lexicon');

/**
 * Find the TBESH file (Hebrew lexicon)
 */
function findTBESHFile() {
  const lexiconDir = path.join(STEPBIBLE_DATA_PATH, 'Lexicons');
  const files = fs.readdirSync(lexiconDir);
  const tbeshFile = files.find(f => f.startsWith('TBESH'));
  if (!tbeshFile) {
    throw new Error('TBESH file not found in Lexicons directory');
  }
  return path.join(lexiconDir, tbeshFile);
}

/**
 * Find the TBESG file (Greek lexicon)
 */
function findTBESGFile() {
  const lexiconDir = path.join(STEPBIBLE_DATA_PATH, 'Lexicons');
  const files = fs.readdirSync(lexiconDir);
  const tbesgFile = files.find(f => f.startsWith('TBESG'));
  if (!tbesgFile) {
    throw new Error('TBESG file not found in Lexicons directory');
  }
  return path.join(lexiconDir, tbesgFile);
}

/**
 * Parse STEPBible lexicon TSV file
 */
function parseLexiconTSV(filePath) {
  console.log(`Reading file: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Remove UTF-8 BOM if present
  const cleanContent = content.replace(/^\uFEFF/, '');
  const lines = cleanContent.split('\n');

  // Find the actual data header line
  // It should contain: eStrong/eStrong#, dStrong, uStrong, Hebrew/Greek, Transliteration, Morph, Gloss
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Look for line with tab-separated columns including these key fields
    if ((line.startsWith('eStrong#\t') || line.startsWith('eStrong\t')) &&
        line.includes('Transliteration') &&
        line.includes('Gloss')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error('Could not find data header line in file');
  }

  const headers = lines[headerIndex].split('\t').map(h => h.trim());
  console.log(`Found ${headers.length} columns: ${headers.slice(0, 8).join(', ')}`);

  const entries = [];
  let skipped = 0;

  // Parse data rows
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split('\t');
    const entry = {};

    headers.forEach((header, idx) => {
      entry[header] = values[idx] || '';
    });

    const eStrong = entry['eStrong#'] || entry['eStrong'];

    // Only include entries with a valid eStrong value (H#### or G####)
    if (eStrong && eStrong.match(/^[HGA]\d+/)) {
      // Store both eStrong# and eStrong for compatibility
      if (!entry['eStrong#']) entry['eStrong#'] = eStrong;
      entries.push(entry);
    } else {
      skipped++;
    }
  }

  console.log(`Parsed ${entries.length} entries (skipped ${skipped} empty rows)`);
  return entries;
}

/**
 * Convert lexicon entries array to indexed object
 * Creates multiple indexes for fast lookup
 */
function createLexiconIndex(entries) {
  const index = {};

  entries.forEach(entry => {
    const eStrong = entry['eStrong#'] || entry['eStrong'];
    const dStrong = entry['dStrong'];
    const uStrong = entry['uStrong'];

    // Create a clean entry object
    // Handle both Hebrew (with "Meaning") and Greek (with "Abbott-Smith lexicon" as last column)
    const lastColumnKey = Object.keys(entry).find(k =>
      k.includes('Meaning') || k.includes('Abbott-Smith') || k.includes('lexicon')
    );

    const cleanEntry = {
      eStrong: eStrong,
      dStrong: dStrong,
      uStrong: uStrong,
      word: entry['Hebrew'] || entry['Greek'] || '',
      transliteration: entry['Transliteration'] || '',
      morph: entry['Morph'] || '',
      gloss: entry['Gloss'] || '',
      meaning: entry[lastColumnKey] || entry['Meaning'] || ''
    };

    // Index by eStrong (primary key)
    if (eStrong) {
      index[eStrong] = cleanEntry;
    }

    // Index by dStrong (for specific variant lookups)
    if (dStrong && dStrong !== '=') {
      index[dStrong] = cleanEntry;
    }

    // Index by uStrong (for unified lookups)
    if (uStrong && uStrong !== eStrong) {
      index[uStrong] = cleanEntry;
    }

    // Also index without leading zeros for backward compatibility
    // H0001 -> H1, G0001 -> G1
    if (eStrong && eStrong.match(/^[HG]\d+/)) {
      const prefix = eStrong[0];
      const num = parseInt(eStrong.slice(1));
      const shortForm = `${prefix}${num}`;
      if (shortForm !== eStrong) {
        index[shortForm] = cleanEntry;
      }
    }
  });

  return index;
}

/**
 * Convert Hebrew lexicon (TBESH)
 */
function convertHebrew() {
  console.log('\n=== Converting Hebrew Lexicon (TBESH) ===');
  const tbeshPath = findTBESHFile();
  const entries = parseLexiconTSV(tbeshPath);
  const index = createLexiconIndex(entries);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_PATH)) {
    fs.mkdirSync(OUTPUT_PATH, { recursive: true });
  }

  // Write JSON file
  const outputFile = path.join(OUTPUT_PATH, 'stepbible-hebrew.json');
  fs.writeFileSync(outputFile, JSON.stringify(index, null, 2));
  console.log(`✓ Written to: ${outputFile}`);

  // Get file size
  const stats = fs.statSync(outputFile);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`✓ File size: ${fileSizeMB} MB`);
  console.log(`✓ Total entries indexed: ${Object.keys(index).length}`);
}

/**
 * Convert Greek lexicon (TBESG)
 */
function convertGreek() {
  console.log('\n=== Converting Greek Lexicon (TBESG) ===');
  const tbesgPath = findTBESGFile();
  const entries = parseLexiconTSV(tbesgPath);
  const index = createLexiconIndex(entries);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_PATH)) {
    fs.mkdirSync(OUTPUT_PATH, { recursive: true });
  }

  // Write JSON file
  const outputFile = path.join(OUTPUT_PATH, 'stepbible-greek.json');
  fs.writeFileSync(outputFile, JSON.stringify(index, null, 2));
  console.log(`✓ Written to: ${outputFile}`);

  // Get file size
  const stats = fs.statSync(outputFile);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`✓ File size: ${fileSizeMB} MB`);
  console.log(`✓ Total entries indexed: ${Object.keys(index).length}`);
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  console.log('STEPBible Lexicon Converter');
  console.log('============================');
  console.log(`Data source: ${STEPBIBLE_DATA_PATH}`);
  console.log(`Output path: ${OUTPUT_PATH}`);

  try {
    if (command === 'hebrew' || command === 'all') {
      convertHebrew();
    }

    if (command === 'greek' || command === 'all') {
      convertGreek();
    }

    if (command !== 'hebrew' && command !== 'greek' && command !== 'all') {
      console.error(`\nUnknown command: ${command}`);
      console.log('\nUsage:');
      console.log('  node scripts/convertLexicon.js hebrew');
      console.log('  node scripts/convertLexicon.js greek');
      console.log('  node scripts/convertLexicon.js all');
      process.exit(1);
    }

    console.log('\n✓ Conversion complete!');
    console.log('\nNext steps:');
    console.log('1. Verify the output files in public/lexicon/');
    console.log('2. Update LexiconService to load these files');
    console.log('3. Test with existing Strong\'s references');
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
