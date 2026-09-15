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
import { presets } from '../../test/fixtures/apiErrors';
import ActivityClosurePage from './ActivityClosurePage';
import ClosureFormPage from './ClosureFormPage';

vi.mock('../../api/closuresApi', () => ({
  finalizeActivityClosure: vi.fn(),
  getActivityClosure: vi.fn(),
  getCertificate: vi.fn(),
  getClosure: vi.fn(),
  saveActivityClosure: vi.fn(),
  submitClosure: vi.fn(),
}));

// jsdom no define `URL.createObjectURL` / `URL.revokeObjectURL`.  Los
// estubamos a nivel de archivo para que el componente los pueda usar al
// previsualizar imágenes y no rompa tests con archivos de tipo imagen.
const createObjectURL = vi.fn(() => 'blob:preview');
const revokeObjectURL = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
});

describe('employee closure page', () => {
  it('sends a new closure with optional evidence and treats 201 as creation', async () => {
    const evidence = new File(['proof'], 'proof.pdf', { type: 'application/pdf' });
    getClosure.mockResolvedValue({ data: {} });
    submitClosure.mockResolvedValue({
      status: 201,
      data: { closureId: 501, actualHours: 6, rating: 5, comment: 'Todo bien.' },
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/closures/new?registrationId=103']}>
        <Routes>
          <Route path="/closures/new" element={<ClosureFormPage />} />
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
    expect(screen.getByTestId('closure-created-notice')).toHaveTextContent(/cierre enviado/i);
  });

  it('preloads the submitted hours and corrects it as 200 without duplicating the closure', async () => {
    getClosure.mockResolvedValue({
      data: { closureId: 501, registrationId: 104, actualHours: 6, rating: 5, comment: 'Gran experiencia.' },
    });
    submitClosure.mockResolvedValue({
      status: 200,
      data: { closureId: 501, registrationId: 104, actualHours: 4, rating: 5, comment: 'Gran experiencia.' },
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/closures/501']}>
        <Routes>
          <Route path="/closures/:closureId" element={<ClosureFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /corregir tu cierre/i })).toBeInTheDocument();
    expect(getClosure).toHaveBeenCalledWith('501');
    expect(screen.getByLabelText(/horas realizadas/i)).toHaveValue(6);

    await user.clear(screen.getByLabelText(/horas realizadas/i));
    await user.type(screen.getByLabelText(/horas realizadas/i), '4');
    await user.click(screen.getByRole('button', { name: /guardar corrección/i }));

    await waitFor(() => expect(submitClosure).toHaveBeenCalledWith({
      registrationId: 104,
      actualHours: 4,
      rating: 5,
      comment: 'Gran experiencia.',
      evidenceConsent: false,
    }, null));

    expect(await screen.findByTestId('closure-updated-notice')).toHaveTextContent(/501/);
    expect(screen.getByTestId('closure-updated-notice')).not.toHaveTextContent(/cierre enviado/i);
    expect(screen.getAllByRole('heading', { name: /detalle del cierre/i })).toHaveLength(1);
    expect(screen.getByText('5 de 5')).toBeInTheDocument();
  });

  it('warns when hours are reduced but still lets the correction be sent', async () => {
    getClosure.mockResolvedValue({
      data: { closureId: 501, registrationId: 104, actualHours: 8, rating: 5 },
    });
    submitClosure.mockResolvedValue({
      status: 200,
      data: { closureId: 501, registrationId: 104, actualHours: 5, rating: 5 },
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/closures/501']}>
        <Routes>
          <Route path="/closures/:closureId" element={<ClosureFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const hoursInput = await screen.findByLabelText(/horas realizadas/i);
    await user.clear(hoursInput);
    await user.type(hoursInput, '5');

    expect(screen.getByText(/por debajo de las 8 h/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar corrección/i })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /guardar corrección/i }));
    await waitFor(() => expect(submitClosure).toHaveBeenCalledWith(expect.objectContaining({
      registrationId: 104,
      actualHours: 5,
    }), null));
  });

  it('does not block when entering more hours than the previous submission', async () => {
    getClosure.mockResolvedValue({
      data: { closureId: 501, registrationId: 104, actualHours: 4, rating: 4 },
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/closures/501']}>
        <Routes>
          <Route path="/closures/:closureId" element={<ClosureFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const hoursInput = await screen.findByLabelText(/horas realizadas/i);
    await user.clear(hoursInput);
    await user.type(hoursInput, '10');
    expect(screen.queryByText(/por debajo de las/i)).not.toBeInTheDocument();
  });

  it('shows the error codes of the closure contract when submission fails', async () => {
    submitClosure.mockRejectedValue(presets.registrationNotConfirmed());
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/closures/new?registrationId=103']}>
        <Routes>
          <Route path="/closures/new" element={<ClosureFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/horas realizadas/i), '6');
    await user.selectOptions(screen.getByRole('combobox', { name: /valoración/i }), '5');
    await user.click(screen.getByRole('button', { name: /enviar cierre/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/debe estar confirmada/i);
  });

  it('shows CLOSURE_ALREADY_CLOSED as a non-blocking inline error', async () => {
    submitClosure.mockRejectedValue(presets.closureAlreadyClosed());
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/closures/new?registrationId=103']}>
        <Routes>
          <Route path="/closures/new" element={<ClosureFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/horas realizadas/i), '6');
    await user.selectOptions(screen.getByRole('combobox', { name: /valoración/i }), '5');
    await user.click(screen.getByRole('button', { name: /enviar cierre/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/ya está completado/i);
    expect(screen.getByRole('button', { name: /enviar cierre/i })).toBeEnabled();
  });

  it('shows ACTIVITY_NOT_FINISHED when the activity has not ended yet', async () => {
    submitClosure.mockRejectedValue(presets.activityNotFinished());
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/closures/new?registrationId=103']}>
        <Routes>
          <Route path="/closures/new" element={<ClosureFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/horas realizadas/i), '6');
    await user.selectOptions(screen.getByRole('combobox', { name: /valoración/i }), '5');
    await user.click(screen.getByRole('button', { name: /enviar cierre/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no ha finalizado/i);
  });

  it('rejects an oversized evidence file on the client before sending (413)', async () => {
    const tooBig = new File([new ArrayBuffer(11 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/closures/new?registrationId=103']}>
        <Routes>
          <Route path="/closures/new" element={<ClosureFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.upload(screen.getByLabelText(/evidencia \(opcional\)/i), tooBig);
    await user.click(screen.getByRole('button', { name: /enviar cierre/i }));

    expect(await screen.findByText(/no puede superar los 10 MB/i)).toBeInTheDocument();
    expect(submitClosure).not.toHaveBeenCalled();
  });

  it('shows a 415 payload error returned by the server (unsupported media type)', async () => {
    submitClosure.mockRejectedValue(presets.unsupportedMedia());
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/closures/new?registrationId=103']}>
        <Routes>
          <Route path="/closures/new" element={<ClosureFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/horas realizadas/i), '6');
    await user.selectOptions(screen.getByRole('combobox', { name: /valoración/i }), '5');
    await user.click(screen.getByRole('button', { name: /enviar cierre/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no permitido/i);
    expect(screen.getByRole('button', { name: /enviar cierre/i })).toBeEnabled();
  });

  it('shows the selected file name, size and a way to remove it, releasing the temporary preview URL', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/closures/new?registrationId=103']}>
        <Routes>
          <Route path="/closures/new" element={<ClosureFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const file = new File([new ArrayBuffer(2048)], 'screenshot.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText(/evidencia \(opcional\)/i), file);

    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(screen.getByTestId('closure-file-name')).toHaveTextContent('screenshot.jpg');
    expect(screen.getByTestId('closure-file-size')).toHaveTextContent('2 KB');
    expect(screen.getByTestId('closure-file-preview').querySelector('img')).toBeInTheDocument();

    await user.click(screen.getByTestId('closure-remove-evidence'));
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview');
    expect(screen.queryByTestId('closure-file-preview')).not.toBeInTheDocument();
  });

  it('sends the closure without evidence after removing the file', async () => {
    submitClosure.mockResolvedValue({ status: 201, data: { closureId: 1, actualHours: 6, rating: 5 } });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/closures/new?registrationId=103']}>
        <Routes>
          <Route path="/closures/new" element={<ClosureFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.upload(screen.getByLabelText(/evidencia \(opcional\)/i), new File(['proof'], 'proof.pdf', { type: 'application/pdf' }));
    await user.click(screen.getByTestId('closure-remove-evidence'));

    await user.type(screen.getByLabelText(/horas realizadas/i), '6');
    await user.selectOptions(screen.getByRole('combobox', { name: /valoración/i }), '5');
    await user.click(screen.getByRole('button', { name: /enviar cierre/i }));

    await waitFor(() => expect(submitClosure).toHaveBeenCalledWith({
      registrationId: 103,
      actualHours: 6,
      rating: 5,
      evidenceConsent: false,
    }, null));
    expect(screen.queryByTestId('closure-file-preview')).not.toBeInTheDocument();
  });

  it('does not send when evidence is present without consent (400 contract)', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/closures/new?registrationId=103']}>
        <Routes>
          <Route path="/closures/new" element={<ClosureFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.upload(screen.getByLabelText(/evidencia \(opcional\)/i), new File(['proof'], 'proof.pdf', { type: 'application/pdf' }));
    await user.type(screen.getByLabelText(/horas realizadas/i), '6');
    await user.selectOptions(screen.getByRole('combobox', { name: /valoración/i }), '5');
    await user.click(screen.getByRole('button', { name: /enviar cierre/i }));

    expect(await screen.findByText(/autorizar el tratamiento/i)).toBeInTheDocument();
    expect(submitClosure).not.toHaveBeenCalled();
  });

  it('paints the server 413 error next to the evidence control', async () => {
    submitClosure.mockRejectedValue(presets.payloadTooLarge());
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/closures/new?registrationId=103']}>
        <Routes>
          <Route path="/closures/new" element={<ClosureFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/horas realizadas/i), '6');
    await user.selectOptions(screen.getByRole('combobox', { name: /valoración/i }), '5');
    await user.click(screen.getByRole('button', { name: /enviar cierre/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/tamaño máximo/i);
    expect(alert.closest('.field')).toBeTruthy();
    expect(screen.getByRole('button', { name: /enviar cierre/i })).toBeEnabled();
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