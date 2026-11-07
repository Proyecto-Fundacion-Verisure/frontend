import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DashboardRanking from './DashboardRanking';

describe('DashboardRanking', () => {
  it('limita el ranking a diez actividades y conserva posición, nombre y favoritos', () => {
    const items = Array.from({ length: 12 }, (_, index) => ({
      activityId: index + 1,
      activityTitle: `Actividad ${index + 1}`,
      favoriteCount: 120 - index * 5,
    }));

    render(<DashboardRanking items={items} />);

    const ranking = screen.getByRole('list', { name: 'Top 10 de actividades favoritas' });
    const rows = within(ranking).getAllByRole('listitem');
    expect(rows).toHaveLength(10);
    expect(within(rows[0]).getByLabelText('Posición 1')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Actividad 1')).toBeInTheDocument();
    expect(within(rows[0]).getByText('120 favoritos')).toBeInTheDocument();
    expect(screen.queryByText('Actividad 11')).not.toBeInTheDocument();
  });
});
