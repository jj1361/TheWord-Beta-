# STEPBible Data Integration Analysis

## Executive Summary

The STEPBible-Data-master directory contains comprehensive, production-ready biblical text and lexical data that can significantly enhance your Bible app with:
- **Enhanced Strong's Concordance** with disambiguated meanings
- **Complete Hebrew & Greek Lexicons** (BDB and LSJ)
- **Morphological Analysis** for every word
- **Proper Name Database** with genealogies and descriptions
- **Multiple Text Editions** for textual criticism
- **All under CC BY 4.0 License** (free to use with attribution)

## Current App Architecture

Your app currently uses:
- **XML-based Bible text** from xmlBible.org
- **Strong's dictionaries** (Greek/Hebrew) from strongs-master
- **BDB Lexicon** from XML files
- **Services**: `lexiconService.ts`, `bibleService.ts`, `strongsSearchService.ts`
- **Types**: `lexicon.ts`, `bible.ts`

## STEPBible Data Overview

### Directory Structure
```
STEPBible-Data-master/
├── Lexicons/                    (38MB)
│   ├── TBESH - Hebrew Lexicon   (3.3MB - 11,736 entries)
│   ├── TBESG - Greek Lexicon    (4.7MB - 11,125 entries)
│   └── TFLSJ - Full LSJ Greek   (32.2MB - comprehensive)
├── Translators Amalgamated OT+NT/ (156MB)
│   ├── TAHOT - Hebrew OT        (70MB - complete with morphology)
│   └── TAGNT - Greek NT         (30MB - multiple editions)
├── TIPNR - Proper Names         (8.1MB - 36,142 entries)
├── TEHMC - Hebrew Morphology    (388KB - code explanations)
├── TEGMC - Greek Morphology     (460KB - code explanations)
└── TVTMS - Versification Map    (5.6MB - cross-tradition mapping)
```

### File Format
- **Tab-Separated Values (TSV)** - Easy to parse
- **UTF-8 Unicode** - Proper Hebrew/Greek characters
- **One line per entry** (except TIPNR which uses multi-line records)

## Key Data Files for Integration

### 1. Hebrew Lexicon (TBESH)

**File**: `Lexicons/TBESH - Translators Brief lexicon of Extended Strongs for Hebrew`

**Format**: TSV with 8 columns
```
eStrong#  dStrong  uStrong  Hebrew  Transliteration  Morph  Gloss  Meaning
```

**Example Entry**:
```
H0001  H0001G =  H0001G  אָב  av  H:N-M  father
1) father of an individual
2) of God as father of his people
3) head or founder of a household, group, family, or clan
4) ancestor
...9 detailed senses
```

**Key Features**:
- **Extended Strong's (eStrong)**: Compatible with BDB, includes subdivisions (a,b,c,d)
- **Disambiguated Strong's (dStrong)**: Unique ID for each sense (A,B,C variants)
- **Unified Strong's (uStrong)**: Most common form
- **BDB-based definitions**: Comprehensive, scholarly meanings
- **Morphology codes**: Part of speech with gender/number

### 2. Greek Lexicon (TBESG)

**File**: `Lexicons/TBESG - Translators Brief lexicon of Extended Strongs for Greek`

**Format**: Same 8 columns as TBESH

**Example Entry**:
```
G0001  G0001A  G0001A  Α  alpha  G:N-N  Alpha
the first letter of Greek alphabet
```

**Key Features**:
- Covers NT, LXX, Apocrypha, and variants
- Based on Abbott-Smith definitions
- Links to full LSJ entries available in companion file

### 3. Full LSJ Greek Lexicon (TFLSJ)

**Files**:
- `TFLSJ 0-5624` (23.8MB)
- `TFLSJ extra` (8.4MB)

**Features**:
- Complete Liddell-Scott-Jones definitions
- Most comprehensive Greek lexicon available
- Formatted with bibliographic data
- Includes etymology, classical references

### 4. Hebrew Old Testament (TAHOT)

**Files** (4 files covering all OT):
- `TAHOT Gen-Deu` (18.2MB)
- `TAHOT Jos-Est` (24.5MB)
- `TAHOT Job-Sng` (9.5MB)
- `TAHOT Isa-Mal` (18.0MB)

**Format**: TSV with ~12 columns per word
```
Ref & Type  Hebrew  Transliteration  Translation  dStrongs  Grammar
Variants  Root  Alternative  Conjoin  Expanded
```

