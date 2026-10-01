import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
};

export function FireButton({ children, loading, disabled, onClick, className = "", type = "button", ...rest }: Props) {
  const [sparks, setSparks] = useState<{ id: number; x: number }[]>([]);

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`fire-btn press ${className}`}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const id = Date.now();
        setSparks((list) => [...list.slice(-4), { id, x }]);
        setTimeout(() => setSparks((list) => list.filter((spark) => spark.id !== id)), 600);
        onClick?.(event);
      }}
      {...rest}
    >
      <span className="relative z-10">{loading ? "Firing…" : children}</span>
      {sparks.map((spark) => (
        <i key={spark.id} className="spark" style={{ left: spark.x }} />
      ))}
    </button>
  );
}
