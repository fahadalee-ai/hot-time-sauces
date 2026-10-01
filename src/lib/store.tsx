import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getProduct } from "./catalog";
import { discountFor, lookupPromo, type Promo } from "./format";
import { readJson, readString, removeKey, writeJson, writeString } from "./storage";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  deals: boolean;
};

export type CartLine = {
  id: string;
  handle: string;
  variantId: string;
  qty: number;
};

export type Address = {
  id: string;
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type OrderItem = {
  handle: string;
  title: string;
  brand: string;
  variant: string;
  qty: number;
  price: number;
  image: string;
};

export type Order = {
  id: string;
  number: string;
  createdAt: string;
  email: string;
  items: OrderItem[];
  address: Address;
  shippingLabel: string;
  shippingCost: number;
  discount: number;
  subtotal: number;
  total: number;
  paymentLast4: string;
  status: "placed" | "packed" | "shipped" | "delivered";
};

export type Fly = { id: number; src: string; x: number; y: number; size: number };

type Toast = { id: number; text: string };

type Store = {
  hydrated: boolean;
  user: User | null;
  guest: boolean;
  onboarded: boolean;
  cart: CartLine[];
  wishlist: string[];
  orders: Order[];
  addresses: Address[];
  recentSearches: string[];
  promo: Promo;
  promoError: string;
  toasts: Toast[];
  fly: Fly | null;
  cartCount: number;
  subtotal: number;
  discount: number;
  markOnboarded: () => void;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  register: (input: Omit<User, "id">) => Promise<{ ok: true } | { ok: false; message: string }>;
  continueAsGuest: () => void;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<User, "name" | "phone">>) => void;
  addToCart: (handle: string, variantId: string, qty?: number, fly?: Omit<Fly, "id">) => void;
  setQty: (id: string, qty: number) => void;
  removeLine: (id: string) => void;
  toggleWish: (handle: string) => void;
  wished: (handle: string) => boolean;
  moveWishToCart: (handle: string) => void;
  rememberSearch: (q: string) => void;
  clearSearches: () => void;
  applyPromo: (code: string) => void;
  clearPromo: () => void;
  saveAddress: (address: Address) => void;
  removeAddress: (id: string) => void;
  placeOrder: (order: Omit<Order, "id" | "number" | "createdAt" | "status">) => Order;
  notifyBack: (handle: string) => void;
  pushToast: (text: string) => void;
  clearFly: () => void;
};

