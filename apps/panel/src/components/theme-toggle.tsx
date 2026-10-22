'use client';
import { useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'mary-hunter:theme:v1';
const CHANGE_EVENT = 'mary-hunter:theme-change';
type Theme = 'light' | 'dark';
function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}
function readPreference(): Theme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null; /* System preference remains available when storage is blocked. */
  }
}
function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}
function snapshot(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}
function subscribe(callback: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const refresh = () => {
    applyTheme(readPreference() ?? systemTheme());
    callback();
  };
  const storage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) refresh();
  };
  const system = () => {
    if (readPreference() === null) refresh();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', storage);
  media.addEventListener('change', system);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', storage);
    media.removeEventListener('change', system);
  };
}
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, snapshot, (): Theme => 'light');
  const [notice, setNotice] = useState('');
  const dark = theme === 'dark';
  function toggle() {
    const next: Theme = dark ? 'light' : 'dark';
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      setNotice(
        `Tema ${next === 'dark' ? 'escuro' : 'claro'} ativado e salvo.`,
      );
    } catch {
      setNotice(
        'Tema alterado nesta sessão. O navegador não permitiu salvar sua preferência.',
      );
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
  return (
    <>
      <button
        className="theme-toggle"
        type="button"
        aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
        aria-pressed={dark}
        onClick={toggle}
        title={dark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      >
        {dark ? <Sun size={17} /> : <Moon size={17} />}
        <span>{dark ? 'Claro' : 'Escuro'}</span>
      </button>
      <span className="sr-only" role="status">
        {notice}
      </span>
    </>
  );
}
export function PageThemeControl() {
  const pathname = usePathname();
  return ['/', '/cursos', '/shopee', '/mercado-livre'].includes(pathname) ||
    pathname.startsWith('/admin') ? null : (
    <div className="page-theme-control">
      <ThemeToggle />
    </div>
  );
}
