import React from 'react';
import { useQuiz } from '../../contexts/QuizContext';
import './QuizToggle.css';

interface QuizToggleProps {
  compact?: boolean;
}

const QuizToggle: React.FC<QuizToggleProps> = ({ compact = false }) => {
  const { isQuizModeEnabled, toggleQuizMode } = useQuiz();

  return (
    <label className={`quiz-toggle ${compact ? 'quiz-toggle-compact' : ''}`}>
      <input
        type="checkbox"
        checked={isQuizModeEnabled}
        onChange={toggleQuizMode}
      />
      <span className="quiz-toggle-slider">
        <span className="quiz-toggle-icon quiz-toggle-icon-off">?</span>
        <span className="quiz-toggle-icon quiz-toggle-icon-on">?</span>
      </span>
      {!compact && <span className="quiz-toggle-label">Quiz Mode</span>}
    </label>
  );
};

export default QuizToggle;
