import { StrongsEntry, BDBEntry, LexiconData, StepBibleEntry, AHLBEntry } from '../types/lexicon';

export class LexiconService {
  private strongsCache: Map<string, StrongsEntry> = new Map();
  private bdbCache: Map<string, BDBEntry> = new Map();
  private lexicalIndexCache: Map<string, string> = new Map(); // Strong's -> BDB ID
  private lexicalIndexLoaded = false;
  private greekDictionary: any = null;
  private hebrewDictionary: any = null;
  private dictionariesLoaded = false;

  // STEPBible data
  private stepBibleHebrew: Map<string, StepBibleEntry> = new Map();
  private stepBibleGreek: Map<string, StepBibleEntry> = new Map();
  private stepBibleLoaded = false;

  // AHLB (Ancient Hebrew Lexicon) data
  private ahlbHebrew: Map<string, AHLBEntry> = new Map();
  private ahlbLoaded = false;

  async loadStrongsDictionaries(): Promise<void> {
    if (this.dictionariesLoaded) return;

    try {
      // Load Greek dictionary
      const greekResponse = await fetch('/lexicon/strongs-greek-dictionary.js');
      const greekText = await greekResponse.text();
      // Extract the dictionary object from the JavaScript file
      const greekMatch = greekText.match(/var strongsGreekDictionary = (\{[\s\S]*\});/);
      if (greekMatch) {
        this.greekDictionary = JSON.parse(greekMatch[1]);
      }

      // Load Hebrew dictionary
      const hebrewResponse = await fetch('/lexicon/strongs-hebrew-dictionary.js');
      const hebrewText = await hebrewResponse.text();
      // Extract the dictionary object from the JavaScript file
      const hebrewMatch = hebrewText.match(/var strongsHebrewDictionary = (\{[\s\S]*\});/);
      if (hebrewMatch) {
        this.hebrewDictionary = JSON.parse(hebrewMatch[1]);
      }

      this.dictionariesLoaded = true;
    } catch (error) {
      console.error('Error loading Strong\'s dictionaries:', error);
    }
  }

  async loadStrongs(strongsNumber: string): Promise<StrongsEntry | null> {
    // Determine if this is Hebrew (H prefix) or Greek (G prefix)
    const isGreek = strongsNumber.startsWith('G');
    const isHebrew = strongsNumber.startsWith('H');

    // Normalize Strong's number
    let strongsId: string;

    if (isGreek) {
      const normalizedNumber = strongsNumber.replace(/^G/, '');
      strongsId = `G${normalizedNumber}`;
    } else if (isHebrew) {
      const normalizedNumber = strongsNumber.replace(/^H/, '');
      strongsId = `H${normalizedNumber}`;
    } else {
      strongsId = `H${strongsNumber}`;
    }

    // Check cache first
    if (this.strongsCache.has(strongsId)) {
      return this.strongsCache.get(strongsId)!;
    }

    try {
      // Load the strongs-master dictionaries
      await this.loadStrongsDictionaries();

      // Get the appropriate dictionary
      const dictionary = isGreek ? this.greekDictionary : this.hebrewDictionary;

      if (!dictionary) {
        console.warn(`Dictionary not loaded for ${strongsId}`);
        return null;
      }

      const entry = dictionary[strongsId];

      if (!entry) {
        console.warn(`Strong's entry ${strongsId} not found in dictionary`);
        return null;
      }

      // Build StrongsEntry from strongs-master data
      const strongsEntry: StrongsEntry = {
        id: strongsId,
        word: entry.lemma || '',
        pronunciation: entry.pron || '',
        transliteration: entry.xlit || entry.translit || '',
        language: isGreek ? 'greek' : 'hebrew',
        partOfSpeech: '',
        source: entry.derivation || '',
        meaning: entry.strongs_def || '',
        usage: entry.kjv_def || '',
        // Additional strongs-master fields
        lemma: entry.lemma,
        xlit: entry.xlit,
        pron: entry.pron,
        kjv_def: entry.kjv_def,
        strongs_def: entry.strongs_def,
        derivation: entry.derivation,
        translit: entry.translit
      };

      this.strongsCache.set(strongsId, strongsEntry);
      return strongsEntry;
    } catch (error) {
      console.error(`Error loading Strong's ${strongsId}:`, error);
      return null;
    }
  }

