import { ChevronLeft, ShoppingBag } from "lucide-react";
import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { FLAT_SHIPPING, FREE_SHIPPING_THRESHOLD } from "@/data/config";
import { money } from "@/lib/format";
import { useApp } from "@/lib/store";

export function ShippingNotice() {
  const free = Number.isInteger(FREE_SHIPPING_THRESHOLD) ? `$${FREE_SHIPPING_THRESHOLD}` : money(FREE_SHIPPING_THRESHOLD);
  return (
    <div className="mx-4 rounded-2xl border border-white/10 bg-char px-4 py-3 text-center">
      <p className="text-[15px] font-semibold leading-snug text-cream">
        Flat rate USPS shipping starts at <span className="text-flame">{money(FLAT_SHIPPING)}</span> in the USA
      </p>
      <p className="mt-1 text-[15px] font-semibold leading-snug text-cream">
        FREE shipping for orders starts at <span className="text-flame">{free}</span>
      </p>
    </div>
  );
}

export function CartButton() {
  const { cartCount } = useApp();
  return (
    <Link to="/cart" aria-label={`Cart, ${cartCount} items`} className="cart-beacon press relative grid h-11 w-11 place-items-center rounded-full bg-char">
      <ShoppingBag className="h-5 w-5" />
      <span id="cart-beacon" className="absolute right-1 top-1 h-2 w-2 rounded-full opacity-0" />
      {cartCount > 0 && (
        <span className="badge-pop absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-fire px-1 text-[10px] font-bold text-white">
          {cartCount}
        </span>
      )}
    </Link>
  );
}

export function BackBar({ title, action, onBack }: { title: string; action?: ReactNode; onBack?: () => void }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-white/10 bg-ember/80 px-1 backdrop-blur-xl">
      <button
        type="button"
        aria-label="Back"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => (onBack ? onBack() : router.history.back())}
        className="press relative z-20 ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-char text-flame"
      >
        <ChevronLeft className="h-7 w-7" strokeWidth={2.5} />
      </button>
      <h1 className="pointer-events-none absolute inset-x-16 truncate text-center font-display text-[1.7rem] leading-none text-cream">{title}</h1>
      {action && <div className="relative z-10 ml-auto flex items-center">{action}</div>}
    </header>
  );
}

export function ActionSheet({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  message?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/55 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]" role="alertdialog" aria-modal="true" aria-labelledby="action-sheet-title">
      <button type="button" aria-label="Dismiss" className="absolute inset-0" onClick={onClose} />
      <div className="relative overflow-hidden rounded-2xl border border-smoke bg-[#1c1614]">
        <div className="px-4 py-3 text-center">
          <p id="action-sheet-title" className="text-sm font-semibold text-cream">{title}</p>
          {message && <p className="mt-1 text-xs leading-relaxed text-ash">{message}</p>}
        </div>
        <button type="button" onClick={onConfirm} className="press h-14 w-full border-t border-smoke text-base font-semibold text-fire">
          {confirmLabel}
        </button>
      </div>
      <button type="button" onClick={onClose} className="press relative mt-2 h-14 w-full rounded-2xl border border-smoke bg-[#1c1614] text-base font-semibold text-cream">
        Cancel
      </button>
    </div>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-4">
      <h2 className="font-display text-[1.7rem] text-cream">{title}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  image,
  title,
  body,
  action,
}: {
  image?: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {image && <img src={image} alt="" className="mb-4 h-44 w-44 object-contain" />}
      <h2 className="font-display text-4xl text-cream">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-ash">{body}</p>
      {action && <div className="mt-6 w-full">{action}</div>}
    </div>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < value ? "text-molten" : "text-smoke"}>
          ★
        </span>
      ))}
    </div>
  );
}
