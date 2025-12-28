/**
 * Voice Command Service
 * Parses voice input and matches it to application commands
 */

import {
  ParsedVoiceCommand,
  VoiceCommandPattern,
} from '../types/voiceCommands';
import { parseScriptureReference } from '../utils/scriptureParser';
import { BIBLE_BOOKS } from '../types/bible';

// Spoken number words to digits mapping
const SPOKEN_NUMBERS: Record<string, number> = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
  'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
  'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
  'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
  'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'twenty-one': 21, 'twenty one': 21, 'twenty-two': 22, 'twenty two': 22,
  'twenty-three': 23, 'twenty three': 23, 'twenty-four': 24, 'twenty four': 24,
  'twenty-five': 25, 'twenty five': 25, 'twenty-six': 26, 'twenty six': 26,
  'twenty-seven': 27, 'twenty seven': 27, 'twenty-eight': 28, 'twenty eight': 28,
  'twenty-nine': 29, 'twenty nine': 29, 'thirty': 30,
  'thirty-one': 31, 'thirty one': 31, 'forty': 40, 'fifty': 50,
  'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
  'hundred': 100, 'one hundred': 100,
  'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
  'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
};

// Book name variations for voice recognition (spoken forms)
const SPOKEN_BOOK_NAMES: Record<string, number> = {
  // Handle common spoken variations
  'genesis': 1, 'exodus': 2, 'leviticus': 3, 'numbers': 4, 'deuteronomy': 5,
  'joshua': 6, 'judges': 7, 'ruth': 8,
  'first samuel': 9, '1st samuel': 9, 'one samuel': 9,
  'second samuel': 10, '2nd samuel': 10, 'two samuel': 10,
  'first kings': 11, '1st kings': 11, 'one kings': 11,
  'second kings': 12, '2nd kings': 12, 'two kings': 12,
  'first chronicles': 13, '1st chronicles': 13, 'one chronicles': 13,
  'second chronicles': 14, '2nd chronicles': 14, 'two chronicles': 14,
  'ezra': 15, 'nehemiah': 16, 'esther': 17, 'job': 18,
  'psalms': 19, 'psalm': 19, 'proverbs': 20, 'ecclesiastes': 21,
  'song of solomon': 22, 'song of songs': 22, 'songs': 22,
  'isaiah': 23, 'jeremiah': 24, 'lamentations': 25, 'ezekiel': 26,
  'daniel': 27, 'hosea': 28, 'joel': 29, 'amos': 30,
  'obadiah': 31, 'jonah': 32, 'micah': 33, 'nahum': 34,
  'habakkuk': 35, 'zephaniah': 36, 'haggai': 37, 'zechariah': 38, 'malachi': 39,
  // New Testament
  'matthew': 40, 'mark': 41, 'luke': 42, 'john': 43, 'acts': 44,
  'romans': 45,
  'first corinthians': 46, '1st corinthians': 46, 'one corinthians': 46,
  'second corinthians': 47, '2nd corinthians': 47, 'two corinthians': 47,
  'galatians': 48, 'ephesians': 49, 'philippians': 50, 'colossians': 51,
  'first thessalonians': 52, '1st thessalonians': 52, 'one thessalonians': 52,
  'second thessalonians': 53, '2nd thessalonians': 53, 'two thessalonians': 53,
  'first timothy': 54, '1st timothy': 54, 'one timothy': 54,
  'second timothy': 55, '2nd timothy': 55, 'two timothy': 55,
  'titus': 56, 'philemon': 57, 'hebrews': 58, 'james': 59,
  'first peter': 60, '1st peter': 60, 'one peter': 60,
  'second peter': 61, '2nd peter': 61, 'two peter': 61,
  'first john': 62, '1st john': 62, 'one john': 62,
  'second john': 63, '2nd john': 63, 'two john': 63,
  'third john': 64, '3rd john': 64, 'three john': 64,
  'jude': 65, 'revelation': 66, 'revelations': 66,
};

/**
 * Convert spoken number words to digits
 */
function parseSpokenNumber(text: string): number | null {
  const normalized = text.toLowerCase().trim();

  // Check if it's already a number
  const directNum = parseInt(normalized, 10);
  if (!isNaN(directNum)) {
    return directNum;
  }

  // Check spoken number mapping
  if (SPOKEN_NUMBERS[normalized] !== undefined) {
    return SPOKEN_NUMBERS[normalized];
  }

  return null;
}