**Example Entry**:
```
Gen.1.1#01=L  בְּרֵאשִׁ֖ית  bərē'šîṯ  in beginning  H7225G  H:N-M
...morphology and variant data...
```

**Key Features**:
- Based on Leningrad Codex
- Every word tagged with dStrong number
- Full ETCBC morphological parsing
- Ketiv/Qere variants marked
- Prefix/suffix analysis
- Instance counting (e.g., 15th occurrence of this word)

### 5. Greek New Testament (TAGNT)

**Files**:
- `TAGNT Mat-Jhn` (14.2M)
- `TAGNT Act-Rev` (15.9M)

**Format**: TSV with ~12 columns

**Key Features**:
- Contains words from NA27, NA28, TR, SBLGNT, Treg, Byz, WH editions
- Edition indicators show which texts contain each word
- Positional and meaning variants marked
- Robinson morphological parsing
- Context-sensitive translations

### 6. Proper Names Database (TIPNR)

**File**: `TIPNR - Translators Individualised Proper Names`

**Size**: 8.1MB, 36,142 lines

**Format**: Multi-line records with "$" separators

**Example Entry**:
```
UniqueName=H0011*Abraham*Ge.11.26#28
Description=Male living at the time of the Patriarchs
eStrong=H0011
dStrong=H0011A
Hebrew=אַבְרָהָם
ESV=Abraham
KJV=Abraham NIV=Abraham
Parents=H8646 Terah
Partners=H8283*Sarah
Offspring=H3327*Isaac, H3458*Ishmael
AllReferences=Gen.11.26; Gen.11.27; ...168 total references
@Briefest=Father of Isaac
@Brief=Father of Isaac, husband of Sarah, patriarch
@Article=[6 paragraph biography created by Claude 3 AI]
```

**Key Features**:
- Every person, place, and proper noun
- Family relationships (parents, siblings, partners, offspring)
- All biblical references
- Multiple description lengths
- Links to Google Maps for places
- Created using AI for comprehensive descriptions

### 7. Morphology Documentation

**Hebrew Codes (TEHMC)**: 4,780 lines explaining all Hebrew grammar codes
**Greek Codes (TEGMC)**: 8,379 lines explaining all Greek grammar codes

**Format**: Human-readable explanations

**Example**:
```
H:N-M = Hebrew Noun, Masculine
H:V-Qal-Perf-3MS = Hebrew Verb, Qal stem, Perfect tense, 3rd person Masculine Singular
G:N-F-S-ACC = Greek Noun, Feminine, Singular, Accusative case
```

## Strong's Number System Explained

STEPBible uses a **4-tier Strong's system** for precision:

### 1. Original Strong's (sStrong)
- Standard numbering: H0001-H8674, G0001-G5627
- Backward compatible with all tools

### 2. Extended Strong's (eStrong)
- Adds letter subdivisions: H0001a, H0001b, H0001c
- Matches BDB and other lexicon entry divisions
- Compatible with OpenScriptures format

### 3. Disambiguated Strong's (dStrong)
- Adds uppercase letters for different senses: H0001A, H0001B, H0001C
- Each variant represents a distinct meaning
- **This is the most important identifier for word study**
- Example: H0001G, H0001H, H0001I = different uses of "father"

### 4. Unified Strong's (uStrong)
- Points to the most common dStrong variant
- Used for default lookups

**Why This Matters**:
Your current app uses simple Strong's numbers (H0001, G0001). STEPBible's dStrong system allows you to:
- Distinguish between multiple meanings of the same word
- Provide context-specific definitions
- Track word usage patterns with precision

## Integration Strategies

### Strategy 1: Minimal Integration - Enhanced Lexicon Only

**Goal**: Replace/supplement current Strong's dictionaries with STEPBible lexicons

**Implementation**:
1. Parse TBESH and TBESG TSV files
2. Convert to JSON format
3. Load into `lexiconService.ts`
4. Map eStrong → your current Strong's format

**Benefits**:
- Better definitions (BDB-based for Hebrew, Abbott-Smith for Greek)
- Morphological information
- Multiple meaning senses
- Easy to implement

**Code Changes**:
- Update `LexiconService.loadStrongs()` to use TBESH/TBESG
- Add parsing for TSV format
- Extend `StrongsEntry` type with new fields (dStrong, uStrong, morph)

