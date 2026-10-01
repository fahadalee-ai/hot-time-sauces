import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Heart, Home, LayoutGrid, ShoppingBag, User } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { useApp, type Fly } from "@/lib/store";

const TABS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/shop", label: "Shop", icon: LayoutGrid },
  { to: "/wishlist", label: "Wishlist", icon: Heart },
  { to: "/cart", label: "Cart", icon: ShoppingBag },
  { to: "/account", label: "Account", icon: User },
] as const;

function showNav(path: string) {
  if (path === "/" || path.startsWith("/onboarding") || path.startsWith("/login") || path.startsWith("/register")) return false;
  if (path.startsWith("/checkout") || path.startsWith("/order/") || path.startsWith("/p/")) return false;
  return true;
}

const ROOTS = new Set(["/", "/home", "/shop", "/wishlist", "/cart", "/account", "/account/", "/onboarding", "/login", "/register"]);

function tabActive(path: string, to: string) {
  if (to === "/home") return path === "/home";
  if (to === "/shop") {
    return (
      path === "/shop" ||
      path.startsWith("/c/") ||
      path.startsWith("/brand") ||
      path.startsWith("/search") ||
      path.startsWith("/gifts") ||
      path.startsWith("/shu") ||
      path.startsWith("/blog") ||
      path.startsWith("/pepper-week")
    );
  }
  if (to === "/account") {
    return path.startsWith("/account") || ["/about", "/faq", "/contact", "/privacy", "/returns"].some((item) => path.startsWith(item));
  }
  return path === to || path.startsWith(`${to}/`);
}

function Flying({ fly }: { fly: Fly }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const phone = document.querySelector(".phone")?.getBoundingClientRect();
    const target = document.querySelector(".cart-beacon")?.getBoundingClientRect();
    const el = ref.current;
    if (!el || !phone || !target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate(
      [
        { transform: `translate(${fly.x}px, ${fly.y}px) scale(1)`, opacity: 1 },
        { transform: `translate(${target.left - phone.left}px, ${target.top - phone.top}px) scale(0.12)`, opacity: 0.15 },
      ],
      { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" },
    );
  }, [fly]);
  return <img ref={ref} src={fly.src} alt="" className="pointer-events-none absolute left-0 top-0 z-50 h-16 w-16 rounded-xl object-contain" />;
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const nav = showNav(path);
  const { toasts, fly, clearFly, cartCount } = useApp();
  const phoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fly) return;
    const timer = setTimeout(clearFly, 700);
    return () => clearTimeout(timer);
  }, [fly, clearFly]);

  useEffect(() => {
    const phone = phoneRef.current;
    if (!phone) return;
    let startX = 0;
    let startY = 0;
    let tracking = false;
    const down = (event: PointerEvent) => {
      const rect = phone.getBoundingClientRect();
      if (event.clientX - rect.left > 28 || ROOTS.has(path)) {
        tracking = false;
        return;
      }
      tracking = true;
      startX = event.clientX;
      startY = event.clientY;
    };
    const up = (event: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = event.clientX - startX;
      const dy = Math.abs(event.clientY - startY);
      if (dx > 72 && dy < 48) router.history.back();
    };
    phone.addEventListener("pointerdown", down);
    phone.addEventListener("pointerup", up);
    return () => {
      phone.removeEventListener("pointerdown", down);
      phone.removeEventListener("pointerup", up);
    };
  }, [path, router]);

  useEffect(() => {
    const onFocus = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!phoneRef.current?.contains(target)) return;
      if (!["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.setTimeout(() => target.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" }), 280);
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, []);

  return (
    <div className="stage">
      <div className="phone" ref={phoneRef}>
        <svg width="0" height="0" className="absolute" aria-hidden>
          <defs>
            <linearGradient id="chili-heat" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e1261c" />
              <stop offset="100%" stopColor="#ff8900" />
            </linearGradient>
          </defs>
        </svg>
        <div className={`phone-scroll ${nav ? "pb-24" : ""}`}>
          <div key={path} className="screen-in min-h-full">
            {children}
          </div>
        </div>
        {nav && (
          <nav className="absolute inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ember/75 px-1 pt-1 backdrop-blur-xl pb-[max(0.35rem,env(safe-area-inset-bottom))]" aria-label="Tab bar">
            <ul className="grid grid-cols-5">
              {TABS.map((tab) => {
                const active = tabActive(path, tab.to);
                const Icon = tab.icon;
                return (
                  <li key={tab.to}>
                    <Link
                      to={tab.to}
                      aria-current={active ? "page" : undefined}
                      className={`press flex h-12 flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${active ? "text-flame" : "text-ash"}`}
                    >
                      <span className={`${tab.to === "/cart" ? "cart-beacon" : ""} relative grid h-6 w-10 place-items-center`}>
                        <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.8} />
                        {tab.to === "/cart" && cartCount > 0 && (
                          <span className="badge-pop absolute -right-0.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-fire px-1 text-[9px] font-bold text-white">
                            {cartCount}
                          </span>
                        )}
                      </span>
                      {tab.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
        {fly && <Flying fly={fly} />}
        <div className="pointer-events-none absolute inset-x-4 top-[max(0.6rem,env(safe-area-inset-top))] z-50 flex flex-col items-center gap-2" role="status" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className="rounded-2xl border border-flame/40 bg-char/95 px-4 py-2.5 text-sm text-cream shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur">
              {toast.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
