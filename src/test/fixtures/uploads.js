// Upload fixtures — portada 5 MB (part `image`), evidencia 10 MB (parts `request`/`evidence`)

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
export const ALLOWED_EVIDENCE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export function makeFile(name, bytes, type) {
  const buffer = new Uint8Array(bytes);
  return new File([buffer], name, { type });
}

export function makeImageFile(name = 'portada.jpg', bytes = 1024, type = 'image/jpeg') {
  return makeFile(name, bytes, type);
}

export function makeEvidenceFile(name = 'evidencia.pdf', bytes = 1024, type = 'application/pdf') {
  return makeFile(name, bytes, type);
}

export function makeOversizedImage() {
  return makeFile('oversized.jpg', MAX_IMAGE_BYTES + 1, 'image/jpeg');
}

export function makeOversizedEvidence() {
  return makeFile('oversized.pdf', MAX_EVIDENCE_BYTES + 1, 'application/pdf');
}

export function makeInvalidTypeFile() {
  return makeFile('invalid.txt', 1024, 'text/plain');
}
