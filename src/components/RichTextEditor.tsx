import React, { useRef, useCallback, useEffect } from 'react';
import { RichTextContent } from '../types/notes';
import './RichTextEditor.css';

interface RichTextEditorProps {
  content: RichTextContent;
  onChange: (content: RichTextContent) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const FONT_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Dark Gray', value: '#4a4a4a' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Purple', value: '#9333ea' },
  { name: 'Pink', value: '#db2777' },
];

const HIGHLIGHT_COLORS = [
  { name: 'None', value: 'transparent' },
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Blue', value: '#bfdbfe' },
  { name: 'Pink', value: '#fbcfe8' },
  { name: 'Orange', value: '#fed7aa' },
  { name: 'Purple', value: '#e9d5ff' },
];

// Font size values use the deprecated fontSize command values (1-7)
// 1 = 10px, 2 = 13px, 3 = 16px (default), 4 = 18px, 5 = 24px, 6 = 32px, 7 = 48px
const FONT_SIZES = [
  { name: 'Tiny', value: '1' },
  { name: 'Small', value: '2' },
  { name: 'Normal', value: '3' },
  { name: 'Large', value: '4' },
  { name: 'X-Large', value: '5' },
  { name: 'XX-Large', value: '6' },
  { name: 'Huge', value: '7' },
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Write your note...',
  autoFocus = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && isInitialMount.current) {
      editorRef.current.innerHTML = content.html || '';
      isInitialMount.current = false;
    }
  }, [content.html]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const plainText = editorRef.current.innerText || '';
      onChange({ html, plainText });
    }
  }, [onChange]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleBold = () => execCommand('bold');
  const handleItalic = () => execCommand('italic');
  const handleUnderline = () => execCommand('underline');
  const handleStrikethrough = () => execCommand('strikeThrough');

  const handleFontColor = (color: string) => {
    execCommand('foreColor', color);
  };

  const handleHighlight = (color: string) => {
    if (color === 'transparent') {
      execCommand('removeFormat');
    } else {
      execCommand('hiliteColor', color);
    }
  };

  const handleBulletList = () => execCommand('insertUnorderedList');
  const handleNumberedList = () => execCommand('insertOrderedList');
  const handleIndent = () => execCommand('indent');
  const handleOutdent = () => execCommand('outdent');

  const handleHeading = (level: string) => {
    if (level === 'p') {
      execCommand('formatBlock', '<p>');
    } else {
      execCommand('formatBlock', `<${level}>`);
    }
  };

  const handleClearFormatting = () => {
    execCommand('removeFormat');
  };

  const handleFontSize = (size: string) => {
    execCommand('fontSize', size);
  };

  return (
    <div className="rich-text-editor">
      <div className="rte-toolbar">
        <div className="rte-toolbar-group">
          <select
            className="rte-select"
            onChange={(e) => handleHeading(e.target.value)}
            defaultValue="p"
            title="Text style"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
        </div>

        <div className="rte-toolbar-group">
          <select
            className="rte-select rte-font-size-select"
            onChange={(e) => handleFontSize(e.target.value)}
            defaultValue="3"
            title="Font size"
          >
            {FONT_SIZES.map((size) => (
              <option key={size.value} value={size.value}>
                {size.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rte-toolbar-divider" />

        <div className="rte-toolbar-group">
          <button
            type="button"
            className="rte-btn"
            onClick={handleBold}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className="rte-btn"
            onClick={handleItalic}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className="rte-btn"
            onClick={handleUnderline}
            title="Underline (Ctrl+U)"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            className="rte-btn"
            onClick={handleStrikethrough}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
        </div>

        <div className="rte-toolbar-divider" />

        <div className="rte-toolbar-group">
          <div className="rte-color-picker">
            <button type="button" className="rte-btn rte-color-btn" title="Font color">
              A
              <span className="rte-color-indicator" style={{ backgroundColor: '#000' }} />
            </button>
            <div className="rte-color-dropdown">
              {FONT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className="rte-color-option"
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleFontColor(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="rte-color-picker">
            <button type="button" className="rte-btn rte-highlight-btn" title="Highlight color">
              <span className="rte-highlight-icon">H</span>
            </button>
            <div className="rte-color-dropdown">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className="rte-color-option"
                  style={{
                    backgroundColor: color.value === 'transparent' ? '#fff' : color.value,
                    border: color.value === 'transparent' ? '1px dashed #ccc' : 'none'
                  }}
                  onClick={() => handleHighlight(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="rte-toolbar-divider" />

        <div className="rte-toolbar-group">
          <button
            type="button"
            className="rte-btn"
            onClick={handleBulletList}
            title="Bullet list"
          >
            •
          </button>
          <button
            type="button"
            className="rte-btn"
            onClick={handleNumberedList}
            title="Numbered list"
          >
            1.
          </button>
          <button
            type="button"
            className="rte-btn"
            onClick={handleOutdent}
            title="Decrease indent"
          >
            ←
          </button>
          <button
            type="button"
            className="rte-btn"
            onClick={handleIndent}
            title="Increase indent"
          >
            →
          </button>
        </div>

        <div className="rte-toolbar-divider" />

        <div className="rte-toolbar-group">
          <button
            type="button"
            className="rte-btn"
            onClick={handleClearFormatting}
            title="Clear formatting"
          >
            Tx
          </button>
        </div>
      </div>

      <div
        ref={editorRef}
        className="rte-content"
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
};

export default RichTextEditor;