**Data Prep**:
```bash
# Convert TSV to JSON (one-time process)
node scripts/convertTBESH.js > public/lexicon/stepbible-hebrew.json
node scripts/convertTBESG.js > public/lexicon/stepbible-greek.json
```

### Strategy 2: Moderate Integration - Lexicon + Morphology

**Goal**: Add morphological analysis to word clicks

**Implementation**:
1. Implement Strategy 1
2. Load morphology documentation (TEHMC, TEGMC)
3. Create morphology lookup service
4. Display grammar parsing for each word

**Benefits**:
- Users see "Verb, Qal, Perfect, 3rd Masculine Singular" instead of cryptic codes
- Educational value for language learners
- Enhanced word study

**New Components**:
- `morphologyService.ts` - Parse and explain grammar codes
- Update `LexiconModal` to show morphology section

### Strategy 3: Comprehensive Integration - Full Word-by-Word Data

**Goal**: Replace your current Bible text with STEPBible's tagged text

**Implementation**:
1. Use TAHOT (Hebrew OT) and TAGNT (Greek NT) as primary text source
2. Parse TSV format for each book/chapter
3. Store in database or generate JSON files
4. Link every word to dStrong number
5. Implement interlinear display

**Benefits**:
- Every word clickable with instant Strong's lookup
- No manual Strong's tagging needed
- Morphological data for every word
- Textual variants available
- Concordance functionality (find all occurrences)

**Major Changes**:
- New service: `stepBibleService.ts`
- Database schema for word-level data
- UI for interlinear display
- Concordance search feature

**Data Prep**:
```bash
# Parse TAHOT files into JSON by book/chapter
node scripts/parseTAHOT.js
# Parse TAGNT files
node scripts/parseTAGNT.js
# Output: public/stepbible/[book]/[chapter].json
```

### Strategy 4: Advanced Integration - Everything

**Goal**: Full-featured Bible study app with all STEPBible data

**Implementation**:
All of Strategy 3 plus:
1. Proper Names database (TIPNR)
2. LSJ full Greek lexicon (TFLSJ)
3. Textual criticism features (edition comparison)
4. Versification mapping (TVTMS)

**New Features**:
- Click person name → see biography, family tree, all references
- Click place → see map, history
- Compare Greek text editions side-by-side
- Advanced concordance with morphological filtering
- Word frequency analysis

**New Services**:
- `properNameService.ts`
- `textualCriticismService.ts`
- `concordanceService.ts`

## Recommended Approach: Phased Implementation

### Phase 1: Enhanced Lexicon (Week 1)
✅ **Low Risk, High Value**

**Tasks**:
1. Create TSV parser utility
2. Convert TBESH/TBESG to JSON
3. Update `lexiconService.ts` to use new data
4. Add dStrong support
5. Update `StrongsEntry` type
6. Test with existing Strong's references

**Deliverable**: Better definitions when clicking Strong's numbers

### Phase 2: Morphology Display (Week 2)
✅ **Medium Risk, High Educational Value**

**Tasks**:
1. Parse TEHMC/TEGMC documentation
2. Create `morphologyService.ts`
3. Add morphology section to lexicon modal
4. Display human-readable grammar parsing

**Deliverable**: "Hebrew Noun, Masculine, Singular" instead of "H:N-M"

### Phase 3: Proper Names (Week 3)
✅ **Medium Risk, Unique Feature**

**Tasks**:
1. Parse TIPNR multi-line format
2. Create `properNameService.ts`
3. Detect proper names in text
4. Create person/place modal component
5. Display family tree and all references

**Deliverable**: Rich biographical info and genealogies

### Phase 4: Word-by-Word Text (Month 2)
⚠️ **High Risk, Transformative**

**Tasks**:
1. Parse TAHOT/TAGNT TSV files
2. Design data storage (JSON files or database)
3. Create `stepBibleService.ts`
4. Implement interlinear view component
5. Add word click handlers
6. Concordance search

**Deliverable**: Every word clickable with instant lexicon lookup

### Phase 5: Advanced Features (Month 3+)
🎯 **Advanced Users**

**Tasks**:
1. Full LSJ Greek lexicon integration
2. Textual criticism UI
3. Morphological search
4. Word frequency analytics
5. Reading tools (lemma highlighting, etc.)

## Technical Implementation Details

### Data Parsing - TSV Format

