import { forwardRef, useId } from 'react';

const Textarea = forwardRef(function Textarea(
  { id, label, hint, error, className = '', required = false, rows = 4, 'aria-describedby': describedBy, ...props },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  const descriptionIds = [describedBy, hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      {label && (
        <label className="field__label" htmlFor={textareaId}>
          {label}{required && <span className="field__required" aria-hidden="true"> *</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={`field__control field__textarea ${className}`.trim()}
        id={textareaId}
        required={required}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionIds}
        {...props}
      />
      {hint && <span className="field__hint" id={hintId}>{hint}</span>}
      {error && <span className="field__error" id={errorId} role="alert">{error}</span>}
    </div>
  );
});

export default Textarea;
