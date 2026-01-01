import React, { useState, useEffect } from 'react';
import { QuizQuestion as QuizQuestionType } from '../../types/quiz';
import './QuizQuestion.css';

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string | number | string[], isCorrect: boolean) => void;
  showFeedback: boolean;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  showFeedback,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [fillBlankAnswers, setFillBlankAnswers] = useState<string[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setFillBlankAnswers(
      question.correctAnswers ? new Array(question.correctAnswers.length).fill('') : []
    );
    setHasSubmitted(false);
    setIsCorrect(false);
  }, [question.id, question.correctAnswers]);

  const handleMultipleChoiceSelect = (index: number) => {
    if (hasSubmitted) return;
    setSelectedOption(index);
  };

  const handleFillBlankChange = (index: number, value: string) => {
    if (hasSubmitted) return;
    const newAnswers = [...fillBlankAnswers];
    newAnswers[index] = value;
    setFillBlankAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (hasSubmitted) return;

    let answer: string | number | string[];
    let correct = false;

    if (question.type === 'multiple-choice') {
      if (selectedOption === null) return;
      answer = selectedOption;
      correct = selectedOption === question.correctOptionIndex;
    } else {
      if (fillBlankAnswers.some((a) => !a.trim())) return;
      answer = fillBlankAnswers;
      correct = checkFillBlankAnswer();
    }

    setHasSubmitted(true);
    setIsCorrect(correct);
    onAnswer(answer, correct);
  };

  const checkFillBlankAnswer = (): boolean => {
    if (!question.correctAnswers) return false;
    return question.correctAnswers.every((correct, index) => {
      const userAnswer = fillBlankAnswers[index]?.trim() || '';
      if (question.caseInsensitive) {
        return userAnswer.toLowerCase() === correct.toLowerCase();
      }
      return userAnswer === correct;
    });
  };

  const canSubmit = () => {
    if (hasSubmitted) return false;
    if (question.type === 'multiple-choice') {
      return selectedOption !== null;
    }
    return fillBlankAnswers.every((a) => a.trim());
  };

  const renderBlankInputs = () => {
    if (!question.verseWithBlanks) return null;

    const parts = question.verseWithBlanks.split('___');
    const elements: React.ReactNode[] = [];

    parts.forEach((part, index) => {
      elements.push(<span key={`text-${index}`}>{part}</span>);

      if (index < parts.length - 1) {
        const isInputCorrect =
          hasSubmitted &&
          question.correctAnswers &&
          (question.caseInsensitive
            ? fillBlankAnswers[index]?.toLowerCase().trim() ===
              question.correctAnswers[index]?.toLowerCase()
            : fillBlankAnswers[index]?.trim() === question.correctAnswers[index]);

        const isInputWrong = hasSubmitted && !isInputCorrect;

        elements.push(
          <span key={`input-${index}`} className="fill-blank-input-wrapper">
            <input
              type="text"
              className={`fill-blank-input ${
                hasSubmitted ? (isInputCorrect ? 'correct' : 'incorrect') : ''
              }`}
              value={fillBlankAnswers[index] || ''}
              onChange={(e) => handleFillBlankChange(index, e.target.value)}
              placeholder="..."
              disabled={hasSubmitted}
              autoComplete="off"
            />
            {isInputWrong && question.correctAnswers && (
              <span className="correct-answer-hint">
                {question.correctAnswers[index]}
              </span>
            )}
          </span>
        );
      }
    });

    return elements;
  };

  return (
    <div className="quiz-question">
      <div className="quiz-question-progress">
        <span className="quiz-question-number">
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="quiz-progress-bar">
          <div
            className="quiz-progress-fill"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      <div className="quiz-question-content">
        {question.type === 'multiple-choice' ? (
          <>
            <h3 className="quiz-question-text">{question.questionText}</h3>
            <div className="quiz-options">
              {question.options?.map((option, index) => {
                const isSelected = selectedOption === index;
                const isCorrectOption = index === question.correctOptionIndex;
                const showCorrect = hasSubmitted && showFeedback && isCorrectOption;
                const showIncorrect =
                  hasSubmitted && showFeedback && isSelected && !isCorrectOption;

                return (
                  <button
                    key={index}
                    className={`quiz-option ${isSelected ? 'selected' : ''} ${
                      showCorrect ? 'correct' : ''
                    } ${showIncorrect ? 'incorrect' : ''}`}
                    onClick={() => handleMultipleChoiceSelect(index)}
                    disabled={hasSubmitted}
                  >
                    <span className="quiz-option-indicator">
                      {showCorrect && '✓'}
                      {showIncorrect && '✗'}
                      {!hasSubmitted && (isSelected ? '●' : '○')}
                      {hasSubmitted && !showCorrect && !showIncorrect && '○'}
                    </span>
                    <span className="quiz-option-text">{option}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <h3 className="quiz-question-text">{question.questionText}</h3>
            <div className="quiz-fill-blank">
              <p className="quiz-fill-blank-verse">{renderBlankInputs()}</p>
            </div>
          </>
        )}
      </div>

      {hasSubmitted && showFeedback && (
        <div className={`quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
          {isCorrect ? (
            <>
              <span className="quiz-feedback-icon">✓</span>
              <span>Correct!</span>
            </>
          ) : (
            <>
              <span className="quiz-feedback-icon">✗</span>
              <span>Incorrect</span>
            </>
          )}
        </div>
      )}

      {!hasSubmitted && (
        <button
          className="quiz-submit-btn"
          onClick={handleSubmit}
          disabled={!canSubmit()}
        >
          Submit Answer
        </button>
      )}
    </div>
  );
};

export default QuizQuestion;
