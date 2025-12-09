export interface PersonData {
  personLookup: string;
  status: string;
  personID: string;
  displayTitle: string;
  alsoCalled: string;
  slug: string;
  name: string;
  surname: string;
  isProperName: string;
  gender: string;
  birthYear: string;
  deathYear: string;
  birthPlace: string;
  deathPlace: string;
  memberOf: string;
  dictionaryLink: string;
  dictionaryText: string;
  events: string;
  eventGroups: string;
  verseCount: string;
  verses: string;
  mother: string;
  father: string;
  children: string;
  siblings: string;
  halfSiblingsSameMother: string;
  halfSiblingsSameFather: string;
  chaptersWritten: string;
  eastons: string;
}

export interface VerseData {
  osisRef: string;
  status: string;
  book: string;
  chapter: string;
  verseNum: string;
  verseText: string;
  mdText: string;
  people: string;
  peopleCount: string;
  places: string;
  placesCount: string;
  yearNum: string;
  quotesFrom: string;
  peopleGroups: string;
  eventsDescribed: string;
}

export interface BookData {
  osisName: string;
  bookOrder: string;
  bookName: string;
  bookDiv: string;
  testament: string;
  shortName: string;
  slug: string;
  yearWritten: string;
  placeWritten: string;
  chapters: string;
  chapterCount: string;
  verseCount: string;
  writers: string;
  peopleCount: string;
  placeCount: string;
}
