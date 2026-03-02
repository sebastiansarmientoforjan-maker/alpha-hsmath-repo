import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  disabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        if (shortcut.disabled) continue;

        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
        const shiftMatches = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
        const altMatches = shortcut.altKey === undefined || event.altKey === shortcut.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Global shortcuts hook for admin pages
export function useGlobalShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: '1',
      ctrlKey: true,
      action: () => router.push('/admin/gem-generator'),
      description: 'Go to GEM Generator',
    },
    {
      key: '2',
      ctrlKey: true,
      action: () => router.push('/admin/process-results'),
      description: 'Go to Process Results',
    },
    {
      key: '3',
      ctrlKey: true,
      action: () => router.push('/admin/research'),
      description: 'Go to Research Repository',
    },
    {
      key: '4',
      ctrlKey: true,
      action: () => router.push('/admin/decision-logs'),
      description: 'Go to Decision Logs',
    },
    {
      key: '5',
      ctrlKey: true,
      action: () => router.push('/admin/scrollytelling'),
      description: 'Go to Scrollytelling',
    },
    // Quick actions
    {
      key: 'h',
      ctrlKey: true,
      action: () => router.push('/admin'),
      description: 'Go to Dashboard (Home)',
    },
    {
      key: '?',
      shiftKey: true,
      action: () => {
        // Show shortcuts modal (will implement later)
        console.log('Shortcuts help - coming soon!');
      },
      description: 'Show keyboard shortcuts help',
    },
  ];

  useKeyboardShortcuts(shortcuts);
}
