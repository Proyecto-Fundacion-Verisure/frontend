export default function ProposalImagePreview({ line }) {
  if (!line) return null;

  return (
    <div className="line-preview">
      <img
        className="line-preview__image"
        src={line.image}
        alt={`Imsgen de la línea ${line.label}: ${line.description}`}
      />
      <p className="line-preview__label">{line.label}</p>
    </div>
  );
}