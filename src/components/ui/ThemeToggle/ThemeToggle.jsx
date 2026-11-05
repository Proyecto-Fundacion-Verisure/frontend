import { Moon, Sun } from 'lucide-react';
import useTheme from '../../../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      onClick={toggleTheme}
    >
      <Icon aria-hidden="true" size={20} strokeWidth={2} />
    </button>
  );
}
