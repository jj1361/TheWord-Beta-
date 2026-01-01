import React from 'react';
import './QuizIndicator.css';

interface QuizIndicatorProps {
  questionCount: number;
  onClick: () => void;
}

const QuizIndicator: React.FC<QuizIndicatorProps> = ({ questionCount, onClick }) => {
  if (questionCount === 0) return null;

  return (
    <button
      className="quiz-indicator"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={`${questionCount} quiz question${questionCount > 1 ? 's' : ''} available`}
      aria-label={`Take quiz - ${questionCount} question${questionCount > 1 ? 's' : ''}`}
    >
      <span className="quiz-indicator-icon">?</span>
      {questionCount > 1 && (
        <span className="quiz-indicator-count">{questionCount}</span>
      )}
    </button>
  );
};

export default QuizIndicator;
