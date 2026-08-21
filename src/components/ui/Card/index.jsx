export default function Card({ children, ...props }) {
  return <article {...props}>{children}</article>;
}
