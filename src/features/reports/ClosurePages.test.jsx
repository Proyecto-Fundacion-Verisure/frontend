import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  finalizeActivityClosure,
  getActivityClosure,
  getClosure,
  saveActivityClosure,
  submitClosure,
} from '../../api/closuresApi';
import ActivityClosurePage from './ActivityClosurePage';
import ReportFormPage from './ReportFormPage';

vi.mock('../../api/closuresApi', () => ({
  finalizeActivityClosure: vi.fn(),
  getActivityClosure: vi.fn(),
  getCertificate: vi.fn(),
  getClosure: vi.fn(),
  saveActivityClosure: vi.fn(),
  submitClosure: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe('employee closure pages', () => {
  it('submits the contract request with optional evidence', async () => {
    const evidence = new File(['proof'], 'proof.pdf', { type: 'application/pdf' });
    submitClosure.mockResolvedValue({
      data: { closureId: 501, actualHours: 6, rating: 5, comment: 'Todo bien.' },
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/closures/new?registrationId=103']}>
        <Routes>
          <Route path="/closures/new" element={<ReportFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/horas realizadas/i), '6');
    await user.selectOptions(screen.getByRole('combobox', { name: /valoración/i }), '5');
    await user.type(screen.getByLabelText(/comentario/i), 'Todo bien.');
    await user.upload(screen.getByLabelText(/evidencia \(opcional\)/i), evidence);
    await user.click(screen.getByLabelText(/autorizo el tratamiento/i));
    await user.click(screen.getByRole('button', { name: /enviar cierre/i }));

    await waitFor(() => expect(submitClosure).toHaveBeenCalledWith({
      registrationId: 103,
      actualHours: 6,
      rating: 5,
      comment: 'Todo bien.',
      evidenceConsent: true,
    }, evidence));
    expect(await screen.findByRole('heading', { name: /detalle del cierre/i })).toBeInTheDocument();
  });

  it('loads a closure by the backend-generated frontend route', async () => {
    getClosure.mockResolvedValue({ data: { closureId: 501, actualHours: 4, rating: 4 } });

    render(
      <MemoryRouter initialEntries={['/closures/501']}>
        <Routes>
          <Route path="/closures/:closureId" element={<ReportFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /detalle del cierre/i })).toBeInTheDocument();
    expect(getClosure).toHaveBeenCalledWith('501');
    expect(screen.getByText('4 de 5')).toBeInTheDocument();
  });
});

describe('administrative activity closure pages', () => {
  const activityClosure = {
    activityId: 41,
    collaborationRating: null,
    closingNotes: '',
    lessonsLearned: '',
    status: 'DRAFT',
    expectedHours: 30,
    reportedHours: 24,
    confirmedVolunteers: 5,
    closedParticipations: 4,
    evidenceCount: 2,
  };

  it('saves current values before finalizing the activity closure', async () => {
    getActivityClosure.mockResolvedValue({ data: activityClosure });
    saveActivityClosure.mockResolvedValue({ data: { ...activityClosure, collaborationRating: 5 } });
    finalizeActivityClosure.mockResolvedValue({ data: { ...activityClosure, status: 'CLOSED' } });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/admin/activities/41/closure']}>
        <Routes>
          <Route path="/admin/activities/:activityId/closure" element={<ActivityClosurePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(await screen.findByLabelText(/valoración de la colaboración/i), '5');
    await user.type(screen.getByLabelText(/notas de cierre/i), 'Buen resultado');
    await user.click(screen.getByRole('button', { name: /finalizar cierre/i }));

    await waitFor(() => expect(saveActivityClosure).toHaveBeenCalledWith('41', {
      collaborationRating: 5,
      closingNotes: 'Buen resultado',
      lessonsLearned: undefined,
    }));
    expect(finalizeActivityClosure).toHaveBeenCalledWith('41');
    expect(await screen.findByText('Actividad cerrada.')).toBeInTheDocument();
  });
});
