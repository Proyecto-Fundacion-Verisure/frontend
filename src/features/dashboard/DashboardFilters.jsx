import { useEffect, useState } from 'react';
import { ACTIVITY_LINES, getLineByValue } from '../../constants/activityLines';
import { Button, Card, Input, Select } from '../../components/ui';

export const MIN_DASHBOARD_YEAR = 2000;

export function isValidDashboardYear(value, currentYear = new Date().getFullYear()) {
  if (value === '' || value === null || value === undefined) return true;
  const year = Number(value);
  return Number.isInteger(year) && year >= MIN_DASHBOARD_YEAR && year <= currentYear;
}

export default function DashboardFilters({ year = '', line = '', onApply, onClear }) {
  const [draftYear, setDraftYear] = useState(year ? String(year) : '');
  const [draftLine, setDraftLine] = useState(line);
  const [yearError, setYearError] = useState('');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setDraftYear(year ? String(year) : '');
    setDraftLine(line);
    setYearError('');
  }, [line, year]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isValidDashboardYear(draftYear, currentYear)) {
      setYearError(`Introduce un año entre ${MIN_DASHBOARD_YEAR} y ${currentYear}.`);
      return;
    }
    setYearError('');
    onApply({
      year: draftYear ? Number(draftYear) : undefined,
      line: draftLine || undefined,
    });
  };

  const handleClear = () => {
    setDraftYear('');
    setDraftLine('');
    setYearError('');
    onClear();
  };

  const activeLine = getLineByValue(line);
  const hasActiveFilters = Boolean(year || line);
  const hasDraftFilters = Boolean(draftYear || draftLine);

  return (
    <Card
      as="form"
      className="dashboard-filters"
      aria-labelledby="dashboard-filters-title"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="dashboard-filters__heading">
        <h2 id="dashboard-filters-title">Filtrar resultados</h2>
        <p>Los filtros se aplican también a las descargas.</p>
      </div>
      <div className="dashboard-filters__controls">
        <Input
          id="dashboard-year"
          type="number"
          inputMode="numeric"
          label="Año"
          placeholder={`Ej. ${currentYear}`}
          min={MIN_DASHBOARD_YEAR}
          max={currentYear}
          value={draftYear}
          error={yearError}
          onChange={(event) => {
            setDraftYear(event.target.value);
            if (yearError) setYearError('');
          }}
        />
        <Select
          id="dashboard-line"
          label="Línea de acción"
          value={draftLine}
          onChange={(event) => setDraftLine(event.target.value)}
        >
          <option value="">Todas las líneas</option>
          {ACTIVITY_LINES.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
      </div>
      <div className="dashboard-filters__actions">
        <Button type="submit">Aplicar filtros</Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!hasActiveFilters && !hasDraftFilters}
          onClick={handleClear}
        >
          Limpiar filtros
        </Button>
      </div>
      <div className="dashboard-filters__active" aria-live="polite">
        <strong>Filtros activos:</strong>
        {hasActiveFilters ? (
          <ul>
            {year && <li>Año: {year}</li>}
            {line && <li>Línea: {activeLine?.label ?? line}</li>}
          </ul>
        ) : <span> ninguno</span>}
      </div>
    </Card>
  );
}
