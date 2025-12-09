export interface HebrewLetterInfo {
  letter: string;
  name: string;
  transliteration: string;
  number: number;
  meaning: string;
  definition: string;
  emoticon: string;
  imageUrl: string;
  ancientScript: string;
}

export const HEBREW_LETTERS: Record<string, HebrewLetterInfo> = {
  'א': {
    letter: 'א',
    name: 'Aleph',
    transliteration: 'aleph',
    number: 1,
    meaning: 'Ox, Leader, First',
    definition: 'Aleph represents strength, leadership, and primacy. It is the first letter of the Hebrew alphabet and symbolizes the oneness of God.',
    emoticon: '🐂',
    imageUrl: '/images/hebrew-letters/aleph.png',
    ancientScript: 'a'
  },
  'ב': {
    letter: 'ב',
    name: 'Bet',
    transliteration: 'bet',
    number: 2,
    meaning: 'House, Family',
    definition: 'Bet represents a house or dwelling place. It symbolizes family, protection, and the concept of being "inside" or sheltered.',
    emoticon: '🏠',
    imageUrl: '/images/hebrew-letters/bet.png',
    ancientScript: 'b'
  },
  'ג': {
    letter: 'ג',
    name: 'Gimel',
    transliteration: 'gimel',
    number: 3,
    meaning: 'Camel, Lift up',
    definition: 'Gimel represents a camel and symbolizes transportation, burden-bearing, and the act of giving or lifting up.',
    emoticon: '🐪',
    imageUrl: '/images/hebrew-letters/gimel.png',
    ancientScript: 'G'
  },
  'ד': {
    letter: 'ד',
    name: 'Dalet',
    transliteration: 'dalet',
    number: 4,
    meaning: 'Door, Path',
    definition: 'Dalet represents a door and symbolizes pathways, opportunities, and the choice between good and evil.',
    emoticon: '🚪',
    imageUrl: '/images/hebrew-letters/dalet.png',
    ancientScript: 'd'
  },
  'ה': {
    letter: 'ה',
    name: 'Hey',
    transliteration: 'hey',
    number: 5,
    meaning: 'Window, Behold, Reveal',
    definition: 'Hey represents a window and symbolizes revelation, breath, and the divine presence. It appears twice in the name of God (YHVH).',
    emoticon: '🪟',
    imageUrl: '/images/hebrew-letters/hey.png',
    ancientScript: 'H'
  },
  'ו': {
    letter: 'ו',
    name: 'Vav',
    transliteration: 'vav',
    number: 6,
    meaning: 'Hook, Nail, Connection',
    definition: 'Vav represents a hook or nail and symbolizes connection, continuation, and the relationship between heaven and earth.',
    emoticon: '',
    imageUrl: '/images/hebrew-letters/vav.png',
    ancientScript: 'W'
  },
  'ז': {
    letter: 'ז',
    name: 'Zayin',
    transliteration: 'zayin',
    number: 7,
    meaning: 'Weapon, Sword',
    definition: 'Zayin represents a weapon or sword and symbolizes spiritual warfare, defense, and the completion represented by the number seven.',
    emoticon: '⚔️',
    imageUrl: '/images/hebrew-letters/zayin.png',
    ancientScript: 'Z'
  },
  'ח': {
    letter: 'ח',
    name: 'Chet',
    transliteration: 'chet',
    number: 8,
    meaning: 'Fence, Separation',
    definition: 'Chet represents a fence and symbolizes protection, separation between holy and profane, and new beginnings.',
    emoticon: '🛡️',
    imageUrl: '/images/hebrew-letters/chet.png',
    ancientScript: 'X'
  },
  'ט': {
    letter: 'ט',
    name: 'Tet',
    transliteration: 'tet',
    number: 9,
    meaning: 'Serpent, Surround',
    definition: 'Tet represents a serpent and symbolizes transformation, hidden goodness, and the surrounding nature of divine providence.',
    emoticon: '🐍',
    imageUrl: '/images/hebrew-letters/tet.png',
    ancientScript: 'J'
  },
  'י': {
    letter: 'י',
    name: 'Yod',
    transliteration: 'yod',
    number: 10,
    meaning: 'Hand, Deed',
    definition: 'Yod represents a hand and symbolizes divine creative power, works, and deeds. It is the smallest letter but forms the basis of all other letters.',
    emoticon: '✋',
    imageUrl: '/images/hebrew-letters/yod.png',
    ancientScript: 'y'
  },
  'כ': {
    letter: 'כ',
    name: 'Kaf',
    transliteration: 'kaf',
    number: 20,
    meaning: 'Palm, Open hand',
    definition: 'Kaf represents an open palm and symbolizes receiving, giving, and the crown of kingship.',
    emoticon: '🤲',
    imageUrl: '/images/hebrew-letters/kaf.png',
    ancientScript: 'K'
  },
  'ך': {
    letter: 'ך',
    name: 'Kaf (final)',
    transliteration: 'kaf sofit',
    number: 20,
    meaning: 'Palm (final form)',
    definition: 'Final Kaf represents completion and the ultimate receiving of divine blessing.',
    emoticon: '🤲',
    imageUrl: '/images/hebrew-letters/kaf-final.png',
    ancientScript: 'K'
  },
  'ל': {
    letter: 'ל',
    name: 'Lamed',
    transliteration: 'lamed',
    number: 30,
    meaning: 'Shepherd staff, Learn',
    definition: 'Lamed represents a shepherd\'s staff and symbolizes teaching, learning, and aspiring upward toward heaven.',
    emoticon: '📚',
    imageUrl: '/images/hebrew-letters/lamed.png',
    ancientScript: 'L'
  },
  'מ': {
    letter: 'מ',
    name: 'Mem',
    transliteration: 'mem',
    number: 40,
    meaning: 'Water, Chaos',
    definition: 'Mem represents water and symbolizes life, chaos that can be ordered, and the revealed and concealed aspects of Torah.',
    emoticon: '💧',
    imageUrl: '/images/hebrew-letters/mem.png',
    ancientScript: 'M'
  },
  'ם': {
    letter: 'ם',
    name: 'Mem (final)',
    transliteration: 'mem sofit',
    number: 40,
    meaning: 'Water (final form)',
    definition: 'Final Mem represents closed or hidden wisdom, the concealed aspects of divine knowledge.',
    emoticon: '💧',
    imageUrl: '/images/hebrew-letters/mem-final.png',
    ancientScript: 'M'
  },
  'נ': {
    letter: 'נ',
    name: 'Nun',
    transliteration: 'nun',
    number: 50,
    meaning: 'Fish, Activity',
    definition: 'Nun represents a fish and symbolizes fruitfulness, multiplication, and faithfulness in the depths.',
    emoticon: '🐟',
    imageUrl: '/images/hebrew-letters/nun.png',
    ancientScript: 'N'
  },
  'ן': {
    letter: 'ן',
    name: 'Nun (final)',
    transliteration: 'nun sofit',
    number: 50,
    meaning: 'Fish (final form)',
    definition: 'Final Nun represents the faithful one who descends to serve, like Messiah who humbles himself.',
    emoticon: '🐟',
    imageUrl: '/images/hebrew-letters/nun-final.png',
    ancientScript: 'N'
  },
  'ס': {
    letter: 'ס',
    name: 'Samech',
    transliteration: 'samech',
    number: 60,
    meaning: 'Support, Protect',
    definition: 'Samech represents support and symbolizes divine providence, protection, and the cycle of life.',
    emoticon: '🛡️',
    imageUrl: '/images/hebrew-letters/samech.png',
    ancientScript: 'S'
  },
  'ע': {
    letter: 'ע',
    name: 'Ayin',
    transliteration: 'ayin',
    number: 70,
    meaning: 'Eye, See',
    definition: 'Ayin represents an eye and symbolizes sight, perception, and both physical and spiritual vision.',
    emoticon: '👁️',
    imageUrl: '/images/hebrew-letters/ayin.png',
    ancientScript: '['
  },
  'פ': {
    letter: 'פ',
    name: 'Pey',
    transliteration: 'pey',
    number: 80,
    meaning: 'Mouth, Speak',
    definition: 'Pey represents a mouth and symbolizes speech, communication, and the power of words to create or destroy.',
    emoticon: '👄',
    imageUrl: '/images/hebrew-letters/pey.png',
    ancientScript: 'P'
  },
  'ף': {
    letter: 'ף',
    name: 'Pey (final)',
    transliteration: 'pey sofit',
    number: 80,
    meaning: 'Mouth (final form)',
    definition: 'Final Pey represents internalized speech, meditation, and the word that dwells within.',
    emoticon: '👄',
    imageUrl: '/images/hebrew-letters/pey-final.png',
    ancientScript: 'P'
  },
  'צ': {
    letter: 'צ',
    name: 'Tzadi',
    transliteration: 'tzadi',
    number: 90,
    meaning: 'Fishhook, Righteous',
    definition: 'Tzadi represents a fishhook and symbolizes righteousness, the righteous person who catches souls for God.',
    emoticon: '🎣',
    imageUrl: '/images/hebrew-letters/tzadi.png',
    ancientScript: 'C'
  },
  'ץ': {
    letter: 'ץ',
    name: 'Tzadi (final)',
    transliteration: 'tzadi sofit',
    number: 90,
    meaning: 'Fishhook (final form)',
    definition: 'Final Tzadi represents the ultimate righteousness that will be revealed at the end of days.',
    emoticon: '🎣',
    imageUrl: '/images/hebrew-letters/tzadi-final.png',
    ancientScript: 'C'
  },
  'ק': {
    letter: 'ק',
    name: 'Qof',
    transliteration: 'qof',
    number: 100,
    meaning: 'Back of head, Cycle',
    definition: 'Qof represents the back of the head and symbolizes holiness, cycles of time, and what is behind or hidden.',
    emoticon: '🔄',
    imageUrl: '/images/hebrew-letters/qof.png',
    ancientScript: 'Q'
  },
  'ר': {
    letter: 'ר',
    name: 'Resh',
    transliteration: 'resh',
    number: 200,
    meaning: 'Head, First',
    definition: 'Resh represents a head and symbolizes leadership, beginning, and the choice between good (righteousness) and evil (wickedness).',
    emoticon: '👤',
    imageUrl: '/images/hebrew-letters/resh.png',
    ancientScript: 'R'
  },
  'ש': {
    letter: 'ש',
    name: 'Shin',
    transliteration: 'shin',
    number: 300,
    meaning: 'Teeth, Consume',
    definition: 'Shin represents teeth and symbolizes divine fire, the consuming power of God, and spiritual transformation.',
    emoticon: '🔥',
    imageUrl: '/images/hebrew-letters/shin.png',
    ancientScript: 'F'
  },
  'ת': {
    letter: 'ת',
    name: 'Tav',
    transliteration: 'tav',
    number: 400,
    meaning: 'Sign, Mark, Seal',
    definition: 'Tav represents a sign or mark and symbolizes truth, covenant, the seal of God, and completion of the alphabet.',
    emoticon: '❌',
    imageUrl: '/images/hebrew-letters/tav.png',
    ancientScript: 'T'
  }
};

// Helper function to get letter info by character
export const getHebrewLetterInfo = (letter: string): HebrewLetterInfo | null => {
  return HEBREW_LETTERS[letter] || null;
};

// Helper function to extract individual letters from Hebrew text
export const extractHebrewLetters = (hebrewText: string): string[] => {
  // Remove nikud (vowel points) and other diacritical marks
  const cleanText = hebrewText.replace(/[\u0591-\u05C7]/g, '');
  return cleanText.split('');
};
