/**
 * TSV Parser Utility for STEPBible Data
 * Parses Tab-Separated Values files from STEPBible-Data repository
 */

export interface TSVRow {
  [key: string]: string;
}

/**
 * Parse a TSV (Tab-Separated Values) file into an array of objects
 * @param tsvText - The raw TSV file content
 * @param skipHeaderLines - Number of initial lines to skip (for STEPBible header comments)
 * @returns Array of objects where keys are column headers
 */
export function parseTSV(tsvText: string, skipHeaderLines: number = 0): TSVRow[] {
  // Remove UTF-8 BOM if present
  const cleanText = tsvText.replace(/^\uFEFF/, '');

  const lines = cleanText.split('\n');
  const data: TSVRow[] = [];

  // Skip header comment lines
  let startLine = skipHeaderLines;

  // Find the header line (should contain column names separated by tabs)
  let headerLine = '';
  let headerIndex = startLine;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('=') && !line.startsWith('This licence')) {
      headerLine = lines[i];
      headerIndex = i;
      break;
    }
  }

  if (!headerLine) {
    throw new Error('Could not find header line in TSV file');
  }

  const headers = headerLine.split('\t').map(h => h.trim());

  // Parse data rows
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) continue;

    // Skip comment lines
    if (line.trim().startsWith('#')) continue;

    const values = line.split('\t');
    const row: TSVRow = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim() || '';
    });

    data.push(row);
  }

  return data;
}

/**
 * Parse STEPBible lexicon format (TBESH or TBESG)
 * These files have extensive header comments before the data
 * @param tsvText - The raw TSV file content
 * @returns Array of lexicon entries
 */
export function parseStepBibleLexicon(tsvText: string): TSVRow[] {
  // STEPBible files have many header lines before the data
  // The actual data starts with a line containing "eStrong#"
  const cleanText = tsvText.replace(/^\uFEFF/, '');
  const lines = cleanText.split('\n');

  // Find the line that starts with "eStrong#" (or "StrongsInt" for some files)
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('eStrong#') || line.startsWith('StrongsInt')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error('Could not find lexicon data header (eStrong#) in file');
  }

  const headers = lines[headerIndex].split('\t').map(h => h.trim());
  const data: TSVRow[] = [];

  // Parse data rows
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) continue;

    const values = line.split('\t');
    const row: TSVRow = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    // Only add rows that have an eStrong# value
    if (row['eStrong#'] || row['StrongsInt']) {
      data.push(row);
    }
  }

  return data;
}

/**
 * Parse STEPBible morphology documentation files (TEHMC or TEGMC)
 * These files contain explanations of morphology codes
 * @param text - The raw file content
 * @returns Map of code to explanation
 */
export function parseMorphologyDoc(text: string): Map<string, string> {
  const cleanText = text.replace(/^\uFEFF/, '');
  const lines = cleanText.split('\n');
  const morphMap = new Map<string, string>();

  for (const line of lines) {
    // Look for lines with format: "CODE = Explanation" or "CODE: Explanation"
    const match = line.match(/^([A-Z]:[^\s=:]+)\s*[=:]\s*(.+)$/);
    if (match) {
      const [, code, explanation] = match;
      morphMap.set(code.trim(), explanation.trim());
    }
  }

  return morphMap;
}
