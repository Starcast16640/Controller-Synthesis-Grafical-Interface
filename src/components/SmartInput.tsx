import React, { useState, useRef, useEffect } from 'react';

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  validNames: string[];
  placeholder?: string;
  className?: string;
  rows?: number;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
}

export function SmartInput({ value, onChange, onFocus, validNames, placeholder, className, rows = 2, inputRef }: SmartInputProps) {
  const defaultRef = useRef<HTMLTextAreaElement>(null);
  const textarea = inputRef || defaultRef;

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState({ top: 0, left: 0 });
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onChange(text);

    const pos = e.target.selectionStart;
    const textBeforeCursor = text.substring(0, pos);
    const match = textBeforeCursor.match(/([a-zA-Z0-9_]+)$/);
    
    if (match) {
      const currentWord = match[1].toLowerCase();
      if (currentWord.length > 0) {
        const filtered = validNames.filter(name => 
          name.toLowerCase().startsWith(currentWord) && name.toLowerCase() !== currentWord
        );
        setSuggestions(filtered.slice(0, 5));
        setSelectedIndex(0);
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines.length;
        setCursorPos({ top: currentLine * 20, left: 16 });
      } else {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } 
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } 
    else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertSuggestion(suggestions[selectedIndex]);
    } 
    else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };
  
  const insertSuggestion = (suggestion: string) => {
    const text = textarea.current?.value || '';
    const pos = textarea.current?.selectionStart || 0;
    
    const textBeforeCursor = text.substring(0, pos);
    const match = textBeforeCursor.match(/([a-zA-Z0-9_]+)$/);
    
    if (match) {
      const wordStart = pos - match[1].length;
      const newText = text.substring(0, wordStart) + suggestion + ' ' + text.substring(pos);
      onChange(newText);
      setSuggestions([]);
      setTimeout(() => {
        textarea.current?.focus();
        textarea.current?.setSelectionRange(wordStart + suggestion.length + 1, wordStart + suggestion.length + 1);
      }, 0);
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textarea}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        className={`${className} resize-none`}
        rows={rows}
      />
      {suggestions.length > 0 && (
        <div 
          className="absolute z-[9999] bg-white border border-gray-200 shadow-2xl rounded-lg min-w-[180px] overflow-hidden divide-y divide-gray-50 animate-in fade-in slide-in-from-top-1"
          style={{ top: `${cursorPos.top + 35}px`, left: `${cursorPos.left + 15}px` }}
        >
          {suggestions.map((s, index) => (
            <div 
              key={s}
              onMouseDown={(e) => { e.preventDefault(); insertSuggestion(s); }}
              className={`px-4 py-2 text-xs cursor-pointer transition-colors ${
                index === selectedIndex 
                  ? 'bg-blue-600 text-white font-bold' 
                  : 'text-gray-700 font-medium hover:bg-gray-50'
              }`}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}