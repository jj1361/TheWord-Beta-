import React, { useState, useEffect } from 'react';
import { QuizQuestion, QuestionType } from '../../types/quiz';
import { quizService } from '../../services/quizService';
import { useQuiz } from '../../contexts/QuizContext';
import { useAuth } from '../../contexts/AuthContext';
import { BIBLE_BOOKS } from '../../types/bible';
import './QuizAdmin.css';

interface QuizAdminProps {
  onBack?: () => void;
}

const QuizAdmin: React.FC<QuizAdminProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { questions, refreshQuestions, stats } = useQuiz();
  const [isEditing, setIsEditing] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [filterBook, setFilterBook] = useState<number | 'all'>('all');

  // Form state
  const [questionType, setQuestionType] = useState<QuestionType>('multiple-choice');
  const [selectedBook, setSelectedBook] = useState(1);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState(1);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [verseWithBlanks, setVerseWithBlanks] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState<string[]>(['']);
  const [caseInsensitive, setCaseInsensitive] = useState(true);

  const selectedBookData = BIBLE_BOOKS.find((b) => b.id === selectedBook);
  const maxChapters = selectedBookData?.chapters || 1;

  useEffect(() => {
    if (selectedChapter > maxChapters) {
      setSelectedChapter(1);
    }
  }, [selectedBook, maxChapters, selectedChapter]);

  const resetForm = () => {
    setQuestionType('multiple-choice');
    setSelectedBook(1);
    setSelectedChapter(1);
    setSelectedVerse(1);
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectOptionIndex(0);
    setVerseWithBlanks('');
    setCorrectAnswers(['']);
    setCaseInsensitive(true);
    setEditingQuestion(null);
  };

  const handleEdit = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setQuestionType(question.type);
    setSelectedBook(question.verse.bookId);
    setSelectedChapter(question.verse.chapter);
    setSelectedVerse(question.verse.startVerse);
    setQuestionText(question.questionText);

    if (question.type === 'multiple-choice') {
      setOptions(question.options || ['', '', '', '']);
      setCorrectOptionIndex(question.correctOptionIndex || 0);
    } else {
      setVerseWithBlanks(question.verseWithBlanks || '');
      setCorrectAnswers(question.correctAnswers || ['']);
      setCaseInsensitive(question.caseInsensitive ?? true);
    }

    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      quizService.deleteQuestion(id);
      refreshQuestions();
    }
  };

  const handleSave = () => {
    const bookName = BIBLE_BOOKS.find((b) => b.id === selectedBook)?.name || 'Unknown';
    const osisRef = `${bookName}.${selectedChapter}.${selectedVerse}`;

    const questionData = {
      type: questionType,
      verse: {
        bookId: selectedBook,
        bookName,
        chapter: selectedChapter,
        startVerse: selectedVerse,
        osisRef,
      },
      questionText,
      ...(questionType === 'multiple-choice'
        ? {
            options: options.filter((o) => o.trim()),
            correctOptionIndex,
          }
        : {
            verseWithBlanks,
            correctAnswers: correctAnswers.filter((a) => a.trim()),
            caseInsensitive,
          }),
      createdBy: user?.uid || 'admin',
    };

    // Validate
    if (!questionText.trim()) {
      alert('Please enter a question');
      return;
    }

    if (questionType === 'multiple-choice') {
      const validOptions = options.filter((o) => o.trim());
      if (validOptions.length < 2) {
        alert('Please provide at least 2 options');
        return;
      }
      if (correctOptionIndex >= validOptions.length) {
        alert('Please select a valid correct answer');
        return;
      }
    } else {
      if (!verseWithBlanks.includes('___')) {
        alert('Please include at least one blank (___) in the verse');
        return;
      }
      const blankCount = (verseWithBlanks.match(/___/g) || []).length;
      const validAnswers = correctAnswers.filter((a) => a.trim());
      if (validAnswers.length !== blankCount) {
        alert(`Please provide ${blankCount} answer(s) for the blank(s)`);
        return;
      }
    }

    if (editingQuestion) {
      quizService.updateQuestion(editingQuestion.id, questionData);
    } else {
      quizService.createQuestion(questionData);
    }

    refreshQuestions();
    resetForm();
    setIsEditing(false);
  };

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctOptionIndex >= newOptions.length) {
        setCorrectOptionIndex(0);
      }
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleBlankAnswerChange = (index: number, value: string) => {
    const newAnswers = [...correctAnswers];
    newAnswers[index] = value;
    setCorrectAnswers(newAnswers);
  };

  // Update blank answers count when verse changes
  useEffect(() => {
    const blankCount = (verseWithBlanks.match(/___/g) || []).length;
    if (blankCount !== correctAnswers.length) {
      setCorrectAnswers(new Array(Math.max(1, blankCount)).fill(''));
    }
  }, [verseWithBlanks, correctAnswers.length]);

  const filteredQuestions =
    filterBook === 'all'
      ? questions
      : questions.filter((q) => q.verse.bookId === filterBook);

  const globalStats = quizService.getGlobalStats();

  if (isEditing) {
    return (
      <div className="quiz-admin-editor">
        <div className="quiz-admin-editor-header">
          <button className="quiz-admin-back-btn" onClick={() => { resetForm(); setIsEditing(false); }}>
            ← Back
          </button>
          <h3>{editingQuestion ? 'Edit Question' : 'Create New Question'}</h3>
        </div>

        <div className="quiz-admin-form">
          <div className="quiz-admin-field">
            <label>Question Type</label>
            <div className="quiz-admin-type-buttons">
              <button
                className={`quiz-type-btn ${questionType === 'multiple-choice' ? 'active' : ''}`}
                onClick={() => setQuestionType('multiple-choice')}
              >
                Multiple Choice
              </button>
              <button
                className={`quiz-type-btn ${questionType === 'fill-blank' ? 'active' : ''}`}
                onClick={() => setQuestionType('fill-blank')}
              >
                Fill in Blank
              </button>
            </div>
          </div>

          <div className="quiz-admin-field">
            <label>Linked Verse</label>
            <div className="quiz-admin-verse-selector">
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(Number(e.target.value))}
              >
                {BIBLE_BOOKS.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(Number(e.target.value))}
              >
                {Array.from({ length: maxChapters }, (_, i) => i + 1).map((ch) => (
                  <option key={ch} value={ch}>
                    Ch. {ch}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={selectedVerse}
                onChange={(e) => setSelectedVerse(Number(e.target.value))}
                placeholder="Verse"
              />
            </div>
          </div>

          <div className="quiz-admin-field">
            <label>Question Text</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question..."
              rows={3}
            />
          </div>

          {questionType === 'multiple-choice' ? (
            <div className="quiz-admin-field">
              <label>Answer Options (select correct answer)</label>
              <div className="quiz-admin-options">
                {options.map((option, index) => (
                  <div key={index} className="quiz-admin-option-row">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOptionIndex === index}
                      onChange={() => setCorrectOptionIndex(index)}
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    {options.length > 2 && (
                      <button
                        className="quiz-admin-remove-option"
                        onClick={() => handleRemoveOption(index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <button className="quiz-admin-add-option" onClick={handleAddOption}>
                    + Add Option
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="quiz-admin-field">
                <label>Verse with Blanks (use ___ for blanks)</label>
                <textarea
                  value={verseWithBlanks}
                  onChange={(e) => setVerseWithBlanks(e.target.value)}
                  placeholder="And God said, Let there be ___: and there was ___."
                  rows={3}
                />
              </div>

              <div className="quiz-admin-field">
                <label>Correct Answers (in order of blanks)</label>
                <div className="quiz-admin-answers">
                  {correctAnswers.map((answer, index) => (
                    <div key={index} className="quiz-admin-answer-row">
                      <span className="answer-number">{index + 1}.</span>
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => handleBlankAnswerChange(index, e.target.value)}
                        placeholder={`Answer ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
                <label className="quiz-admin-checkbox">
                  <input
                    type="checkbox"
                    checked={caseInsensitive}
                    onChange={(e) => setCaseInsensitive(e.target.checked)}
                  />
                  Case insensitive matching
                </label>
              </div>
            </>
          )}

          <div className="quiz-admin-form-actions">
            <button
              className="quiz-admin-btn quiz-admin-btn-secondary"
              onClick={() => { resetForm(); setIsEditing(false); }}
            >
              Cancel
            </button>
            <button className="quiz-admin-btn quiz-admin-btn-primary" onClick={handleSave}>
              {editingQuestion ? 'Update Question' : 'Save Question'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-admin">
      <div className="quiz-admin-stats">
        <div className="quiz-stat-card">
          <span className="quiz-stat-value">{globalStats.totalQuestions}</span>
          <span className="quiz-stat-label">Questions</span>
        </div>
        <div className="quiz-stat-card">
          <span className="quiz-stat-value">{globalStats.totalAttempts}</span>
          <span className="quiz-stat-label">Attempts</span>
        </div>
        <div className="quiz-stat-card">
          <span className="quiz-stat-value">
            {globalStats.averageScore ? `${Math.round(globalStats.averageScore)}%` : '-'}
          </span>
          <span className="quiz-stat-label">Avg Score</span>
        </div>
      </div>

      <div className="quiz-admin-list-header">
        <h3>Questions</h3>
        <div className="quiz-admin-list-actions">
          <select
            className="quiz-admin-filter"
            value={filterBook === 'all' ? 'all' : filterBook}
            onChange={(e) =>
              setFilterBook(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
          >
            <option value="all">All Books</option>
            {BIBLE_BOOKS.map((book) => (
              <option key={book.id} value={book.id}>
                {book.name}
              </option>
            ))}
          </select>
          <button
            className="quiz-admin-btn quiz-admin-btn-primary"
            onClick={() => setIsEditing(true)}
          >
            + Add Question
          </button>
        </div>
      </div>

      <div className="quiz-admin-questions">
        {filteredQuestions.length === 0 ? (
          <div className="quiz-admin-empty">
            <p>No questions created yet</p>
            <button
              className="quiz-admin-btn quiz-admin-btn-primary"
              onClick={() => setIsEditing(true)}
            >
              Create First Question
            </button>
          </div>
        ) : (
          filteredQuestions.map((question) => {
            const qStats = stats.questionStats[question.id];
            return (
              <div key={question.id} className="quiz-admin-question-card">
                <div className="quiz-admin-question-content">
                  <span className="quiz-admin-question-type">
                    {question.type === 'multiple-choice' ? '📝' : '✏️'}
                  </span>
                  <div className="quiz-admin-question-info">
                    <p className="quiz-admin-question-text">{question.questionText}</p>
                    <span className="quiz-admin-question-meta">
                      {question.verse.bookName} {question.verse.chapter}:{question.verse.startVerse}
                      {' • '}
                      {question.type === 'multiple-choice' ? 'Multiple Choice' : 'Fill in Blank'}
                      {qStats && ` • ${qStats.attempts} attempts`}
                    </span>
                  </div>
                </div>
                <div className="quiz-admin-question-actions">
                  <button
                    className="quiz-admin-action-btn"
                    onClick={() => handleEdit(question)}
                  >
                    Edit
                  </button>
                  <button
                    className="quiz-admin-action-btn quiz-admin-action-btn-danger"
                    onClick={() => handleDelete(question.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default QuizAdmin;
