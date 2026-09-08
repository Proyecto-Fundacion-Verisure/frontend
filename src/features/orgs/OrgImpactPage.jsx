import { useCallback, useEffect, useState } from 'react';
import { getOrgDashboard } from '../../api/orgApi';
import { Button, Input, Spinner } from '../../components/ui';

export default function OrgImpactPage() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [dashboard, setDashboard] = useState(null);
  const [state, setState] = useState({ status: 'loading', error: null });

  const load = useCallback(async () => {
    setState({ status: 'loading', error: null });
    try {
      const { data } = await getOrgDashboard(Number(year));
      setDashboard(data);
      setState({ status: 'success', error: null });
    } catch (error) {
      setState({ status: 'error', error });
    }
  }, [year]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section aria-labelledby="org-dashboard-title">
      <h1 id="org-dashboard-title">Impacto de mi entidad</h1>
      <form onSubmit={(event) => { event.preventDefault(); void load(); }}>
        <Input
          type="number"
          name="year"
          label="Año"
          value={year}
          onChange={(event) => setYear(event.target.value)}
        />
        <Button type="submit">Actualizar</Button>
      </form>
      {state.status === 'loading' && <Spinner label="Cargando impacto…" />}
      {state.status === 'error' && <p role="alert">{state.error?.message || 'No hemos podido cargar el impacto.'}</p>}
      {state.status === 'success' && dashboard && (
        <dl>
          {Object.entries(dashboard)
            .filter(([, value]) => ['string', 'number'].includes(typeof value))
            .map(([key, value]) => (
              <div key={key}><dt>{key}</dt><dd>{value}</dd></div>
            ))}
        </dl>
      )}
    </section>
  );
}
