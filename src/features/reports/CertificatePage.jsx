import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import logo from '../../assets/images/logo-fundacion-verisure.png';
import { getCertificate } from '../../api/closuresApi';
import { Button, Spinner } from '../../components/ui';

const LINE_LABELS = {
  desoledad: 'Desoledad',
  educar: 'Educar para proteger',
  acoso: 'Protegidos ante el acoso',
  medio_ambiente: 'Medio ambiente',
};

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export default function CertificatePage() {
  const { closureId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCertificate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getCertificate(closureId);
      setCertificate(data);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [closureId]);

  useEffect(() => {
    loadCertificate();
  }, [loadCertificate]);

  if (loading) {
    return (
      <section className="certificate-page certificate-page--state" aria-label="Cargando certificado">
        <Spinner label="Cargando certificado…" />
      </section>
    );
  }

  if (error) {
    const isNotOwner = error.status === 403 || error.code === 'NOT_OWNER';
    const isNotValidated = error.status === 409 || error.code === 'ACTIVITY_NOT_CLOSED';
    const title = isNotOwner
      ? 'No puedes consultar este certificado'
      : isNotValidated
        ? 'El certificado todavía no está disponible'
        : 'No hemos podido cargar el certificado';
    return (
      <section className="certificate-page certificate-page--state">
        <h1>{title}</h1>
        <p role="alert">{error.message || 'Inténtalo de nuevo.'}</p>
        <div className="certificate-page__actions">
          {!isNotOwner && !isNotValidated && <Button onClick={loadCertificate}>Reintentar</Button>}
          <Link className="button button--secondary button--medium" to="/my-volunteering">Volver a mis actividades</Link>
        </div>
      </section>
    );
  }

  const fullName = certificate.fullName ?? certificate.volunteerName;
  const partnerName = certificate.partner?.name ?? certificate.partnerName;
  const line = certificate.line?.toLowerCase();

  return (
    <section className="certificate-page" aria-labelledby="certificate-title">
      <div className="certificate-page__actions">
        <Link className="button button--secondary button--medium" to="/my-volunteering">← Volver</Link>
        <Button onClick={() => window.print()}>Imprimir o guardar como PDF</Button>
      </div>

      <article className="certificate">
        <header className="certificate__header">
          <img src={logo} alt="Fundación Verisure" />
          <p>Fundación Verisure acredita que</p>
        </header>

        <div className="certificate__body">
          <h1 id="certificate-title">Certificado de voluntariado</h1>
          <p className="certificate__name">{fullName}</p>
          <p className="certificate__statement">
            ha participado en la actividad <strong>{certificate.activityTitle}</strong>,
            organizada junto a <strong>{partnerName}</strong> dentro de la línea de acción
            {' '}<strong>{LINE_LABELS[line] ?? certificate.line}</strong>.
          </p>

          <dl className="certificate__details">
            <div>
              <dt>Periodo de participación</dt>
              <dd>{formatDate(certificate.startDate)} — {formatDate(certificate.endDate)}</dd>
            </div>
            <div className="certificate__hours">
            <dt>Horas realizadas</dt>
            <dd>{certificate.actualHours ?? certificate.hours ?? '—'}</dd>
            </div>
            <div>
              <dt>Fecha de expedición</dt>
              <dd>{formatDate(certificate.issuedAt ?? certificate.issueDate)}</dd>
            </div>
          </dl>
        </div>

        <footer className="certificate__footer">
          <span>Fundación Verisure</span>
          <span>Referencia: <strong>{certificate.reference}</strong></span>
        </footer>
      </article>
    </section>
  );
}