**Sample Parser**:
```typescript
// utils/tsvParser.ts
export function parseTSV(tsvText: string): Array<Record<string, string>> {
  const lines = tsvText.split('\n');
  const headers = lines[0].split('\t');
  const data: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split('\t');
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    data.push(row);
  }

  return data;
}
```

### Data Conversion Script

**Convert TBESH to JSON**:
```javascript
// scripts/convertLexicon.js
const fs = require('fs');

function parseTBESH(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Find header line (starts with "eStrong#")
  let headerIdx = lines.findIndex(l => l.startsWith('eStrong#'));
  const headers = lines[headerIdx].split('\t');

  const lexicon = {};

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split('\t');
    const entry = {};
    headers.forEach((h, idx) => {
      entry[h.trim()] = values[idx]?.trim() || '';
    });

    // Index by eStrong and dStrong
    lexicon[entry['eStrong#']] = entry;
    lexicon[entry.dStrong] = entry;
  }

  return lexicon;
}

// Usage
const hebrewLex = parseTBESH('../STEPBible-Data-master/Lexicons/TBESH...');
fs.writeFileSync('./public/lexicon/stepbible-hebrew.json', JSON.stringify(hebrewLex, null, 2));
```

### Enhanced Type Definitions

**Update `types/lexicon.ts`**:
```typescript
export interface StepBibleEntry {
  eStrong: string;           // Extended Strong's (H0001a)
  dStrong: string;           // Disambiguated (H0001A)
  uStrong: string;           // Unified/most common
  word: string;              // Hebrew/Greek text
  transliteration: string;   // Phonetic
  morph: string;             // Grammar code (H:N-M)
  gloss: string;             // One-word meaning
  meaning: string;           // Full definition with senses
}

export interface MorphologyInfo {
  code: string;              // H:N-M
  language: 'Hebrew' | 'Greek' | 'Aramaic';
  type: string;              // Noun, Verb, etc.
  gender?: string;           // M, F, N, C
  number?: string;           // S, P
  extra?: string;            // Tense, mood, etc.
  explanation: string;       // Human-readable
}

export interface ProperName {
  uniqueName: string;        // Name + reference
  description: string;       // "Male living at time of..."
  eStrong: string;
  dStrong: string;
  word: string;              // Hebrew/Greek
  esv: string;               // ESV rendering
  kjv?: string;              // KJV alternate
  niv?: string;              // NIV alternate
  parents?: string[];        // Family relationships
  siblings?: string[];
  partners?: string[];
  offspring?: string[];
  allReferences: string[];   // All occurrences
  briefest: string;          // 3-word description
  brief: string;             // 10-word description
  short: string;             // Sentence
  article: string;           // 6-paragraph biography
  mapLink?: string;          // For places
}
```

### Enhanced Lexicon Service

**Update `services/lexiconService.ts`**:
```typescript
import { StepBibleEntry, MorphologyInfo } from '../types/lexicon';

export class LexiconService {
  private stepBibleHebrew: Map<string, StepBibleEntry> = new Map();
  private stepBibleGreek: Map<string, StepBibleEntry> = new Map();
  private morphologyCache: Map<string, MorphologyInfo> = new Map();

  async loadStepBibleLexicons(): Promise<void> {
    const hebrewResp = await fetch('/lexicon/stepbible-hebrew.json');
    const hebrewData = await hebrewResp.json();
    Object.entries(hebrewData).forEach(([key, val]) => {
      this.stepBibleHebrew.set(key, val as StepBibleEntry);
    });

    const greekResp = await fetch('/lexicon/stepbible-greek.json');
    const greekData = await greekResp.json();
    Object.entries(greekData).forEach(([key, val]) => {
      this.stepBibleGreek.set(key, val as StepBibleEntry);
    });
  }

  getStepBibleEntry(strongsNum: string): StepBibleEntry | null {
    const isGreek = strongsNum.startsWith('G');
    const lexicon = isGreek ? this.stepBibleGreek : this.stepBibleHebrew;
    return lexicon.get(strongsNum) || null;
  }

  getMorphologyInfo(morphCode: string): MorphologyInfo {
    // Parse codes like "H:N-M" or "G:V-PAI-3S"
    // Return human-readable explanation
  }
}
```

### Database Schema Option

If using a database instead of JSON files:

