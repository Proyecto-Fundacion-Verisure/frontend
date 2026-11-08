// Valores, validación y payload del formulario público de propuesta.
// Aquí no hay React: la página y el hook solo coordinan estado y pintado.
export const PROPOSAL_INITIAL_VALUES = Object.freeze({
  organizationName: '',
  cif: '',
  contactName: '',
  email: '',
  phone: '',
  estimatedVolunteers: '12',
  line: '',
  description: '',
  consent: false,
});

// Orden real de los campos en el formulario. Se usa para llevar el foco al
// primer campo inválido en el mismo orden en que se lee la pantalla.
export const PROPOSAL_FIELD_ORDER = Object.freeze([
  'organizationName',
  'cif',
  'contactName',
  'email',
  'phone',
  'estimatedVolunteers',
  'line',
  'description',
  'consent',
]);

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const CIF_PATTERN = /^[A-Z]\d{7}[A-Z0-9]$/i;

function validateOrganizationFields(values) {
  const errors = {};

  if (!values.organizationName.trim()) {
    errors.organizationName = 'Indica el nombre de la organización.';
  }
  if (!CIF_PATTERN.test(values.cif.trim())) {
    errors.cif = 'Introduce un CIF válido.';
  }
  if (!values.contactName.trim()) {
    errors.contactName = 'Indica una persona de contacto.';
  }

  return errors;
}

function validateContactFields(values) {
  const errors = {};

  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Introduce un correo válido.';
  }
  if (!values.phone.trim()) {
    errors.phone = 'Indica un teléfono de contacto.';
  }

  return errors;
}

function validateVolunteerAmount(values) {
  const hasAmount = Boolean(values.estimatedVolunteers);
  const amount = Number(values.estimatedVolunteers);
  const isPositiveInteger = Number.isInteger(amount) && amount >= 1;

  if (hasAmount && !isPositiveInteger) {
    return 'Debe ser un número entero mayor que cero.';
  }
  return undefined;
}

function validateNeedFields(values) {
  const errors = {};
  const estimatedVolunteersError = validateVolunteerAmount(values);

  if (!values.description.trim()) {
    errors.description = 'Describe la necesidad de la organización.';
  }
  if (estimatedVolunteersError) {
    errors.estimatedVolunteers = estimatedVolunteersError;
  }
  if (!values.consent) {
    errors.consent = 'Debes aceptar la política de privacidad.';
  }

  return errors;
}

export function validateProposal(values) {
  return {
    ...validateOrganizationFields(values),
    ...validateContactFields(values),
    ...validateNeedFields(values),
  };
}

export function getProposalFieldError(name, values) {
  return validateProposal(values)[name];
}

// El backend devuelve `fieldErrors` como mapa de listas: se queda con el primer
// mensaje de cada campo conocido y descarta el resto.
export function getServerFieldErrors(error) {
  if (!error?.fieldErrors || Array.isArray(error.fieldErrors)) return null;

  const fieldErrors = Object.entries(error.fieldErrors).reduce(
    (result, [field, message]) => {
      const fieldMessage = Array.isArray(message) ? message[0] : message;
      const isKnownField = Object.prototype.hasOwnProperty.call(PROPOSAL_INITIAL_VALUES, field);

      if (isKnownField && typeof fieldMessage === 'string') {
        result[field] = fieldMessage;
      }
      return result;
    },
    {},
  );

  return Object.keys(fieldErrors).length ? fieldErrors : null;
}

export function buildProposalPayload(values) {
  return {
    ...values,
    estimatedVolunteers: Number(values.estimatedVolunteers) || null,
  };
}

// Marca como tocados solo los campos indicados, o todos si no se pasa nada.
export function createTouchedFields(fields = PROPOSAL_FIELD_ORDER) {
  return Object.fromEntries(fields.map((field) => [field, true]));
}
