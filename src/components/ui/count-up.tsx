import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
}

export function CountUp({ value, duration = 1.2, className }: CountUpProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = value;
    if (end === 0) { setCount(0); return; }
    
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, inView, duration]);

  return <span ref={ref} className={className}>{count}</span>;
}
