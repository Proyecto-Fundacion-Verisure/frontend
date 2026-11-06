import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
  it('renders the title as the page heading', () => {
    render(<PageHeader title="Proyectos" titleId="projects-title" />);

    const heading = screen.getByRole('heading', { level: 1, name: 'Proyectos' });
    expect(heading).toHaveAttribute('id', 'projects-title');
  });

  it('renders eyebrow, description and actions when provided', () => {
    render(
      <PageHeader
        eyebrow="Administración"
        title="Proyectos"
        description="3 proyectos encontrados"
        actions={<button type="button">Nuevo proyecto</button>}
      />,
    );

    expect(screen.getByText('Administración')).toBeInTheDocument();
    expect(screen.getByText('3 proyectos encontrados')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nuevo proyecto' })).toBeInTheDocument();
  });

  it('omits the optional wrappers when they are empty', () => {
    const { container } = render(<PageHeader title="Proyectos" />);

    expect(container.querySelector('.page-header__eyebrow')).toBeNull();
    expect(container.querySelector('.page-header__description')).toBeNull();
    expect(container.querySelector('.page-header__actions')).toBeNull();
  });
});
