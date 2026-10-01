import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import logo from "@/img/logo.png";
import splashBg from "@/img/generated/splash-bg.webp";
import onboarding1 from "@/img/generated/onboarding-1.webp";
import onboarding2 from "@/img/generated/onboarding-2.webp";
import onboarding3 from "@/img/generated/onboarding-3.webp";
import authBg from "@/img/generated/auth-bg.webp";
import { EmberParticles, FlameBackground, FloatingChilies } from "@/components/effects";
import { FireButton } from "@/components/FireButton";
import { useApp } from "@/lib/store";

const SLIDES = [
  {
    image: onboarding1,
    title: "Welcome to the Heat",
    body: "Discover 600+ hot sauces from the world's boldest brands, from mild and tangy to face-melting.",
  },
  {
    image: onboarding2,
    title: "Pick Your Heat Level",
    body: "Shop by heat, pepper type, flavor or diet. From Mild all the way to Hottest.",
  },
  {
    image: onboarding3,
    title: "Fired Up, Delivered Fast",
    body: "Flat-rate USA shipping, free delivery on bigger orders, and easy 14-day returns.",
  },
];

export function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => navigate({ to: "/onboarding" }), reduced ? 500 : 3200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-black">
      <img src={splashBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/50" />
      <FlameBackground />
      <EmberParticles count={32} />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8">
        <img src={logo} alt="Hot Time Sauces" className="splash-logo h-44 w-44 rounded-full object-cover" />
        <p className="splash-tag mt-6 font-display text-4xl tracking-[0.18em] text-cream">Bring the Heat.</p>
      </div>
      <div className="relative z-10 px-8 pb-10">
        <div className="h-1 overflow-hidden rounded-full bg-white/15">
          <div className="splash-bar h-full bg-gradient-to-r from-fire to-flame" />
        </div>
      </div>
      <style>{`
        .splash-logo { animation: logo-in 1s 0.35s both; filter: drop-shadow(0 0 24px rgba(225,38,28,0.65)); }
        .splash-tag { animation: fade-up 0.6s 1.7s both; }
        .splash-bar { width: 0; animation: bar-fill 2.6s 0.4s linear forwards; }
        @keyframes logo-in { 0% { opacity: 0; transform: scale(0.6); } 70% { opacity: 1; transform: scale(1.05) rotate(-2deg); } 100% { transform: scale(1); } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes bar-fill { to { width: 100%; } }
      `}</style>
    </div>
  );
}

export function OnboardingScreen() {
  const navigate = useNavigate();
  const { markOnboarded } = useApp();
  const [index, setIndex] = useState(0);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const slide = SLIDES[index] ?? SLIDES[0];

  const finish = () => {
    markOnboarded();
    navigate({ to: "/login" });
  };
  const back = () => setIndex((value) => Math.max(0, value - 1));

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-black"
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("button")) return;
        drag.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        if (!drag.current) return;
        const dx = event.clientX - drag.current.x;
        const dy = Math.abs(event.clientY - drag.current.y);
        drag.current = null;
        if (dy > 70) return;
        if (dx < -48) setIndex((value) => Math.min(SLIDES.length - 1, value + 1));
        if (dx > 48) back();
      }}
    >
      <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_28%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/15" />
      {index > 0 && (
        <button type="button" aria-label="Previous screen" onClick={back} className="press absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-20 grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white">
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      <button type="button" onClick={finish} className="capsule press absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 bg-black/55 text-white">
        Skip
      </button>
      <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-8 pt-28">
        <h1 className="font-display text-5xl leading-none text-white" style={{ textShadow: "0 2px 16px rgba(0,0,0,0.85)" }}>
          {slide.title}
        </h1>
        <p className="mt-3 text-base font-medium leading-relaxed text-white" style={{ textShadow: "0 1px 10px rgba(0,0,0,0.9)" }}>
          {slide.body}
        </p>
        <div className="mt-6 flex gap-2" aria-label="Onboarding progress">
          {SLIDES.map((item, dot) => (
            <span key={item.title} className={`h-2 rounded-full transition-all ${dot === index ? "nav-glow w-8" : "w-2 bg-white/45"}`} />
          ))}
        </div>
        <div className="pt-8">
          <FireButton onClick={() => (index === SLIDES.length - 1 ? finish() : setIndex(index + 1))}>
            {index === SLIDES.length - 1 ? "Get Started" : "Next"}
          </FireButton>
        </div>
      </div>
    </div>
  );
}

