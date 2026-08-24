import { forwardRef, useId } from 'react';

const Select = forwardRef(function Select(
  { children, id, label, hint, error, className = '', required = false, 'aria-describedby': describedBy, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const descriptionIds = [describedBy, hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      {label && (
        <label className="field__label" htmlFor={selectId}>
          {label}{required && <span className="field__required" aria-hidden="true"> *</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`field__control field__select ${className}`.trim()}
        id={selectId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionIds}
        {...props}
      >
        {children}
      </select>
      {hint && <span className="field__hint" id={hintId}>{hint}</span>}
      {error && <span className="field__error" id={errorId} role="alert">{error}</span>}
    </div>
  );
});

export default Select;
