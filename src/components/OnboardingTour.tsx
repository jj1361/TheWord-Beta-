import React, { useState, useEffect, useCallback } from 'react';
import './OnboardingTour.css';

interface TourStep {
  target: string; // CSS selector for the element to highlight
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  fallbackPosition?: { top: string; left: string }; // For elements that might not exist
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const tourSteps: TourStep[] = [
  {
    target: '.welcome-step',
    title: 'Welcome to The Book!',
    content: 'This interactive Bible study app helps you explore Scripture with powerful tools. Let\'s take a quick tour of the key features.',
    position: 'center',
  },
  {
    target: '.navigation-modal-btn',
    title: 'Navigate the Bible',
    content: 'Click here to select any book and chapter. Use the arrow buttons on either side to move between chapters.',
    position: 'bottom',
  },
  {
    target: '.search-container',
    title: 'Powerful Search',
    content: 'Search for text, scripture references (like "John 3:16"), or Strong\'s numbers (like "H430" or "G2316") to find Hebrew/Greek word definitions.',
    position: 'bottom',
  },
  {
    target: '.verse-container',
    title: 'Interactive Verses',
    content: 'Click any verse to expand the Interlinear Analysis, showing the original Hebrew or Greek words with their meanings.',
    position: 'top',
  },
  {
    target: '.sidebar',
    title: 'Sidebar Tools',
    content: 'Access powerful features here: Proto-Sinaitic script toggle, webcam for presentations, screen sharing, and Youth Mode with visual aids.',
    position: 'right',
  },
  {
    target: '.history-dropdown-btn',
    title: 'Navigation History',
    content: 'View your reading history and quickly jump back to previously visited chapters.',
    position: 'bottom',
  },
  {
    target: '.bookmarks-btn',
    title: 'Bookmarks',
    content: 'Save your favorite verses and passages for quick access later. Add labels to organize your bookmarks.',
    position: 'bottom',
  },
  {
    target: '.theme-toggle',
    title: 'Light/Dark Mode',
    content: 'Toggle between light and dark themes for comfortable reading in any environment.',
    position: 'bottom',
  },
  {
    target: '.tour-complete',
    title: 'You\'re Ready!',
    content: 'That\'s the basics! Explore the app to discover more features like Hebrew letter meanings, person links, and lexicon entries. Happy studying!',
    position: 'center',
  },
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});

  const calculatePosition = useCallback(() => {
    const step = tourSteps[currentStep];

    // Center position for welcome/complete steps
    if (step.position === 'center') {
      setTooltipStyle({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
      setHighlightStyle({ display: 'none' });
      return;
    }

    const targetElement = document.querySelector(step.target);

    if (!targetElement) {
      // Fallback if element not found
      setTooltipStyle({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
      setHighlightStyle({ display: 'none' });
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const padding = 8;

    // Set highlight position
    setHighlightStyle({
      display: 'block',
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Calculate tooltip position based on step.position
    const tooltipWidth = 320;
    const tooltipHeight = 180;
    const gap = 16;

    let top: number, left: number;

    switch (step.position) {
      case 'top':
        top = rect.top - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
        break;
      default:
        top = rect.bottom + gap;
        left = rect.left;
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 20) left = 20;
    if (left + tooltipWidth > viewportWidth - 20) left = viewportWidth - tooltipWidth - 20;
    if (top < 20) top = 20;
    if (top + tooltipHeight > viewportHeight - 20) top = viewportHeight - tooltipHeight - 20;

    setTooltipStyle({
      top: `${top}px`,
      left: `${left}px`,
    });
  }, [currentStep]);

  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition);

      return () => {
        window.removeEventListener('resize', calculatePosition);
        window.removeEventListener('scroll', calculatePosition);
      };
    }
  }, [isOpen, currentStep, calculatePosition]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <div className="onboarding-overlay">
      {/* Highlight box around target element */}
      <div className="onboarding-highlight" style={highlightStyle} />

      {/* Tooltip */}
      <div className="onboarding-tooltip" style={tooltipStyle}>
        <div className="tooltip-header">
          <h3 className="tooltip-title">{step.title}</h3>
          <button className="tooltip-close" onClick={handleSkip} title="Skip tour">
            ✕
          </button>
        </div>

        <p className="tooltip-content">{step.content}</p>

        <div className="tooltip-footer">
          <div className="tooltip-progress">
            {tourSteps.map((_, index) => (
              <span
                key={index}
                className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>

          <div className="tooltip-actions">
            {!isFirstStep && (
              <button className="tooltip-btn secondary" onClick={handlePrev}>
                Back
              </button>
            )}
            <button className="tooltip-btn primary" onClick={handleNext}>
              {isLastStep ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>

        <div className="tooltip-step-counter">
          Step {currentStep + 1} of {tourSteps.length}
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
