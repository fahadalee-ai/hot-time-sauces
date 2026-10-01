import { useEffect, useState } from "react";

export function FlameBackground() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56" aria-hidden>
      <div className="flame-wash" />
      <div className="flame-wash delay" />
    </div>
  );
}

export function EmberParticles({ count = 28 }: { count?: number }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  if (reduced) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className="ember-dot"
          style={{
            left: `${(index * 37) % 100}%`,
            animationDuration: `${4 + (index % 6)}s`,
            animationDelay: `${(index % 8) * -0.7}s`,
            width: index % 3 === 0 ? 4 : 6,
            height: index % 3 === 0 ? 4 : 6,
            opacity: 0.75,
          }}
        />
      ))}
    </div>
  );
}

export function FloatingChilies() {
  const spots = [
    { left: "8%", top: "18%", delay: "0s" },
    { left: "78%", top: "12%", delay: "1s" },
    { left: "70%", top: "42%", delay: "2s" },
    { left: "12%", top: "48%", delay: "0.5s" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {spots.map((spot) => (
        <svg key={spot.left} className="float-chili h-8 w-8" style={{ left: spot.left, top: spot.top, animationDelay: spot.delay }} viewBox="0 0 24 24">
          <path fill="#e1261c" d="M14 2.5c.3 1.4-.5 2.4-1.4 3-2.4.9-3.8 2.6-4.5 4.6C7.2 12.4 6 13.6 4.6 14.6 3.1 15.6 2 17.2 2.3 18.8c.3 1.4 1.8 2.2 3.2 1.8 2.8-.5 4.8-2.2 6.4-4.4 1.4-2 2.2-4.2 2.8-6.4.3-1.2 1.1-2.1 2.1-2.4.7-.2 1.1-.9.7-1.6-.5-1-1.9-1.4-2.8-1z" />
        </svg>
      ))}
    </div>
  );
}

export function ChiliGlyph({ lit, delay = 0 }: { lit: boolean; delay?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`heat-chili h-4 w-4 ${lit ? "is-lit" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
      aria-hidden
    >
      <path
        fill={lit ? "url(#chili-heat)" : "#2A211E"}
        d="M15.2 2.2c.4 1.6-.6 2.8-1.6 3.4-2.6 1-4.2 3-5 5.2-1 2.6-2.4 4-4 5.2-1.8 1.2-3 3-2.6 4.8.4 1.6 2.2 2.6 4 2.2 3.2-.6 5.6-2.6 7.4-5.2 1.6-2.2 2.6-4.8 3.2-7.4.4-1.4 1.3-2.5 2.6-2.9.8-.2 1.3-1 .9-1.8-.6-1.3-2.2-1.7-3.4-1.3-.4.1-.8.1-1.1.2.2-.8.4-1.4.6-1.6z"
      />
    </svg>
  );
}
