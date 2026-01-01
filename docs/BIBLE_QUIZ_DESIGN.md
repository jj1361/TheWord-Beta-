# Bible Quiz Feature Design

## Overview

A Bible Quiz feature that allows administrators to create quiz questions linked to specific verses. Users can enable a Quiz Toggle to see which verses have questions, then interact with quizzes via a modern modal interface.

---

## Feature Components

### 1. Quiz Toggle (Header Control)

**Location**: ChapterHeader component, alongside existing toggles

**Behavior**:
- Toggle switch styled like YouthToggle
- When enabled, verse indicators appear on verses that have linked questions
- Persists preference in localStorage

**Visual Design**:
```
┌─────────────────────────────────┐
│  [Quiz Mode]  ○────●            │
│               OFF  ON           │
└─────────────────────────────────┘
```

---

### 2. Verse Quiz Indicators

**Location**: VerseDisplay component

**Behavior**:
- Small badge/icon appears next to verse number when quiz mode is enabled
- Shows count if multiple questions exist for that verse
- Clicking the indicator opens the Quiz Modal

**Visual Design**:
```
┌─────────────────────────────────────────────────┐
│  ¹ [?] In the beginning God created the heaven  │
│       and the earth.                            │
│                                                 │
│  ² And the earth was without form, and void...  │
│                                                 │
│  ³ [?2] And God said, Let there be light: and   │
│        there was light.                         │
└─────────────────────────────────────────────────┘

[?]  = Single question indicator
[?2] = Multiple questions indicator (shows count)
```

**Indicator Styling**:
- Small pill badge: `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Icon: Question mark or quiz icon
- Hover tooltip: "Click to take quiz"
- Subtle pulse animation to draw attention

---

### 3. Quiz Modal

**Trigger**: Click on verse quiz indicator

**Structure**:
```
┌─────────────────────────────────────────────────────────┐
│  ╳                                                      │
│                                                         │
│     📖 Genesis 1:3                                      │
│     ─────────────────────────────────────              │
│                                                         │
│     "And God said, Let there be light:                 │
│      and there was light."                             │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                   │ │
│  │   Question 1 of 2                                │ │
│  │   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│  │                                                   │ │
│  │   What did God create on Day 1?                  │ │
│  │                                                   │ │
│  │   ┌─────────────────────────────────────────┐    │ │
│  │   │  ○  Light                               │    │ │
│  │   └─────────────────────────────────────────┘    │ │
│  │   ┌─────────────────────────────────────────┐    │ │
│  │   │  ○  Water                               │    │ │
│  │   └─────────────────────────────────────────┘    │ │
│  │   ┌─────────────────────────────────────────┐    │ │
│  │   │  ○  Animals                             │    │ │
│  │   └─────────────────────────────────────────┘    │ │
│  │   ┌─────────────────────────────────────────┐    │ │
│  │   │  ○  Plants                              │    │ │
│  │   └─────────────────────────────────────────┘    │ │
│  │                                                   │ │
│  │              [ Submit Answer ]                    │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│     ● ○  (question progress dots)                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Fill-in-the-Blank Design**:
```
┌───────────────────────────────────────────────────┐
│                                                   │
│   Complete the verse:                             │
│                                                   │
│   "And God said, Let there be ________:          │
│    and there was ________."                       │
│                                                   │
│   ┌─────────────────────────────────────────┐    │
│   │  light                                  │    │
│   └─────────────────────────────────────────┘    │
│                                                   │
│              [ Submit Answer ]                    │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Answer Feedback**:
```
Correct Answer:
┌─────────────────────────────────────────┐
│  ✓  Light                    ✓ Correct! │
│     ────────────────────────────────    │
│     (green background, checkmark)       │
└─────────────────────────────────────────┘

