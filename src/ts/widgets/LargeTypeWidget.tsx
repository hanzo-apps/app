import React, { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/StoreProvider';
import { Key } from '@/components/Key';
import { Assets } from '@/assets';
import clsx from 'clsx';

const LargeTypeWidget = observer(() => {
  const store = useStore();
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(120);
  const [fontFamily, setFontFamily] = useState('system-ui');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [bgColor, setBgColor] = useState('#000000');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isFullscreen) {
        setIsFullscreen(false);
      } else {
        store.ui.setFocusedWidget(null);
      }
    } else if (e.metaKey && e.key === 'Enter') {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.metaKey && e.key === '+') {
      e.preventDefault();
      setFontSize(Math.min(fontSize + 10, 300));
    } else if (e.metaKey && e.key === '-') {
      e.preventDefault();
      setFontSize(Math.max(fontSize - 10, 20));
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      store.native?.showToast('Press Esc to exit fullscreen', 'info');
    }
  };

  const fonts = [
    { value: 'system-ui', name: 'System' },
    { value: 'serif', name: 'Serif' },
    { value: 'monospace', name: 'Mono' },
    { value: 'cursive', name: 'Cursive' },
    { value: 'fantasy', name: 'Fantasy' },
  ];

  const presetColors = [
    { bg: '#000000', text: '#FFFFFF', name: 'Classic' },
    { bg: '#1c1c1e', text: '#FF6363', name: 'Hanzo' },
    { bg: '#FFFFFF', text: '#000000', name: 'Light' },
    { bg: '#0066FF', text: '#FFFFFF', name: 'Blue' },
    { bg: '#00C853', text: '#FFFFFF', name: 'Green' },
  ];

  if (isFullscreen) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-16 cursor-pointer"
        style={{ backgroundColor: bgColor }}
        onClick={toggleFullscreen}
        onKeyDown={handleKeyDown}
      >
        <div 
          className="text-center break-words max-w-full"
          style={{ 
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily,
            color: textColor,
            lineHeight: 1.2,
          }}
        >
          {text || 'Type something...'}
        </div>
      </div>
    );
  }

  return (
    <div className="hanzo-window" style={{ height: '600px' }}>
      {/* Header */}
      <div className="hanzo-search">
        <img 
          src={Assets.HanzoWhiteSmall} 
          alt="Hanzo" 
          className="hanzo-search-icon"
          style={{ width: 24, height: 24, marginRight: 8 }}
        />
        <h2 className="text-lg font-semibold">Large Type</h2>
      </div>

      {/* Preview Area */}
      <div 
        className="flex-1 flex items-center justify-center p-8 m-4 rounded-lg"
        style={{ backgroundColor: bgColor }}
      >
        <div 
          className="text-center break-words max-w-full"
          style={{ 
            fontSize: `${Math.min(fontSize / 2, 60)}px`,
            fontFamily: fontFamily,
            color: textColor,
            lineHeight: 1.2,
          }}
        >
          {text || 'Type something...'}
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 space-y-4">
        {/* Text Input */}
        <div className="hanzo-form-group">
          <label className="hanzo-form-label">Text</label>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter text to display..."
            className="hanzo-form-input"
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Font Size */}
        <div className="hanzo-form-group">
          <label className="hanzo-form-label">Font Size: {fontSize}px</label>
          <input
            type="range"
            min="20"
            max="300"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Font Family */}
        <div className="hanzo-form-group">
          <label className="hanzo-form-label">Font</label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="hanzo-form-input"
          >
            {fonts.map(font => (
              <option key={font.value} value={font.value}>{font.name}</option>
            ))}
          </select>
        </div>

        {/* Color Presets */}
        <div className="hanzo-form-group">
          <label className="hanzo-form-label">Color Scheme</label>
          <div className="flex gap-2">
            {presetColors.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  setBgColor(preset.bg);
                  setTextColor(preset.text);
                }}
                className={clsx(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  bgColor === preset.bg && textColor === preset.text
                    ? 'ring-2 ring-[var(--hanzo-accent)]'
                    : ''
                )}
                style={{ 
                  backgroundColor: preset.bg, 
                  color: preset.text,
                  border: `1px solid ${preset.bg === '#FFFFFF' ? '#ccc' : preset.bg}`
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Fullscreen Button */}
        <button 
          onClick={toggleFullscreen}
          className="hanzo-button w-full"
        >
          Enter Fullscreen
        </button>
      </div>

      {/* Footer */}
      <div className="hanzo-footer">
        <div className="hanzo-footer-hints">
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="↵" size="small" /> Fullscreen
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="+" size="small" /> Increase
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="-" size="small" /> Decrease
          </span>
          <span className="hanzo-footer-hint">
            <Key k="Esc" size="small" /> Exit
          </span>
        </div>
      </div>
    </div>
  );
});

export { LargeTypeWidget };