```sql
-- Lexicon table
CREATE TABLE lexicon (
  eStrong VARCHAR(10) PRIMARY KEY,
  dStrong VARCHAR(10),
  uStrong VARCHAR(10),
  language VARCHAR(10),
  word TEXT,
  transliteration TEXT,
  morph VARCHAR(20),
  gloss TEXT,
  meaning TEXT,
  INDEX(dStrong),
  INDEX(uStrong)
);

-- Bible text table (word-by-word)
CREATE TABLE bible_words (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book VARCHAR(20),
  chapter INT,
  verse INT,
  word_num INT,
  word TEXT,
  transliteration TEXT,
  translation TEXT,
  dStrong VARCHAR(10),
  morph VARCHAR(30),
  INDEX(book, chapter, verse),
  INDEX(dStrong)
);

-- Proper names table
CREATE TABLE proper_names (
  unique_name VARCHAR(100) PRIMARY KEY,
  description TEXT,
  eStrong VARCHAR(10),
  dStrong VARCHAR(10),
  word TEXT,
  esv VARCHAR(100),
  parents JSON,
  offspring JSON,
  all_references JSON,
  article TEXT
);
```

## Data Size Considerations

### Current Approach
Your app currently loads:
- Strong's dictionaries: ~2MB total (JavaScript files)
- BDB XML: Loaded on-demand
- Bible XML: Per-chapter loading

### STEPBible Approach

**Option A: Pre-converted JSON Files**
- Hebrew lexicon: ~5MB JSON
- Greek lexicon: ~7MB JSON
- Load once, cache in browser
- Fast lookups

**Option B: Database Backend**
- Parse TSV files into PostgreSQL/MySQL
- Create REST API endpoints
- Lighter frontend
- Better for large-scale apps

**Option C: Hybrid**
- Lexicons as JSON (small, frequently used)
- Full text in database (large, on-demand)
- Proper names as JSON (medium size, occasional use)

### Recommended: Hybrid Approach
```
/public/lexicon/
  stepbible-hebrew.json          (5MB)
  stepbible-greek.json           (7MB)
  stepbible-propernames.json     (12MB - indexed by name)
  morphology-hebrew.json         (1MB - code explanations)
  morphology-greek.json          (1.5MB - code explanations)

/api/ (if using backend)
  /text/:book/:chapter           (Returns word-by-word TAHOT/TAGNT data)
  /concordance/:dstrong          (All occurrences of a word)
  /search/morph?query=...        (Morphological search)
```

## UI/UX Enhancements

### Enhanced Word Click Modal

**Before** (current):
```
Strong's H0001
Word: אָב
Meaning: father
```

**After** (with STEPBible):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    אָב (av)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Strong's: H0001G
Grammar: Hebrew Noun, Masculine

📖 Meanings:
  1. father of an individual
  2. of God as father of his people
  3. head or founder of household/family/clan
  4. ancestor (grandfather, forefathers)
  5. originator/patron of a profession
  6. producer, generator (figurative)
  7. benevolence and protection (figurative)
  8. term of respect and honour
  9. ruler or chief (specific usage)

🔍 Occurs 1,205 times in OT
📚 See all occurrences →
🌳 Related words: H0002 (אַב), H0001H...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Proper Name Modal

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Abraham (אַבְרָהָם)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Person
Strong's: H0011A

🏛️ Era: Patriarchs

👨‍👩‍👦 Family:
  Father: Terah (H8646)
  Wife: Sarah (H8283)
  Sons: Isaac (H3327), Ishmael (H3458)

📖 Brief:
Father of Isaac, husband of Sarah,
patriarch of Israel through whom God's
covenant promises were given.

📍 Appears: 168 times
Genesis 11:26, 11:27, 12:1...

📚 Read full biography →
🔍 See all references →

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Interlinear View

```
Genesis 1:1

בְּרֵאשִׁ֖ית    בָּרָ֣א      אֱלֹהִ֑ים     אֵ֥ת
bərēšîṯ      bārā'       'ĕlōhîm      'ēṯ
in-beginning  created     God          [obj]
H7225G       H1254A      H0430A       H0853

הַשָּׁמַ֖יִם    וְאֵ֥ת      הָאָֽרֶץ׃
haššāmayim   wə'ēṯ      hā'āreṣ
the-heavens  and-[obj]  the-earth
H8064       H0853      H0776

[Each word clickable for full lexicon info]
```

## Performance Optimization

