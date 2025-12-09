const fs = require('fs');
const path = require('path');

/**
 * Convert AHLB (Ancient Hebrew Lexicon of the Bible) CSV to JSON
 * Maps Strong's Hebrew numbers to AHLB lexicon entries
 */

/**
 * Parse the AHLB CSV file
 * Each entry contains: Translation, Definition, KJV Translations, and Strong's Hebrew #
 */
function parseAHLBCSV(filePath) {
  console.log(`Reading AHLB CSV: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf-8');

  // The CSV has PageNumber and Text columns where Text is a multiline quoted field
  // We need to properly parse CSV with quoted multiline fields

  let fullText = '';
  let inQuote = false;
  let currentField = '';
  let fieldCount = 0;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuote && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuote = !inQuote;
      }
    } else if (char === ',' && !inQuote) {
      // Field separator
      fieldCount++;
      currentField = '';
    } else if (char === '\n' && !inQuote) {
      // End of record
      if (fieldCount > 0) {
        // This was a data row, currentField has the text content
        fullText += currentField + ' ';
      }
      fieldCount = 0;
      currentField = '';
    } else if (fieldCount > 0) {
      // We're in the second field (Text column)
      currentField += char;
    }
  }

  console.log(`Extracted ${fullText.length} characters of text`);

  // Now parse entries by looking for Strong's references
  const entries = {};

  // Find all instances of Strong's Hebrew # followed by h.#### references
  const strongsPattern = /Strong's Hebrew #:\s*(h\.\d+(?:,?\s*h\.\d+)*)/g;
  let match;
  const strongsRefs = [];

  while ((match = strongsPattern.exec(fullText)) !== null) {
    const position = match.index;
    const strongsList = match[1];
    strongsRefs.push({ position, strongsList });
  }

  console.log(`Found ${strongsRefs.length} Strong's references`);

  // For each Strong's reference, extract the entry that comes before it
  strongsRefs.forEach((ref, index) => {
    // Get text before this Strong's reference
    const startPos = index > 0 ? strongsRefs[index - 1].position : 0;
    const textBefore = fullText.substring(startPos, ref.position);

    // Extract Strong's number(s)
    const strongsNums = ref.strongsList.match(/h\.(\d+)/g);
    if (!strongsNums) return;

    // Extract Translation (last occurrence before Strong's ref)
    const translationMatches = textBefore.match(/Translation:\s*([A-Z\.\s\-\(\)]+?)(?:\s+Definition:|$)/g);
    const lastTranslationMatch = translationMatches ? translationMatches[translationMatches.length - 1] : null;
    const translation = lastTranslationMatch ? lastTranslationMatch.replace(/Translation:\s*/, '').replace(/\s+Definition:.*/, '').trim() : '';

    // Extract Definition (last occurrence before Strong's ref)
    const definitionMatches = textBefore.match(/Definition:\s*([^]+?)(?:\s+(?:Relationship to Root:|KJV Translations:|Strong's))/g);
    const lastDefinitionMatch = definitionMatches ? definitionMatches[definitionMatches.length - 1] : null;
    const definition = lastDefinitionMatch ? lastDefinitionMatch.replace(/Definition:\s*/, '').replace(/\s+(?:Relationship to Root:|KJV Translations:).*/, '').trim() : '';

    // Extract KJV Translations (text between "KJV Translations:" and "Strong's Hebrew #:")
    const kjvMatch = textBefore.match(/KJV Translations:\s*([^]+?)(?=\s*$)/);
    const kjvTranslations = kjvMatch ? kjvMatch[1].trim() : '';

    // Extract Relationship to Root if present
    const relationshipMatch = textBefore.match(/Relationship to Root:\s*([^]+?)(?:\s+(?:KJV Translations:|Strong's))/);
    const relationship = relationshipMatch ? relationshipMatch[1].trim() : '';

    // Extract transliteration (format: "/ word-form)")
    const translitMatches = textBefore.match(/\/\s*([a-z\-\.]+)\)/g);
    const lastTranslitMatch = translitMatches ? translitMatches[translitMatches.length - 1] : null;
    const transliteration = lastTranslitMatch ? lastTranslitMatch.replace(/\/\s*/, '').replace(')', '').trim() : '';

    // Extract word type
    const typeMatches = textBefore.match(/\(\s*(masc\.|fem\.|common)/g);
    const lastTypeMatch = typeMatches ? typeMatches[typeMatches.length - 1] : null;
    const wordType = lastTypeMatch ? lastTypeMatch.replace(/\(\s*/, '').trim() : '';

    // Create entry for each Strong's number
    strongsNums.forEach(strongsRef => {
      const strongsNum = strongsRef.replace('h.', '');
      const paddedNum = strongsNum.padStart(4, '0');
      const strongsId = `H${paddedNum}`;

      if (translation || definition) {
        entries[strongsId] = {
          strongsId,
          translation,
          transliteration,
          wordType,
          definition,
          relationship,
          kjvTranslations,
          source: 'AHLB (Ancient Hebrew Lexicon of the Bible)'
        };
      }
    });
  });

  console.log(`Parsed ${Object.keys(entries).length} AHLB entries`);
  return entries;
}

/**
 * Main conversion function
 */
function convertAHLB() {
  const inputFile = path.join(__dirname, '../../ahlb_pages.csv');
  const outputDir = path.join(__dirname, '../public/lexicon');
  const outputFile = path.join(outputDir, 'ahlb-hebrew.json');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Parse the CSV
  const entries = parseAHLBCSV(inputFile);

  // Write JSON output
  console.log(`Writing output to: ${outputFile}`);
  fs.writeFileSync(outputFile, JSON.stringify(entries, null, 2), 'utf-8');

  // Print statistics
  const fileSize = fs.statSync(outputFile).size;
  const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

  console.log('\n✅ AHLB Conversion Complete!');
  console.log(`   Entries: ${Object.keys(entries).length}`);
  console.log(`   Output: ${outputFile}`);
  console.log(`   Size: ${fileSizeMB} MB`);

  // Show sample entries
  const sampleKeys = Object.keys(entries).slice(0, 3);
  console.log('\n📖 Sample entries:');
  sampleKeys.forEach(key => {
    const entry = entries[key];
    console.log(`   ${key}: ${entry.translation} - ${entry.definition.substring(0, 60)}...`);
  });
}

// Run conversion
convertAHLB();
