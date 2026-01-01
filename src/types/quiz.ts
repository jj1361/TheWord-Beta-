import { VerseReference } from './notes';

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

export interface QuizAnswer {
  questionId: string;
  userAnswer: string | number | string[];
  isCorrect: boolean;
  timeTaken?: number; // milliseconds
}

export interface QuizAttempt {
  id: string;
  userId: string;
  questionIds: string[];
  answers: QuizAnswer[];
  score: number;
  totalQuestions: number;
  completedAt: number;
}

export interface QuizSession {
  questionIds: string[];
  currentIndex: number;
  answers: QuizAnswer[];
  startedAt: number;
}

export interface QuestionStats {
  attempts: number;
  correctCount: number;
  averageTime?: number;
}

export interface QuizStats {
  totalQuestions: number;
  totalAttempts: number;
  averageScore: number;
  questionStats: Record<string, QuestionStats>;
}

export interface QuizState {
  questions: QuizQuestion[];
  isQuizModeEnabled: boolean;
}
