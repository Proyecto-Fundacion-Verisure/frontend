import { useEffect, useRef, useState } from 'react';
import { BarChart3, Building2, ChevronDown, Download, FileSpreadsheet } from 'lucide-react';
import {
  exportDashboardPdf,
  exportParticipationsCsv,
  exportPartnersCsv,
} from '../../api/dashboardApi';
import { downloadBlob } from './downloadFile';

const EXPORT_OPTIONS = [
  {
    id: 'report',
    title: 'Representación con gráficos',
    description: 'PDF con los KPIs y los gráficos tal y como se ven aquí',
    format: 'PDF',
    filename: 'report.pdf',
    Icon: BarChart3,
    request: exportDashboardPdf,
  },
  {
    id: 'participations',
    title: 'Dashboard general',
    description: 'CSV con una fila por participación cerrada, seudonimizada',
    format: 'CSV',
    filename: 'participations.csv',
    Icon: FileSpreadsheet,
    request: exportParticipationsCsv,
  },
  {
    id: 'partners',
    title: 'Entidades colaboradoras',
    description: 'CSV con las organizaciones, sus actividades y sus horas',
    format: 'CSV',
    filename: 'partners.csv',
    Icon: Building2,
    request: exportPartnersCsv,
  },
];

export default function ExportMenu({ filters = {} }) {
  const [open, setOpen] = useState(false);
  const [statuses, setStatuses] = useState(() =>
    Object.fromEntries(EXPORT_OPTIONS.map((o) => [o.id, { state: 'idle', message: '' }]))
  );
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const updateStatus = (id, status) => {
    setStatuses((c) => ({ ...c, [id]: status }));
  };

  const handleDownload = async (option) => {
    updateStatus(option.id, { state: 'loading', message: `Descargando ${option.filename}…` });
    try {
      const response = await option.request(filters);
      downloadBlob(response.data, option.filename);
      updateStatus(option.id, { state: 'success', message: `${option.filename} se ha descargado correctamente.` });
      setOpen(false);
      buttonRef.current?.focus();
    } catch (error) {
      updateStatus(option.id, {
        state: 'error',
        message:
          error?.status === 403
            ? 'No tienes permiso para descargar este archivo.'
            : `No hemos podido generar ${option.filename}. Puedes volver a intentarlo.`,
      });
    }
  };

  useEffect(() => {
    const onMouseDown = (e) => {
      if (!open) return;
      if (menuRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKeyDown = (e) => {
      if (!open) return;
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = menuRef.current?.querySelectorAll('[role="menuitem"]');
        if (!items?.length) return;
        const current = document.activeElement;
        const idx = Array.from(items).indexOf(current);
        const next = e.key === 'ArrowDown' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
        items[next]?.focus();
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const first = menuRef.current?.querySelector('[role="menuitem"]');
      first?.focus();
    }
  }, [open]);

  return (
    <div className="export-menu">
      <button
        ref={buttonRef}
        type="button"
        className={`button button--primary button--medium export-menu__trigger ${open ? 'export-menu__trigger--open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="export-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Download size={16} aria-hidden="true" />
        <span>Exportar</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`export-menu__chevron ${open ? 'export-menu__chevron--open' : ''}`}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          id="export-menu"
          role="menu"
          aria-orientation="vertical"
          className="export-menu__dropdown"
        >
          {EXPORT_OPTIONS.map((opt) => {
            const st = statuses[opt.id];
            const isLoading = st.state === 'loading';
            return (
              <button
                key={opt.id}
                role="menuitem"
                tabIndex={0}
                className="export-menu__item"
                disabled={isLoading}
                aria-busy={isLoading || undefined}
                onClick={() => handleDownload(opt)}
              >
                <span className="export-menu__item-icon" aria-hidden="true">
                  <opt.Icon size={20} />
                </span>
                <span className="export-menu__item-content">
                  <span className="export-menu__item-title">
                    {opt.title} <span className="export-menu__item-format">{opt.format}</span>
                  </span>
                  <span className="export-menu__item-desc">{opt.description}</span>
                  {st.message && (
                    <span
                      className={`export-menu__item-status export-menu__item-status--${st.state}`}
                      role={st.state === 'error' ? 'alert' : 'status'}
                      aria-live="polite"
                    >
                      {st.message}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
