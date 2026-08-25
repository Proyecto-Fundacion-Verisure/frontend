export default function StatCounter({ label, value, icon }) {
  return (
    <p className="landing-stat">
      {icon && <img src={icon} alt="icono" width={24} height={24} className="landing-stat__icon" />}
      <strong>{value}</strong>
      <span>{label}</span>
    </p>
  );
}
