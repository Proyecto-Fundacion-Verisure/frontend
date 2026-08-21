export default function Modal({ isOpen, children, onClose }) {
  if (!isOpen) return null;
  return <div role="dialog" aria-modal="true"><button onClick={onClose} aria-label="Cerrar">×</button>{children}</div>;
}
