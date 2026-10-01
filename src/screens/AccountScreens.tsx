import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, ChevronRight, Gift, Heart, HelpCircle, Info, LogOut, Mail, MapPin, Package, Pencil, RotateCcw, Shield, Thermometer } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { FireButton } from "@/components/FireButton";
import { ActionSheet, BackBar } from "@/components/Chrome";
import { SauceImage } from "@/components/SauceImage";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/data/config";
import { coverFor } from "@/lib/catalog";
import { imageUrl, money } from "@/lib/format";
import { useApp, type Address, type Order } from "@/lib/store";

const GROUPS: { title: string; items: { label: string; hint: string; to: "/account/orders" | "/account/addresses" | "/wishlist" | "/gifts" | "/shu" | "/blog" | "/faq" | "/contact" | "/about" | "/privacy" | "/returns"; icon: ComponentType<{ className?: string }> }[] }[] = [
  {
    title: "Your shelf",
    items: [
      { label: "My Orders", hint: "Track every bottle", to: "/account/orders", icon: Package },
      { label: "Saved Addresses", hint: "Where the heat ships", to: "/account/addresses", icon: MapPin },
      { label: "Wishlist", hint: "Sauces you saved", to: "/wishlist", icon: Heart },
      { label: "E-Gift Cards", hint: "Send the burn", to: "/gifts", icon: Gift },
    ],
  },
  {
    title: "Discover",
    items: [
      { label: "Pepper SHU Guide", hint: "How hot is hot", to: "/shu", icon: Thermometer },
      { label: "Sauce Blog", hint: "Stories from the shelf", to: "/blog", icon: BookOpen },
    ],
  },
  {
    title: "Help",
    items: [
      { label: "Help / FAQ", hint: "Shipping, heat, orders", to: "/faq", icon: HelpCircle },
      { label: "Contact Us", hint: SUPPORT_PHONE, to: "/contact", icon: Mail },
      { label: "About Us", hint: "The Hot Time story", to: "/about", icon: Info },
      { label: "Returns Policy", hint: "14-day returns", to: "/returns", icon: RotateCcw },
      { label: "Privacy Policy", hint: "How we handle your info", to: "/privacy", icon: Shield },
    ],
  },
];

