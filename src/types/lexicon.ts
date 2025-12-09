export interface StrongsEntry {
  id: string;
  word: string;
  pronunciation: string;
  transliteration: string;
  language: string;
  partOfSpeech: string;
  source: string;
  meaning: string;
  usage: string;
  // Additional fields from strongs-master dictionary
  lemma?: string;
  xlit?: string;
  pron?: string;
  kjv_def?: string;
  strongs_def?: string;
  derivation?: string;
  translit?: string;
}

export interface BDBEntry {
  id: string;
  word: string;
  partOfSpeech: string;
  definition: string;
  senses: BDBSense[];
}

export interface BDBSense {
  number?: string;
  definition: string;
  references?: string[];
  subSenses?: BDBSense[];
}

export interface LexiconData {
  strongs?: StrongsEntry;
  bdb?: BDBEntry;
  stepBible?: StepBibleEntry;
  ahlb?: AHLBEntry;
}

/**
 * STEPBible Lexicon Entry
 * From TBESH (Hebrew) and TBESG (Greek) lexicons
 * License: CC BY 4.0 - STEP Bible (www.STEPBible.org)
 */
export interface StepBibleEntry {
  eStrong: string;           // Extended Strong's (H0001, G0001)
  dStrong: string;           // Disambiguated (H0001A, H0001B)
  uStrong: string;           // Unified/most common form
  word: string;              // Hebrew/Greek text
  transliteration: string;   // Phonetic representation
  morph: string;             // Morphology code (H:N-M, G:V-PAI-3S)
  gloss: string;             // One-word English meaning
  meaning: string;           // Full definition (BDB for Hebrew, Abbott-Smith/LSJ for Greek)
}

/**
 * AHLB (Ancient Hebrew Lexicon of the Bible) Entry
 * From www.ancient-hebrew.org
 * Provides pictographic and etymological Hebrew word meanings
 */
export interface AHLBEntry {
  strongsId: string;          // Strong's number (H0001, H0024, etc.)
  translation: string;        // English translation/gloss
  transliteration: string;    // Phonetic representation
  wordType: string;           // masc., fem., or common
  definition: string;         // Full pictographic definition
  relationship: string;       // Relationship to root word
  kjvTranslations: string;    // KJV translation variations
  source: string;             // Attribution source
}
