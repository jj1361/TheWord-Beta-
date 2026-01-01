import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { QuizQuestion, QuizStats } from '../types/quiz';
import { quizService } from '../services/quizService';
import { useAuth } from './AuthContext';

interface QuizContextType {
  isQuizModeEnabled: boolean;
  toggleQuizMode: () => void;
  setQuizModeEnabled: (enabled: boolean) => void;
  questions: QuizQuestion[];
  refreshQuestions: () => void;
  getQuestionsForVerse: (bookId: number, chapter: number, verseNum: number) => QuizQuestion[];
  getQuestionCountForVerse: (bookId: number, chapter: number, verseNum: number) => number;
  hasQuestionsForVerse: (bookId: number, chapter: number, verseNum: number) => boolean;
  stats: QuizStats;
  refreshStats: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isQuizModeEnabled, setIsQuizModeEnabledState] = useState(() =>
    quizService.isQuizModeEnabled()
  );
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [stats, setStats] = useState<QuizStats>(() => quizService.getStats());

  // Set user ID in quiz service when user changes
  useEffect(() => {
    quizService.setCurrentUserId(user?.uid || null);
    if (user?.uid) {
      quizService.migrateAnonymousDataToUser(user.uid);
    }
    // Refresh data when user changes
    setQuestions(quizService.getAllQuestions());
    setStats(quizService.getStats());
  }, [user?.uid]);

  const refreshQuestions = useCallback(() => {
    setQuestions(quizService.getAllQuestions());
  }, []);

  const refreshStats = useCallback(() => {
    setStats(quizService.getStats());
  }, []);

  const toggleQuizMode = useCallback(() => {
    const newValue = !isQuizModeEnabled;
    setIsQuizModeEnabledState(newValue);
    quizService.setQuizModeEnabled(newValue);
  }, [isQuizModeEnabled]);

  const setQuizModeEnabled = useCallback((enabled: boolean) => {
    setIsQuizModeEnabledState(enabled);
    quizService.setQuizModeEnabled(enabled);
  }, []);

  const getQuestionsForVerse = useCallback(
    (bookId: number, chapter: number, verseNum: number): QuizQuestion[] => {
      return questions.filter(
        (q) =>
          q.verse.bookId === bookId &&
          q.verse.chapter === chapter &&
          q.verse.startVerse === verseNum
      );
    },
    [questions]
  );

  const getQuestionCountForVerse = useCallback(
    (bookId: number, chapter: number, verseNum: number): number => {
      return getQuestionsForVerse(bookId, chapter, verseNum).length;
    },
    [getQuestionsForVerse]
  );

  const hasQuestionsForVerse = useCallback(
    (bookId: number, chapter: number, verseNum: number): boolean => {
      return getQuestionCountForVerse(bookId, chapter, verseNum) > 0;
    },
    [getQuestionCountForVerse]
  );

  const value: QuizContextType = {
    isQuizModeEnabled,
    toggleQuizMode,
    setQuizModeEnabled,
    questions,
    refreshQuestions,
    getQuestionsForVerse,
    getQuestionCountForVerse,
    hasQuestionsForVerse,
    stats,
    refreshStats,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};

export const useQuiz = (): QuizContextType => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

export default QuizContext;
