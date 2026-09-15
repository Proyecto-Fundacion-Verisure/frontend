const LINE_ALIASES = {
  medioambiente: 'medio_ambiente',
  'medio-ambiente': 'medio_ambiente',
};

export function normalizeActivityLine(value) {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  return LINE_ALIASES[normalized] ?? normalized;
}

export function serializeActivityLine(value) {
  const normalized = normalizeActivityLine(value);
  return normalized === 'medio_ambiente' ? 'medioambiente' : normalized;
}

function toLocalDate(value) {
  if (!value) return value;
  if (typeof value === 'string') return value.slice(0, 10);
  return value;
}

export function serializeActivityRequest(activity) {
  if (!activity || typeof activity !== 'object') return activity;
  const {
    capacity,
    image,
    maxParticipants,
    modality,
    organizationName,
    partnerName,
    registeredCount,
    favoritedByMe,
    favoriteCount,
    ...request
  } = activity;
  const mode = activity.mode ?? modality;
  const spots = activity.spots ?? maxParticipants ?? capacity;

  return Object.fromEntries(Object.entries({
    ...request,
    line: serializeActivityLine(activity.line),
    mode: typeof mode === 'string' ? mode.toUpperCase() : mode,
    spots,
    imageUrl: activity.imageUrl ?? image,
    startDate: toLocalDate(activity.startDate),
    endDate: toLocalDate(activity.endDate),
    registrationDeadline: toLocalDate(activity.registrationDeadline),
  }).filter(([, value]) => value !== undefined));
}

export function normalizeActivity(activity) {
  if (!activity || typeof activity !== 'object') return activity;

  const capacity = activity.capacity ?? activity.spots ?? activity.maxParticipants;
  const organizationName = activity.organizationName
    ?? activity.partnerName
    ?? activity.partner?.name;
  const image = activity.image ?? activity.imageUrl;
  const mode = activity.mode ?? activity.modality;

  return {
    ...activity,
    line: normalizeActivityLine(activity.line),
    mode,
    modality: activity.modality ?? mode,
    capacity,
    maxParticipants: activity.maxParticipants ?? capacity,
    organizationName,
    image,
    imageUrl: activity.imageUrl ?? image,
  };
}

export function normalizeRegistration(registration) {
  if (!registration || typeof registration !== 'object') return registration;
  return {
    ...registration,
    registrationId: registration.registrationId ?? registration.id,
  };
}

export function normalizeCertificate(certificate) {
  if (!certificate || typeof certificate !== 'object') return certificate;
  return {
    ...certificate,
    fullName: certificate.fullName
      ?? certificate.volunteerName
      ?? certificate.employeeName,
    endDate: certificate.endDate ?? certificate.activityEndDate,
  };
}

function normalizePayload(payload, itemNormalizer) {
  if (Array.isArray(payload)) return payload.map(itemNormalizer);
  if (Array.isArray(payload?.content)) {
    return { ...payload, content: payload.content.map(itemNormalizer) };
  }
  return itemNormalizer(payload);
}

export function normalizeResponse(response, itemNormalizer) {
  if (!response || typeof response !== 'object' || !('data' in response)) return response;
  return { ...response, data: normalizePayload(response.data, itemNormalizer) };
}

export function normalizeRequestResult(result, itemNormalizer) {
  if (result && typeof result.then === 'function') {
    return result.then((response) => normalizeResponse(response, itemNormalizer));
  }
  return normalizeResponse(result, itemNormalizer);
}
