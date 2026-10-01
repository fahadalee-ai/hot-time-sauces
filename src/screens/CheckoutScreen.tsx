import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import successArt from "@/img/generated/order-success.webp";
import { FlameBackground } from "@/components/effects";
import { FireButton } from "@/components/FireButton";
import { FLAT_SHIPPING, FREE_SHIPPING_THRESHOLD, PRIORITY_SHIPPING } from "@/data/config";
import { getProduct } from "@/lib/catalog";
import { addBusinessDays, eligibleShippingSubtotal, formatDay, luhn, money, shippingQuote, US_STATES } from "@/lib/format";
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
    const a = draft.address;
    const next: Record<string, string> = {};
    if (a.name.trim().length < 2) next.name = "Enter the full name.";
    if (!/^\S+@\S+\.\S+$/.test(a.email)) next.email = "Enter a valid email.";
    if (a.phone.replace(/\D/g, "").length < 10) next.phone = "Enter a phone number.";
    if (a.line1.trim().length < 4) next.line1 = "Enter the street address.";
    if (a.city.trim().length < 2) next.city = "Enter the city.";
    if (!/^\d{5}(-\d{4})?$/.test(a.zip)) next.zip = "Enter a 5-digit ZIP.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setStep(1);
  };

  const nextPayment = () => {
    const next: Record<string, string> = {};
    const digits = draft.cardNumber.replace(/\D/g, "");
    if (draft.cardName.trim().length < 2) next.cardName = "Name on card is required.";
    if (!luhn(digits)) next.cardNumber = "Enter a valid card number.";
    const match = draft.expiry.match(/^(\d{2})\/(\d{2})$/);
    const month = Number(match?.[1]);
    const year = Number(match?.[2]);
    const expired = !match || month < 1 || month > 12 || year < 26 || (year === 26 && month < 10);
    if (expired) next.expiry = "Use a future date as MM/YY.";
    if (!/^\d{3,4}$/.test(draft.cvv)) next.cvv = "Enter the CVV.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setStep(3);
  };

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
      <div className="px-4 pt-16 text-center">
        <h1 className="font-display text-4xl">Cart is empty</h1>
        <Link to="/shop" className="mt-4 inline-block text-flame">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 pt-[max(0.8rem,env(safe-area-inset-top))]">
      <div className="mb-4 flex items-center gap-2">
        <button type="button" onClick={() => (step === 0 ? navigate({ to: "/cart" }) : setStep(step - 1))} className="text-sm text-flame">
          Back
        </button>
        <h1 className="font-display text-3xl">Checkout</h1>
      </div>
      <ol className="mb-4 grid grid-cols-4 gap-1">
        {STEPS.map((label, index) => (
          <li key={label}>
            <button type="button" disabled={index > step} onClick={() => index < step && setStep(index)} className="w-full text-left">
              <span className={`block h-1.5 rounded-full ${index <= step ? "nav-glow" : "bg-smoke"}`} />
              <span className={`mt-1 block text-[10px] ${index === step ? "text-flame" : "text-ash"}`}>{label}</span>
            </button>
          </li>
        ))}
      </ol>
      {summary}
      {step === 0 && (
        <div className="space-y-3">
          {app.addresses.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {app.addresses.map((address) => (
                <button key={address.id} type="button" onClick={() => setDraft((current) => ({ ...current, address }))} className="press shrink-0 rounded-2xl border border-smoke px-3 py-2 text-left text-xs">
                  <span className="block font-semibold text-cream">{address.name}</span>
                  {address.line1}
                </button>
              ))}
            </div>
          )}
          <Input label="Full name" value={draft.address.name} error={errors.name} onChange={(name) => setAddress({ name })} />
          <Input label="Email" value={draft.address.email} error={errors.email} onChange={(email) => setAddress({ email })} />
          <Input label="Phone" value={draft.address.phone} error={errors.phone} onChange={(phone) => setAddress({ phone })} />
          <Input label="Address line 1" value={draft.address.line1} error={errors.line1} onChange={(line1) => setAddress({ line1 })} />
          <Input label="Address line 2" value={draft.address.line2} onChange={(line2) => setAddress({ line2 })} />
          <Input label="City" value={draft.address.city} error={errors.city} onChange={(city) => setAddress({ city })} />
          <label className="block text-xs uppercase tracking-wide text-ash">
            State
            <select aria-label="State" value={draft.address.state} onChange={(event) => setAddress({ state: event.target.value })} className="field mt-1">
              {US_STATES.map((state) => (
                <option key={state}>{state}</option>
              ))}
            </select>
          </label>
          <Input label="ZIP" value={draft.address.zip} error={errors.zip} onChange={(zip) => setAddress({ zip })} />
          <label className="block text-xs uppercase tracking-wide text-ash">
            Country
            <input className="field mt-1" value="United States" readOnly aria-label="Country" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.saveIt} onChange={(event) => setDraft({ ...draft, saveIt: event.target.checked })} className="h-5 w-5 accent-[#e1261c]" />
            Save this address
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.sameBilling} onChange={(event) => setDraft({ ...draft, sameBilling: event.target.checked })} className="h-5 w-5 accent-[#ff8900]" />
            Billing address is the same
          </label>
          <FireButton onClick={nextAddress}>Continue</FireButton>
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
          <FireButton onClick={() => setStep(2)}>Continue</FireButton>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          {/* TODO: Replace this mock payment form with the Shopify Storefront API Checkout
              (cartCreate → cartBuyerIdentityUpdate → checkoutUrl) so orders are paid on hottimesauces.com. */}
          <Input label="Name on card" value={draft.cardName} error={errors.cardName} onChange={(cardName) => setDraft({ ...draft, cardName })} />
          <Input
            label="Card number"
            value={draft.cardNumber}
            error={errors.cardNumber}
            onChange={(cardNumber) =>
              setDraft({
                ...draft,
                cardNumber: cardNumber
                  .replace(/\D/g, "")
                  .slice(0, 16)
                  .replace(/(\d{4})(?=\d)/g, "$1 ")
                  .trim(),
              })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expiry"
              value={draft.expiry}
              error={errors.expiry}
              onChange={(expiry) => {
                const digits = expiry.replace(/\D/g, "").slice(0, 4);
                setDraft({ ...draft, expiry: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits });
              }}
            />
            <Input label="CVV" value={draft.cvv} error={errors.cvv} onChange={(cvv) => setDraft({ ...draft, cvv: cvv.replace(/\D/g, "").slice(0, 4) })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="press h-12 rounded-2xl border border-smoke text-sm font-semibold" onClick={() => app.pushToast("Apple Pay isn't connected in this demo.")}>
              Apple Pay
            </button>
            <button type="button" className="press h-12 rounded-2xl border border-smoke text-sm font-semibold" onClick={() => app.pushToast("Google Pay isn't connected in this demo.")}>
              Google Pay
            </button>
          </div>
          <p className="text-xs text-ash">Secure checkout UI only. No card is charged. Visa, Mastercard, Amex, and Discover badges are shown for the real store.</p>
          <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wide text-ash">
            <span className="rounded-full border border-smoke px-2 py-1">Visa</span>
            <span className="rounded-full border border-smoke px-2 py-1">Mastercard</span>
            <span className="rounded-full border border-smoke px-2 py-1">Amex</span>
            <span className="rounded-full border border-smoke px-2 py-1">Discover</span>
          </div>
          <FireButton onClick={nextPayment}>Review Order</FireButton>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3 text-sm">
          <Block title="Ship to" body={`${draft.address.name}\n${draft.address.line1} ${draft.address.line2}\n${draft.address.city}, ${draft.address.state} ${draft.address.zip}\n${draft.address.email}`} />
          <Block title="Shipping" body={`${quote.label} · ${quote.cost === 0 ? "FREE" : money(quote.cost)}`} />
          <Block title="Payment" body={`${draft.cardName} · •••• ${draft.cardNumber.replace(/\D/g, "").slice(-4)}\n${draft.sameBilling ? "Billing matches shipping" : "Billing address collected at the store"}`} />
          <div className="rounded-[20px] bg-char p-4">
            <Row k="Subtotal" v={money(app.subtotal)} />
            {app.discount > 0 && <Row k="Promo" v={`−${money(app.discount)}`} />}
            <Row k="Shipping" v={quote.cost === 0 ? "FREE" : money(quote.cost)} />
            <Row k="Tax" v="Calculated at checkout" />
            <Row k="Total" v={money(total)} />
          </div>
          <FireButton loading={placing} onClick={() => void place()}>
            Place Order
          </FireButton>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <label className="block text-xs uppercase tracking-wide text-ash">
      {label}
      <input className="field mt-1 normal-case" value={value} aria-label={label} onChange={(event) => onChange(event.target.value)} />
      {error && <span className="mt-1 block text-fire">{error}</span>}
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
  const { orders, hydrated } = useApp();
  const order = useMemo(() => orders.find((item) => item.id === id), [orders, id]);
  if (!hydrated) return <div className="shimmer m-4 h-64 rounded-[20px]" />;
  if (!order) {
    return (
      <div className="px-4 pt-16 text-center">
        <h1 className="font-display text-4xl">Order not found</h1>
        <Link to="/home" className="mt-3 inline-block text-flame">
          Back home
        </Link>
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
      <div className="relative mt-5 space-y-3">
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
