import { useEffect, useRef, useState } from "react";
import { ChiliGlyph } from "./effects";

export function HeatMeter({ score, label }: { score: number; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setOn(true);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (score <= 0) return null;

  return (
    <div ref={ref} className="flex items-center gap-1" aria-label={label ?? `Heat ${score} of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <ChiliGlyph key={index} lit={on && index < score} delay={index * 70} />
      ))}
    </div>
  );
}