### Lazy Loading Strategy
```typescript
// Load core lexicons on app start
await lexiconService.loadStepBibleLexicons();

// Load morphology on first word click
const morphInfo = await morphologyService.getInfo(code);

// Load proper names when name is clicked
const personInfo = await properNameService.getPerson(name);

// Load full LSJ only for advanced users
if (userSettings.advancedGreek) {
  await lexiconService.loadFullLSJ();
}
```

### Caching Strategy
```typescript
// Service worker cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('stepbible-v1').then((cache) => {
      return cache.addAll([
        '/lexicon/stepbible-hebrew.json',
        '/lexicon/stepbible-greek.json',
        '/lexicon/stepbible-propernames.json',
      ]);
    })
  );
});

// IndexedDB for large datasets
const db = await openDB('stepbible-db', 1, {
  upgrade(db) {
    db.createObjectStore('lexicon', { keyPath: 'dStrong' });
    db.createObjectStore('propernames', { keyPath: 'uniqueName' });
  },
});
```

### Search Optimization
```typescript
// Create search index for fast lookups
class LexiconSearchIndex {
  private wordIndex: Map<string, string[]> = new Map(); // word → [dStrong IDs]
  private meaningIndex: Map<string, string[]> = new Map(); // keyword → [dStrong IDs]

  buildIndex(lexicon: Map<string, StepBibleEntry>) {
    lexicon.forEach((entry, key) => {
      // Index by word
      this.addToIndex(this.wordIndex, entry.word.toLowerCase(), key);

      // Index by transliteration
      this.addToIndex(this.wordIndex, entry.transliteration.toLowerCase(), key);

      // Index by meaning keywords
      const keywords = entry.meaning.toLowerCase().split(/\W+/);
      keywords.forEach(kw => {
        if (kw.length > 3) {
          this.addToIndex(this.meaningIndex, kw, key);
        }
      });
    });
  }

  search(query: string): StepBibleEntry[] {
    // Fast lookup by word or meaning
  }
}
```

## License Compliance

### Attribution Requirements

**Required Attribution**:
```html
<!-- In your app footer or about page -->
<div class="attribution">
  Lexical data from
  <a href="https://www.STEPBible.org">STEP Bible</a>
  (CC BY 4.0)
  <br>
  Created by Tyndale House, Cambridge
</div>
```

**In Code Comments**:
```typescript
/**
 * Strong's Concordance data from STEPBible-Data
 * Source: https://github.com/STEPBible/STEPBible-Data
 * License: CC BY 4.0
 * Attribution: STEP Bible (www.STEPBible.org)
 * Based on work at Tyndale House, Cambridge
 */
```

### License Terms

✅ **You Can**:
- Include any part in your app
- Reformat for your application
- Use commercially
- Make corrections (send to STEPBibleATgmail.com)

✅ **You Must**:
- Credit "STEP Bible" linked to www.STEPBible.org
- Refer users to GitHub as the source
- Include note of any changes you make

❌ **You Cannot**:
- Redistribute the raw data (point to GitHub instead)
- Remove attribution
- Change underlying data without noting changes

## Testing Strategy

### Unit Tests
```typescript
describe('LexiconService', () => {
  it('should load Hebrew lexicon entry', async () => {
    const entry = await lexiconService.getStepBibleEntry('H0001');
    expect(entry?.word).toBe('אָב');
    expect(entry?.gloss).toBe('father');
  });

  it('should handle dStrong variants', async () => {
    const entry = await lexiconService.getStepBibleEntry('H0001G');
    expect(entry).toBeDefined();
  });
});

describe('MorphologyService', () => {
  it('should parse Hebrew noun code', () => {
    const info = morphologyService.parse('H:N-M');
    expect(info.type).toBe('Noun');
    expect(info.gender).toBe('Masculine');
  });
});

describe('ProperNameService', () => {
  it('should load person with family', async () => {
    const abraham = await properNameService.getPerson('Abraham');
    expect(abraham?.parents).toContain('Terah');
    expect(abraham?.offspring).toContain('Isaac');
  });
});
```

### Integration Tests
```typescript
describe('Word Click Flow', () => {
  it('should show lexicon on Strong's click', async () => {
    // Click word with H0001
    fireEvent.click(getByText('אָב'));

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText('father')).toBeInTheDocument();
      expect(screen.getByText('H0001G')).toBeInTheDocument();
    });
  });
});
```

## Migration Path

### Phase 1: Side-by-Side (Week 1)
- Keep existing Strong's dictionaries
- Add STEPBible lexicons as alternative
- Toggle in UI: "Use STEPBible definitions"
- Compare quality

