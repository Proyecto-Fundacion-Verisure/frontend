export default function StatCounter({ label, value }) {
  return (
    <p className="landing-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </p>
  );
}
