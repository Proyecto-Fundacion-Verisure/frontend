import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Badge from './Badge/Badge';
import Button from './Button/Button';
import EmptyState from './EmptyState/EmptyState';
import Input from './Input/Input';
import Modal from './Modal/Modal';
import ProgressBar from './ProgressBar/ProgressBar';
import Select from './Select/Select';
import Table from './Table/Table';
import Textarea from './Textarea/Textarea';

describe('form controls', () => {
  it('associates labels, help and errors with their controls', () => {
    render(
      <>
        <Input label="Correo" hint="Usa tu correo corporativo" error="El correo no es válido" required />
        <Select label="Modalidad"><option>Presencial</option></Select>
        <Textarea label="Descripción" />
      </>,
    );

    const input = screen.getByLabelText(/Correo/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Usa tu correo corporativo El correo no es válido');
    expect(screen.getByLabelText('Modalidad')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('El correo no es válido');
  });
});

describe('feedback components', () => {
  it('disables a loading button and announces its state', () => {
    render(<Button isLoading loadingLabel="Guardando">Guardar</Button>);
    const button = screen.getByRole('button', { name: 'Guardando' });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('clamps progress values and exposes a readable value', () => {
    render(<ProgressBar label="Plazas" value={15} max={12} showValue />);
    const progress = screen.getByRole('progressbar', { name: 'Plazas' });

    expect(progress).toHaveAttribute('aria-valuenow', '12');
    expect(progress).toHaveAttribute('aria-valuetext', '12 de 12');
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders semantic variants and empty-state actions', () => {
    render(
      <>
        <Badge variant="success">Confirmada</Badge>
        <EmptyState title="Sin actividades" action={<Button>Crear</Button>} />
      </>,
    );

    expect(screen.getByText('Confirmada')).toHaveClass('badge--success');
    expect(screen.getByRole('heading', { name: 'Sin actividades' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
  });
});

describe('Table', () => {
  const columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'status', label: 'Estado', render: (row) => row.status.toUpperCase() },
  ];

  it('renders its caption, headers and transformed cells', () => {
    render(<Table caption="Solicitudes" columns={columns} data={[{ id: 1, name: 'Ana', status: 'pendiente' }]} />);

    expect(screen.getByRole('table', { name: 'Solicitudes' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
    expect(screen.getByText('PENDIENTE')).toBeInTheDocument();
  });

  it('shows an explicit empty state', () => {
    render(<Table columns={columns} emptyMessage="Sin solicitudes" />);
    expect(screen.getByText('Sin solicitudes')).toHaveAttribute('colspan', '2');
  });
});

describe('Modal', () => {
  it('closes with Escape and restores focus', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(
      <>
        <button type="button">Abrir</button>
        <Modal isOpen={false} onClose={onClose} title="Confirmar">Contenido</Modal>
      </>,
    );
    const opener = screen.getByRole('button', { name: 'Abrir' });
    opener.focus();

    rerender(
      <>
        <button type="button">Abrir</button>
        <Modal isOpen onClose={onClose} title="Confirmar">Contenido</Modal>
      </>,
    );
    expect(screen.getByRole('dialog', { name: 'Confirmar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();

    rerender(
      <>
        <button type="button">Abrir</button>
        <Modal isOpen={false} onClose={onClose} title="Confirmar">Contenido</Modal>
      </>,
    );
    expect(opener).toHaveFocus();
  });
});
