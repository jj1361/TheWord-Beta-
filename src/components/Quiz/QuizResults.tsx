import React from 'react';
import './QuizResults.css';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  onTryAgain: () => void;
  onClose: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  score,
  totalQuestions,
  onTryAgain,
  onClose,
}) => {
  const percentage = Math.round((score / totalQuestions) * 100);

  const getMessage = () => {
    if (percentage === 100) return 'Perfect Score!';
    if (percentage >= 80) return 'Great Job!';
    if (percentage >= 60) return 'Good Effort!';
    if (percentage >= 40) return 'Keep Practicing!';
    return 'Keep Learning!';
  };

  const getEmoji = () => {
    if (percentage === 100) return '🎉';
    if (percentage >= 80) return '🌟';
    if (percentage >= 60) return '👍';
    if (percentage >= 40) return '💪';
    return '📖';
  };

  return (
    <div className="quiz-results">
      <div className="quiz-results-emoji">{getEmoji()}</div>
      <h2 className="quiz-results-title">Quiz Complete!</h2>

      <div className="quiz-results-score-container">
        <div className="quiz-results-score-circle">
          <svg viewBox="0 0 100 100" className="quiz-results-svg">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--border-primary, #e2e8f0)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${percentage * 2.83} 283`}
              transform="rotate(-90 50 50)"
              className="quiz-results-progress"
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="100%" stopColor="#764ba2" />
              </linearGradient>
            </defs>
          </svg>
          <div className="quiz-results-score-text">
            <span className="quiz-results-score-number">{score}</span>
            <span className="quiz-results-score-divider">/</span>
            <span className="quiz-results-score-total">{totalQuestions}</span>
          </div>
        </div>
        <div className="quiz-results-percentage">{percentage}%</div>
      </div>

      <p className="quiz-results-message">{getMessage()}</p>

      <div className="quiz-results-actions">
        <button className="quiz-results-btn quiz-results-btn-secondary" onClick={onTryAgain}>
          Try Again
        </button>
        <button className="quiz-results-btn quiz-results-btn-primary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default QuizResults;
