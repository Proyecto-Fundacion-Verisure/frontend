export function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export function makeJsonBlob(obj) {
  return new Blob([JSON.stringify(obj)], { type: 'application/json' });
}

// Assert that rendered output never mentions Enrollment / /api/enrollments
export function assertNoEnrollment(container) {
  const text = container.textContent ?? '';
  if (/enrollment/i.test(text)) {
    throw new Error('Rendered output must not contain Enrollment');
  }
  if (container.innerHTML?.includes('/api/enrollments')) {
    throw new Error('Must not use /api/enrollments');
  }
}
