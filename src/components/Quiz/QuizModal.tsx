import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { QuizQuestion as QuizQuestionType, QuizAnswer } from '../../types/quiz';
import { quizService } from '../../services/quizService';
import { useQuiz } from '../../contexts/QuizContext';
import QuizQuestion from './QuizQuestion';
import QuizResults from './QuizResults';
import './QuizModal.css';

interface QuizModalProps {
  questions: QuizQuestionType[];
  verseText?: string;
  verseReference?: string;
  onClose: () => void;
}

const QuizModal: React.FC<QuizModalProps> = ({
  questions,
  verseText,
  verseReference,
  onClose,
}) => {
  const { refreshStats } = useQuiz();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [startTime] = useState(Date.now());

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleAnswer = useCallback(
    (answer: string | number | string[], isCorrect: boolean) => {
      const timeTaken = Date.now() - startTime;
      const newAnswer: QuizAnswer = {
        questionId: questions[currentIndex].id,
        userAnswer: answer,
        isCorrect,
        timeTaken,
      };
      setAnswers((prev) => [...prev, newAnswer]);
      setShowFeedback(true);

      // Wait a moment to show feedback, then move to next question or results
      setTimeout(() => {
        setShowFeedback(false);
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          // Quiz complete - save attempt
          const allAnswers = [...answers, newAnswer];
          const score = allAnswers.filter((a) => a.isCorrect).length;
          quizService.saveAttempt(
            questions.map((q) => q.id),
            allAnswers,
            score
          );
          refreshStats();
          setShowResults(true);
        }
      }, 1500);
    },
    [currentIndex, questions, answers, startTime, refreshStats]
  );

  const handleTryAgain = () => {
    setCurrentIndex(0);
    setAnswers([]);
    setShowResults(false);
    setShowFeedback(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const score = answers.filter((a) => a.isCorrect).length;
  const currentQuestion = questions[currentIndex];

  return createPortal(
    <div className="quiz-modal-overlay" onClick={handleOverlayClick}>
      <div className="quiz-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="quiz-modal-close"
          onClick={onClose}
          aria-label="Close quiz"
        >
          ×
        </button>

        {verseReference && (
          <div className="quiz-modal-verse-header">
            <span className="quiz-modal-verse-reference">{verseReference}</span>
            {verseText && (
              <p className="quiz-modal-verse-text">"{verseText}"</p>
            )}
          </div>
        )}

        <div className="quiz-modal-content">
          {showResults ? (
            <QuizResults
              score={score}
              totalQuestions={questions.length}
              onTryAgain={handleTryAgain}
              onClose={onClose}
            />
          ) : (
            currentQuestion && (
              <QuizQuestion
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                totalQuestions={questions.length}
                onAnswer={handleAnswer}
                showFeedback={showFeedback}
              />
            )
          )}
        </div>

        {!showResults && questions.length > 1 && (
          <div className="quiz-modal-dots">
            {questions.map((_, index) => (
              <span
                key={index}
                className={`quiz-modal-dot ${
                  index < currentIndex
                    ? 'completed'
                    : index === currentIndex
                    ? 'active'
                    : ''
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default QuizModal;