Incorrect Answer:
┌─────────────────────────────────────────┐
│  ✗  Water                    ✗ Wrong    │
│  ✓  Light  ← Correct answer             │
│     ────────────────────────────────    │
│     (red for wrong, green for correct)  │
└─────────────────────────────────────────┘
```

**Quiz Completion Screen**:
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    🎉 Quiz Complete!                    │
│                                                         │
│                    ┌───────────────┐                    │
│                    │               │                    │
│                    │    2 / 2      │                    │
│                    │    100%       │                    │
│                    │               │                    │
│                    └───────────────┘                    │
│                                                         │
│                  You got all correct!                   │
│                                                         │
│         [ Try Again ]    [ Close ]                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 4. Quiz Admin Panel

**Location**: New tab in AdminPanel ("Quiz" tab alongside "Users" and "Stats")

**Structure**:
```
┌─────────────────────────────────────────────────────────────────┐
│  Admin Panel                                              ╳     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ Users ]  [ Stats ]  [ Quiz ]                                │
│                         ═══════                                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Quiz Statistics                                        │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │   │
│  │  │      24      │ │      156     │ │     78%      │    │   │
│  │  │  Questions   │ │  Attempts    │ │  Avg Score   │    │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Questions                           [ + Add Question ] │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  📝 What did God create on Day 1?               │   │   │
│  │  │  Genesis 1:3 • Multiple Choice • 45 attempts    │   │   │
│  │  │                              [ Edit ] [ Delete ] │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  📝 Complete: "In the beginning..."             │   │   │
│  │  │  Genesis 1:1 • Fill in Blank • 32 attempts      │   │   │
│  │  │                              [ Edit ] [ Delete ] │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Question Editor Form**:
```
┌─────────────────────────────────────────────────────────────────┐
│  Create New Question                                      ╳     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Question Type                                                  │
│  ┌─────────────────────┐ ┌─────────────────────┐               │
│  │  ● Multiple Choice  │ │  ○ Fill in Blank    │               │
│  └─────────────────────┘ └─────────────────────┘               │
│                                                                 │
│  Linked Verse                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Book: [Genesis ▼]  Chapter: [1 ▼]  Verse: [3 ▼]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Preview: "And God said, Let there be light..."                │
│                                                                 │
│  Question Text                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  What did God create on Day 1?                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Answer Options (mark correct answer)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ● Light                                          [ ✗ ] │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ○ Water                                          [ ✗ ] │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ○ Animals                                        [ ✗ ] │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ○ Plants                                         [ ✗ ] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                     [ + Add Option ]            │
│                                                                 │
│                    [ Cancel ]  [ Save Question ]                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Fill-in-the-Blank Editor**:
```
┌─────────────────────────────────────────────────────────────────┐
│  Create New Question                                      ╳     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Question Type                                                  │
│  ┌─────────────────────┐ ┌─────────────────────┐               │
│  │  ○ Multiple Choice  │ │  ● Fill in Blank    │               │
│  └─────────────────────┘ └─────────────────────┘               │
│                                                                 │
│  Linked Verse                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Book: [Genesis ▼]  Chapter: [1 ▼]  Verse: [3 ▼]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Full Verse: "And God said, Let there be light: and there     │
│              was light."                                        │
│                                                                 │
│  Verse with Blanks (use ___ for blanks)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  And God said, Let there be ___: and there was ___.     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Correct Answers (in order of blanks)                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. light                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  2. light                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ☑ Case insensitive matching                                   │
│                                                                 │
│                    [ Cancel ]  [ Save Question ]                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Structures

### TypeScript Interfaces

```typescript
// src/types/quiz.ts

export type QuestionType = 'multiple-choice' | 'fill-blank';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  verse: VerseReference;
  questionText: string;

  // For multiple choice
  options?: string[];
  correctOptionIndex?: number;

  // For fill-in-the-blank
  verseWithBlanks?: string;
  correctAnswers?: string[];
  caseInsensitive?: boolean;

  // Metadata
  createdBy: string;
  createdAt: number;
  updatedAt?: number;
}

export interface QuizAttempt {
  id: string;
  odId: string;
  answers: QuizAnswer[];
  score: number;
  totalQuestions: number;
  completedAt: number;
}

export interface QuizAnswer {
  questionId: string;
  userAnswer: string | number;
  isCorrect: boolean;
  timeTaken?: number;  // milliseconds
}

export interface QuizSession {
  questionIds: string[];
  currentIndex: number;
  answers: QuizAnswer[];
  startedAt: number;
}

export interface QuizStats {
  totalQuestions: number;
  totalAttempts: number;
  averageScore: number;
  questionStats: Record<string, QuestionStats>;
}

export interface QuestionStats {
  attempts: number;
  correctCount: number;
  averageTime?: number;
}
```

---

## Storage Schema

```typescript
// src/services/quizService.ts

const STORAGE_KEYS = {
  QUESTIONS: 'bible-app-quiz-questions',
  ATTEMPTS: 'bible-app-quiz-attempts',
  STATS: 'bible-app-quiz-stats',
};

// User-scoped keys (for attempts/stats)
// `user-${userId}-bible-app-quiz-attempts`
// `user-${userId}-bible-app-quiz-stats`

// Questions are global (admin-created)
// Attempts and stats are per-user
```

---

## File Structure

