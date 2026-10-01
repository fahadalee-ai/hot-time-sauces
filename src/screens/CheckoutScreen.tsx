import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import successArt from "@/img/generated/order-success.webp";
import { FlameBackground } from "@/components/effects";
import { BackBar } from "@/components/Chrome";
import { FireButton } from "@/components/FireButton";
import { FLAT_SHIPPING, FREE_SHIPPING_THRESHOLD, PRIORITY_SHIPPING } from "@/data/config";
import { getProduct } from "@/lib/catalog";
import { addBusinessDays, eligibleShippingSubtotal, formatAddress, formatDay, money, shippingQuote, US_STATES } from "@/lib/format";
import { useApp, type Address, type Order } from "@/lib/store";

const STEPS = ["Address", "Shipping", "Payment", "Review"];

const emptyAddress = (): Address => ({
  id: "",
  name: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "CA",
  zip: "",
  country: "United States",
});

type Draft = {
  address: Address;
  saveIt: boolean;
  sameBilling: boolean;
  method: "ground" | "priority";
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
};

const blankDraft = (): Draft => ({
  address: emptyAddress(),
  saveIt: true,
  sameBilling: true,
  method: "ground",
  cardName: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
});

export function CheckoutScreen() {
  const navigate = useNavigate();
  const app = useApp();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!app.hydrated) return;
    const saved = sessionStorage.getItem("hts.checkout");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { step: number; draft: Draft };
        setStep(parsed.step);
        setDraft(parsed.draft);
      } catch {
        /* keep blank */
      }
    } else if (app.user) {
      setDraft((current) => ({
        ...current,
        address: { ...current.address, name: app.user?.name ?? "", email: app.user?.email ?? "", phone: app.user?.phone ?? "" },
        cardName: app.user?.name ?? "",
      }));
    }
    setReady(true);
  }, [app.hydrated, app.user]);

  useEffect(() => {
    if (!ready) return;
    sessionStorage.setItem("hts.checkout", JSON.stringify({ step, draft }));
  }, [ready, step, draft]);

  const lines = app.cart
    .map((line) => {
      const product = getProduct(line.handle);
      if (!product) return null;
      const variant = product.variants.find((item) => item.id === line.variantId);
      return { line, product, variant, price: variant?.price ?? product.price };
    })
    .filter((row) => row != null);

  const eligible = eligibleShippingSubtotal(lines.map((row) => ({ price: row.price, qty: row.line.qty, isBundle: row.product.isBundle })));
  const quote = shippingQuote({ eligibleSubtotal: eligible, method: draft.method, percentOff: app.promo?.kind === "percent" });
  const total = Math.max(0, app.subtotal - app.discount + quote.cost);

  const summary = (
    <div className="mb-4 rounded-[20px] border border-smoke bg-char">
      <button type="button" onClick={() => setSummaryOpen((value) => !value)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="text-sm font-semibold">{lines.reduce((sum, row) => sum + row.line.qty, 0)} items</span>
        <span className="text-sm font-semibold text-flame">{money(total)}</span>
      </button>
      {summaryOpen && (
        <ul className="space-y-2 border-t border-smoke px-4 py-3 text-sm text-ash">
          {lines.map((row) => (
            <li key={row.line.id} className="flex justify-between gap-3">
              <span className="line-clamp-1">{row.product.title} × {row.line.qty}</span>
              <span className="text-cream">{money(row.price * row.line.qty)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const setAddress = (patch: Partial<Address>) => setDraft((current) => ({ ...current, address: { ...current.address, ...patch } }));

  const nextAddress = () => {
    const address = draft.address;
    const next: Record<string, string> = {};
    if (address.name.trim().length < 2) next.name = "Enter the full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) next.email = "Enter an email so this order can be found later.";
    if (address.line1.trim().length < 4) next.line1 = "Enter the street address.";
    if (address.city.trim().length < 2) next.city = "Enter the city.";
    if (!/^\d{5}(-\d{4})?$/.test(address.zip.trim())) next.zip = "Enter a 5-digit ZIP.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setStep(1);
  };

  const nextPayment = () => setStep(3);

  const place = async () => {
    setPlacing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (draft.saveIt) {
      app.saveAddress({ ...draft.address, id: draft.address.id || `ad${Date.now()}` });
    }
    const order = app.placeOrder({
      email: draft.address.email,
      items: lines.map((row) => ({
        handle: row.product.handle,
        title: row.product.title,
        brand: row.product.brand,
        variant: row.variant?.title ?? "Default",
        qty: row.line.qty,
        price: row.price,
        image: row.product.images[0] ?? "",
      })),
      address: draft.address,
      shippingLabel: quote.label,
      shippingCost: quote.cost,
      discount: app.discount,
      subtotal: app.subtotal,
      total,
      paymentLast4: draft.cardNumber.replace(/\D/g, "").slice(-4),
    });
    sessionStorage.removeItem("hts.checkout");
    navigate({ to: "/order/$id", params: { id: order.id } });
  };

  if (app.hydrated && lines.length === 0) {
    return (
      <div>
        <BackBar title="Checkout" onBack={() => navigate({ to: "/cart" })} />
        <div className="px-4 pt-10 text-center">
          <h1 className="font-display text-4xl">Cart is empty</h1>
          <Link to="/shop" className="mt-4 inline-block text-flame">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <BackBar title="Checkout" onBack={() => (step === 0 ? navigate({ to: "/cart" }) : setStep(step - 1))} />
      <ol aria-label="Checkout steps" className="grid grid-cols-4 border-b border-white/10">
        {STEPS.map((label, index) => {
          const current = index === step;
          const done = index < step;
          return (
            <li key={label}>
              <button
                type="button"
                aria-current={current ? "step" : undefined}
                aria-disabled={index > step}
                onClick={() => done && setStep(index)}
                className="relative flex h-11 w-full items-center justify-center px-1"
              >
                <span className={`truncate text-[13px] font-semibold ${current ? "text-flame" : done ? "text-cream" : "text-ash"}`}>{label}</span>
                <span className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full ${current ? "bg-flame" : done ? "bg-flame/50" : ""}`} />
              </button>
            </li>
          );
        })}
      </ol>
      <div className="px-4 pt-4">
      {summary}
      {step === 0 && (
        <div className="space-y-3">
          {app.addresses.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {app.addresses.map((address) => (
                <button key={address.id} type="button" onClick={() => setDraft((current) => ({ ...current, address }))} className="capsule press shrink-0 border border-smoke bg-char text-left text-cream">
                  <span className="block font-semibold text-cream">{address.name}</span>
                  {address.line1}
                </button>
              ))}
            </div>
          )}
          <Input label="Full name" value={draft.address.name} error={errors.name} onChange={(name) => setAddress({ name })} />
          <Input label="Email" value={draft.address.email} error={errors.email} onChange={(email) => setAddress({ email })} />
          <Input label="Phone" value={draft.address.phone} onChange={(phone) => setAddress({ phone })} />
          <Input label="Address line 1" value={draft.address.line1} error={errors.line1} onChange={(line1) => setAddress({ line1 })} />
          <Input label="Address line 2" value={draft.address.line2} onChange={(line2) => setAddress({ line2 })} />
          <Input label="City" value={draft.address.city} error={errors.city} onChange={(city) => setAddress({ city })} />
          <StatePicker value={draft.address.state} onChange={(state) => setAddress({ state })} />
          <Input label="ZIP" value={draft.address.zip} error={errors.zip} onChange={(zip) => setAddress({ zip })} />
          <label className="block text-xs uppercase tracking-wide text-ash">
            Country
            <input className="field mt-2" value="United States" readOnly aria-label="Country" />
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" checked={draft.saveIt} onChange={(event) => setDraft({ ...draft, saveIt: event.target.checked })} className="h-6 w-6 accent-[#e1261c]" />
            Save this address
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" checked={draft.sameBilling} onChange={(event) => setDraft({ ...draft, sameBilling: event.target.checked })} className="h-6 w-6 accent-[#ff8900]" />
            Billing address is the same
          </label>
          <FireButton className="!mt-6" onClick={nextAddress}>Continue</FireButton>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-3">
          <Method
            title={quote.free && draft.method === "ground" ? "Free Shipping" : "Flat Rate USPS"}
            body={`Ground Advantage · 3 to 8 business days · ${quote.free ? "FREE" : money(FLAT_SHIPPING)}`}
            selected={draft.method === "ground"}
            onClick={() => setDraft({ ...draft, method: "ground" })}
          />
          <Method
            title="USPS Priority Mail"
            body={`2 to 3 business days · ${money(PRIORITY_SHIPPING)}`}
            selected={draft.method === "priority"}
            onClick={() => setDraft({ ...draft, method: "priority" })}
          />
          <p className="text-xs leading-relaxed text-ash">
            Standard 5 oz orders ship free at ${FREE_SHIPPING_THRESHOLD}. Larger bottles use an $80 bar on the website. Package deals do not qualify, and a percent-off code returns shipping to the flat rate.
          </p>
          <FireButton className="!mt-6" onClick={() => setStep(2)}>Continue</FireButton>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          {/* TODO: Replace this mock payment form with the Shopify Storefront API Checkout
              (cartCreate → cartBuyerIdentityUpdate → checkoutUrl) so orders are paid on hottimesauces.com. */}
          <p className="text-[15px] leading-6 text-cream">Nothing is charged on this phone. Payment happens later on the Hot Time Sauces store.</p>
          <p className="text-[13px] leading-5 text-ash">Visa, Mastercard, Amex, and Discover are the cards the real store accepts.</p>
          <FireButton className="!mt-6" onClick={nextPayment}>Review Order</FireButton>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3 text-sm">
          <Block title="Ship to" body={[draft.address.name, formatAddress(draft.address), draft.address.email].map((part) => part.trim()).filter(Boolean).join("\n")} />
          <Block title="Shipping" body={`${quote.label} · ${quote.cost === 0 ? "FREE" : money(quote.cost)}`} />
          <Block title="Payment" body="Demo only. No card is charged." />
          <div className="rounded-[20px] bg-char p-4">
            <Row k="Subtotal" v={money(app.subtotal)} />
            {app.discount > 0 && <Row k="Promo" v={`−${money(app.discount)}`} />}
            <Row k="Shipping" v={quote.cost === 0 ? "FREE" : money(quote.cost)} />
            <Row k="Tax" v="Calculated at checkout" />
            <Row k="Total" v={money(total)} />
          </div>
          <FireButton className="!mt-6" loading={placing} onClick={() => void place()}>
            Place demo order
          </FireButton>
        </div>
      )}
      </div>
    </div>
  );
}

function StatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPhone(document.querySelector(".phone"));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const selected = document.querySelector("[data-state-selected='true']");
    selected?.scrollIntoView({ block: "center" });
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sheet = (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/55" role="dialog" aria-modal="true" aria-label="State">
      <button type="button" aria-label="Close" className="flex-1" onClick={() => setOpen(false)} />
      <div className="max-h-[70%] overflow-y-auto rounded-t-[20px] border border-smoke bg-[#1c1614] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <div className="mx-auto mb-2 h-1.5 w-9 rounded-full bg-white/25" aria-hidden />
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-display text-3xl">State</h2>
          <button type="button" onClick={() => setOpen(false)} className="press grid h-11 min-w-11 place-items-center text-sm font-semibold text-flame">
            Done
          </button>
        </div>
        <ul role="listbox" aria-label="State">
          {US_STATES.map((state) => {
            const selected = state === value;
            return (
              <li key={state}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-state-selected={selected ? "true" : undefined}
                  onClick={() => {
                    onChange(state);
                    setOpen(false);
                  }}
                  className={`flex h-11 w-full items-center justify-between border-t border-white/10 text-left text-[17px] normal-case ${selected ? "font-semibold text-flame" : "text-cream"}`}
                >
                  {state}
                  {selected ? "✓" : ""}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="block text-xs uppercase tracking-wide text-ash">
      State
      <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)} className="field mt-2 flex items-center justify-between text-left text-[17px] normal-case text-cream">
        <span>{value}</span>
        <ChevronDown className="h-5 w-5 text-ash" />
      </button>
      {open && phone ? createPortal(sheet, phone) : null}
    </div>
  );
}

function Input({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <label className="block text-[13px] uppercase tracking-wide text-ash">
      {label}
      <input className="field mt-2 normal-case" value={value} aria-label={label} onChange={(event) => onChange(event.target.value)} />
      {error && <span className="mt-2 block normal-case text-[13px] text-fire">{error}</span>}
    </label>
  );
}

function Method({ title, body, selected, onClick }: { title: string; body: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`w-full rounded-[20px] border p-4 text-left ${selected ? "border-flame shadow-[0_0_16px_rgba(255,137,0,0.25)]" : "border-smoke bg-char"}`}>
      <span className="block font-semibold text-cream">{title}</span>
      <span className="text-sm text-ash">{body}</span>
    </button>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[20px] bg-char p-4">
      <p className="text-xs uppercase tracking-wide text-flame">{title}</p>
      <p className="mt-1 whitespace-pre-line text-cream">{body}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-ash">{k}</span>
      <span className="font-semibold text-flame">{v}</span>
    </div>
  );
}

export function OrderSuccessScreen({ id }: { id: string }) {
  const navigate = useNavigate();
  const { orders, hydrated } = useApp();
  const order = useMemo(() => orders.find((item) => item.id === id), [orders, id]);
  if (!hydrated) return <div className="shimmer m-4 h-64 rounded-[20px]" />;
  if (!order) {
    return (
      <div>
        <BackBar title="Order" onBack={() => navigate({ to: "/home" })} />
        <p className="px-4 pt-6 text-center text-sm text-ash">We couldn't find that order on this device.</p>
      </div>
    );
  }
  return <SuccessBody order={order} />;
}

function SuccessBody({ order }: { order: Order }) {
  const start = addBusinessDays(new Date(order.createdAt), order.shippingLabel.includes("Priority") ? 2 : 3);
  const end = addBusinessDays(new Date(order.createdAt), order.shippingLabel.includes("Priority") ? 3 : 8);
  return (
    <div className="relative min-h-full overflow-hidden px-4 pb-10 pt-8 text-center">
      <img src={successArt} alt="" className="mx-auto h-56 w-56 object-contain" />
      <FlameBackground />
      <h1 className="font-display relative text-5xl">Your Order Is Fired Up!</h1>
      <p className="relative mt-2 text-sm text-ash">Order {order.number}</p>
      <p className="relative mt-1 text-sm text-flame">
        Arrives {formatDay(start)} – {formatDay(end)}
      </p>
      <div className="relative mt-5 rounded-[20px] bg-char p-4 text-left text-sm">
        {order.items.map((item) => (
          <p key={item.handle} className="flex justify-between gap-3 py-1">
            <span className="line-clamp-1">{item.title} × {item.qty}</span>
            <span className="text-flame">{money(item.price * item.qty)}</span>
          </p>
        ))}
        <p className="mt-2 flex justify-between border-t border-smoke pt-2 font-semibold">
          <span>Total</span>
          <span className="text-flame">{money(order.total)}</span>
        </p>
      </div>
      <div className="relative mt-8 space-y-3">
        <Link to="/account/orders/$id" params={{ id: order.id }} className="fire-btn">
          Track Order
        </Link>
        <Link to="/home" className="press flex h-[52px] items-center justify-center rounded-2xl border border-smoke font-semibold">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
