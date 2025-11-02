import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Check for Cmd/Ctrl modifier
      const isMod = event.metaKey || event.ctrlKey;

      // Keyboard shortcuts
      if (isMod) {
        switch (event.key.toLowerCase()) {
          case 'n':
            event.preventDefault();
            navigate('/add-expense');
            break;
          case 'h':
            event.preventDefault();
            navigate('/');
            break;
          case 's':
            event.preventDefault();
            navigate('/settlement');
            break;
          case 'a':
            event.preventDefault();
            navigate('/analytics');
            break;
          case 'r':
            event.preventDefault();
            navigate('/recurring');
            break;
          case ',':
            event.preventDefault();
            navigate('/settings');
            break;
        }
      }

      // Simple key shortcuts (no modifier)
      if (!isMod && !event.shiftKey && !event.altKey) {
        switch (event.key) {
          case '?':
            event.preventDefault();
            // Show keyboard shortcuts help
            showShortcutsHelp();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);
};

const showShortcutsHelp = () => {
  // Create a simple toast or modal showing available shortcuts
  const shortcuts = [
    { keys: 'Cmd/Ctrl + N', action: 'New Expense' },
    { keys: 'Cmd/Ctrl + H', action: 'Home/Dashboard' },
    { keys: 'Cmd/Ctrl + S', action: 'Settlement' },
    { keys: 'Cmd/Ctrl + A', action: 'Analytics' },
    { keys: 'Cmd/Ctrl + R', action: 'Recurring Expenses' },
    { keys: 'Cmd/Ctrl + ,', action: 'Settings' },
    { keys: '?', action: 'Show this help' },
  ];

  const message = shortcuts
    .map((s) => `${s.keys}: ${s.action}`)
    .join('\n');

  alert(`Keyboard Shortcuts:\n\n${message}`);
};