export function AccountScreen() {
  const navigate = useNavigate();
  const { user, guest, logout, hydrated, updateProfile, orders, wishlist, addresses } = useApp();
  const [editing, setEditing] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  useEffect(() => setName(user?.name ?? ""), [user?.name]);

  if (!hydrated) return <div className="shimmer m-4 h-40 rounded-[20px]" />;

  const displayName = user?.name || (guest ? "Guest" : "Welcome");
  const latest = orders[0];
  const stats = [
    { label: "Orders", value: orders.length, to: "/account/orders" as const },
    { label: "Saved", value: wishlist.length, to: "/wishlist" as const },
    { label: "Addresses", value: addresses.length, to: "/account/addresses" as const },
  ];

  return (
    <div className="pb-8">
      <div className="relative h-36 overflow-hidden bg-black">
        <img src={imageUrl(coverFor("hot-ones"), 900)} alt="" className="absolute inset-0 h-full w-full object-cover object-[80%_center]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ember via-black/55 to-black/25" />
        <h1 className="relative px-4 pt-[max(0.9rem,env(safe-area-inset-top))] font-display text-4xl text-white">Profile</h1>
      </div>

      <div className="relative z-10 -mt-10 px-4">
        <div className="sauce-card p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-fire to-flame font-display text-3xl text-white shadow-[0_0_24px_rgba(225,38,28,0.45)]">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-4xl leading-none text-cream">{displayName}</p>
              <p className="mt-1 truncate text-sm text-ash">{user?.email ?? (guest ? "Browsing as a guest" : "Sign in to save your heat")}</p>
              {user?.phone && <p className="truncate text-xs text-ash">{user.phone}</p>}
            </div>
            {user && (
              <button type="button" aria-label="Edit name" onClick={() => setEditing((open) => !open)} className="press grid h-11 w-11 place-items-center rounded-full bg-black/40 text-flame">
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>

          {user && editing && (
            <form
              className="mt-4 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                updateProfile({ name });
                setEditing(false);
              }}
            >
              <input aria-label="Display name" value={name} onChange={(event) => setName(event.target.value)} className="field" />
              <button type="submit" className="press h-[52px] shrink-0 rounded-2xl bg-gradient-to-r from-fire to-flame px-4 text-sm font-bold text-white">
                Save
              </button>
            </form>
          )}

          {!user && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <FireButton onClick={() => navigate({ to: "/login" })}>Log in</FireButton>
              <button type="button" onClick={() => navigate({ to: "/register" })} className="press h-[52px] rounded-2xl border border-flame text-sm font-bold text-flame">
                Join
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 px-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to} className="sauce-card press px-2 py-3 text-center">
            <p className="font-display text-3xl text-flame">{stat.value}</p>
            <p className="text-[11px] font-medium text-ash">{stat.label}</p>
          </Link>
        ))}
      </div>

      {latest ? (
        <Link to="/account/orders/$id" params={{ id: latest.id }} className="sauce-card press mx-4 mt-3 flex items-center gap-3 p-3">
          <SauceImage src={latest.items[0]?.image} alt="" className="h-16 w-16 shrink-0 rounded-2xl" />
          <span className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-flame">Latest order</span>
            <span className="mt-0.5 block truncate text-sm font-semibold text-cream">{latest.number}</span>
            <span className="text-xs capitalize text-ash">{latest.status} · {money(latest.total)}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ash" />
        </Link>
      ) : (
        <button type="button" onClick={() => navigate({ to: "/shop" })} className="sauce-card press mx-4 mt-3 block w-[calc(100%-2rem)] p-4 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-flame">No orders yet</p>
          <p className="font-display text-3xl text-cream">Find your first bottle</p>
        </button>
      )}

      {GROUPS.map((group) => (
        <section key={group.title} className="mt-6">
          <h2 className="mb-2 px-4 font-display text-2xl text-cream">{group.title}</h2>
          <ul className="mx-4 overflow-hidden rounded-[20px] border border-smoke bg-char">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label} className="border-t border-smoke first:border-t-0">
                  <Link to={item.to} className="press flex min-h-[64px] items-center gap-3 px-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-black/40 text-flame">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-cream">{item.label}</span>
                      <span className="block truncate text-xs text-ash">{item.hint}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ash" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p className="px-4 pt-5 text-center text-xs text-ash">
        Questions? {SUPPORT_EMAIL}
        <br />
        {SUPPORT_PHONE}
      </p>

      {(user || guest) && (
        <div className="px-4 pt-4">
          <button
            type="button"
            className="press flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-smoke text-sm font-semibold text-cream"
            onClick={() => setConfirmLogout(true)}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
      {confirmLogout && (
        <ActionSheet
          title="Log out?"
          message="You can sign back in anytime. Your cart stays on this device."
          confirmLabel="Log Out"
          onClose={() => setConfirmLogout(false)}
          onConfirm={() => {
            logout();
            setConfirmLogout(false);
            navigate({ to: "/login" });
          }}
        />
      )}
    </div>
  );
}

const FLOW = ["placed", "packed", "shipped", "delivered"] as const;

export function OrdersScreen() {
  const { orders, hydrated } = useApp();
  if (!hydrated) return <div className="shimmer m-4 h-40 rounded-[20px]" />;
  return (
    <div>
      <BackBar title="My Orders" />
      {orders.length === 0 ? (
        <p className="px-4 text-sm text-ash">No orders yet. Your first bottle is waiting.</p>
      ) : (
        <ul className="space-y-3 px-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link to="/account/orders/$id" params={{ id: order.id }} className="sauce-card block p-4">
                <div className="flex justify-between">
                  <span className="font-semibold">{order.number}</span>
                  <span className="text-flame">{money(order.total)}</span>
                </div>
                <p className="mt-1 text-xs capitalize text-ash">{order.status} · {new Date(order.createdAt).toLocaleDateString()}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function OrderDetailScreen({ id }: { id: string }) {
  const { orders } = useApp();
  const order = orders.find((item) => item.id === id);
  if (!order) {
    return (
      <div>
        <BackBar title="Order" />
        <p className="px-4 text-sm text-ash">We couldn't find that order on this device.</p>
      </div>
    );
  }
  return <OrderBody order={order} />;
}

function OrderBody({ order }: { order: Order }) {
  const active = FLOW.indexOf(order.status);
  return (
    <div>
      <BackBar title={order.number} />
      <ol className="mx-4 mb-4 grid grid-cols-4 gap-1">
        {FLOW.map((status, index) => (
          <li key={status} className="text-center">
            <span className={`mx-auto block h-2 rounded-full ${index <= active ? "nav-glow" : "bg-smoke"}`} />
            <span className="mt-1 block text-[10px] capitalize text-ash">{status}</span>
          </li>
        ))}
      </ol>
      <ul className="space-y-3 px-4">
        {order.items.map((item) => (
          <li key={item.handle} className="flex gap-3">
            <SauceImage src={item.image} alt={item.title} width={200} className="h-16 w-16 rounded-2xl" />
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm">{item.title}</p>
              <p className="text-xs text-ash">Qty {item.qty}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mx-4 mt-4 rounded-[20px] bg-char p-4 text-sm">
        <p>{order.address.name}</p>
        <p className="text-ash">{order.address.line1}, {order.address.city} {order.address.state} {order.address.zip}</p>
        <p className="mt-2 text-ash">{order.shippingLabel}</p>
        <p className="mt-2 font-semibold text-flame">{money(order.total)}</p>
      </div>
    </div>
  );
}

export function AddressesScreen() {
  const { addresses, saveAddress, removeAddress, hydrated } = useApp();
  const [form, setForm] = useState<Address>({ id: "", name: "", email: "", phone: "", line1: "", line2: "", city: "", state: "CA", zip: "", country: "United States" });
  if (!hydrated) return <div className="shimmer m-4 h-40 rounded-[20px]" />;
  return (
    <div className="px-4 pb-8">
      <BackBar title="Addresses" />
      <ul className="space-y-2">
        {addresses.map((address) => (
          <li key={address.id} className="rounded-[20px] bg-char p-3 text-sm">
            <p className="font-semibold">{address.name}</p>
            <p className="text-ash">{address.line1}, {address.city} {address.state} {address.zip}</p>
            <button type="button" onClick={() => removeAddress(address.id)} className="mt-2 text-xs text-fire">
              Remove
            </button>
          </li>
        ))}
        {addresses.length === 0 && <p className="text-sm text-ash">No saved addresses yet.</p>}
      </ul>
      <form
        className="mt-4 space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.name || !form.line1 || !form.city || !form.zip) return;
          saveAddress({ ...form, id: `ad${Date.now()}` });
          setForm({ ...form, name: "", line1: "", city: "", zip: "" });
        }}
      >
        <input aria-label="Name" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="field" />
        <input aria-label="Street" placeholder="Street" value={form.line1} onChange={(event) => setForm({ ...form, line1: event.target.value })} className="field" />
        <input aria-label="City" placeholder="City" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="field" />
        <input aria-label="ZIP" placeholder="ZIP" value={form.zip} onChange={(event) => setForm({ ...form, zip: event.target.value })} className="field" />
        <FireButton type="submit">Save Address</FireButton>
      </form>
    </div>
  );
}