  async loadLexicalIndex(): Promise<void> {
    if (this.lexicalIndexLoaded) return;

    try {
      const response = await fetch('/lexicon/LexicalIndex.xml');
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      const entries = xmlDoc.querySelectorAll('entry');
      entries.forEach(entry => {
        const xref = entry.querySelector('xref');
        const strongAttr = xref?.getAttribute('strong');
        const bdbAttr = xref?.getAttribute('bdb');

        if (strongAttr && bdbAttr) {
          const strongsId = `H${strongAttr}`;
          this.lexicalIndexCache.set(strongsId, bdbAttr);
        }
      });

      this.lexicalIndexLoaded = true;
    } catch (error) {
      console.error('Error loading LexicalIndex:', error);
    }
  }

  async loadBDB(bdbId: string): Promise<BDBEntry | null> {
    // Check cache first
    if (this.bdbCache.has(bdbId)) {
      return this.bdbCache.get(bdbId)!;
    }

    try {
      const response = await fetch('/lexicon/BrownDriverBriggs.xml');
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Find the specific entry
      const entry = xmlDoc.querySelector(`entry[id="${bdbId}"]`);
      if (!entry) {
        console.warn(`BDB entry ${bdbId} not found`);
        return null;
      }

      const wElement = entry.querySelector('w');
      const posElement = entry.querySelector('pos');

      // Get full entry content by converting XML to readable text
      const entryClone = entry.cloneNode(true) as Element;

      // Remove status elements which are internal
      entryClone.querySelectorAll('status').forEach(el => el.remove());

      // Convert the entry to formatted text, preserving structure
      const fullDefinition = this.extractBDBText(entryClone);

      const bdbEntry: BDBEntry = {
        id: bdbId,
        word: wElement?.textContent || '',
        partOfSpeech: posElement?.textContent || '',
        definition: fullDefinition,
        senses: []
      };

      this.bdbCache.set(bdbId, bdbEntry);
      return bdbEntry;
    } catch (error) {
      console.error(`Error loading BDB ${bdbId}:`, error);
      return null;
    }
  }

