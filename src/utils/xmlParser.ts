import { KJVVerse, KJVsVerse, InterlinearVerse, Word, KJVsPhrase } from '../types/bible';

export class XMLParser {
  static parseKJVChapter(xmlText: string): KJVVerse[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const verses: KJVVerse[] = [];

    const verseElements = xmlDoc.querySelectorAll('verse');
    verseElements.forEach((verseEl) => {
      const num = parseInt(verseEl.getAttribute('num') || '0');
      const text = verseEl.textContent || '';
      verses.push({ num, text: text.trim() });
    });

    return verses;
  }

  static parseKJVsChapter(xmlText: string): KJVsVerse[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const verses: KJVsVerse[] = [];

    const verseElements = xmlDoc.querySelectorAll('verse');
    verseElements.forEach((verseEl) => {
      const num = parseInt(verseEl.getAttribute('num') || '0');
      const phrases: KJVsPhrase[] = [];

      const phraseElements = verseEl.querySelectorAll('phrase');
      phraseElements.forEach((phraseEl) => {
        let strongsAttr = phraseEl.getAttribute('strongs') || '';
        let rawText = phraseEl.textContent || '';

        // Handle corrupted strongs attributes like "8737% spirit" or "8737% and a contrite"
        // Extract text that appears after the % in the strongs attribute
        const strongsTextMatch = strongsAttr.match(/^(\d+%)\s+(.+)$/);
        if (strongsTextMatch) {
          // Text is embedded in strongs attribute: extract it
          const embeddedText = strongsTextMatch[2];
          strongsAttr = strongsTextMatch[1]; // Keep just the number%
          // Prepend embedded text to the existing text content
          rawText = embeddedText + (rawText ? ' ' + rawText : '');
        }

        // Remove corrupted Strong's references like {H8799% or {G1234% from text
        const text = rawText.replace(/\{[HG]\d+%/g, '').trim();
        phrases.push({ strongs: strongsAttr, text });
      });

      verses.push({ num, phrases });
    });

    return verses;
  }

  static parseInterlinearChapter(xmlText: string): InterlinearVerse[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const verses: InterlinearVerse[] = [];

    const verseElements = xmlDoc.querySelectorAll('verse');
    verseElements.forEach((verseEl) => {
      const num = parseInt(verseEl.getAttribute('num') || '0');
      const words: Word[] = [];

      const wordElements = verseEl.querySelectorAll('word');
      wordElements.forEach((wordEl) => {
        const wordNum = parseInt(wordEl.getAttribute('num') || '0');
        // Note: Some Hebrew particles/prepositions have no Strong's number
        const strongsRaw = wordEl.querySelector('strongs')?.textContent || '';
        const strongs = strongsRaw.trim();
        const pos = wordEl.querySelector('pos')?.textContent || '';
        const parse = wordEl.querySelector('parse')?.textContent || '';
        const transliteration = wordEl.querySelector('transliteration')?.textContent || '';
        const hebrew = wordEl.querySelector('hebrew')?.textContent || '';
        const greek = wordEl.querySelector('greek')?.textContent || '';
        const english = wordEl.querySelector('english')?.textContent || '';

        const word: Word = {
          num: wordNum,
          strongs,
          pos,
          parse,
          transliteration,
          english: english.trim(),
        };

        if (hebrew) word.hebrew = hebrew;
        if (greek) word.greek = greek;

        words.push(word);
      });

      verses.push({ num, words });
    });

    return verses;
  }
}
