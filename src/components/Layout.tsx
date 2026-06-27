import { useEffect, useState, type ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem('of-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function Layout({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('of-theme', theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={() => setTheme((c) => (c === 'light' ? 'dark' : 'light'))}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={20} strokeWidth={1.75} /> : <Sun size={20} strokeWidth={1.75} />}
        </button>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        Shared Principles · a triage tool for when to standardize
      </footer>
    </div>
  );
}
