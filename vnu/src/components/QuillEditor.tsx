import React, { useEffect, useRef } from 'react';
import Quill from 'quill';

interface QuillEditorProps {
  value: string;
  onChange: (html: string, length: number) => void;
  placeholder?: string;
}

// By defining the toolbar in JSX, we give React full control over its rendering,
// preventing the duplicate toolbar issue in StrictMode.
const QuillToolbar = () => (
  <div id="toolbar">
    <span className="ql-formats">
      <button className="ql-bold"></button>
      <button className="ql-italic"></button>
      <button className="ql-underline"></button>
      <button className="ql-strike"></button>
    </span>
    <span className="ql-formats">
      <button className="ql-list" value="ordered"></button>
      <button className="ql-list" value="bullet"></button>
      <button className="ql-indent" value="-1"></button>
      <button className="ql-indent" value="+1"></button>
    </span>
    <span className="ql-formats">
      <button className="ql-blockquote"></button>
    </span>
    <span className="ql-formats">
      <select className="ql-color"></select>
      <select className="ql-background"></select>
    </span>
    <span className="ql-formats">
      <button className="ql-clean"></button>
    </span>
  </div>
);

export const QuillEditor: React.FC<QuillEditorProps> = ({ value, onChange, placeholder }) => {
  const quillRef = useRef<Quill | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      // Check to prevent re-initialization
      if (quillRef.current) {
        return;
      }
      
      const quill = new Quill(editorRef.current, {
        modules: {
          toolbar: '#toolbar', // Point to the JSX toolbar
        },
        theme: 'snow',
        placeholder: placeholder,
      });

      quillRef.current = quill;

      // Set initial value
      if (value) {
        quill.clipboard.dangerouslyPasteHTML(value);
      }

      // Main listener for changes
      quill.on('text-change', (delta, oldDelta, source) => {
        if (source === 'user') {
          const html = quill.root.innerHTML;
          const length = quill.getLength() - 1; // -1 to not count the trailing newline
          onChange(html, length);
        }
      });
    }
  }, []);

  // Effect to sync parent value changes to the editor
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      if (value) {
        quillRef.current.clipboard.dangerouslyPasteHTML(value);
      } else {
        quillRef.current.setText('');
      }
    }
  }, [value]);


  return (
    <div className="quill-editor-container">
      <QuillToolbar />
      <div ref={editorRef}></div>
    </div>
  );
};
