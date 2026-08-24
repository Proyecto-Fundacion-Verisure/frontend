import { forwardRef, useId } from 'react';

const Input = forwardRef(function Input(
  { id, label, hint, error, className = '', required = false, 'aria-describedby': describedBy, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const descriptionIds = [describedBy, hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}{required && <span className="field__required" aria-hidden="true"> *</span>}
        </label>
      )}
      <input
        ref={ref}
        className={`field__control ${className}`.trim()}
        id={inputId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionIds}
        {...props}
      />
      {hint && <span className="field__hint" id={hintId}>{hint}</span>}
      {error && <span className="field__error" id={errorId} role="alert">{error}</span>}
    </div>
  );
});

export default Input;
