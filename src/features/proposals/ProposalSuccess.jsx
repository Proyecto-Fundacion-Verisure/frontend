import { useEffect, useRef } from "react";
import { Button } from "../../shared/ui";

export default function ProposalSuccess({ onReset }) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      className="proposal-page proposal-page--success"
      aria-labelledby="proposal-success-title"
      role="status"
      aria-live="polite"
    >
      <p className="proposal-page__eyebrow">Propuesta recibida</p>
      <h1 id="proposal-success-title" ref={headingRef} tabIndex={-1}>
        Gracias por contarnos qué necesitáis.
      </h1>
      <p>
        Hemos recibido vuestra propuesta. El equipo de la Fundación Verisure
        la revisará y os contactará por correo.
      </p>
      <Button onClick={onReset}>
        Enviar otra propuesta
      </Button>
    </section>
  );
}