```
src/
├── components/
│   ├── Quiz/
│   │   ├── QuizToggle.tsx
│   │   ├── QuizToggle.css
│   │   ├── QuizIndicator.tsx
│   │   ├── QuizIndicator.css
│   │   ├── QuizModal.tsx
│   │   ├── QuizModal.css
│   │   ├── QuizQuestion.tsx
│   │   ├── QuizQuestion.css
│   │   ├── QuizResults.tsx
│   │   └── QuizResults.css
│   │
│   └── AdminPanel/
│       ├── QuizAdmin.tsx
│       ├── QuizAdmin.css
│       ├── QuestionEditor.tsx
│       ├── QuestionEditor.css
│       ├── QuestionList.tsx
│       └── QuestionList.css
│
├── services/
│   └── quizService.ts
│
├── types/
│   └── quiz.ts
│
└── contexts/
    └── QuizContext.tsx  (optional, for global quiz state)
```

---

## CSS Design Tokens

```css
/* Quiz-specific tokens (extend theme.css) */

:root {
  /* Quiz brand colors */
  --quiz-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --quiz-success: #10b981;
  --quiz-success-bg: rgba(16, 185, 129, 0.1);
  --quiz-error: #ef4444;
  --quiz-error-bg: rgba(239, 68, 68, 0.1);

  /* Quiz indicator */
  --quiz-indicator-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --quiz-indicator-text: #ffffff;
  --quiz-indicator-size: 20px;

  /* Progress */
  --quiz-progress-bg: #e2e8f0;
  --quiz-progress-fill: linear-gradient(90deg, #667eea 0%, #764ba2 100%);

  /* Option cards */
  --quiz-option-bg: var(--bg-secondary);
  --quiz-option-border: var(--border-primary);
  --quiz-option-hover: var(--bg-hover);
  --quiz-option-selected: rgba(102, 126, 234, 0.1);
  --quiz-option-selected-border: #667eea;
}

[data-theme="dark"] {
  --quiz-success-bg: rgba(16, 185, 129, 0.2);
  --quiz-error-bg: rgba(239, 68, 68, 0.2);
  --quiz-option-selected: rgba(102, 126, 234, 0.2);
}
```

---

## Animation Specifications

```css
/* Modal entrance */
@keyframes quizModalSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Question transition */
@keyframes quizQuestionFade {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Correct answer celebration */
@keyframes quizCorrectPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

/* Indicator pulse */
@keyframes quizIndicatorPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(102, 126, 234, 0); }
}

/* Score counter */
@keyframes quizScoreCount {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}
```

---

## Component Behavior Specifications

### QuizToggle
- Renders in ChapterHeader
- Stores preference: `localStorage.setItem('quiz-mode-enabled', 'true')`
- Emits toggle event to parent or uses context

### QuizIndicator
- Renders inside VerseDisplay when quiz mode is enabled
- Queries quizService for questions linked to current verse
- Shows count badge if multiple questions
- Click handler opens QuizModal with question IDs

### QuizModal
- Receives question IDs as prop
- Manages quiz session state internally
- Shuffles questions on start
- Tracks time per question (optional)
- Shows feedback after each answer
- Displays results at completion
- Saves attempt via quizService

### QuizAdmin
- Only visible to admin users (useAuth().isAdmin)
- CRUD operations for questions
- Statistics dashboard
- Filter/search questions by book, chapter, type

### QuestionEditor
- Form for creating/editing questions
- Verse selector (book, chapter, verse dropdowns)
- Live verse preview
- Validation (must have correct answer, etc.)

---

## Implementation Priority

### Phase 1: Core Infrastructure
1. Create `types/quiz.ts` with interfaces
2. Create `quizService.ts` with CRUD operations
3. Create QuizContext for global state

### Phase 2: Admin Features
4. Add Quiz tab to AdminPanel
5. Create QuestionList component
6. Create QuestionEditor component

### Phase 3: User Features
7. Create QuizToggle component
8. Create QuizIndicator component
9. Integrate indicator into VerseDisplay

### Phase 4: Quiz Experience
10. Create QuizModal component
11. Create QuizQuestion component (handles both types)
12. Create QuizResults component

### Phase 5: Polish
13. Add animations and transitions
14. Implement statistics tracking
15. Add sound effects (optional)
16. Mobile optimization

---

## Accessibility Considerations

- All interactive elements must be keyboard accessible
- ARIA labels for quiz controls
- Focus management in modal (trap focus)
- High contrast mode support
- Screen reader announcements for feedback
- Sufficient color contrast (WCAG AA)
- Touch targets minimum 44x44px on mobile
