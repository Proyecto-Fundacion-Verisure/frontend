import { useEffect, useState } from 'react';
import client from '../../../api/axiosClient';

function isProtectedUpload(source) {
  if (!source || typeof source !== 'string') return false;
  try {
    const parsed = new URL(source, window.location.origin);
    return parsed.pathname.startsWith('/uploads/');
  } catch {
    return source.startsWith('/uploads/');
  }
}

function resolveUploadUrl(source) {
  if (/^https?:\/\//i.test(source)) return source;
  const apiUrl = import.meta.env.VITE_API_URL ?? '/api';
  const apiOrigin = new URL(apiUrl, window.location.origin).origin;
  return new URL(source, apiOrigin).toString();
}

export default function AuthenticatedImage({ src, alt = '', ...props }) {
  const [resolvedSource, setResolvedSource] = useState(
    () => (isProtectedUpload(src) ? null : src),
  );

  useEffect(() => {
    if (!isProtectedUpload(src)) {
      setResolvedSource(src);
      return undefined;
    }

    let cancelled = false;
    let objectUrl = null;
    setResolvedSource(null);
    client.get(resolveUploadUrl(src), { responseType: 'blob' })
      .then(({ data }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(data);
        setResolvedSource(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setResolvedSource(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return <img src={resolvedSource ?? undefined} alt={alt} {...props} />;
}
