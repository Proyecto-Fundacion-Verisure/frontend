import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Tabs from './Tabs';

const TABS = [
  { id: 'queue', label: 'En cola', count: 2 },
  { id: 'confirmed', label: 'Confirmadas', count: 0 },
  { id: 'closed', label: 'Cerradas' },
];

function Example() {
  const [activeId, setActiveId] = useState('queue');
  return (
    <Tabs label="Estados" tabs={TABS} activeId={activeId} onChange={setActiveId}>
      <p>Contenido de {activeId}</p>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('links the active tab to its panel and shows the counts', () => {
    render(<Example />);

    const active = screen.getByRole('tab', { name: 'En cola 2' });
    expect(active).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tablist', { name: 'Estados' })).toBeInTheDocument();
    expect(screen.getByRole('tabpanel', { name: 'En cola 2' })).toHaveTextContent(
      'Contenido de queue',
    );
    expect(active).toHaveAttribute('aria-controls', screen.getByRole('tabpanel').id);
    expect(screen.getByRole('tab', { name: 'Confirmadas 0' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Cerradas' })).toBeInTheDocument();
  });

  it('changes tab on click', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('tab', { name: /cerradas/i }));

    expect(screen.getByRole('tab', { name: /cerradas/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /en cola/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Contenido de closed');
  });

  it('keeps only the active tab in the tab order', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.tab();

    expect(screen.getByRole('tab', { name: /en cola/i })).toHaveFocus();
    expect(screen.getByRole('tab', { name: /confirmadas/i })).toHaveAttribute('tabindex', '-1');
  });

  it('moves with the arrow keys, wrapping at both ends', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.tab();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: /cerradas/i })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Contenido de closed');

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /en cola/i })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Contenido de confirmed');
  });

  it('jumps to the ends with Home and End', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.tab();

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: /cerradas/i })).toHaveFocus();

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: /en cola/i })).toHaveFocus();
  });
});
