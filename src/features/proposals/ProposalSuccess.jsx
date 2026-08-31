import { Button } from "../../components/ui";

export default function ProposalSuccess({ onReset }) {
  return (
    <section className="proposal-page proposal-page--success">
      <p className="proposal-page__eyebrow">Propuesta recibida</p>
      <h1>Gracias por contarnos .</h1>
      <p>
        Hemos recibido vuestra propuesta. El equipo de la Fundación Verisure
        la revisará y os contactará por correo.
      </p>
      <Button size="large" onClick={onReset}>
        Enviar otra propuesta
      </Button>
    </section>
  );
}
