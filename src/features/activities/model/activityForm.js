// Valores y reglas del formulario de actividad. Todo lo que no necesita React
// vive aquí para que la página y el hook solo coordinen estado y pintado.
export const ACTIVITY_FORM_INITIAL_VALUES = {
  title: '',
  description: '',
  line: '',
  mode: '',
  location: '',
  spots: '',
  hours: '',
  startDate: '',
  endDate: '',
  registrationDeadline: '',
};

// Los valores de `mode` son los que siembra el backend y por los que filtra el
// catálogo (`CatalogPage.MODE_OPTIONS`): en mayúsculas, sin traducir.
export const ACTIVITY_MODE_OPTIONS = Object.freeze([
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'MIXTO', label: 'Mixto' },
]);

export const ACTIVITY_LINE_OPTIONS = Object.freeze([
  { value: 'desoledad', label: 'Desoledad' },
  { value: 'educar', label: 'Educar para proteger' },
  { value: 'acoso', label: 'Protegidos ante el acoso' },
  { value: 'medioambiente', label: 'Medio ambiente' },
]);

const ACTIVITY_FORM_HEADER_COPY = {
  admin: {
    create: {
      eyebrow: 'Nueva actividad',
      title: 'Crear actividad de voluntariado',
      description: 'Guarda la actividad como borrador o publícala cuando todos los datos estén listos.',
    },
    edit: {
      eyebrow: 'Editar actividad',
      title: 'Editar actividad de voluntariado',
      description: 'Actualiza los datos necesarios y guarda los cambios.',
    },
  },
  partner: {
    create: {
      eyebrow: 'Nueva propuesta',
      title: 'Proponer una actividad de voluntariado',
      description: 'Guarda la propuesta como borrador o envíala a la Fundación cuando esté lista. Si la aprueba, la actividad pasará al catálogo de la plantilla.',
    },
    edit: {
      eyebrow: 'Editar propuesta',
      title: 'Editar propuesta de actividad',
      description: 'Actualiza los datos necesarios y guarda los cambios.',
    },
  },
};

const ACTIVITY_FORM_RESULT_COPY = {
  admin: {
    draft: {
      eyebrow: 'Borrador guardado',
      title: 'Tu borrador está guardado',
      description: 'La actividad todavía no es visible en el catálogo. Puedes publicarla cuando esté lista.',
      publishLabel: 'Publicar actividad',
    },
    updated: {
      eyebrow: 'Cambios guardados',
      title: 'La actividad se ha actualizado',
      description: 'Los cambios están guardados y ya puedes volver al listado administrativo.',
    },
    published: {
      eyebrow: 'Actividad publicada',
      title: 'La actividad ya está publicada',
      description: 'La actividad ya está disponible en el catálogo interno.',
    },
  },
  partner: {
    draft: {
      eyebrow: 'Borrador guardado',
      title: 'Tu borrador está guardado',
      description: 'La propuesta todavía no se ha enviado a la Fundación. Puedes enviarla cuando esté lista.',
      publishLabel: 'Enviar',
    },
    updated: {
      eyebrow: 'Cambios guardados',
      title: 'La propuesta se ha actualizado',
      description: 'Los cambios están guardados. Desde «Mis propuestas» puedes enviarla a la Fundación.',
    },
    published: {
      eyebrow: 'Propuesta enviada',
      title: 'La propuesta está pendiente de aprobación',
      description: 'La Fundación revisará la propuesta y, si la aprueba, la actividad pasará al catálogo.',
    },
  },
};

const ACTIVITY_FORM_LOAD_ERROR_COPY = {
  forbidden: {
    title: 'No tienes permiso para editar esta actividad',
    canRetry: false,
  },
  'not-found': {
    title: 'No encontramos la actividad',
    canRetry: false,
  },
  'load-error': {
    title: 'No hemos podido cargar la actividad',
    canRetry: true,
  },
};

const ACTIVITY_LOAD_ERROR_STATUS = {
  403: 'forbidden',
  404: 'not-found',
};

const PENDING_RESULT_STATUS = {
  publishing: 'draft',
};

export function getActivityFormHeaderCopy({ isPartner, isEditMode }) {
  const audience = isPartner ? 'partner' : 'admin';
  const action = isEditMode ? 'edit' : 'create';
  return ACTIVITY_FORM_HEADER_COPY[audience][action];
}

