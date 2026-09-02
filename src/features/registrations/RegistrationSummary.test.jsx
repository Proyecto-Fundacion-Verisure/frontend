import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RegistrationSummary from './RegistrationSummary';

function getCard(label) {
  return screen.getByText(label).closest('div');
}

describe('RegistrationSummary', () => {
  it('uses backend counters and shows available capacity', () => {
    render(<RegistrationSummary board={{
      activity: { spots: 12 },
      counters: { confirmed: 7, waitlisted: 3, acceptedWaitlisted: 2, unreviewed: 1 },
    }} />);

    expect(within(getCard('Confirmadas')).getByText('7')).toBeInTheDocument();
    expect(within(getCard('En cola')).getByText('3')).toBeInTheDocument();
    expect(within(getCard('Aceptadas en cola')).getByText('2')).toBeInTheDocument();
    expect(within(getCard('Sin revisar')).getByText('1')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /aforo confirmado/i })).toHaveAttribute('aria-valuenow', '7');
    expect(screen.getByText(/7 de 12 plazas ocupadas/i)).toBeInTheDocument();
  });

  it('never renders capacity beyond the backend total', () => {
    render(<RegistrationSummary board={{
      activity: { spots: 4 },
      counters: { confirmed: 6, waitlisted: 2, acceptedWaitlisted: 1, unreviewed: 1 },
    }} />);

    const progress = screen.getByRole('progressbar', { name: /aforo confirmado/i });
    expect(progress).toHaveAttribute('aria-valuenow', '4');
    expect(progress).toHaveAttribute('aria-valuemax', '4');
    expect(screen.getByText(/4 de 4 plazas ocupadas/i)).toBeInTheDocument();
  });
});
