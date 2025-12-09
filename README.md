# Holy Bible Application

A modern Bible reading application built with React and TypeScript, featuring the King James Version with Interlinear support.

## Features

- **Chapter by Chapter Reading**: Navigate through all 66 books of the Bible
- **Interlinear Support**: Toggle interlinear view for each verse to see:
  - Original Hebrew/Greek text
  - Transliteration
  - Strong's numbers
  - Part of speech
  - Detailed grammatical parsing
- **Interactive Hebrew Letters**: Click any Hebrew letter in the interlinear text to view:
  - Letter name and transliteration
  - Numeric value (Gematria)
  - Meaning and symbolism
  - Detailed definition
  - Ancient Proto-Sinaitic script representation
  - Visual representation with emoticons
  - Custom images (when provided)
- **Smart Navigation**:
  - Quick book and chapter selection
  - Previous/Next chapter navigation
  - Direct chapter jumping
- **Advanced Search**: Full-text search across the entire Bible with highlighted results
- **Modern UI**: Beautiful, responsive design with gradient colors and smooth animations
- **Verse Highlighting**: Search results automatically highlight and scroll to the specific verse

## Installation

1. Install dependencies:
```bash
npm install
```

2. The Bible data (XML files) are already included in the `public/xmlBible.org-main` directory.

## Running the Application

Start the development server:
```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000)

## Building for Production

Create an optimized production build:
```bash
npm run build
```

## Project Structure

```
bible-app/
├── src/
│   ├── components/        # React components
│   │   ├── Navigation.tsx         # Book/Chapter navigation
│   │   ├── SearchBox.tsx         # Search functionality
│   │   ├── ChapterDisplay.tsx    # Chapter container
│   │   └── VerseDisplay.tsx      # Individual verse with interlinear
│   ├── services/         # Business logic
│   │   └── bibleService.ts       # Bible data loading and search
│   ├── utils/            # Utilities
│   │   └── xmlParser.ts          # XML parsing utilities
│   ├── types/            # TypeScript types
│   │   └── bible.ts              # Type definitions
│   └── App.tsx           # Main application
├── public/
│   └── xmlBible.org-main/        # Bible XML data
│       ├── KJV/                  # King James Version
│       ├── KJVs/                 # KJV with Strong's numbers
│       └── Interlinear/          # Interlinear data
└── package.json
```

## Data Source

Bible data from [xmlBible.org](http://xmlbible.org), including:
- King James Version (KJV)
- Strong's numbers
- Hebrew/Greek interlinear text with transliteration

## Technologies Used

- React 18
- TypeScript
- CSS3 (modern gradients, animations, flexbox)
- XML parsing with DOMParser

## Browser Support

Works on all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## License

This project uses Bible data from xmlBible.org. Please refer to their licensing terms for the Bible data.