### Phase 2: Gradual Replacement (Week 2-3)
- Default to STEPBible data
- Fall back to old dictionaries if entry missing
- Monitor for issues

### Phase 3: Full Migration (Week 4)
- Remove old Strong's dictionaries
- Use STEPBible exclusively
- Update documentation

### Phase 4: Enhanced Features (Ongoing)
- Add morphology
- Add proper names
- Add concordance
- Add word-by-word text

## Troubleshooting

### Common Issues

**Issue**: TSV files have incorrect encoding
```typescript
// Solution: Ensure UTF-8 with BOM handling
const content = fs.readFileSync(path, 'utf-8').replace(/^\uFEFF/, '');
```

**Issue**: Hebrew/Greek text not displaying
```css
/* Solution: Use proper Unicode font */
.hebrew-text {
  font-family: 'SBL Hebrew', 'Ezra SIL', serif;
}
.greek-text {
  font-family: 'SBL Greek', 'Gentium', serif;
}
```

**Issue**: Large JSON files slow page load
```typescript
// Solution: Compress with gzip, load asynchronously
fetch('/lexicon/stepbible-hebrew.json', {
  headers: { 'Accept-Encoding': 'gzip' }
})
```

**Issue**: Can't find matching Strong's numbers
```typescript
// Solution: Normalize input (remove leading zeros, handle variants)
function normalizeStrongs(input: string): string[] {
  const variants = [input];
  // H1 → H0001, H0001G
  if (input.match(/^[HG]\d+$/)) {
    const num = input.slice(1).padStart(4, '0');
    variants.push(`${input[0]}${num}`);
  }
  return variants;
}
```

## Next Steps

### Immediate Actions (This Week)
1. ✅ Review this analysis document
2. 📋 Decide on integration strategy (recommend Phase 1)
3. 🛠️ Set up data conversion scripts
4. 🧪 Create test environment
5. 📝 Update project documentation

### Week 1 Goals
- [ ] Parse TBESH Hebrew lexicon to JSON
- [ ] Parse TBESG Greek lexicon to JSON
- [ ] Update `LexiconService` to use new data
- [ ] Test with existing Strong's references
- [ ] Deploy to staging

### Week 2-3 Goals
- [ ] Add morphology service
- [ ] Parse TEHMC/TEGMC documentation
- [ ] Update lexicon modal with grammar info
- [ ] Test with users

### Month 2 Goals (Optional)
- [ ] Evaluate full text integration (TAHOT/TAGNT)
- [ ] Design interlinear UI
- [ ] Build concordance features

## Resources

### Documentation
- **STEPBible GitHub**: https://github.com/STEPBible/STEPBible-Data
- **README**: [STEPBible-Data-master/README.md](../STEPBible-Data-master/README.md)
- **Tyndale House**: https://www.TyndaleHouse.com
- **STEP Bible Online**: https://www.STEPBible.org

### Data Files
- **Hebrew Lexicon**: `STEPBible-Data-master/Lexicons/TBESH...`
- **Greek Lexicon**: `STEPBible-Data-master/Lexicons/TBESG...`
- **Hebrew OT**: `STEPBible-Data-master/Translators Amalgamated OT+NT/TAHOT...`
- **Greek NT**: `STEPBible-Data-master/Translators Amalgamated OT+NT/TAGNT...`
- **Proper Names**: `STEPBible-Data-master/TIPNR...`

### Contact
- **Questions/Corrections**: STEPBibleATgmail.com
- **License**: CC BY 4.0
- **Organization**: Charitable Incorporated Organisation (UK #1193950)

## Conclusion

**STEPBible-Data is production-ready, well-documented, and legally free to use.** It offers significant advantages over your current Strong's dictionaries:

✅ **Better Definitions**: BDB-based (Hebrew), Abbott-Smith/LSJ (Greek)
✅ **Disambiguated Meanings**: dStrong system for precision
✅ **Morphological Data**: Full grammar parsing
✅ **Proper Names**: Rich biographical data
✅ **Multiple Editions**: Textual criticism support
✅ **Legally Clear**: CC BY 4.0 with simple attribution

**Recommended First Step**: Implement Phase 1 (Enhanced Lexicon) this week. It's low-risk, high-value, and will immediately improve your app's word study capabilities.

---

**Questions?** Let me know which integration strategy you prefer, and I can help implement it!
