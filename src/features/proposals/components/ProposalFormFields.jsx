import { ACTIVITY_LINES } from '../../../shared/domain/activityLines';
import { Button, Input, Select, Textarea } from '../../../shared/ui';
import ProposalConsentField from './ProposalConsentField';
import ProposalImagePreview from './ProposalImagePreview';

export default function ProposalFormFields({ form }) {
  const { values, errors, touched, setFieldRef } = form;

  return (
    <form className="proposal-form" onSubmit={form.handleSubmit} noValidate>
      <div className="proposal-form__grid">
        <Input
          ref={(node) => setFieldRef('organizationName', node)}
          name="organizationName"
          label="Nombre de la organización"
          placeholder="Asociación, fundación o entidad"
          required
          value={values.organizationName}
          onChange={form.handleFieldChange}
          onBlur={form.handleBlur}
          error={touched.organizationName ? errors.organizationName : undefined}
        />
        <Input
          ref={(node) => setFieldRef('cif', node)}
          name="cif"
          label="CIF"
          placeholder="G12345678"
          required
          value={values.cif}
          onChange={form.handleFieldChange}
          onBlur={form.handleBlur}
          error={touched.cif ? errors.cif : undefined}
        />
        <Input
          ref={(node) => setFieldRef('contactName', node)}
          name="contactName"
          label="Persona de contacto"
          placeholder="Nombre y apellidos"
          required
          value={values.contactName}
          onChange={form.handleFieldChange}
          onBlur={form.handleBlur}
          error={touched.contactName ? errors.contactName : undefined}
        />
        <Input
          ref={(node) => setFieldRef('email', node)}
          name="email"
          type="email"
          label="Correo electrónico"
          placeholder="nombre@organizacion.org"
          required
          value={values.email}
          onChange={form.handleFieldChange}
          onBlur={form.handleBlur}
          error={touched.email ? errors.email : undefined}
        />
        <Input
          ref={(node) => setFieldRef('phone', node)}
          name="phone"
          type="tel"
          label="Teléfono"
          placeholder="600 000 000"
          required
          value={values.phone}
          onChange={form.handleFieldChange}
          onBlur={form.handleBlur}
          error={touched.phone ? errors.phone : undefined}
        />
        <Input
          ref={(node) => setFieldRef('estimatedVolunteers', node)}
          name="estimatedVolunteers"
          type="number"
          min="1"
          label="Voluntarios estimados"
          value={values.estimatedVolunteers}
          onChange={form.handleFieldChange}
          onBlur={form.handleBlur}
          error={touched.estimatedVolunteers ? errors.estimatedVolunteers : undefined}
        />
      </div>

      <Select
        ref={(node) => setFieldRef('line', node)}
        name="line"
        label="Línea con la que encaja"
        value={values.line}
        onChange={form.handleFieldChange}
        onBlur={form.handleBlur}
      >
        <option value="">No lo tengo claro, ayudadme a ubicarla</option>
        {ACTIVITY_LINES.map((line) => (
          <option key={line.value} value={line.value}>
            {line.label}
          </option>
        ))}
      </Select>

      <ProposalImagePreview line={form.selectedLine} />

      <Textarea
        ref={(node) => setFieldRef('description', node)}
        name="description"
        label="Descripción de la necesidad"
        placeholder="Qué necesitáis, a quién beneficia, dónde y con qué dedicación aproximada."
        required
        rows={4}
        value={values.description}
        onChange={form.handleFieldChange}
        onBlur={form.handleBlur}
        error={touched.description ? errors.description : undefined}
        hint="Cuanto más concreta sea la dedicación por persona, antes podremos publicarla."
      />

      <ProposalConsentField
        inputRef={(node) => setFieldRef('consent', node)}
        checked={values.consent}
        error={touched.consent ? errors.consent : undefined}
        onChange={form.handleFieldChange}
        onBlur={form.handleBlur}
      />

      {form.hasSubmitError && (
        <p className="proposal-form__error" role="alert">
          No hemos podido enviar la propuesta. Inténtalo de nuevo.
        </p>
      )}

      <div className="proposal-form__footer">
        <small>Los campos marcados con * son obligatorios.</small>
        <Button type="submit" isLoading={form.isLoading} loadingLabel="Enviando…">
          Enviar
        </Button>
      </div>
    </form>
  );
}
