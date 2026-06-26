import { useEffect, useState } from 'react';

export type ThemeId = 'ember' | 'midnight' | 'daylight';

const THEMES: { id: ThemeId; label: string; icon: string }[] = [
  { id: 'ember', label: 'Ember', icon: '🔥' },
  { id: 'midnight', label: 'Midnight', icon: '🌙' },
  { id: 'daylight', label: 'Daylight', icon: '☀️' },
];

const STORAGE_KEY = 'devguessr:theme';

function readStoredTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ember' || saved === 'midnight' || saved === 'daylight') {
      return saved;
    }
  } catch {
    /* localStorage may be unavailable */
  }
  return 'ember';
}

function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute('data-theme', theme);
}

// Apply the saved theme as early as possible to avoid a flash of the default.
applyTheme(readStoredTheme());

export default function ThemePicker() {
  const [theme, setTheme] = useState<ThemeId>(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore persistence errors */
    }
  }, [theme]);

  return (
    <div className="theme-picker" role="group" aria-label="Color theme">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`theme-btn ${theme === t.id ? 'active' : ''}`}
          onClick={() => setTheme(t.id)}
          title={`${t.label} theme`}
          aria-label={`${t.label} theme`}
          aria-pressed={theme === t.id}
        >
          <span aria-hidden="true">{t.icon}</span>
        </button>
      ))}
    </div>
  );
}
