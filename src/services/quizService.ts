import {
  QuizQuestion,
  QuizAttempt,
  QuizAnswer,
  QuizStats,
  QuestionStats,
} from '../types/quiz';
import { VerseReference } from '../types/notes';

const STORAGE_KEYS = {
  QUESTIONS: 'bible-app-quiz-questions',
  ATTEMPTS: 'bible-app-quiz-attempts',
  STATS: 'bible-app-quiz-stats',
  QUIZ_MODE: 'bible-app-quiz-mode-enabled',
};

class QuizService {
  private currentUserId: string | null = null;

  setCurrentUserId(userId: string | null): void {
    this.currentUserId = userId;
  }

  private getUserStorageKey(baseKey: string): string {
    if (this.currentUserId) {
      return `user-${this.currentUserId}-${baseKey}`;
    }
    return baseKey;
  }

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============= QUESTIONS (Global - Admin Only) =============

  getAllQuestions(): QuizQuestion[] {
    const stored = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  getQuestionById(id: string): QuizQuestion | undefined {
    const questions = this.getAllQuestions();
    return questions.find((q) => q.id === id);
  }

  getQuestionsForVerse(verse: VerseReference): QuizQuestion[] {
    const questions = this.getAllQuestions();
    return questions.filter(
      (q) =>
        q.verse.bookId === verse.bookId &&
        q.verse.chapter === verse.chapter &&
        q.verse.startVerse === verse.startVerse
    );
  }

  getQuestionsForChapter(bookId: number, chapter: number): QuizQuestion[] {
    const questions = this.getAllQuestions();
    return questions.filter(
      (q) => q.verse.bookId === bookId && q.verse.chapter === chapter
    );
  }

  getVersesWithQuestions(bookId: number, chapter: number): Set<number> {
    const questions = this.getQuestionsForChapter(bookId, chapter);
    return new Set(questions.map((q) => q.verse.startVerse));
  }

  getQuestionCountForVerse(
    bookId: number,
    chapter: number,
    verseNum: number
  ): number {
    const questions = this.getAllQuestions();
    return questions.filter(
      (q) =>
        q.verse.bookId === bookId &&
        q.verse.chapter === chapter &&
        q.verse.startVerse === verseNum
    ).length;
  }

  createQuestion(
    question: Omit<QuizQuestion, 'id' | 'createdAt'>
  ): QuizQuestion {
    const questions = this.getAllQuestions();
    const newQuestion: QuizQuestion = {
      ...question,
      id: this.generateId(),
      createdAt: Date.now(),
    };
    questions.push(newQuestion);
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    return newQuestion;
  }

  updateQuestion(
    id: string,
    updates: Partial<Omit<QuizQuestion, 'id' | 'createdAt' | 'createdBy'>>
  ): QuizQuestion | null {
    const questions = this.getAllQuestions();
    const index = questions.findIndex((q) => q.id === id);
    if (index === -1) return null;

    questions[index] = {
      ...questions[index],
      ...updates,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    return questions[index];
  }

  deleteQuestion(id: string): boolean {
    const questions = this.getAllQuestions();
    const filtered = questions.filter((q) => q.id !== id);
    if (filtered.length === questions.length) return false;
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(filtered));
    return true;
  }

  // ============= ATTEMPTS (User-Scoped) =============

  getUserAttempts(): QuizAttempt[] {
    const key = this.getUserStorageKey(STORAGE_KEYS.ATTEMPTS);
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  saveAttempt(
    questionIds: string[],
    answers: QuizAnswer[],
    score: number
  ): QuizAttempt {
    const attempts = this.getUserAttempts();
    const newAttempt: QuizAttempt = {
      id: this.generateId(),
      userId: this.currentUserId || 'anonymous',
      questionIds,
      answers,
      score,
      totalQuestions: questionIds.length,
      completedAt: Date.now(),
    };
    attempts.push(newAttempt);
    const key = this.getUserStorageKey(STORAGE_KEYS.ATTEMPTS);
    localStorage.setItem(key, JSON.stringify(attempts));

    // Update stats
    this.updateStatsAfterAttempt(answers, score, questionIds.length);

    return newAttempt;
  }

  // ============= STATS =============

  private updateStatsAfterAttempt(
    answers: QuizAnswer[],
    score: number,
    totalQuestions: number
  ): void {
    const stats = this.getStats();

    // Update global stats
    const prevTotal = stats.totalAttempts;
    stats.totalAttempts += 1;
    stats.averageScore =
      (stats.averageScore * prevTotal + (score / totalQuestions) * 100) /
      stats.totalAttempts;

    // Update per-question stats
    answers.forEach((answer) => {
      if (!stats.questionStats[answer.questionId]) {
        stats.questionStats[answer.questionId] = {
          attempts: 0,
          correctCount: 0,
        };
      }
      const qStats = stats.questionStats[answer.questionId];
      qStats.attempts += 1;
      if (answer.isCorrect) {
        qStats.correctCount += 1;
      }
      if (answer.timeTaken) {
        qStats.averageTime = qStats.averageTime
          ? (qStats.averageTime * (qStats.attempts - 1) + answer.timeTaken) /
            qStats.attempts
          : answer.timeTaken;
      }
    });

    stats.totalQuestions = this.getAllQuestions().length;

    const key = this.getUserStorageKey(STORAGE_KEYS.STATS);
    localStorage.setItem(key, JSON.stringify(stats));
  }

  getStats(): QuizStats {
    const key = this.getUserStorageKey(STORAGE_KEYS.STATS);
    const stored = localStorage.getItem(key);
    if (!stored) {
      return {
        totalQuestions: this.getAllQuestions().length,
        totalAttempts: 0,
        averageScore: 0,
        questionStats: {},
      };
    }
    try {
      return JSON.parse(stored);
    } catch {
      return {
        totalQuestions: this.getAllQuestions().length,
        totalAttempts: 0,
        averageScore: 0,
        questionStats: {},
      };
    }
  }

  getGlobalStats(): QuizStats {
    // Aggregate stats from all users (for admin view)
    const questions = this.getAllQuestions();
    const questionStats: Record<string, QuestionStats> = {};

    // Initialize stats for all questions
    questions.forEach((q) => {
      questionStats[q.id] = {
        attempts: 0,
        correctCount: 0,
      };
    });

    // For now, just return current user stats
    // In a real app, this would aggregate from all users
    const userStats = this.getStats();

    return {
      totalQuestions: questions.length,
      totalAttempts: userStats.totalAttempts,
      averageScore: userStats.averageScore,
      questionStats: { ...questionStats, ...userStats.questionStats },
    };
  }

  // ============= QUIZ MODE =============

  isQuizModeEnabled(): boolean {
    return localStorage.getItem(STORAGE_KEYS.QUIZ_MODE) === 'true';
  }

  setQuizModeEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.QUIZ_MODE, enabled.toString());
  }

