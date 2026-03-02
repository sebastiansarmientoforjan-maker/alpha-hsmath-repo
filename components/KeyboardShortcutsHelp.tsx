'use client';

import { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + ? to open help
      if (e.shiftKey && e.key === '?') {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const shortcuts = [
    { keys: ['Ctrl', '1'], description: 'GEM Generator' },
    { keys: ['Ctrl', '2'], description: 'Process Results' },
    { keys: ['Ctrl', '3'], description: 'Research Repository' },
    { keys: ['Ctrl', '4'], description: 'Decision Logs' },
    { keys: ['Ctrl', '5'], description: 'Scrollytelling' },
    { keys: ['Ctrl', 'H'], description: 'Dashboard (Home)' },
    { keys: ['Ctrl', 'S'], description: 'Save (context-aware)' },
    { keys: ['Ctrl', 'Enter'], description: 'Submit/Process' },
    { keys: ['Ctrl', '→'], description: 'Next workflow step' },
    { keys: ['Shift', '?'], description: 'Show this help' },
    { keys: ['Esc'], description: 'Close modals' },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-[9998] p-3 border-4 border-dark bg-white hover:bg-cool-blue transition-all shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] hover:shadow-[2px_2px_0px_0px_rgba(18,18,18,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
        title="Keyboard Shortcuts (Shift + ?)"
      >
        <Keyboard size={24} className="text-dark" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-dark/80 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white border-4 border-dark shadow-[8px_8px_0px_0px_rgba(18,18,18,1)] max-w-2xl w-full animate-fade-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cool-blue border-2 border-dark">
                <Keyboard size={28} className="text-dark" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-dark">Keyboard Shortcuts</h2>
                <p className="text-sm text-dark/60">Navigate faster with hotkeys</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-dark/10 transition-colors"
            >
              <X size={24} className="text-dark" />
            </button>
          </div>

          {/* Shortcuts List */}
          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border-2 border-dark/20 hover:border-dark hover:bg-cool-blue/10 transition-all"
              >
                <span className="text-dark/80">{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <div key={keyIndex} className="flex items-center gap-1">
                      <kbd className="px-3 py-1 border-2 border-dark bg-white text-dark font-mono text-sm font-bold">
                        {key}
                      </kbd>
                      {keyIndex < shortcut.keys.length - 1 && (
                        <span className="text-dark/40 font-bold">+</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 p-4 border-2 border-cool-blue bg-cool-blue/10">
            <p className="text-xs text-dark/70">
              💡 <strong>Tip:</strong> Shortcuts work on any admin page except when typing in input fields.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
