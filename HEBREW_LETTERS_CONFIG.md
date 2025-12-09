# Hebrew Letters Configuration Guide

This guide explains how to customize the Hebrew letter information displayed in the application.

## Configuration File Location

The Hebrew letter data is stored in:
```
src/config/hebrewLetters.ts
```

## Data Structure

Each Hebrew letter has the following properties:

```typescript
interface HebrewLetterInfo {
  letter: string;           // The Hebrew character
  name: string;            // English name (e.g., "Aleph")
  transliteration: string; // Romanized pronunciation
  number: number;          // Gematria value
  meaning: string;         // Short meaning
  definition: string;      // Detailed explanation
  emoticon: string;        // Unicode emoticon/emoji
  imageUrl: string;        // Path to image file
  ancientScript: string;   // Proto-Sinaitic character mapping
}
```

## Customizing Letter Data

### 1. Edit Basic Information

Open `src/config/hebrewLetters.ts` and find the letter you want to modify:

```typescript
'א': {
  letter: 'א',
  name: 'Aleph',                    // Change the English name
  transliteration: 'aleph',         // Change pronunciation
  number: 1,                        // Change numeric value
  meaning: 'Ox, Leader, First',     // Change short meaning
  definition: 'Your detailed definition here...',
  emoticon: '🐂',                   // Change emoji
  imageUrl: '/images/hebrew-letters/aleph.png',
  ancientScript: 'A'                // Proto-Sinaitic character (A-Z mapping)
}
```

### 2. Update Definitions

The `definition` field supports longer text descriptions. You can include:
- Historical context
- Theological significance
- Symbolic meanings
- Usage examples

Example:
```typescript
definition: 'Aleph represents strength, leadership, and primacy. ' +
            'It is the first letter of the Hebrew alphabet and symbolizes ' +
            'the oneness of God. In ancient pictographic Hebrew, it depicted ' +
            'an ox head, representing strength and sacrifice.'
```

### 3. Change Emoticons

Use any Unicode emoji or emoticon:

```typescript
emoticon: '🐂'  // Ox
emoticon: '🏠'  // House
emoticon: '🔥'  // Fire
emoticon: '💧'  // Water
emoticon: '✋'  // Hand
```

Find more emojis at: https://emojipedia.org

### 4. Configure Ancient Script

The `ancientScript` property maps to the Proto-Sinaitic font characters. The Proto-Sinaitic 15 font uses English letters (A-Z) to display ancient pictographic forms.

**Character Mappings:**
```typescript
'א' (Aleph)  -> 'A'
'ב' (Bet)    -> 'B'
'ג' (Gimel)  -> 'G'
'ד' (Dalet)  -> 'D'
'ה' (Hey)    -> 'H'
'ו' (Vav)    -> 'W'
'ז' (Zayin)  -> 'Z'
'ח' (Chet)   -> 'X'
'ט' (Tet)    -> 'J'
'י' (Yod)    -> 'Y'
'כ/ך' (Kaf)  -> 'K'
'ל' (Lamed)  -> 'L'
'מ/ם' (Mem)  -> 'M'
'נ/ן' (Nun)  -> 'N'
'ס' (Samech) -> 'S'
'ע' (Ayin)   -> 'O'
'פ/ף' (Pey)  -> 'P'
'צ/ץ' (Tzadi)-> 'C'
'ק' (Qof)    -> 'Q'
'ר' (Resh)   -> 'R'
'ש' (Shin)   -> 'V'
'ת' (Tav)    -> 'T'
```

The font file is located at `public/fonts/Proto-Sinaitic-15.ttf` and automatically loads when the Hebrew Letter Panel displays.

### 5. Add Custom Images

1. Place your image files in: `public/images/hebrew-letters/`
2. Name them according to the letter (e.g., `aleph.png`, `bet.png`)
3. Update the `imageUrl` in the config:

```typescript
imageUrl: '/images/hebrew-letters/aleph.png'
```

**Recommended image specifications:**
- Format: PNG (with transparency) or JPG
- Size: 300x300 pixels or larger
- Square aspect ratio
- Clear, simple design

### 6. Add New Letters

If a letter is missing, add it to the `HEBREW_LETTERS` object:

```typescript
export const HEBREW_LETTERS: Record<string, HebrewLetterInfo> = {
  // ... existing letters ...

  'ְ': {  // Add new letter
    letter: 'ְ',
    name: 'Shva',
    transliteration: 'shva',
    number: 0,
    meaning: 'Vowel point',
    definition: 'A Hebrew vowel point...',
    emoticon: '📝',
    imageUrl: '/images/hebrew-letters/shva.png'
  }
};
```

## Testing Your Changes

1. Save the configuration file
2. The React app will automatically reload
3. Open the interlinear view for any verse
4. Click a Hebrew letter to see your changes

## Current Letter Coverage

The configuration includes all 22 letters of the Hebrew alphabet plus 5 final forms:

**Regular Letters:**
א ב ג ד ה ו ז ח ט י כ ל מ נ ס ע פ צ ק ר ש ת

**Final Forms:**
ך ם ן ף ץ

## Example Customization

Here's a complete example of customizing the letter Bet (ב):

```typescript
'ב': {
  letter: 'ב',
  name: 'Bet',
  transliteration: 'bet',
  number: 2,
  meaning: 'House, Dwelling, Family',
  definition: 'Bet is the second letter of the Hebrew alphabet. ' +
              'Its pictographic form represents a house or tent, symbolizing ' +
              'dwelling, family, and protection. The letter Bet begins the ' +
              'Torah with the word "Bereshit" (In the beginning), signifying ' +
              'that creation began with God\'s desire to dwell with humanity. ' +
              'The enclosed shape suggests privacy and intimacy with God.',
  emoticon: '🏠',
  imageUrl: '/images/hebrew-letters/bet.png'
}
```

## Tips

- Keep definitions concise but informative (2-4 sentences)
- Use meaningful emoticons that relate to the letter's symbolism
- Ensure image files are properly sized for fast loading
- Test on mobile devices to ensure text is readable
- Consider adding sources or references in comments

## Troubleshooting

**Letter not showing up?**
- Check that the Unicode character matches exactly
- Ensure the letter is properly formatted in the object

**Image not loading?**
- Verify the file exists in `public/images/hebrew-letters/`
- Check the file name matches the `imageUrl` exactly
- Ensure the file has the correct extension (.png, .jpg, etc.)

**Panel not opening?**
- Check browser console for JavaScript errors
- Ensure the letter exists in the `HEBREW_LETTERS` object
- Verify the `getHebrewLetterInfo` function is working

## Resources

- [Hebrew Alphabet on Wikipedia](https://en.wikipedia.org/wiki/Hebrew_alphabet)
- [Gematria Values](https://en.wikipedia.org/wiki/Gematria)
- [Ancient Hebrew Research Center](https://www.ancient-hebrew.org/)
- [Hebrew Letter Meanings](https://www.hebrew4christians.com/Grammar/Unit_One/Aleph-Bet/aleph-bet.html)
