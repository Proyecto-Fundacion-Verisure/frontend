import { Download } from 'lucide-react';
import { useState } from 'react';
import {
  exportDashboardPdf,
  exportPartnersCsv,
  exportParticipationsCsv,
} from '../../api/dashboardApi';
import { Button, Card } from '../../components/ui';
import { downloadBlob } from './downloadFile';

const EXPORTS = [
  {
    id: 'participations',
    title: 'Participaciones',
    format: 'CSV',
    filename: 'participations.csv',
    description: 'Datos seudonimizados de participación. No incluye nombres ni correos electrónicos.',
    request: exportParticipationsCsv,
  },
  {
    id: 'partners',
    title: 'Entidades colaboradoras',
    format: 'CSV',
    filename: 'partners.csv',
    description: 'Entidades colaboradoras, actividades realizadas y horas reportadas.',
    request: exportPartnersCsv,
  },
  {
    id: 'report',
    title: 'Informe visual',
    format: 'PDF',
    filename: 'dashboard-report.pdf',
    description: 'Resumen de los indicadores y gráficos con los filtros activos.',
    request: exportDashboardPdf,
    optional: true,
  },
];

const initialStatuses = Object.fromEntries(EXPORTS.map(({ id }) => [id, { state: 'idle' }]));

export default function DashboardExports({ filters = {} }) {
  const [statuses, setStatuses] = useState(initialStatuses);

  const updateStatus = (id, status) => {
    setStatuses((current) => ({ ...current, [id]: status }));
  };

  const handleDownload = async (definition) => {
    updateStatus(definition.id, {
      state: 'loading',
      message: `Descargando ${definition.filename}…`,
    });
    try {
      const response = await definition.request(filters);
      downloadBlob(response.data, definition.filename);
      updateStatus(definition.id, {
        state: 'success',
        message: `${definition.filename} se ha descargado correctamente.`,
      });
    } catch (error) {
      updateStatus(definition.id, {
        state: 'error',
        message: error?.status === 403
          ? 'No tienes permiso para descargar este archivo.'
          : `No hemos podido generar ${definition.filename}. Puedes volver a intentarlo.`,
      });
    }
  };

  return (
    <section className="dashboard-exports" aria-labelledby="dashboard-exports-title">
      <div className="dashboard-section-heading">
        <div>
          <p className="dashboard__eyebrow">Exportaciones</p>
          <h2 id="dashboard-exports-title">Descargar resultados</h2>
          <p className="dashboard-exports__description">
            Cada archivo utiliza exactamente los filtros activos del dashboard.
          </p>
        </div>
      </div>
      <div className="dashboard-exports__grid">
        {EXPORTS.map((definition) => {
          const status = statuses[definition.id];
          return (
            <Card className="dashboard-export" key={definition.id}>
              <div className="dashboard-export__heading">
                <div>
                  <h3>{definition.title}</h3>
                  <span className="dashboard-export__format">{definition.format}</span>
                </div>
                <Download aria-hidden="true" />
              </div>
              <p>{definition.description}</p>
              {definition.optional && (
                <p className="dashboard-export__optional">Disponible si la generación de PDF está habilitada.</p>
              )}
              <Button
                variant="secondary"
                isLoading={status.state === 'loading'}
                loadingLabel={`Descargando ${definition.format}…`}
                onClick={() => handleDownload(definition)}
              >
                {status.state === 'error' ? 'Reintentar descarga' : `Descargar ${definition.format}`}
              </Button>
              <div
                className={`dashboard-export__status dashboard-export__status--${status.state}`}
                role={status.state === 'error' ? 'alert' : 'status'}
                aria-live="polite"
              >
                {status.message ?? ''}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
