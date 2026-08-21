export default function ProgressBar({ value = 0, max = 100 }) {
  return <progress value={value} max={max}>{value}%</progress>;
}
