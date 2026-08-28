import { useEffect, useRef, useState } from 'react';

const ANIMATION_DURATION = 1200;

function getNumericValue(value) {
  const digits = String(value).replace(/\D/g, '');
  return Number(digits) || 0;
}

function formatValue(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function StatCounter({ label, value, icon }) {
  const elementRef = useRef(null);
  const finalValue = getNumericValue(value);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      setDisplayValue(finalValue);
      return undefined;
    }

    let animationFrame;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;

      observer.disconnect();
      let startedAt;

      const animate = (timestamp) => {
        startedAt ??= timestamp;
        const progress = Math.min((timestamp - startedAt) / ANIMATION_DURATION, 1);
        setDisplayValue(Math.round(finalValue * progress));

        if (progress < 1) animationFrame = requestAnimationFrame(animate);
      };

      animationFrame = requestAnimationFrame(animate);
    });

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [finalValue]);

  return (
    <p className="landing-stat" ref={elementRef}>
      {icon && <img src={icon} alt="" width={24} height={24} className="landing-stat__icon" />}
      <strong aria-label={String(value)}>{formatValue(displayValue)}</strong>
      <span>{label}</span>
    </p>
  );
}
