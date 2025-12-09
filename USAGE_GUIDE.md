# Bible Application - Usage Guide

## Getting Started

### Starting the Application

```bash
cd bible-app
npm start
```

The app will open at http://localhost:3000

## Features Overview

### 1. Reading the Bible

**Navigate by Book and Chapter:**
- Use the dropdown menus to select a book and chapter
- Click "Go" to load the chapter
- Use "Previous" and "Next" buttons to move between chapters

**Default View:**
- The app starts with Genesis Chapter 1
- Each verse is numbered and clearly formatted
- Verses are displayed in a clean, modern card layout

### 2. Searching the Bible

**To search for text:**
1. Type your search query in the search box at the top
2. Click "Search" or press Enter
3. Results will appear in a dropdown panel
4. Click any result to jump to that verse
5. The verse will be highlighted and scrolled into view

**Search Tips:**
- Search is case-insensitive
- Results show book, chapter, and verse references
- Matching text is highlighted in yellow

### 3. Viewing Interlinear Text

**To view interlinear analysis:**
1. Look for the 📚 button next to verses with interlinear data
2. Click the button to expand the interlinear view
3. The button changes to 📖 when active
4. Click again to collapse the view

**Interlinear View Shows:**
- Original Hebrew/Greek text
- Transliteration (pronunciation)
- English translation of each word
- Strong's concordance numbers
- Part of speech tags
- Detailed grammatical parsing

### 4. Exploring Hebrew Letters (NEW!)

**Interactive Hebrew Letter Analysis:**

1. **Open Interlinear View**
   - Click the 📚 button on any verse with Hebrew text

2. **Click a Hebrew Letter**
   - In the interlinear view, hover over any Hebrew letter
   - Letters will glow purple when you hover
   - Click any letter to open the letter information panel

3. **Letter Information Panel**
   - Opens on the right side of the screen
   - Shows the selected letter in large format
   - Displays an emoticon representing the letter's meaning
   - Provides detailed information:
     - **Name**: English name of the letter
     - **Transliteration**: How to pronounce it
     - **Number**: Gematria (numeric value)
     - **Meaning**: Symbolic meaning
     - **Definition**: Detailed explanation of significance

4. **Closing the Panel**
   - Click the "✕" button in the top-right
   - Click another letter to view different information

**Example Workflow:**
1. Navigate to Genesis 1:1
2. Click the 📚 button to open interlinear view
3. You'll see "בְּרֵאשִׁ֖ית" (Bereshit - "In the beginning")
4. Click on the letter "ב" (Bet)
5. The panel opens showing:
   - The letter ב with house emoji 🏠
   - Name: Bet
   - Transliteration: bet
   - Number: 2
   - Meaning: House, Family
   - Definition explaining its significance

## Visual Features

### Color Coding

- **Purple Gradient**: Headers, navigation, and selected items
- **Golden Yellow**: Important badges and highlights
- **Blue Accents**: Information tags and links
- **White Cards**: Clean, modern verse containers

### Hover Effects

- Verses lift slightly when you hover
- Hebrew letters glow and enlarge when hovered
- Buttons scale up when you hover
- Smooth transitions throughout

### Responsive Design

- Works on desktop, tablet, and mobile
- Navigation adapts to screen size
- Letter panel adjusts for mobile screens
- Touch-friendly buttons

## Tips and Tricks

### Quick Navigation

- Use keyboard navigation in dropdowns
- Type to search in book dropdown
- Previous/Next buttons work across book boundaries

### Efficient Reading

- Toggle multiple verses' interlinear views
- Search for key words to find related passages
- Use the chapter navigation for continuous reading

### Hebrew Letter Study

- Click multiple letters in sequence to compare
- Use the hint banner in interlinear view
- Letters with glowing effect are clickable
- Non-Hebrew letters (punctuation, spaces) are not clickable

### Search Strategies

- Search for exact phrases in quotes: "in the beginning"
- Search for single words to find all occurrences
- Use common words to find passages by theme

## Keyboard Shortcuts

While typing in search box:
- **Enter**: Execute search
- **Escape**: Close search results (when implemented)

## Mobile Usage

- Swipe to scroll through verses
- Tap letters to view information
- Letter panel appears fullscreen
- All features available on mobile

## Troubleshooting

**Interlinear button not showing?**
- Some verses may not have interlinear data
- Only Old Testament books have Hebrew interlinear
- New Testament would have Greek (if available)

**Letter panel not opening?**
- Ensure you clicked a Hebrew letter (not punctuation)
- Check that interlinear view is open
- Try refreshing the page

**Search is slow?**
- Searching all 66 books takes a moment
- Be patient for comprehensive results
- Results stream in as they're found

**Chapter won't load?**
- Check browser console for errors
- Ensure XML files are in public folder
- Try refreshing the page

## Advanced Features

### Customizing Letter Data

See `HEBREW_LETTERS_CONFIG.md` for instructions on:
- Editing letter definitions
- Adding custom images
- Changing emoticons
- Adding new letters

### Adding Images

1. Place images in `public/images/hebrew-letters/`
2. Name them according to letter (e.g., `aleph.png`)
3. Images will automatically appear in letter panel

## Support

For issues or questions:
- Check the README.md for setup instructions
- Review HEBREW_LETTERS_CONFIG.md for customization
- Check browser console for error messages

## What's Next?

Future enhancements could include:
- Greek letter analysis (for New Testament)
- Bookmark favorite verses
- Personal notes on verses
- Audio pronunciation of Hebrew letters
- Print/export functionality
- Dark mode
- Multiple Bible translations
