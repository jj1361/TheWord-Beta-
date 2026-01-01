import React, { useRef, useCallback, useEffect, useState } from 'react';
import { RichTextContent } from '../types/notes';
import './RichTextEditor.css';

interface RichTextEditorProps {
  content: RichTextContent;
  onChange: (content: RichTextContent) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const FONT_COLORS = [
  { name: 'Automatic', value: 'inherit' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#ffffff' },
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

interface ModalState {
  type: 'link' | 'image' | 'video' | 'table' | null;
  data?: {
    url?: string;
    text?: string;
    rows?: number;
    cols?: number;
  };
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Write your note...',
  autoFocus = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const savedSelection = useRef<Range | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<string>('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

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

  // Setup resize observers for images, videos, and tables
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if clicking on a media resize handle
      if (target.classList.contains('rte-resize-handle')) {
        e.preventDefault();
        const resizable = target.parentElement;
        if (!resizable) return;

        const media = resizable.querySelector('img, video, iframe') as HTMLElement;
        if (!media) return;

        const startX = e.clientX;
        const startWidth = media.offsetWidth;
        const startHeight = media.offsetHeight;
        const aspectRatio = startWidth / startHeight;

        const handleMouseMove = (moveEvent: MouseEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const newWidth = Math.max(50, startWidth + deltaX);
          const newHeight = newWidth / aspectRatio;

          media.style.width = `${newWidth}px`;
          media.style.height = `${newHeight}px`;
        };

        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          handleInput();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }

      // Check if clicking on a table resize handle
      if (target.classList.contains('rte-table-resize-handle')) {
        e.preventDefault();
        const wrapper = target.closest('.rte-table-wrapper') as HTMLElement;
        const table = wrapper?.querySelector('table') as HTMLTableElement;
        if (!table) return;

        const startX = e.clientX;
        const startWidth = table.offsetWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const newWidth = Math.max(200, startWidth + deltaX);
          table.style.width = `${newWidth}px`;
        };

        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          handleInput();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }

      // Check if clicking on a column resize handle
      if (target.classList.contains('rte-col-resize')) {
        e.preventDefault();
        const th = target.closest('th') as HTMLTableCellElement;
        if (!th) return;

        const startX = e.clientX;
        const startWidth = th.offsetWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const newWidth = Math.max(40, startWidth + deltaX);
          th.style.width = `${newWidth}px`;
          th.style.minWidth = `${newWidth}px`;

          // Also resize corresponding cells in the column
          const table = th.closest('table');
          const cellIndex = th.cellIndex;
          if (table) {
            table.querySelectorAll('tr').forEach(row => {
              const cell = row.cells[cellIndex];
              if (cell && cell !== th) {
                cell.style.width = `${newWidth}px`;
                cell.style.minWidth = `${newWidth}px`;
              }
            });
          }
        };

        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          handleInput();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    };

    editor.addEventListener('mousedown', handleMouseDown);
    return () => editor.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const plainText = editorRef.current.innerText || '';
      onChange({ html, plainText });
    }
  }, [onChange]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelection.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (savedSelection.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection.current);
      }
    }
  };

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
    if (color === 'inherit') {
      // Remove color formatting to use default/inherited color
      execCommand('removeFormat');
    } else {
      execCommand('foreColor', color);
    }
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

  const handleRemoveAllFormatting = () => {
    // Remove all formatting including block-level
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const text = range.toString();
      if (text) {
        // Delete the selected content and insert plain text
        execCommand('insertText', text);
      }
    }
  };

  const handleFontSize = (size: string) => {
    execCommand('fontSize', size);
  };

  // Link handling
  const openLinkModal = () => {
    saveSelection();
    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';
    setLinkText(selectedText);
    setLinkUrl('');
    setModal({ type: 'link' });
  };

  const insertLink = () => {
    restoreSelection();
    editorRef.current?.focus();

    if (linkUrl) {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      if (linkText) {
        const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
        execCommand('insertHTML', linkHtml);
      } else {
        execCommand('createLink', url);
      }
    }
    setModal({ type: null });
    setLinkUrl('');
    setLinkText('');
  };

  const removeLink = () => {
    execCommand('unlink');
  };

  // Image handling
  const openImageModal = () => {
    saveSelection();
    setImageUrl('');
    setModal({ type: 'image' });
  };

  const insertImage = () => {
    restoreSelection();
    editorRef.current?.focus();

    if (imageUrl) {
      const imageHtml = `<div class="rte-resizable" contenteditable="false">
        <img src="${imageUrl}" alt="Image" style="max-width: 100%; height: auto;" />
        <div class="rte-resize-handle"></div>
      </div>`;
      execCommand('insertHTML', imageHtml);
    }
    setModal({ type: null });
    setImageUrl('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImageUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Video handling
  const openVideoModal = () => {
    saveSelection();
    setVideoUrl('');
    setVideoFile('');
    setModal({ type: 'video' });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setVideoFile(dataUrl);
        setVideoUrl(''); // Clear URL if file is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const insertVideo = () => {
    restoreSelection();
    editorRef.current?.focus();

    // Check if we have a file upload
    if (videoFile) {
      const videoHtml = `<div class="rte-resizable rte-video-container" contenteditable="false">
        <video
          src="${videoFile}"
          controls
          width="560"
          height="315"
          style="max-width: 100%;"
        ></video>
        <div class="rte-resize-handle"></div>
      </div>`;
      execCommand('insertHTML', videoHtml);
    } else if (videoUrl) {
      let embedUrl = videoUrl;

      // Convert YouTube URLs to embed format
      if (videoUrl.includes('youtube.com/watch')) {
        const videoId = new URL(videoUrl).searchParams.get('v');
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } else if (videoUrl.includes('youtu.be/')) {
        const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      }
      // Convert Vimeo URLs to embed format
      else if (videoUrl.includes('vimeo.com/')) {
        const videoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0];
        if (videoId) {
          embedUrl = `https://player.vimeo.com/video/${videoId}`;
        }
      }

      const videoHtml = `<div class="rte-resizable rte-video-container" contenteditable="false">
        <iframe
          src="${embedUrl}"
          width="560"
          height="315"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          style="max-width: 100%;"
        ></iframe>
        <div class="rte-resize-handle"></div>
      </div>`;
      execCommand('insertHTML', videoHtml);
    }
    setModal({ type: null });
    setVideoUrl('');
    setVideoFile('');
  };

  // Table handling
  const openTableModal = () => {
    saveSelection();
    setTableRows(3);
    setTableCols(3);
    setModal({ type: 'table' });
  };

  const insertTable = () => {
    restoreSelection();
    editorRef.current?.focus();

    let tableHtml = '<div class="rte-table-wrapper" contenteditable="false">';
    tableHtml += '<table class="rte-table">';
    for (let i = 0; i < tableRows; i++) {
      tableHtml += '<tr>';
      for (let j = 0; j < tableCols; j++) {
        if (i === 0) {
          tableHtml += '<th contenteditable="true"><span class="rte-col-resize"></span>&nbsp;</th>';
        } else {
          tableHtml += '<td contenteditable="true">&nbsp;</td>';
        }
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</table>';
    tableHtml += '<div class="rte-table-resize-handle"></div>';
    tableHtml += '</div><p>&nbsp;</p>';

    execCommand('insertHTML', tableHtml);
    setModal({ type: null });
  };

  const addTableRow = () => {
    const selection = window.getSelection();
    if (!selection) return;

    const range = selection.getRangeAt(0);
    const cell = range.startContainer.parentElement?.closest('td, th');
    const row = cell?.parentElement;
    const table = row?.parentElement;

    if (row && table) {
      const newRow = row.cloneNode(true) as HTMLElement;
      newRow.querySelectorAll('td, th').forEach(cell => {
        cell.innerHTML = '&nbsp;';
      });
      row.after(newRow);
      handleInput();
    }
  };

  const addTableColumn = () => {
    const selection = window.getSelection();
    if (!selection) return;

    const range = selection.getRangeAt(0);
    const cell = range.startContainer.parentElement?.closest('td, th');
    const table = cell?.closest('table');

    if (cell && table) {
      const cellIndex = Array.from(cell.parentElement?.children || []).indexOf(cell);
      table.querySelectorAll('tr').forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells[cellIndex]) {
          const newCell = cells[cellIndex].cloneNode(true) as HTMLElement;
          newCell.innerHTML = '&nbsp;';
          cells[cellIndex].after(newCell);
        }
      });
      handleInput();
    }
  };

  const deleteTableRow = () => {
    const selection = window.getSelection();
    if (!selection) return;

    const range = selection.getRangeAt(0);
    const cell = range.startContainer.parentElement?.closest('td, th');
    const row = cell?.parentElement;
    const table = row?.closest('table');

    if (row && table && table.querySelectorAll('tr').length > 1) {
      row.remove();
      handleInput();
    }
  };

  const deleteTableColumn = () => {
    const selection = window.getSelection();
    if (!selection) return;

    const range = selection.getRangeAt(0);
    const cell = range.startContainer.parentElement?.closest('td, th');
    const table = cell?.closest('table');

    if (cell && table) {
      const cellIndex = Array.from(cell.parentElement?.children || []).indexOf(cell);
      const firstRowCells = table.querySelector('tr')?.querySelectorAll('td, th');

      if (firstRowCells && firstRowCells.length > 1) {
        table.querySelectorAll('tr').forEach(row => {
          const cells = row.querySelectorAll('td, th');
          if (cells[cellIndex]) {
            cells[cellIndex].remove();
          }
        });
        handleInput();
      }
    }
  };

  const closeModal = () => {
    setModal({ type: null });
    setLinkUrl('');
    setLinkText('');
    setImageUrl('');
    setVideoUrl('');
    setVideoFile('');
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

        {/* Insert group - Link, Image, Video, Table */}
        <div className="rte-toolbar-group">
          <button
            type="button"
            className="rte-btn"
            onClick={openLinkModal}
            title="Insert link"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>
          <button
            type="button"
            className="rte-btn"
            onClick={removeLink}
            title="Remove link"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
          <button
            type="button"
            className="rte-btn"
            onClick={openImageModal}
            title="Insert image"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
          <button
            type="button"
            className="rte-btn"
            onClick={openVideoModal}
            title="Insert video"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </button>
          <button
            type="button"
            className="rte-btn"
            onClick={openTableModal}
            title="Insert table"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>
        </div>

        <div className="rte-toolbar-divider" />

        {/* Table manipulation buttons (shown when cursor is in a table) */}
        <div className="rte-toolbar-group rte-table-controls">
          <button
            type="button"
            className="rte-btn rte-btn-small"
            onClick={addTableRow}
            title="Add row"
          >
            +Row
          </button>
          <button
            type="button"
            className="rte-btn rte-btn-small"
            onClick={addTableColumn}
            title="Add column"
          >
            +Col
          </button>
          <button
            type="button"
            className="rte-btn rte-btn-small"
            onClick={deleteTableRow}
            title="Delete row"
          >
            -Row
          </button>
          <button
            type="button"
            className="rte-btn rte-btn-small"
            onClick={deleteTableColumn}
            title="Delete column"
          >
            -Col
          </button>
        </div>

        <div className="rte-toolbar-divider" />

        <div className="rte-toolbar-group">
          <button
            type="button"
            className="rte-btn"
            onClick={handleClearFormatting}
            title="Clear inline formatting"
          >
            Tx
          </button>
          <button
            type="button"
            className="rte-btn"
            onClick={handleRemoveAllFormatting}
            title="Remove all formatting (plain text)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3H7l-4 8h6l-2 10 12-12h-6l4-6z" />
              <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" />
            </svg>
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

      {/* Modal Overlays */}
      {modal.type && (
        <div className="rte-modal-overlay" onClick={closeModal}>
          <div className="rte-modal" onClick={(e) => e.stopPropagation()}>
            {/* Link Modal */}
            {modal.type === 'link' && (
              <>
                <div className="rte-modal-header">
                  <h3>Insert Link</h3>
                  <button className="rte-modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="rte-modal-body">
                  <div className="rte-form-group">
                    <label>URL</label>
                    <input
                      type="text"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com"
                      autoFocus
                    />
                  </div>
                  <div className="rte-form-group">
                    <label>Text (optional)</label>
                    <input
                      type="text"
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                      placeholder="Link text"
                    />
                  </div>
                </div>
                <div className="rte-modal-footer">
                  <button className="rte-modal-btn rte-modal-btn-cancel" onClick={closeModal}>
                    Cancel
                  </button>
                  <button className="rte-modal-btn rte-modal-btn-primary" onClick={insertLink}>
                    Insert
                  </button>
                </div>
              </>
            )}

            {/* Image Modal */}
            {modal.type === 'image' && (
              <>
                <div className="rte-modal-header">
                  <h3>Insert Image</h3>
                  <button className="rte-modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="rte-modal-body">
                  <div className="rte-form-group">
                    <label>Image URL</label>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      autoFocus
                    />
                  </div>
                  <div className="rte-form-divider">or</div>
                  <div className="rte-form-group">
                    <label>Upload from computer</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="rte-file-input"
                    />
                  </div>
                  {imageUrl && (
                    <div className="rte-image-preview">
                      <img src={imageUrl} alt="Preview" />
                    </div>
                  )}
                </div>
                <div className="rte-modal-footer">
                  <button className="rte-modal-btn rte-modal-btn-cancel" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    className="rte-modal-btn rte-modal-btn-primary"
                    onClick={insertImage}
                    disabled={!imageUrl}
                  >
                    Insert
                  </button>
                </div>
              </>
            )}

            {/* Video Modal */}
            {modal.type === 'video' && (
              <>
                <div className="rte-modal-header">
                  <h3>Insert Video</h3>
                  <button className="rte-modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="rte-modal-body">
                  <div className="rte-form-group">
                    <label>Video URL</label>
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                        setVideoFile(''); // Clear file if URL is entered
                      }}
                      placeholder="YouTube or Vimeo URL"
                      autoFocus
                    />
                    <span className="rte-form-hint">
                      Supports YouTube and Vimeo links
                    </span>
                  </div>
                  <div className="rte-form-divider">or</div>
                  <div className="rte-form-group">
                    <label>Upload from computer</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="rte-file-input"
                    />
                    <span className="rte-form-hint">
                      Supports MP4, WebM, and other video formats
                    </span>
                  </div>
                  {videoFile && (
                    <div className="rte-video-preview">
                      <video src={videoFile} controls width="100%" />
                    </div>
                  )}
                </div>
                <div className="rte-modal-footer">
                  <button className="rte-modal-btn rte-modal-btn-cancel" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    className="rte-modal-btn rte-modal-btn-primary"
                    onClick={insertVideo}
                    disabled={!videoUrl && !videoFile}
                  >
                    Insert
                  </button>
                </div>
              </>
            )}

            {/* Table Modal */}
            {modal.type === 'table' && (
              <>
                <div className="rte-modal-header">
                  <h3>Insert Table</h3>
                  <button className="rte-modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="rte-modal-body">
                  <div className="rte-form-row">
                    <div className="rte-form-group">
                      <label>Rows</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={tableRows}
                        onChange={(e) => setTableRows(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                      />
                    </div>
                    <div className="rte-form-group">
                      <label>Columns</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={tableCols}
                        onChange={(e) => setTableCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                      />
                    </div>
                  </div>
                  <div className="rte-table-preview">
                    <table>
                      <tbody>
                        {Array.from({ length: Math.min(tableRows, 5) }).map((_, i) => (
                          <tr key={i}>
                            {Array.from({ length: Math.min(tableCols, 5) }).map((_, j) => (
                              <td key={j}></td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(tableRows > 5 || tableCols > 5) && (
                      <span className="rte-preview-note">
                        Preview shows max 5×5
                      </span>
                    )}
                  </div>
                </div>
                <div className="rte-modal-footer">
                  <button className="rte-modal-btn rte-modal-btn-cancel" onClick={closeModal}>
                    Cancel
                  </button>
                  <button className="rte-modal-btn rte-modal-btn-primary" onClick={insertTable}>
                    Insert
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
