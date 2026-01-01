/**
 * Noah Webster's 1828 Dictionary PDF to CSV Conversion Script
 *
 * This script extracts dictionary entries from the Noah Webster's 1828 Dictionary PDF
 * and converts them to a CSV file with columns: word, definition, part_of_speech, etymology
 *
 * Usage:
 *   1. First, install pdf-parse if not already installed:
 *      npm install pdf-parse
 *
 *   2. Run the script:
 *      node scripts/convertWebster1828.js
 *
 *   3. Output will be saved to: public/dictionaries/webster1828.csv
 *
 * Alternative: If pdf-parse doesn't work well, you can extract text using external tools:
 *   - macOS: Use "Preview" to export as text, or install poppler: brew install poppler
 *   - Then run: pdftotext -layout "NoahWebsters1828 Dictionary.pdf" webster1828.txt
 *   - Then use this script with the --from-text flag:
 *      node scripts/convertWebster1828.js --from-text webster1828.txt
 */

const fs = require('fs');
const path = require('path');

// Paths
const PDF_PATH = path.join(__dirname, '../../NoahWebsters1828 Dictionary.pdf');
const TEXT_PATH = path.join(__dirname, '../../webster1828.txt');
const OUTPUT_DIR = path.join(__dirname, '../public/dictionaries');
const OUTPUT_CSV = path.join(OUTPUT_DIR, 'webster1828.csv');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'webster1828.json');

/**
 * Escape CSV field value
 */
function escapeCSV(value) {
  if (!value) return '';
  // If the value contains commas, quotes, or newlines, wrap in quotes and escape existing quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

/**
 * Parse dictionary entries from extracted text
 *
 * Webster's 1828 dictionary format typically follows patterns like:
 * WORD, n. [etymology] Definition text...
 * WORD, v.t. Definition text...
 * WORD, a. Definition text...
 *
 * Parts of speech abbreviations:
 * n. = noun, v.t. = verb transitive, v.i. = verb intransitive,
 * a. = adjective, adv. = adverb, prep. = preposition, etc.
 */
function parseDictionaryText(text) {
  console.log(`Parsing ${text.length} characters of text...`);

  const entries = [];
  const lines = text.split('\n');

  // Pattern to match dictionary entry headers
  // Format: WORD, part_of_speech. [etymology] definition...
  // or: WORD. definition... (for some entries)
  const entryHeaderPattern = /^([A-Z][A-Z'\-]+(?:\s+[A-Z'\-]+)*),?\s*(n\.|v\.t\.|v\.i\.|v\.|a\.|adj\.|adv\.|prep\.|conj\.|pron\.|interj\.|pp\.|pret\.|\.)?\s*(.*)$/;

  // Alternative pattern for entries that start with capital words
  const altEntryPattern = /^([A-Z]{2,}[A-Z'\-]*)\s+(.*)$/;

  let currentEntry = null;
  let currentDefinition = '';
  let entriesFound = 0;
  let skippedLines = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and page numbers
    if (!line || /^\d+$/.test(line) || /^Page\s+\d+/i.test(line)) {
      skippedLines++;
      continue;
    }

    // Check if this line starts a new entry
    const match = entryHeaderPattern.exec(line);

    if (match && match[1].length >= 2) {
      // Save previous entry if exists
      if (currentEntry && currentDefinition.trim()) {
        const parsed = parseDefinition(currentDefinition);
        entries.push({
          word: currentEntry.word,
          partOfSpeech: currentEntry.partOfSpeech || parsed.partOfSpeech,
          etymology: parsed.etymology,
          definition: parsed.definition
        });
        entriesFound++;
      }

      // Start new entry
      currentEntry = {
        word: match[1].trim(),
        partOfSpeech: match[2] ? match[2].replace('.', '').trim() : ''
      };
      currentDefinition = match[3] || '';

    } else if (currentEntry) {
      // Continue building current definition
      currentDefinition += ' ' + line;
    }

    // Progress update every 10000 lines
    if (i % 10000 === 0 && i > 0) {
      console.log(`  Processed ${i} lines, found ${entriesFound} entries...`);
    }
  }

  // Don't forget the last entry
  if (currentEntry && currentDefinition.trim()) {
    const parsed = parseDefinition(currentDefinition);
    entries.push({
      word: currentEntry.word,
      partOfSpeech: currentEntry.partOfSpeech || parsed.partOfSpeech,
      etymology: parsed.etymology,
      definition: parsed.definition
    });
    entriesFound++;
  }

  console.log(`Parsed ${entries.length} dictionary entries`);
  console.log(`Skipped ${skippedLines} empty/page number lines`);

  return entries;
}

/**
 * Parse definition text to extract etymology and clean definition
 */
function parseDefinition(text) {
  let etymology = '';
  let definition = text.trim();
  let partOfSpeech = '';

  // Extract etymology if present (usually in brackets like [L. word] or [Fr. word])
  const etymologyMatch = definition.match(/^\[([^\]]+)\]\s*/);
  if (etymologyMatch) {
    etymology = etymologyMatch[1].trim();
    definition = definition.substring(etymologyMatch[0].length);
  }

  // Check for part of speech at start if not already captured
  const posMatch = definition.match(/^(n\.|v\.t\.|v\.i\.|v\.|a\.|adj\.|adv\.|prep\.|conj\.|pron\.|interj\.|pp\.|pret\.)\s*/i);
  if (posMatch) {
    partOfSpeech = posMatch[1].replace('.', '').toLowerCase();
    definition = definition.substring(posMatch[0].length);
  }

  // Clean up definition
  definition = definition
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/^\d+\.\s*/, '')  // Remove leading numbers
    .trim();

  return { etymology, definition, partOfSpeech };
}