function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-full overflow-hidden">
      <img src={authBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/80 to-black" />
      <EmberParticles />
      <FloatingChilies />
      <FlameBackground />
      <div className="relative z-10 px-5 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">{children}</div>
    </div>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  error,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ash">{label}</span>
      <span className="relative block">
        <input
          className="field pr-12"
          type={isPassword && show ? "text" : type}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
        />
        {isPassword && (
          <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center text-ash">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </span>
      {error && <span className="mt-1 block text-xs text-fire">{error}</span>}
    </label>
  );
}

export function LoginScreen() {
  const navigate = useNavigate();
  const { login, continueAsGuest, pushToast } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  const submit = async () => {
    setLoading(true);
    await login(email, password);
    setLoading(false);
    navigate({ to: "/home" });
  };

  return (
    <AuthFrame>
      <img src={logo} alt="Hot Time Sauces" className="mx-auto h-24 w-24 rounded-full object-cover" />
      <h1 className="font-display mt-4 text-center text-5xl">Welcome Back</h1>
      <p className="mt-1 text-center text-sm text-ash">Log in to ignite your cravings.</p>
      <form
        className="mt-6 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Field label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" autoComplete="current-password" value={password} onChange={setPassword} />
        <button type="button" onClick={() => setForgot((v) => !v)} className="inline-flex h-11 items-center text-sm font-semibold text-flame">
          Forgot Password
        </button>
        {forgot && (
          <p className="rounded-2xl bg-char p-3 text-xs leading-relaxed text-ash">
            Password reset emails are not connected in this demo. Accounts live on this device — use the password you created here.
          </p>
        )}
        <FireButton className="!mt-8" type="submit" loading={loading}>
          Login
        </FireButton>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-ash">
        <span className="h-px flex-1 bg-smoke" />
        or continue with
        <span className="h-px flex-1 bg-smoke" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="press h-12 rounded-2xl border border-smoke bg-char text-sm font-semibold" onClick={() => pushToast("Google sign-in isn't connected in this demo.")}>
          Google
        </button>
        <button type="button" className="press h-12 rounded-2xl border border-smoke bg-char text-sm font-semibold" onClick={() => pushToast("Apple sign-in isn't connected in this demo.")}>
          Apple
        </button>
      </div>
      <button
        type="button"
        className="mt-4 flex h-11 w-full items-center justify-center text-sm font-semibold text-flame"
        onClick={() => {
          continueAsGuest();
          navigate({ to: "/home" });
        }}
      >
        Continue as Guest
      </button>
      <p className="mt-4 text-center text-sm text-ash">
        New here?{" "}
        <button type="button" className="inline-flex h-11 items-center font-semibold text-flame" onClick={() => navigate({ to: "/register" })}>
          Register
        </button>
      </p>
    </AuthFrame>
  );
}

export function RegisterScreen() {
  const navigate = useNavigate();
  const { register } = useApp();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "", terms: false, deals: false });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    setLoading(true);
    await register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      deals: form.deals,
    });
    setLoading(false);
    navigate({ to: "/home" });
  };

  return (
    <AuthFrame>
      <img src={logo} alt="Hot Time Sauces" className="mx-auto h-20 w-20 rounded-full object-cover" />
      <h1 className="font-display mt-3 text-center text-5xl">Join the Fire Club</h1>
      <form
        className="mt-5 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Field label="Full Name" autoComplete="name" value={form.name} onChange={(value) => set("name", value)} />
        <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={(value) => set("email", value)} />
        <Field label="Phone (optional)" type="tel" autoComplete="tel" value={form.phone} onChange={(value) => set("phone", value)} />
        <Field label="Password" type="password" autoComplete="new-password" value={form.password} onChange={(value) => set("password", value)} />
        <Field label="Confirm Password" type="password" autoComplete="new-password" value={form.confirm} onChange={(value) => set("confirm", value)} />
        <label className="flex min-h-11 items-center gap-3 text-sm text-cream">
          <input type="checkbox" checked={form.terms} onChange={(event) => set("terms", event.target.checked)} className="h-6 w-6 shrink-0 accent-[#e1261c]" />
          I agree to the Terms and Privacy Policy.
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm text-ash">
          <input type="checkbox" checked={form.deals} onChange={(event) => set("deals", event.target.checked)} className="h-6 w-6 shrink-0 accent-[#ff8900]" />
          Send me deals and new sauce drops.
        </label>
        <FireButton className="!mt-8" type="submit" loading={loading}>
          Create Account
        </FireButton>
      </form>
      <p className="mt-4 text-center text-sm text-ash">
        Already have an account?{" "}
        <button type="button" className="inline-flex h-11 items-center font-semibold text-flame" onClick={() => navigate({ to: "/login" })}>
          Login
        </button>
      </p>
    </AuthFrame>
  );
}
