import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ErrorFallback from './ErrorFallback';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('ErrorFallback', () => {
  const error = new Error('Test error message');
  const resetErrorBoundary = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSubject = () =>
    render(
      <MemoryRouter>
        <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
      </MemoryRouter>,
    );

  it('renders the error message', () => {
    renderSubject();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders the title', () => {
    renderSubject();
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });

  it('navigates to / when "Volver al inicio" is clicked', () => {
    renderSubject();
    fireEvent.click(screen.getByText('Volver al inicio'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('calls resetErrorBoundary when "Reintentar" is clicked', () => {
    renderSubject();
    fireEvent.click(screen.getByText('Reintentar'));
    expect(resetErrorBoundary).toHaveBeenCalled();
  });
});