/**
 * Convert spoken numbers in text to digits
 */
function convertSpokenNumbersToDigits(text: string): string {
  let result = text.toLowerCase();

  // Sort by length descending to match longer phrases first
  const sortedKeys = Object.keys(SPOKEN_NUMBERS).sort((a, b) => b.length - a.length);

  for (const word of sortedKeys) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, String(SPOKEN_NUMBERS[word]));
  }

  return result;
}

/**
 * Parse book name from spoken text
 */
function parseSpokenBookName(text: string): { bookId: number; bookName: string } | null {
  const normalized = text.toLowerCase().trim();

  // Check spoken book names first
  if (SPOKEN_BOOK_NAMES[normalized] !== undefined) {
    const bookId = SPOKEN_BOOK_NAMES[normalized];
    const book = BIBLE_BOOKS.find(b => b.id === bookId);
    return book ? { bookId, bookName: book.name } : null;
  }

  // Try standard book lookup
  const book = BIBLE_BOOKS.find(b =>
    b.name.toLowerCase() === normalized ||
    b.name.toLowerCase().startsWith(normalized)
  );

  if (book) {
    return { bookId: book.id, bookName: book.name };
  }

  return null;
}

/**
 * Voice command patterns - ordered by priority (higher first)
 */
const NAVIGATION_PATTERNS: VoiceCommandPattern[] = [
  // Scripture navigation with book, chapter, and verse
  // "go to John 3:16", "read Genesis chapter 1 verse 1", "navigate to Psalm 23"
  {
    patterns: [
      /^(?:go\s+to|navigate\s+to|open|read|take\s+me\s+to|show\s+me)\s+(.+?)(?:\s+chapter)?\s+(\d+)\s*(?::|verse)\s*(\d+)$/i,
      /^(?:go\s+to|navigate\s+to|open|read|take\s+me\s+to|show\s+me)\s+(.+?)\s+(\d+)\s*:\s*(\d+)$/i,
    ],
    action: 'NAVIGATE_TO_SCRIPTURE',
    priority: 100,
    extractParams: (match) => {
      const bookText = match[1];
      const chapter = parseInt(match[2], 10);
      const verse = parseInt(match[3], 10);

      // Try to parse book name
      const bookInfo = parseSpokenBookName(bookText);
      if (bookInfo) {
        return {
          bookId: bookInfo.bookId,
          bookName: bookInfo.bookName,
          chapter,
          verse,
        };
      }

      // Fallback to scripture parser
      const parsed = parseScriptureReference(`${bookText} ${chapter}:${verse}`);
      if (parsed) {
        return {
          bookId: parsed.bookId,
          bookName: parsed.bookName,
          chapter: parsed.chapter,
          verse: parsed.verse,
        };
      }

      return { rawInput: match[0] };
    },
  },

  // Scripture navigation with book and chapter only
  // "go to John 3", "read Genesis chapter 1"
  // Note: Uses negative lookahead to avoid matching "read verse X" which should be handled by READ_VERSE
  {
    patterns: [
      /^(?:go\s+to|navigate\s+to|open|take\s+me\s+to|show\s+me)\s+(.+?)(?:\s+chapter)?\s+(\d+)$/i,
      /^read\s+(?!verse\b|verses\b)(.+?)(?:\s+chapter)?\s+(\d+)$/i,
    ],
    action: 'NAVIGATE_TO_SCRIPTURE',
    priority: 90,
    extractParams: (match) => {
      const bookText = match[1];
      const chapter = parseInt(match[2], 10);

      const bookInfo = parseSpokenBookName(bookText);
      if (bookInfo) {
        return {
          bookId: bookInfo.bookId,
          bookName: bookInfo.bookName,
          chapter,
        };
      }

      const parsed = parseScriptureReference(`${bookText} ${chapter}`);
      if (parsed) {
        return {
          bookId: parsed.bookId,
          bookName: parsed.bookName,
          chapter: parsed.chapter,
        };
      }

      return { rawInput: match[0] };
    },
  },

  // Natural book references without "go to" prefix
  // "John 3:16", "Genesis 1"
  {
    patterns: [
      /^(.+?)\s+(\d+)\s*:\s*(\d+)$/i,
      /^(.+?)\s+chapter\s+(\d+)\s*(?:verse)?\s*(\d+)?$/i,
    ],
    action: 'NAVIGATE_TO_SCRIPTURE',
    priority: 80,
    extractParams: (match) => {
      const bookText = match[1];
      const chapter = parseInt(match[2], 10);
      const verse = match[3] ? parseInt(match[3], 10) : undefined;

      const bookInfo = parseSpokenBookName(bookText);
      if (bookInfo) {
        return {
          bookId: bookInfo.bookId,
          bookName: bookInfo.bookName,
          chapter,
          verse,
        };
      }

      return { rawInput: match[0] };
    },
  },

  // Chapter navigation
  // "next chapter", "previous chapter", "go to next chapter"
  {
    patterns: [
      /^(?:go\s+to\s+)?next\s+chapter$/i,
      /^forward(?:\s+a)?\s+chapter$/i,
      /^chapter\s+forward$/i,
    ],
    action: 'NEXT_CHAPTER',
    priority: 70,
  },
  {
    patterns: [
      /^(?:go\s+to\s+)?(?:previous|prior|last)\s+chapter$/i,
      /^back(?:\s+a)?\s+chapter$/i,
      /^chapter\s+back$/i,
    ],
    action: 'PREVIOUS_CHAPTER',
    priority: 70,
  },

  // Verse navigation
  // "go to verse 5", "verse 10", "jump to verse 3"
  {
    patterns: [
      /^(?:go\s+to\s+|jump\s+to\s+)?verse\s+(\d+)$/i,
      /^verse\s+number\s+(\d+)$/i,
    ],
    action: 'GO_TO_VERSE',
    priority: 60,
    extractParams: (match) => ({
      verse: parseInt(match[1], 10),
    }),
  },

  // History navigation
  // "go back", "go forward"
  {
    patterns: [
      /^go\s+back$/i,
      /^back$/i,
      /^previous\s+location$/i,
    ],
    action: 'GO_BACK',
    priority: 50,
  },
  {
    patterns: [
      /^go\s+forward$/i,
      /^forward$/i,
      /^next\s+location$/i,
    ],
    action: 'GO_FORWARD',
    priority: 50,
  },
];

