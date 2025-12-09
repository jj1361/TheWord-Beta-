import React, { useState } from 'react';
import './HelpModal.css';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
}

type HelpSection = 'getting-started' | 'navigation' | 'search' | 'interlinear' | 'tools' | 'keyboard' | 'tips';

interface SectionContent {
  title: string;
  icon: string;
  content: React.ReactNode;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, onStartTour }) => {
  const [activeSection, setActiveSection] = useState<HelpSection>('getting-started');

  if (!isOpen) return null;

  const sections: Record<HelpSection, SectionContent> = {
    'getting-started': {
      title: 'Getting Started',
      icon: '🚀',
      content: (
        <div className="help-content">
          <h3>Welcome to The Book</h3>
          <p>
            The Book is an interactive Bible study application designed to help you explore Scripture
            with powerful research tools. Here's how to get started:
          </p>

          <div className="help-steps">
            <div className="help-step">
              <span className="step-number">1</span>
              <div>
                <strong>Select a Book and Chapter</strong>
                <p>Click the book/chapter button in the header to open the navigation modal. Choose any book and chapter from the Bible.</p>
              </div>
            </div>

            <div className="help-step">
              <span className="step-number">2</span>
              <div>
                <strong>Read and Explore</strong>
                <p>Click on any verse to expand the interlinear analysis, showing the original Hebrew or Greek text with word-by-word translations.</p>
              </div>
            </div>

            <div className="help-step">
              <span className="step-number">3</span>
              <div>
                <strong>Deep Dive</strong>
                <p>Click on Hebrew letters, Strong's numbers, or highlighted words to explore their meanings in the lexicon panel.</p>
              </div>
            </div>
          </div>

          <div className="help-cta">
            <button className="help-tour-btn-inline" onClick={onStartTour}>
              Take the Interactive Tour
            </button>
          </div>
        </div>
      ),
    },

    'navigation': {
      title: 'Navigation',
      icon: '📖',
      content: (
        <div className="help-content">
          <h3>Navigating the Bible</h3>

          <div className="help-feature">
            <h4>Book & Chapter Selection</h4>
            <p>Click the <strong>book name and chapter number</strong> in the header to open the full navigation modal. You can:</p>
            <ul>
              <li>Browse all 66 books organized by Old and New Testament</li>
              <li>Click any book to see its chapters</li>
              <li>Jump directly to any chapter</li>
            </ul>
          </div>

          <div className="help-feature">
            <h4>Chapter Arrows</h4>
            <p>Use the <strong>← →</strong> arrows on either side of the navigation button to move to the previous or next chapter. This also works across book boundaries.</p>
          </div>

          <div className="help-feature">
            <h4>History Controls</h4>
            <p>The <strong>back/forward arrows</strong> let you navigate through your reading history, just like a web browser. The history dropdown shows all chapters you've visited in this session.</p>
          </div>

          <div className="help-feature">
            <h4>Quick Chapter Jump</h4>
            <p>Click just the <strong>chapter number</strong> (underlined) to open a quick chapter selector for the current book.</p>
          </div>
        </div>
      ),
    },

    'search': {
      title: 'Search',
      icon: '🔍',
      content: (
        <div className="help-content">
          <h3>Powerful Search Features</h3>

          <div className="help-feature">
            <h4>Text Search</h4>
            <p>Type any word or phrase to search across the entire Bible. Results show the verse reference and matching text with highlights.</p>
            <div className="help-example">
              <code>love</code> → Finds all verses containing "love"
            </div>
          </div>

          <div className="help-feature">
            <h4>Scripture References</h4>
            <p>Type a scripture reference to jump directly to that passage:</p>
            <div className="help-example">
              <code>John 3:16</code> → Goes to John chapter 3, verse 16<br />
              <code>Gen 1</code> → Goes to Genesis chapter 1<br />
              <code>Ps 23:1-6</code> → Goes to Psalm 23
            </div>
          </div>

          <div className="help-feature">
            <h4>Strong's Numbers</h4>
            <p>Search by Strong's Concordance numbers to find Hebrew/Greek word definitions:</p>
            <div className="help-example">
              <code>H430</code> → Hebrew word #430 (Elohim - God)<br />
              <code>G2316</code> → Greek word #2316 (Theos - God)<br />
              <code>430</code> → Opens word search for that number
            </div>
          </div>

          <div className="help-tip">
            <strong>💡 Tip:</strong> The search index builds in the background. You'll see "Fast search ready" when it's complete for instant results.
          </div>
        </div>
      ),
    },

    'interlinear': {
      title: 'Interlinear Study',
      icon: '📚',
      content: (
        <div className="help-content">
          <h3>Interlinear Analysis</h3>
          <p>The interlinear feature shows you the original Hebrew (Old Testament) or Greek (New Testament) text with detailed word analysis.</p>

          <div className="help-feature">
            <h4>Opening Interlinear View</h4>
            <p>Click any verse to expand its interlinear analysis. Click again to collapse it.</p>
          </div>

          <div className="help-feature">
            <h4>Word Cards</h4>
            <p>Each word card shows:</p>
            <ul>
              <li><strong>Original text</strong> - Hebrew or Greek script</li>
              <li><strong>Transliteration</strong> - Pronunciation in English letters</li>
              <li><strong>Translation</strong> - English meaning</li>
              <li><strong>Strong's number</strong> - Click to see full definition</li>
              <li><strong>Part of speech</strong> - Noun, verb, etc.</li>
            </ul>
          </div>

          <div className="help-feature">
            <h4>Forward/Reverse Mode</h4>
            <p>Toggle between:</p>
            <ul>
              <li><strong>Reverse (default)</strong> - Original language first, then English</li>
              <li><strong>Forward</strong> - English first, then original language</li>
            </ul>
          </div>

          <div className="help-feature">
            <h4>Hebrew Letters</h4>
            <p>Click any Hebrew letter to learn its pictographic meaning, numerical value, and spiritual significance. Toggle Proto-Sinaitic script to see the ancient pictographic forms.</p>
          </div>
        </div>
      ),
    },

    'tools': {
      title: 'Sidebar Tools',
      icon: '🛠️',
      content: (
        <div className="help-content">
          <h3>Sidebar Tools</h3>
          <p>The sidebar on the left provides quick access to powerful features:</p>

          <div className="help-feature">
            <h4>א Proto-Sinaitic Toggle</h4>
            <p>Switch Hebrew text between modern Hebrew script and ancient Proto-Sinaitic pictographic characters. See the original picture-letters that form Hebrew words.</p>
          </div>

          <div className="help-feature">
            <h4>📹 Webcam</h4>
            <p>Enable your webcam for presentations or teaching. Additional controls:</p>
            <ul>
              <li>Settings - Adjust camera preferences</li>
              <li>Fullscreen - Expand webcam to fill the content area</li>
            </ul>
          </div>

          <div className="help-feature">
            <h4>📺 Screen Share</h4>
            <p>Share your screen within the app. Great for showing other content alongside Scripture. When enabled:</p>
            <ul>
              <li>Fullscreen by default</li>
              <li>Toggle to show verses alongside the shared screen</li>
              <li>Sidebar becomes transparent to overlay the content</li>
            </ul>
          </div>

          <div className="help-feature">
            <h4>👶 Youth Mode</h4>
            <p>Enables visual aids and images to help younger readers engage with Scripture. Key words are replaced with helpful illustrations.</p>
          </div>
        </div>
      ),
    },

    'keyboard': {
      title: 'Keyboard Shortcuts',
      icon: '⌨️',
      content: (
        <div className="help-content">
          <h3>Keyboard Shortcuts</h3>

          <div className="keyboard-shortcuts">
            <div className="shortcut-group">
              <h4>Navigation</h4>
              <div className="shortcut">
                <kbd>←</kbd>
                <span>Previous chapter</span>
              </div>
              <div className="shortcut">
                <kbd>→</kbd>
                <span>Next chapter</span>
              </div>
            </div>

            <div className="shortcut-group">
              <h4>Quick Jump</h4>
              <div className="shortcut">
                <kbd>1-9</kbd>
                <span>Type numbers to jump to verse</span>
              </div>
            </div>

            <div className="shortcut-group">
              <h4>Interface</h4>
              <div className="shortcut">
                <kbd>Esc</kbd>
                <span>Close modals and panels</span>
              </div>
            </div>
          </div>

          <div className="help-tip">
            <strong>💡 Tip:</strong> Type a verse number quickly (e.g., "16") to jump to that verse in the current chapter.
          </div>
        </div>
      ),
    },

    'tips': {
      title: 'Tips & Tricks',
      icon: '💡',
      content: (
        <div className="help-content">
          <h3>Pro Tips</h3>

          <div className="tip-card">
            <span className="tip-icon">📑</span>
            <div>
              <strong>Use Bookmarks</strong>
              <p>Save verses for quick access later. Add labels to organize your study topics.</p>
            </div>
          </div>

          <div className="tip-card">
            <span className="tip-icon">🔗</span>
            <div>
              <strong>Click Person Names</strong>
              <p>Names in blue are clickable. View biographical information and all Scripture references for that person.</p>
            </div>
          </div>

          <div className="tip-card">
            <span className="tip-icon">📊</span>
            <div>
              <strong>Word Usage Statistics</strong>
              <p>In the lexicon panel, click "Load Usage Counts" to see how many times each English translation is used, with clickable verse references.</p>
            </div>
          </div>

          <div className="tip-card">
            <span className="tip-icon">🌙</span>
            <div>
              <strong>Dark Mode</strong>
              <p>Toggle dark mode with the sun/moon button for comfortable reading in any lighting condition.</p>
            </div>
          </div>

          <div className="tip-card">
            <span className="tip-icon">📱</span>
            <div>
              <strong>Responsive Design</strong>
              <p>The app works on tablets and mobile devices. The sidebar becomes a horizontal bar on smaller screens.</p>
            </div>
          </div>

          <div className="tip-card">
            <span className="tip-icon">🔤</span>
            <div>
              <strong>Italic Words</strong>
              <p>Words in <em>italics</em> in the KJV text indicate words added by translators for clarity that don't appear in the original manuscripts.</p>
            </div>
          </div>
        </div>
      ),
    },
  };

  const sectionKeys = Object.keys(sections) as HelpSection[];

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal-header">
          <h2>Help & Documentation</h2>
          <button className="help-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="help-modal-body">
          <nav className="help-nav">
            {sectionKeys.map((key) => (
              <button
                key={key}
                className={`help-nav-item ${activeSection === key ? 'active' : ''}`}
                onClick={() => setActiveSection(key)}
              >
                <span className="nav-icon">{sections[key].icon}</span>
                <span className="nav-label">{sections[key].title}</span>
              </button>
            ))}
          </nav>

          <div className="help-section-content">
            {sections[activeSection].content}
          </div>
        </div>

        <div className="help-modal-footer">
          <span className="help-version">The Book v1.0</span>
          <div className="help-footer-actions">
            <button className="help-btn secondary" onClick={onStartTour}>
              Take Tour
            </button>
            <button className="help-btn primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