  private extractBDBText(element: Element): string {
    let text = '';

    // Process child nodes
    element.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const content = node.textContent?.trim();
        if (content) {
          text += content + ' ';
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;

        // Skip certain elements
        if (el.tagName === 'status') return;

        // Add special formatting for certain elements
        if (el.tagName === 'sense') {
          const senseNum = el.getAttribute('n');
          if (senseNum) {
            text += `\n${senseNum}. `;
          }
        } else if (el.tagName === 'def') {
          text += el.textContent?.trim() + ' ';
          return;
        } else if (el.tagName === 'w') {
          text += el.textContent?.trim() + ' ';
        } else if (el.tagName === 'pos') {
          text += '[' + el.textContent?.trim() + '] ';
        } else if (el.tagName === 'ref') {
          // Add scripture references
          const refText = el.getAttribute('r') || el.textContent;
          if (refText) {
            text += refText + ' ';
          }
        }

        // Recursively process child elements
        text += this.extractBDBText(el);
      }
    });

    return text;
  }

  /**
   * Load STEPBible lexicon data (TBESH Hebrew and TBESG Greek)
   * License: CC BY 4.0 - STEP Bible (www.STEPBible.org)
   */
  async loadStepBibleLexicons(): Promise<void> {
    if (this.stepBibleLoaded) return;

    try {
      // Load Hebrew lexicon
      const hebrewResponse = await fetch('/lexicon/stepbible-hebrew.json');
      const hebrewData = await hebrewResponse.json();
      Object.entries(hebrewData).forEach(([key, value]) => {
        this.stepBibleHebrew.set(key, value as StepBibleEntry);
      });

      // Load Greek lexicon
      const greekResponse = await fetch('/lexicon/stepbible-greek.json');
      const greekData = await greekResponse.json();
      Object.entries(greekData).forEach(([key, value]) => {
        this.stepBibleGreek.set(key, value as StepBibleEntry);
      });

      this.stepBibleLoaded = true;
      console.log(`Loaded STEPBible lexicons: ${this.stepBibleHebrew.size} Hebrew entries, ${this.stepBibleGreek.size} Greek entries`);
    } catch (error) {
      console.error('Error loading STEPBible lexicons:', error);
    }
  }

  /**
   * Get STEPBible lexicon entry for a Strong's number
   * Supports multiple formats: H0001, H1, G0001, G1, H0001G (dStrong variants)
   */
  async getStepBibleEntry(strongsNumber: string): Promise<StepBibleEntry | null> {
    await this.loadStepBibleLexicons();

    const isGreek = strongsNumber.startsWith('G');
    const lexicon = isGreek ? this.stepBibleGreek : this.stepBibleHebrew;

    // Try exact match first
    let entry = lexicon.get(strongsNumber);
    if (entry) return entry;

    // Try with leading zeros (H1 -> H0001)
    if (strongsNumber.match(/^[HG]\d+$/)) {
      const prefix = strongsNumber[0];
      const num = strongsNumber.slice(1).padStart(4, '0');
      const paddedKey = `${prefix}${num}`;
      entry = lexicon.get(paddedKey);
      if (entry) return entry;
    }

    // Try without leading zeros (H0001 -> H1)
    if (strongsNumber.match(/^[HG]0+\d+$/)) {
      const prefix = strongsNumber[0];
      const num = parseInt(strongsNumber.slice(1));
      const shortKey = `${prefix}${num}`;
      entry = lexicon.get(shortKey);
      if (entry) return entry;
    }

    return null;
  }

  /**
   * Load AHLB (Ancient Hebrew Lexicon of the Bible) data
   * From www.ancient-hebrew.org
   */
  async loadAHLB(): Promise<void> {
    if (this.ahlbLoaded) return;

    try {
      const response = await fetch('/lexicon/ahlb-hebrew.json');
      const data = await response.json();
      Object.entries(data).forEach(([key, value]) => {
        this.ahlbHebrew.set(key, value as AHLBEntry);
      });

      this.ahlbLoaded = true;
      console.log(`Loaded AHLB lexicon: ${this.ahlbHebrew.size} Hebrew entries`);
    } catch (error) {
      console.error('Error loading AHLB lexicon:', error);
    }
  }

  /**
   * Get AHLB lexicon entry for a Strong's number
   * Only supports Hebrew (H prefix) words
   */
  async getAHLBEntry(strongsNumber: string): Promise<AHLBEntry | null> {
    // AHLB only has Hebrew entries
    if (!strongsNumber.startsWith('H')) {
      return null;
    }

    await this.loadAHLB();

    // Try exact match first
    let entry = this.ahlbHebrew.get(strongsNumber);
    if (entry) return entry;

    // Try with leading zeros (H1 -> H0001)
    if (strongsNumber.match(/^H\d+$/)) {
      const num = strongsNumber.slice(1).padStart(4, '0');
      const paddedKey = `H${num}`;
      entry = this.ahlbHebrew.get(paddedKey);
      if (entry) return entry;
    }

    // Try without leading zeros (H0001 -> H1)
    if (strongsNumber.match(/^H0+\d+$/)) {
      const num = parseInt(strongsNumber.slice(1));
      const shortKey = `H${num}`;
      entry = this.ahlbHebrew.get(shortKey);
      if (entry) return entry;
    }

    return null;
  }

  async getLexiconData(strongsNumber: string): Promise<LexiconData> {
    // Load STEPBible data (preferred source)
    const stepBible = await this.getStepBibleEntry(strongsNumber);

    // Load AHLB data (Ancient Hebrew Lexicon - pictographic meanings)
    const ahlb = await this.getAHLBEntry(strongsNumber);

    console.log(`[LexiconService] Looking up ${strongsNumber}`);
    console.log(`[LexiconService] STEPBible entry found:`, stepBible ? 'YES' : 'NO');
    console.log(`[LexiconService] AHLB entry found:`, ahlb ? 'YES' : 'NO');
    if (stepBible) {
      console.log(`[LexiconService] STEPBible data:`, {
        word: stepBible.word,
        gloss: stepBible.gloss,
        morph: stepBible.morph
      });
    }

    // Load legacy Strong's data (fallback)
    const strongs = await this.loadStrongs(strongsNumber);

    // Only load BDB for Hebrew words (not Greek)
    const isGreek = strongsNumber.startsWith('G');
    let bdb: BDBEntry | undefined;

    if (!isGreek) {
      // Load lexical index to map Strong's to BDB (Hebrew only)
      await this.loadLexicalIndex();

      const normalizedNumber = strongsNumber.replace(/^H/, '');
      const strongsId = `H${normalizedNumber}`;
      const bdbId = this.lexicalIndexCache.get(strongsId);

      if (bdbId) {
        const bdbEntry = await this.loadBDB(bdbId);
        bdb = bdbEntry || undefined;
      }
    }

    const result = {
      stepBible: stepBible || undefined,
      strongs: strongs || undefined,
      bdb,
      ahlb: ahlb || undefined
    };

    console.log(`[LexiconService] Returning:`, {
      hasStepBible: !!result.stepBible,
      hasStrongs: !!result.strongs,
      hasBdb: !!result.bdb,
      hasAhlb: !!result.ahlb
    });

    return result;
  }
}

export const lexiconService = new LexiconService();
