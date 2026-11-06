export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  showValue = false,
  valueLabel,
  className = '',
}) {
  const safeMax = Number(max) > 0 ? Number(max) : 100;
  const safeValue = Math.min(Math.max(Number(value) || 0, 0), safeMax);
  const percentage = Math.round((safeValue / safeMax) * 100);
  const readableValue = valueLabel ?? `${safeValue} de ${safeMax}`;

  return (
    <div className={`progress ${className}`.trim()}>
      {(label || showValue) && (
        <div className="progress__header">
          {label && <span>{label}</span>}
          {showValue && <span>{percentage}%</span>}
        </div>
      )}
      <div
        className="progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
        aria-valuetext={readableValue}
      >
        <span className="progress__bar" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
