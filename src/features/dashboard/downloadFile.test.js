import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadBlob } from './downloadFile';

describe('downloadBlob', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('crea la descarga con su extensión y libera siempre el ObjectURL', () => {
    const blob = new Blob(['datos'], { type: 'text/csv' });
    const createObjectURL = vi.fn(() => 'blob:dashboard-file');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const createElement = document.createElement.bind(document);
    let createdLink;
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      const element = createElement(tagName, options);
      if (tagName === 'a') createdLink = element;
      return element;
    });

    downloadBlob(blob, 'participations.csv');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(createdLink.download).toBe('participations.csv');
    expect(createdLink.href).toBe('blob:dashboard-file');
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:dashboard-file');
    expect(createdLink).not.toBeInTheDocument();
  });
});
