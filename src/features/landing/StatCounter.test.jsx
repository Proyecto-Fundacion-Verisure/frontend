import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StatCounter from './StatCounter';

let intersectionCallback;
const disconnect = vi.fn();

function setReducedMotion(matches) {
  window.matchMedia = vi.fn().mockReturnValue({ matches });
}

beforeEach(() => {
  intersectionCallback = undefined;
  disconnect.mockClear();
  window.IntersectionObserver = vi.fn((callback) => {
    intersectionCallback = callback;
    return { observe: vi.fn(), disconnect };
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('StatCounter', () => {
  it('anima el contador cuando entra en la pantalla', () => {
    setReducedMotion(false);
    const frames = [];
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
      frames.push(callback);
      return frames.length;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    render(<StatCounter value="2.655" label="horas de voluntariado" />);
    expect(screen.getByText('0')).toBeInTheDocument();

    act(() => intersectionCallback([{ isIntersecting: true }]));
    act(() => frames.shift()(100));
    act(() => frames.shift()(1300));

    expect(screen.getByText('2.655')).toBeInTheDocument();
    expect(disconnect).toHaveBeenCalled();
  });

  it('muestra directamente el valor final si se prefiere reducir el movimiento', () => {
    setReducedMotion(true);

    render(<StatCounter value="12.234" label="personas beneficiadas" />);

    expect(screen.getByText('12.234')).toBeInTheDocument();
    expect(window.IntersectionObserver).not.toHaveBeenCalled();
  });
});
