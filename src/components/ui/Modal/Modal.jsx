import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function Modal({
  isOpen,
  children,
  onClose,
  title,
  description,
  footer,
  closeLabel = 'Cerrar',
  closeOnBackdrop = true,
  closeDisabled = false,
  size = 'medium',
  className = '',
  ...props
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const root = document.getElementById('root');
    document.body.style.overflow = 'hidden';
    if (root) {
      root.setAttribute('aria-hidden', 'true');
      // @ts-ignore - inert is supported in modern browsers
      if ('inert' in root) root.inert = true;
    }

    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll(FOCUSABLE_ELEMENTS);
    (focusable?.[0] ?? dialog)?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (closeDisabled) return;
        onClose?.();
        return;
      }

      if (event.key !== 'Tab' || !dialog) return;
      const elements = [...dialog.querySelectorAll(FOCUSABLE_ELEMENTS)];
      if (!elements.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (root) {
        root.removeAttribute('aria-hidden');
        if ('inert' in root) root.inert = false;
      }
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose, closeDisabled]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (closeDisabled) return;
        if (closeOnBackdrop && event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        ref={dialogRef}
        className={`modal modal--${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        {...props}
      >
        <div className="modal__header">
          {title && <h2 className="modal__title" id={titleId}>{title}</h2>}
          <button className="modal__close" onClick={onClose} type="button" aria-label={closeLabel} disabled={closeDisabled}>
            ×
          </button>
        </div>
        {description && <p className="modal__description" id={descriptionId}>{description}</p>}
        <div className="modal__content">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </section>
    </div>,
    document.body,
  );
}