export function getActivityFormResultCopy({ requestStatus, isPartner, isEditMode }) {
  const audience = isPartner ? 'partner' : 'admin';
  const status = PENDING_RESULT_STATUS[requestStatus] ?? requestStatus;
  const copy = ACTIVITY_FORM_RESULT_COPY[audience][status] ?? ACTIVITY_FORM_RESULT_COPY[audience].draft;
  const hasPublishAction = status !== 'published' && !isEditMode;

  return {
    ...copy,
    showPublish: hasPublishAction,
    secondaryLabel: isEditMode ? 'Seguir editando' : 'Crear otra actividad',
  };
}

export function getActivityFormLoadErrorCopy(status) {
  return ACTIVITY_FORM_LOAD_ERROR_COPY[status] ?? ACTIVITY_FORM_LOAD_ERROR_COPY['load-error'];
}

export function getActivityLoadErrorStatus(status) {
  return ACTIVITY_LOAD_ERROR_STATUS[status] ?? 'load-error';
}

export function getActivityFormView(requestStatus, activity) {
  if (requestStatus === 'loading') return 'loading';
  if (['forbidden', 'not-found', 'load-error'].includes(requestStatus)) return 'error';
  if (['draft', 'updated', 'published'].includes(requestStatus)) return 'result';
  if (requestStatus === 'publishing' && activity) return 'result';
  return 'form';
}

export function toDateInput(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

// Lee tanto `ActivityFormResponse` (admin) como `OrgActivityRow` (entidad); la
// segunda no trae `description`, que llega vacía.
export function toActivityFormValues(activity) {
  return {
    title: activity.title ?? '',
    description: activity.description ?? '',
    line: activity.line?.toLowerCase() ?? '',
    mode: activity.mode?.toUpperCase() ?? '',
    location: activity.location ?? '',
    spots: String(activity.spots ?? ''),
    hours: String(activity.hours ?? ''),
    startDate: toDateInput(activity.startDate),
    endDate: toDateInput(activity.endDate),
    registrationDeadline: toDateInput(activity.registrationDeadline),
  };
}

export function buildActivityPayload(values) {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    line: values.line,
    mode: values.mode,
    location: values.location.trim() || null,
    startDate: values.startDate,
    endDate: values.endDate,
    registrationDeadline: values.registrationDeadline,
    hours: Number(values.hours),
    spots: Number(values.spots),
  };
}

function validateActivityTextFields(values) {
  const errors = {};

  if (!values.title.trim()) {
    errors.title = 'Indica el título de la actividad.';
  } else if (values.title.trim().length > 120) {
    errors.title = 'El título no puede superar los 120 caracteres.';
  }
  if (!values.description.trim()) errors.description = 'Describe la actividad.';
  if (!values.line) errors.line = 'Selecciona una línea.';
  if (!values.mode) errors.mode = 'Selecciona una modalidad.';
  if (values.location.trim().length > 160) {
    errors.location = 'El lugar no puede superar los 160 caracteres.';
  }

  return errors;
}

function validateActivityNumberFields(values) {
  const errors = {};

  if (!values.spots) {
    errors.spots = 'Indica el número de plazas.';
  } else if (Number(values.spots) < 1) {
    errors.spots = 'Debe ser al menos 1.';
  }
  if (!values.hours) {
    errors.hours = 'Indica las horas estimadas.';
  } else if (Number(values.hours) < 1) {
    errors.hours = 'Debe ser al menos 1.';
  }

  return errors;
}

function validateActivityDateFields(values) {
  const errors = {};

  if (!values.startDate) errors.startDate = 'Indica la fecha de inicio.';
  if (!values.endDate) errors.endDate = 'Indica la fecha de fin.';
  if (!values.registrationDeadline) {
    errors.registrationDeadline = 'Indica la fecha límite de inscripción.';
  }

  // Las mismas dos reglas que `@ValidDateRange` en el backend: una actividad de
  // un día tiene inicio y fin iguales, y el plazo puede coincidir con el inicio.
  // Son `YYYY-MM-DD`, así que se comparan como texto.
  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = 'La fecha de fin no puede ser anterior a la de inicio.';
  }
  if (
    values.startDate
    && values.registrationDeadline
    && values.registrationDeadline > values.startDate
  ) {
    errors.registrationDeadline = 'La fecha límite no puede ser posterior al inicio.';
  }

  return errors;
}

export function validateActivityForm(values) {
  return {
    ...validateActivityTextFields(values),
    ...validateActivityNumberFields(values),
    ...validateActivityDateFields(values),
  };
}

export function createTouchedState(fields = Object.keys(ACTIVITY_FORM_INITIAL_VALUES)) {
  return Object.fromEntries(fields.map((field) => [field, true]));
}
