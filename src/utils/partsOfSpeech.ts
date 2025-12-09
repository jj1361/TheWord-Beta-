// Mapping of part of speech codes to their full names
// Based on PartsOfSpeech.xml from HebrewLexicon

export const PARTS_OF_SPEECH: Record<string, string> = {
  'a': 'Adjective',
  'a-f': 'Adjective Feminine',
  'a-gent': 'Gentilic Adjective',
  'a-m': 'Adjective Masculine',
  'adv': 'Adverb',
  'arbor': 'Arbor',
  'comm': 'Common',
  'conj': 'Conjunction',
  'cstr': 'Construct',
  'd': 'Demonstrative Pronoun',
  'da': 'Definite Article',
  'deae': 'Deity',
  'dei': 'Deity',
  'denom': 'Denominative',
  'div': 'Divine',
  'dp': 'Demonstrative Particle',
  'du': 'Dual',
  'enclitic part': 'Enclitic Particle',
  'epith': 'Epithet',
  'fl': 'Flumen',
  'flum': 'Flumen',
  'font': 'Fountain',
  'indef': 'Indefinite',
  'inj': 'Interjection',
  'i': 'Interrogative Pronoun',
  'mens': 'Month',
  'mont': 'Mountain',
  'np': 'Negative Particle',
  'n': 'Noun',
  'n-f': 'Noun Feminine',
  'n-m': 'Noun Masculine',
  'n-m-loc': 'Noun Masculine Location',
  'n-pr': 'Proper Name',
  'n-pr-f': 'Proper Name Feminine',
  'n-pr-loc': 'Proper Name Location',
  'n-pr-m': 'Proper Name Masculine',
  'p': 'Personal Pronoun',
  'pr': 'Proper',
  'prep': 'Preposition',
  'pron': 'Pronoun',
  'prt': 'Particle',
  'pt': 'Participle',
  'putei': 'Well',
  'r': 'Relative Pronoun',
  'rpt': 'Relative Particle',
  'rup': 'Cliff',
  'sg': 'Singular',
  'terr': 'Territory',
  'trib': 'Tribe',
  'urb': 'City',
  'v': 'Verb',
  'x': 'Indefinite Pronoun',
  // BDB uses different codes
  'N': 'Noun',
  'V': 'Verb',
  'Adj': 'Adjective',
  'Np': 'Proper Name',
  'n.m': 'Noun Masculine',
  'n.f': 'Noun Feminine',
  'n.[m.]': 'Noun Masculine',
  'n.[f.]': 'Noun Feminine',
  'n.pr.m': 'Proper Name Masculine',
  'n.pr.f': 'Proper Name Feminine',
  'vb': 'Verb',
  'adj': 'Adjective',
  'interj': 'Interjection',
  // Additional common variations
  'pos': 'Part of Speech'
};

export function getPartOfSpeechName(code: string): string {
  // Try exact match first
  if (PARTS_OF_SPEECH[code]) {
    return PARTS_OF_SPEECH[code];
  }

  // Try case-insensitive match
  const lowerCode = code.toLowerCase();
  const matchingKey = Object.keys(PARTS_OF_SPEECH).find(
    key => key.toLowerCase() === lowerCode
  );

  if (matchingKey) {
    return PARTS_OF_SPEECH[matchingKey];
  }

  // Return original code if no match found
  return code;
}