// Mode toggle patterns
const MODE_PATTERNS: VoiceCommandPattern[] = [
  // Webcam
  {
    patterns: [
      /^(?:open|show|enable|turn\s+on|start)(?:\s+the)?\s+(?:webcam|camera|video)$/i,
    ],
    action: 'ENABLE_WEBCAM',
    priority: 60,
  },
  {
    patterns: [
      /^(?:close|hide|disable|turn\s+off|stop)(?:\s+the)?\s+(?:webcam|camera|video)$/i,
    ],
    action: 'DISABLE_WEBCAM',
    priority: 60,
  },
  {
    patterns: [
      /^toggle(?:\s+the)?\s+(?:webcam|camera|video)$/i,
    ],
    action: 'TOGGLE_WEBCAM',
    priority: 60,
  },

  // Dark mode
  {
    patterns: [
      /^(?:enable|turn\s+on|switch\s+to|activate)(?:\s+the)?\s+dark\s+(?:mode|theme)$/i,
      /^dark\s+mode(?:\s+on)?$/i,
    ],
    action: 'ENABLE_DARK_MODE',
    priority: 60,
  },
  {
    patterns: [
      /^(?:disable|turn\s+off|switch\s+to|deactivate)(?:\s+the)?\s+(?:light\s+(?:mode|theme)|dark\s+mode\s+off)$/i,
      /^light\s+mode(?:\s+on)?$/i,
      /^dark\s+mode\s+off$/i,
    ],
    action: 'DISABLE_DARK_MODE',
    priority: 60,
  },
  {
    patterns: [
      /^toggle(?:\s+the)?\s+(?:dark\s+mode|theme)$/i,
    ],
    action: 'TOGGLE_DARK_MODE',
    priority: 60,
  },

  // Study mode
  {
    patterns: [
      /^(?:enable|turn\s+on|start|activate)(?:\s+the)?\s+study\s+mode$/i,
      /^study\s+mode(?:\s+on)?$/i,
    ],
    action: 'ENABLE_STUDY_MODE',
    priority: 60,
  },
  {
    patterns: [
      /^(?:disable|turn\s+off|stop|deactivate)(?:\s+the)?\s+study\s+mode$/i,
      /^study\s+mode\s+off$/i,
    ],
    action: 'DISABLE_STUDY_MODE',
    priority: 60,
  },
  {
    patterns: [
      /^toggle(?:\s+the)?\s+study\s+mode$/i,
    ],
    action: 'TOGGLE_STUDY_MODE',
    priority: 60,
  },

  // Youth mode
  {
    patterns: [
      /^(?:enable|turn\s+on|start|activate)(?:\s+the)?\s+(?:youth|kids?|children(?:'s)?)\s+mode$/i,
      /^(?:youth|kids?)\s+mode(?:\s+on)?$/i,
    ],
    action: 'ENABLE_YOUTH_MODE',
    priority: 60,
  },
  {
    patterns: [
      /^(?:disable|turn\s+off|stop|deactivate)(?:\s+the)?\s+(?:youth|kids?|children(?:'s)?)\s+mode$/i,
      /^(?:youth|kids?)\s+mode\s+off$/i,
    ],
    action: 'DISABLE_YOUTH_MODE',
    priority: 60,
  },
  {
    patterns: [
      /^toggle(?:\s+the)?\s+(?:youth|kids?)\s+mode$/i,
    ],
    action: 'TOGGLE_YOUTH_MODE',
    priority: 60,
  },

  // Fullscreen
  {
    patterns: [
      /^(?:enable|enter|go)(?:\s+to)?\s+full\s*screen$/i,
      /^full\s*screen(?:\s+mode)?(?:\s+on)?$/i,
    ],
    action: 'ENABLE_FULLSCREEN',
    priority: 60,
  },
  {
    patterns: [
      /^(?:disable|exit|leave)(?:\s+the)?\s+full\s*screen$/i,
      /^full\s*screen(?:\s+mode)?\s+off$/i,
    ],
    action: 'DISABLE_FULLSCREEN',
    priority: 60,
  },
];

// Person profile patterns
const PERSON_PATTERNS: VoiceCommandPattern[] = [
  {
    patterns: [
      /^(?:show|open|display)(?:\s+the)?\s+profile\s+(?:of|for)\s+(.+)$/i,
      /^(?:who\s+is|tell\s+me\s+about|show\s+me)\s+(.+)$/i,
      /^(.+?)(?:'s)?\s+profile$/i,
    ],
    action: 'SHOW_PERSON_PROFILE',
    priority: 50,
    extractParams: (match) => ({
      personName: match[1].trim(),
    }),
  },
];

// Study tool patterns
const STUDY_PATTERNS: VoiceCommandPattern[] = [
  // Strong's lookup
  {
    patterns: [
      /^(?:look\s+up|search\s+for|find|show)(?:\s+the)?\s+(?:strong(?:'s)?(?:\s+number)?)\s*([hg]?\d+)$/i,
      /^strong(?:'s)?\s*([hg]?\d+)$/i,
      /^([hg]\d+)$/i,
    ],
    action: 'LOOKUP_STRONGS',
    priority: 60,
    extractParams: (match) => ({
      strongsId: match[1].toUpperCase(),
    }),
  },

  // Text search
  {
    patterns: [
      /^search\s+(?:for\s+)?(.+)$/i,
      /^find\s+(?:the\s+(?:word|phrase)\s+)?(.+)$/i,
    ],
    action: 'SEARCH_TEXT',
    priority: 40,
    extractParams: (match) => ({
      searchQuery: match[1].trim(),
    }),
  },

  // Bookmark
  {
    patterns: [
      /^(?:add|create|save)(?:\s+a)?\s+bookmark$/i,
      /^bookmark(?:\s+this)?$/i,
    ],
    action: 'ADD_BOOKMARK',
    priority: 50,
  },

  // Note
  {
    patterns: [
      /^(?:add|create|make|write)(?:\s+a)?\s+note$/i,
      /^(?:take|new)\s+note$/i,
    ],
    action: 'CREATE_NOTE',
    priority: 50,
  },

  // Footnotes
  {
    patterns: [
      /^(?:show|display|enable)(?:\s+the)?\s+(?:footnotes?|marginal\s+notes?)$/i,
      /^footnotes?\s+on$/i,
    ],
    action: 'SHOW_FOOTNOTES',
    priority: 50,
  },
  {
    patterns: [
      /^(?:hide|disable)(?:\s+the)?\s+(?:footnotes?|marginal\s+notes?)$/i,
      /^footnotes?\s+off$/i,
    ],
    action: 'HIDE_FOOTNOTES',
    priority: 50,
  },

  // Cross references
  {
    patterns: [
      /^(?:show|display|open)(?:\s+the)?\s+cross\s*references?(?:\s+for)?(?:\s+verse)?\s*(\d+)?$/i,
      /^cross\s*references?(?:\s+for)?(?:\s+verse)?\s*(\d+)?$/i,
    ],
    action: 'SHOW_CROSS_REFERENCES',
    priority: 55,
    extractParams: (match) => {
      if (match[1]) {
        return { verse: parseInt(match[1], 10) };
      }
      return {};
    },
  },

  // Interlinear view
  {
    patterns: [
      /^(?:show|display|open)(?:\s+the)?\s+interlinear(?:\s+view)?(?:\s+for)?(?:\s+verse)?\s*(\d+)?$/i,
      /^interlinear(?:\s+view)?(?:\s+for)?(?:\s+verse)?\s*(\d+)?$/i,
    ],
    action: 'SHOW_INTERLINEAR',
    priority: 55,
    extractParams: (match) => {
      if (match[1]) {
        return { verse: parseInt(match[1], 10) };
      }
      return {};
    },
  },
];

// Text size patterns
const TEXT_SIZE_PATTERNS: VoiceCommandPattern[] = [
  {
    patterns: [
      /^(?:increase|make\s+(?:the\s+)?(?:text|font)\s+(?:bigger|larger)|zoom\s+in)$/i,
      /^bigger\s+(?:text|font)$/i,
      /^larger\s+(?:text|font)$/i,
    ],
    action: 'INCREASE_TEXT_SIZE',
    priority: 50,
  },
  {
    patterns: [
      /^(?:decrease|make\s+(?:the\s+)?(?:text|font)\s+(?:smaller)|zoom\s+out)$/i,
      /^smaller\s+(?:text|font)$/i,
    ],
    action: 'DECREASE_TEXT_SIZE',
    priority: 50,
  },
  {
    patterns: [
      /^(?:set\s+)?(?:text|font)\s+size\s+(?:to\s+)?(\d+)$/i,
    ],
    action: 'SET_TEXT_SIZE',
    priority: 50,
    extractParams: (match) => ({
      textSize: parseInt(match[1], 10),
    }),
  },
];

// Reading (TTS) patterns - higher priority than navigation to catch "read verse X" before "read [book] X"
const READING_PATTERNS: VoiceCommandPattern[] = [
  // Read chapter
  {
    patterns: [
      /^read(?:\s+this)?\s+chapter$/i,
      /^read(?:\s+the)?\s+(?:whole|entire|full)\s+chapter$/i,
    ],
    action: 'READ_CHAPTER',
    priority: 95,
  },

  // Read current verse - must be higher priority than navigation
  {
    patterns: [
      /^read(?:\s+this)?\s+verse$/i,
      /^read\s+verse\s+(\d+)$/i,
    ],
    action: 'READ_VERSE',
    priority: 95,
    extractParams: (match) => {
      if (match[1]) {
        return { verse: parseInt(match[1], 10) };
      }
      return {};
    },
  },

  // Read verse range - must be higher priority than navigation
  {
    patterns: [
      /^read\s+verses?\s+(\d+)\s+(?:to|through|-)\s+(\d+)$/i,
      /^read\s+from\s+verse\s+(\d+)\s+to\s+(\d+)$/i,
    ],
    action: 'READ_VERSE_RANGE',
    priority: 95,
    extractParams: (match) => ({
      verse: parseInt(match[1], 10),
      endVerse: parseInt(match[2], 10),
    }),
  },

  // Read entire book
  {
    patterns: [
      /^read(?:\s+the)?\s+(?:whole|entire|full)\s+book$/i,
      /^read(?:\s+this)?\s+book$/i,
    ],
    action: 'READ_BOOK',
    priority: 95,
  },

  // Control reading
  {
    patterns: [
      /^stop(?:\s+reading)?$/i,
      /^cancel(?:\s+reading)?$/i,
    ],
    action: 'STOP_READING',
    priority: 70,
  },
  {
    patterns: [
      /^pause(?:\s+reading)?$/i,
    ],
    action: 'PAUSE_READING',
    priority: 70,
  },
  {
    patterns: [
      /^(?:resume|continue)(?:\s+reading)?$/i,
    ],
    action: 'RESUME_READING',
    priority: 70,
  },

  // Repeat count
  {
    patterns: [
      /^repeat\s+(\d+)\s+times?$/i,
      /^read\s+(\d+)\s+times?$/i,
      /^set\s+repeat(?:\s+count)?\s+(?:to\s+)?(\d+)$/i,
    ],
    action: 'SET_REPEAT_COUNT',
    priority: 60,
    extractParams: (match) => ({
      repeatCount: parseInt(match[1], 10),
    }),
  },
];

// Combine all patterns
const ALL_PATTERNS: VoiceCommandPattern[] = [
  ...NAVIGATION_PATTERNS,
  ...MODE_PATTERNS,
  ...PERSON_PATTERNS,
  ...STUDY_PATTERNS,
  ...TEXT_SIZE_PATTERNS,
  ...READING_PATTERNS,
].sort((a, b) => (b.priority || 0) - (a.priority || 0));

/**
 * Parse a voice command transcript into an action
 */
export function parseVoiceCommand(transcript: string): ParsedVoiceCommand {
  // Normalize the transcript
  let normalized = transcript.trim().toLowerCase();

  // Remove common filler words and punctuation
  normalized = normalized
    .replace(/[.,!?]/g, '')
    .replace(/\bplease\b/gi, '')
    .replace(/\bcan\s+you\b/gi, '')
    .replace(/\bcould\s+you\b/gi, '')
    .replace(/\bwould\s+you\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove wake word prefix if present (e.g., "hey bible", "ok bible", "bible")
  normalized = normalized
    .replace(/^(?:hey|ok|okay|hi)\s+bible\s*/i, '')
    .replace(/^bible\s+/i, '')
    .trim();

  // Convert spoken numbers to digits
  const withDigits = convertSpokenNumbersToDigits(normalized);

  // Try each pattern
  for (const pattern of ALL_PATTERNS) {
    for (const regex of pattern.patterns) {
      // Try both original and converted versions
      let match = withDigits.match(regex);
      if (!match) {
        match = normalized.match(regex);
      }

      if (match) {
        const params = pattern.extractParams
          ? pattern.extractParams(match, transcript)
          : {};

        return {
          action: pattern.action,
          params,
          confidence: 1.0,
          rawTranscript: transcript,
        };
      }
    }
  }

  // No pattern matched - try fallback parsing
  return fallbackParse(transcript, normalized);
}

/**
 * Fallback parsing for commands that don't match standard patterns
 */
function fallbackParse(transcript: string, normalized: string): ParsedVoiceCommand {
  // Try to parse as a scripture reference directly
  const withDigits = convertSpokenNumbersToDigits(normalized);
  const scriptureRef = parseScriptureReference(withDigits);

  if (scriptureRef) {
    return {
      action: 'NAVIGATE_TO_SCRIPTURE',
      params: {
        bookId: scriptureRef.bookId,
        bookName: scriptureRef.bookName,
        chapter: scriptureRef.chapter,
        verse: scriptureRef.verse,
      },
      confidence: 0.7,
      rawTranscript: transcript,
    };
  }

  // Check if it's just a book name (go to first chapter)
  const bookInfo = parseSpokenBookName(normalized);
  if (bookInfo) {
    return {
      action: 'NAVIGATE_TO_SCRIPTURE',
      params: {
        bookId: bookInfo.bookId,
        bookName: bookInfo.bookName,
        chapter: 1,
      },
      confidence: 0.6,
      rawTranscript: transcript,
    };
  }

  return {
    action: 'UNKNOWN',
    params: { rawInput: transcript },
    confidence: 0,
    rawTranscript: transcript,
  };
}

/**
 * Get suggestions for what the user might have meant
 */
export function getSuggestions(transcript: string): string[] {
  const suggestions: string[] = [];
  const normalized = transcript.toLowerCase();

  // Check for partial book name matches
  for (const book of BIBLE_BOOKS) {
    if (book.name.toLowerCase().includes(normalized) ||
        normalized.includes(book.name.toLowerCase().substring(0, 3))) {
      suggestions.push(`Go to ${book.name} 1`);
      if (suggestions.length >= 3) break;
    }
  }

  // Add common command suggestions
  if (normalized.includes('camera') || normalized.includes('web')) {
    suggestions.push('Open webcam');
    suggestions.push('Close webcam');
  }

  if (normalized.includes('dark') || normalized.includes('light')) {
    suggestions.push('Enable dark mode');
    suggestions.push('Disable dark mode');
  }

  if (normalized.includes('read')) {
    suggestions.push('Read this chapter');
    suggestions.push('Read verse 1 to 10');
  }

  return suggestions.slice(0, 5);
}

/**
 * Get human-readable description of a command
 */
export function getCommandDescription(command: ParsedVoiceCommand): string {
  const { action, params } = command;

  switch (action) {
    case 'NAVIGATE_TO_SCRIPTURE':
      if (params.verse) {
        return `Navigate to ${params.bookName} ${params.chapter}:${params.verse}`;
      }
      return `Navigate to ${params.bookName} ${params.chapter}`;
    case 'NEXT_CHAPTER':
      return 'Go to next chapter';
    case 'PREVIOUS_CHAPTER':
      return 'Go to previous chapter';
    case 'GO_TO_VERSE':
      return `Go to verse ${params.verse}`;
    case 'GO_BACK':
      return 'Go back';
    case 'GO_FORWARD':
      return 'Go forward';
    case 'ENABLE_WEBCAM':
      return 'Enable webcam';
    case 'DISABLE_WEBCAM':
      return 'Disable webcam';
    case 'TOGGLE_WEBCAM':
      return 'Toggle webcam';
    case 'ENABLE_DARK_MODE':
      return 'Enable dark mode';
    case 'DISABLE_DARK_MODE':
      return 'Disable dark mode';
    case 'TOGGLE_DARK_MODE':
      return 'Toggle dark mode';
    case 'ENABLE_STUDY_MODE':
      return 'Enable study mode';
    case 'DISABLE_STUDY_MODE':
      return 'Disable study mode';
    case 'TOGGLE_STUDY_MODE':
      return 'Toggle study mode';
    case 'ENABLE_YOUTH_MODE':
      return 'Enable youth mode';
    case 'DISABLE_YOUTH_MODE':
      return 'Disable youth mode';
    case 'TOGGLE_YOUTH_MODE':
      return 'Toggle youth mode';
    case 'ENABLE_FULLSCREEN':
      return 'Enter fullscreen';
    case 'DISABLE_FULLSCREEN':
      return 'Exit fullscreen';
    case 'SHOW_PERSON_PROFILE':
      return `Show profile of ${params.personName}`;
    case 'LOOKUP_STRONGS':
      return `Look up Strong's ${params.strongsId}`;
    case 'SEARCH_TEXT':
      return `Search for "${params.searchQuery}"`;
    case 'ADD_BOOKMARK':
      return 'Add bookmark';
    case 'CREATE_NOTE':
      return 'Create note';
    case 'INCREASE_TEXT_SIZE':
      return 'Increase text size';
    case 'DECREASE_TEXT_SIZE':
      return 'Decrease text size';
    case 'SET_TEXT_SIZE':
      return `Set text size to ${params.textSize}`;
    case 'READ_CHAPTER':
      return 'Read chapter';
    case 'READ_VERSE':
      return params.verse ? `Read verse ${params.verse}` : 'Read current verse';
    case 'READ_VERSE_RANGE':
      return `Read verses ${params.verse} to ${params.endVerse}`;
    case 'READ_BOOK':
      return 'Read entire book';
    case 'STOP_READING':
      return 'Stop reading';
    case 'PAUSE_READING':
      return 'Pause reading';
    case 'RESUME_READING':
      return 'Resume reading';
    case 'SET_REPEAT_COUNT':
      return `Set repeat count to ${params.repeatCount}`;
    case 'SHOW_FOOTNOTES':
      return 'Show footnotes';
    case 'HIDE_FOOTNOTES':
      return 'Hide footnotes';
    case 'SHOW_CROSS_REFERENCES':
      return params.verse ? `Show cross references for verse ${params.verse}` : 'Show cross references';
    case 'SHOW_INTERLINEAR':
      return params.verse ? `Show interlinear for verse ${params.verse}` : 'Show interlinear view';
    default:
      return `Unknown command: ${command.rawTranscript}`;
  }
}

export const voiceCommandService = {
  parseVoiceCommand,
  getSuggestions,
  getCommandDescription,
  parseSpokenNumber,
  convertSpokenNumbersToDigits,
  parseSpokenBookName,
};