const Ctx = createContext<Store | null>(null);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [guest, setGuest] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [promo, setPromo] = useState<Promo>(null);
  const [promoError, setPromoError] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [fly, setFly] = useState<Fly | null>(null);

  useEffect(() => {
    setUsers(readJson<User[]>("hts.users", []));
    setUser(readJson<User | null>("hts.user", null));
    setGuest(readString("hts.guest") === "1");
    setOnboarded(readString("hts.onboarded") === "1");
    setCart(readJson<CartLine[]>("hts.cart", []));
    setWishlist(readJson<string[]>("hts.wishlist", []));
    setOrders(readJson<Order[]>("hts.orders", []));
    setAddresses(readJson<Address[]>("hts.addresses", []));
    setRecentSearches(readJson<string[]>("hts.searches", []));
    const savedPromo = readString("hts.promo");
    if (savedPromo) setPromo(lookupPromo(savedPromo));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeJson("hts.users", users);
    writeJson("hts.user", user);
    writeJson("hts.cart", cart);
    writeJson("hts.wishlist", wishlist);
    writeJson("hts.orders", orders);
    writeJson("hts.addresses", addresses);
    writeJson("hts.searches", recentSearches);
    if (guest) writeString("hts.guest", "1");
    else removeKey("hts.guest");
    if (onboarded) writeString("hts.onboarded", "1");
    if (promo) writeString("hts.promo", promo.code);
    else removeKey("hts.promo");
  }, [hydrated, users, user, guest, onboarded, cart, wishlist, orders, addresses, recentSearches, promo]);

  const pushToast = (text: string) => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, text }]);
    setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), 2600);
  };

  const subtotal = cart.reduce((sum, line) => {
    const product = getProduct(line.handle);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    return sum + (variant?.price ?? product?.price ?? 0) * line.qty;
  }, 0);
  const discount = discountFor(subtotal, promo);
  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0);

  const value = useMemo<Store>(
    () => ({
      hydrated,
      user,
      guest,
      onboarded,
      cart,
      wishlist,
      orders,
      addresses,
      recentSearches,
      promo,
      promoError,
      toasts,
      fly,
      cartCount,
      subtotal,
      discount,
      markOnboarded: () => setOnboarded(true),
      login: async (email, password) => {
        await wait(400);
        const clean = email.trim().toLowerCase();
        const found = clean ? users.find((entry) => entry.email.toLowerCase() === clean) : undefined;
        const session: User = found
          ? { ...found, password: password || found.password }
          : {
              id: `u${Date.now()}`,
              name: clean ? clean.split("@")[0] : "Heat Seeker",
              email: clean || "fan@hottimesauces.demo",
              phone: "",
              password,
              deals: false,
            };
        if (!found) setUsers((list) => [...list, session]);
        setUser(session);
        setGuest(false);
        setOnboarded(true);
        return { ok: true };
      },
      register: async (input) => {
        await wait(400);
        const email = input.email.trim().toLowerCase();
        const existing = email ? users.find((entry) => entry.email.toLowerCase() === email) : undefined;
        const created: User = {
          id: existing?.id ?? `u${Date.now()}`,
          name: input.name.trim() || "Heat Seeker",
          email: email || "fan@hottimesauces.demo",
          phone: input.phone.trim(),
          password: input.password,
          deals: input.deals,
        };
        setUsers((list) => (existing ? list.map((entry) => (entry.id === created.id ? created : entry)) : [...list, created]));
        setUser(created);
        setGuest(false);
        setOnboarded(true);
        return { ok: true };
      },
      continueAsGuest: () => {
        setGuest(true);
        setOnboarded(true);
      },
      logout: () => {
        setUser(null);
        setGuest(false);
      },
      updateProfile: (patch) => {
        if (!user) return;
        const next = { ...user, ...patch };
        setUser(next);
        setUsers((list) => list.map((entry) => (entry.id === next.id ? next : entry)));
      },
      addToCart: (handle, variantId, qty = 1, flyFrom) => {
        const product = getProduct(handle);
        if (!product?.available) return;
        const id = `${handle}::${variantId}`;
        setCart((lines) => {
          const existing = lines.find((line) => line.id === id);
          if (existing) return lines.map((line) => (line.id === id ? { ...line, qty: Math.min(10, line.qty + qty) } : line));
          return [...lines, { id, handle, variantId, qty }];
        });
        if (flyFrom) setFly({ ...flyFrom, id: Date.now() });
        pushToast("Added to cart");
      },
      setQty: (id, qty) => {
        if (qty <= 0) setCart((lines) => lines.filter((line) => line.id !== id));
        else setCart((lines) => lines.map((line) => (line.id === id ? { ...line, qty: Math.min(10, qty) } : line)));
      },
      removeLine: (id) => setCart((lines) => lines.filter((line) => line.id !== id)),
      toggleWish: (handle) => {
        setWishlist((list) => (list.includes(handle) ? list.filter((item) => item !== handle) : [handle, ...list]));
      },
      wished: (handle) => wishlist.includes(handle),
      moveWishToCart: (handle) => {
        const product = getProduct(handle);
        const variant = product?.variants.find((v) => v.available) ?? product?.variants[0];
        if (!product || !variant || !product.available) return;
        const id = `${handle}::${variant.id}`;
        setCart((lines) => {
          const existing = lines.find((line) => line.id === id);
          if (existing) return lines.map((line) => (line.id === id ? { ...line, qty: Math.min(10, line.qty + 1) } : line));
          return [...lines, { id, handle, variantId: variant.id, qty: 1 }];
        });
        setWishlist((list) => list.filter((item) => item !== handle));
        pushToast("Moved to cart");
      },
      rememberSearch: (q) => {
        const term = q.trim();
        if (term.length < 2) return;
        setRecentSearches((list) => [term, ...list.filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(0, 8));
      },
      clearSearches: () => setRecentSearches([]),
      applyPromo: (code) => {
        const found = lookupPromo(code);
        if (!found) {
          setPromo(null);
          setPromoError("That code isn't recognized.");
          return;
        }
        setPromo(found);
        setPromoError("");
        pushToast(`${found.code} applied`);
      },
      clearPromo: () => {
        setPromo(null);
        setPromoError("");
      },
      saveAddress: (address) => {
        setAddresses((list) => {
          const without = list.filter((item) => item.id !== address.id);
          return [address, ...without].slice(0, 6);
        });
      },
      removeAddress: (id) => setAddresses((list) => list.filter((item) => item.id !== id)),
      placeOrder: (draft) => {
        const order: Order = {
          ...draft,
          id: `o${Date.now()}`,
          number: `HTS-${Date.now().toString().slice(-8)}`,
          createdAt: new Date().toISOString(),
          status: "placed",
        };
        setOrders((list) => [order, ...list]);
        setCart([]);
        setPromo(null);
        return order;
      },
      notifyBack: (handle) => {
        const current = readJson<string[]>("hts.notify", []);
        if (!current.includes(handle)) writeJson("hts.notify", [...current, handle]);
        pushToast("We'll ping you when it's back.");
      },
      pushToast,
      clearFly: () => setFly(null),
    }),
    [
      hydrated,
      user,
      guest,
      onboarded,
      cart,
      wishlist,
      orders,
      addresses,
      recentSearches,
      promo,
      promoError,
      toasts,
      fly,
      cartCount,
      subtotal,
      discount,
      users,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