/**
 * Alternative parsing for more structured PDF text
 * Some PDFs preserve formatting better with distinct patterns
 */
function parseStructuredDictionaryText(text) {
  console.log('Using structured parsing mode...');

  const entries = [];

  // Split on patterns that indicate new entries
  // Look for ALL-CAPS words at the start of lines
  const entryBlocks = text.split(/\n(?=[A-Z]{2,}[A-Z'\-]*(?:,|\s+[a-z]+\.))/);

  console.log(`Found ${entryBlocks.length} potential entry blocks`);

  for (const block of entryBlocks) {
    if (!block.trim()) continue;

    // Extract word (first all-caps sequence)
    const wordMatch = block.match(/^([A-Z][A-Z'\-]+(?:\s+[A-Z'\-]+)*)/);
    if (!wordMatch) continue;

    const word = wordMatch[1].trim();
    if (word.length < 2) continue;

    // Rest is the definition
    let rest = block.substring(wordMatch[0].length).trim();

    // Remove leading comma if present
    rest = rest.replace(/^,\s*/, '');

    const parsed = parseDefinition(rest);

    if (parsed.definition.length > 5) {  // Skip very short definitions
      entries.push({
        word,
        partOfSpeech: parsed.partOfSpeech,
        etymology: parsed.etymology,
        definition: parsed.definition
      });
    }
  }

  console.log(`Parsed ${entries.length} dictionary entries using structured mode`);
  return entries;
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractTextFromPDF(pdfPath) {
  console.log(`Extracting text from PDF: ${pdfPath}`);

  let pdfParse;
  try {
    pdfParse = require('pdf-parse');
  } catch (e) {
    console.error('\n❌ pdf-parse module not found!');
    console.log('\nTo install, run:');
    console.log('  npm install pdf-parse');
    console.log('\nOr use an external tool to extract text first:');
    console.log('  brew install poppler  (on macOS)');
    console.log('  pdftotext -layout "NoahWebsters1828 Dictionary.pdf" webster1828.txt');
    console.log('  node scripts/convertWebster1828.js --from-text webster1828.txt');
    process.exit(1);
  }

  const dataBuffer = fs.readFileSync(pdfPath);
  console.log(`PDF file size: ${(dataBuffer.length / 1024 / 1024).toFixed(2)} MB`);

  console.log('Parsing PDF (this may take a few minutes for large files)...');

  const options = {
    // Customize text extraction
    normalizeWhitespace: true,
    disableCombineTextItems: false
  };

  const data = await pdfParse(dataBuffer, options);

  console.log(`Extracted ${data.numpages} pages`);
  console.log(`Text length: ${data.text.length} characters`);

  return data.text;
}

/**
 * Write entries to CSV file
 */
function writeCSV(entries, outputPath) {
  console.log(`Writing ${entries.length} entries to CSV...`);

  // CSV header
  const header = 'word,part_of_speech,etymology,definition';

  // Build CSV rows
  const rows = entries.map(entry => {
    return [
      escapeCSV(entry.word),
      escapeCSV(entry.partOfSpeech),
      escapeCSV(entry.etymology),
      escapeCSV(entry.definition)
    ].join(',');
  });

  const csvContent = header + '\n' + rows.join('\n');
  fs.writeFileSync(outputPath, csvContent, 'utf-8');

  const fileSize = fs.statSync(outputPath).size;
  console.log(`✓ CSV written: ${outputPath}`);
  console.log(`  Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
}

/**
 * Write entries to JSON file (for easy lookup)
 */
function writeJSON(entries, outputPath) {
  console.log(`Writing ${entries.length} entries to JSON...`);

  // Create an indexed object for fast lookup
  const index = {};
  entries.forEach(entry => {
    const key = entry.word.toLowerCase();
    if (!index[key]) {
      index[key] = entry;
    } else {
      // If duplicate word, append definition
      if (Array.isArray(index[key])) {
        index[key].push(entry);
      } else {
        index[key] = [index[key], entry];
      }
    }
  });

  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2), 'utf-8');

  const fileSize = fs.statSync(outputPath).size;
  console.log(`✓ JSON written: ${outputPath}`);
  console.log(`  Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
}

/**
 * Main conversion function
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  Noah Webster\'s 1828 Dictionary PDF to CSV Converter     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const args = process.argv.slice(2);
  const fromText = args.includes('--from-text');
  const textFile = fromText ? args[args.indexOf('--from-text') + 1] : null;
  const structuredMode = args.includes('--structured');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }

  let text;

  if (fromText && textFile) {
    // Read from pre-extracted text file
    const textPath = path.isAbsolute(textFile) ? textFile : path.join(__dirname, '../..', textFile);
    console.log(`Reading from text file: ${textPath}`);

    if (!fs.existsSync(textPath)) {
      console.error(`❌ Text file not found: ${textPath}`);
      process.exit(1);
    }

    text = fs.readFileSync(textPath, 'utf-8');
    console.log(`Text file size: ${(text.length / 1024 / 1024).toFixed(2)} MB`);
  } else {
    // Extract from PDF
    if (!fs.existsSync(PDF_PATH)) {
      console.error(`❌ PDF file not found: ${PDF_PATH}`);
      console.log('\nPlease ensure the PDF file is located at:');
      console.log(`  ${PDF_PATH}`);
      process.exit(1);
    }

    text = await extractTextFromPDF(PDF_PATH);
  }

  // Parse the dictionary text
  let entries;
  if (structuredMode) {
    entries = parseStructuredDictionaryText(text);
  } else {
    entries = parseDictionaryText(text);

    // If we got very few entries, try structured mode
    if (entries.length < 100) {
      console.log('\nFew entries found, trying structured parsing mode...');
      entries = parseStructuredDictionaryText(text);
    }
  }

  if (entries.length === 0) {
    console.error('\n❌ No dictionary entries found!');
    console.log('\nPossible issues:');
    console.log('1. The PDF text extraction may not be working well');
    console.log('2. The PDF format may be different than expected');
    console.log('\nTry using pdftotext to extract the text first:');
    console.log('  brew install poppler');
    console.log('  pdftotext -layout "NoahWebsters1828 Dictionary.pdf" webster1828.txt');
    console.log('  node scripts/convertWebster1828.js --from-text webster1828.txt');
    process.exit(1);
  }

  // Write output files
  writeCSV(entries, OUTPUT_CSV);
  writeJSON(entries, OUTPUT_JSON);

  // Show sample entries
  console.log('\n📖 Sample entries:');
  const samples = entries.slice(0, 5);
  samples.forEach(entry => {
    const defPreview = entry.definition.length > 80
      ? entry.definition.substring(0, 80) + '...'
      : entry.definition;
    console.log(`  ${entry.word} (${entry.partOfSpeech || 'n/a'}): ${defPreview}`);
  });

  console.log('\n✅ Conversion complete!');
  console.log(`\nOutput files:`);
  console.log(`  CSV:  ${OUTPUT_CSV}`);
  console.log(`  JSON: ${OUTPUT_JSON}`);
  console.log(`\nTotal entries: ${entries.length}`);
}

// Handle async main
main().catch(err => {
  console.error('\n❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
