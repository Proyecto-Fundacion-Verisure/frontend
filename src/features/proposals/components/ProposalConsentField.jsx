export default function ProposalConsentField({ checked, error, onChange, onBlur }) {
  return (
    <>
      <label
        className={`proposal-form__consent${error ? " proposal-form__consent--error" : ""}`}
      >
        <input
          name="consent"
          type="checkbox"
          required
          checked={checked}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "proposal-consent-error" : undefined}
          onChange={onChange}
          onBlur={onBlur}
        />{" "}
        <span>
          He leído y acepto la <strong>política de privacidad</strong>.
          Autorizo a la Fundación Verisure a tratar estos datos con el único
          fin de valorar esta propuesta y ponerse en contacto conmigo.{" "}
          <b>*</b>
        </span>
      </label>
      {error && (
        <p id="proposal-consent-error" className="proposal-form__error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