  // ============= ANSWER CHECKING =============

  checkAnswer(question: QuizQuestion, userAnswer: string | number | string[]): boolean {
    if (question.type === 'multiple-choice') {
      return userAnswer === question.correctOptionIndex;
    }

    if (question.type === 'fill-blank') {
      if (!question.correctAnswers) return false;

      const answers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];

      if (answers.length !== question.correctAnswers.length) return false;

      return question.correctAnswers.every((correct, index) => {
        const user = answers[index]?.toString().trim() || '';
        if (question.caseInsensitive) {
          return user.toLowerCase() === correct.toLowerCase();
        }
        return user === correct;
      });
    }

    return false;
  }

  // ============= DATA MIGRATION =============

  migrateAnonymousDataToUser(userId: string): void {
    // Migrate attempts
    const anonymousAttempts = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    const userAttemptsKey = `user-${userId}-${STORAGE_KEYS.ATTEMPTS}`;
    const existingUserAttempts = localStorage.getItem(userAttemptsKey);

    if (anonymousAttempts && !existingUserAttempts) {
      localStorage.setItem(userAttemptsKey, anonymousAttempts);
    }

    // Migrate stats
    const anonymousStats = localStorage.getItem(STORAGE_KEYS.STATS);
    const userStatsKey = `user-${userId}-${STORAGE_KEYS.STATS}`;
    const existingUserStats = localStorage.getItem(userStatsKey);

    if (anonymousStats && !existingUserStats) {
      localStorage.setItem(userStatsKey, anonymousStats);
    }
  }
}

export const quizService = new QuizService();
export default quizService;
