import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useTheme from './useTheme';

function mockSystemTheme(matches) {
  const listeners = new Set();
  window.matchMedia = vi.fn(() => ({
    matches,
    addEventListener: (_, listener) => listeners.add(listener),
    removeEventListener: (_, listener) => listeners.delete(listener),
  }));
  return (nextMatches) => listeners.forEach((listener) => listener({ matches: nextMatches }));
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    delete window.matchMedia;
    vi.restoreAllMocks();
  });

  it('uses the light theme when the browser has no matchMedia', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('follows the system preference when nothing is stored', () => {
    mockSystemTheme(true);

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('prefers the stored theme over the system preference', () => {
    localStorage.setItem('theme', 'light');
    mockSystemTheme(true);

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('light');
  });

  it('ignores an invalid stored value', () => {
    localStorage.setItem('theme', 'sepia');
    mockSystemTheme(true);

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
  });

  it('toggles, applies and stores the theme', () => {
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleTheme());

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('keeps working when storage throws', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('blocked'); });

    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());

    expect(result.current.theme).toBe('dark');
  });

  it('reacts to system changes until a theme is chosen', () => {
    const changeSystemTheme = mockSystemTheme(false);
    const { result } = renderHook(() => useTheme());

    act(() => changeSystemTheme(true));
    expect(result.current.theme).toBe('dark');

    act(() => result.current.toggleTheme());
    act(() => changeSystemTheme(true));
    expect(result.current.theme).toBe('light');
  });
});
