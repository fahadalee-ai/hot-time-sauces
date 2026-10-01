import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { clearStorage, readStorage, writeStorage } from "./storage";
import {
  seedActivity,
  seedCompliance,
  seedDocuments,
  seedFieldwork,
  seedForms,
  seedNotifications,
  seedSupervisor,
  seedTemplates,
  seedUsers,
  type ActivityItem,
  type AppDocument,
  type AppNotification,
  type ComplianceItem,
  type FieldworkEntry,
  type FormRecord,
  type FormTemplate,
  type Role,
  type SupervisionSession,
  type Supervisor,
  type User,
  seedSupervision,
} from "./mock-data";

export type Toast = { id: number; title: string; body?: string };

type Prefs = {
  "Supervision reminders": boolean;
  "Compliance deadlines": boolean;
  "Document expirations": boolean;
  "Pending approvals": boolean;
};

type Store = {
  users: User[];
  user: User | null;
  onboarded: boolean;
  markOnboarded: () => void;
  login: (email: string, password: string) => { ok: true } | { ok: false; reason: "invalid" | "admin" };
  register: (input: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bacbNumber?: string;
    password: string;
    role: Role;
  }) => { ok: true; email: string } | { ok: false; reason: "exists" };
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
  supervisor: Supervisor;
  fieldwork: FieldworkEntry[];
  addFieldwork: (entry: Omit<FieldworkEntry, "id" | "status">) => void;
  updateFieldwork: (id: string, patch: Partial<FieldworkEntry>) => void;
  removeFieldwork: (id: string) => void;
  supervision: SupervisionSession[];
  addSupervision: (entry: Omit<SupervisionSession, "id">) => void;
  compliance: ComplianceItem[];
  toggleRemind: (id: string) => void;
  documents: AppDocument[];
  addDocument: (doc: Omit<AppDocument, "id" | "status" | "uploadedAt"> & { status?: AppDocument["status"] }) => void;
  replaceDocument: (id: string, name: string) => void;
  removeDocument: (id: string) => void;
  templates: FormTemplate[];
  forms: FormRecord[];
  submitForm: (record: Omit<FormRecord, "id" | "status" | "submittedAt">) => void;
  notifications: AppNotification[];
  markAllRead: () => void;
  markNotificationRead: (id: string) => void;
  activity: ActivityItem[];
  prefs: Prefs;
  togglePref: (key: keyof Prefs) => void;
  toasts: Toast[];
  pushToast: (title: string, body?: string) => void;
  dismissToast: (id: number) => void;
};

const Ctx = createContext<Store | null>(null);

const DEFAULT_PREFS: Prefs = {
  "Supervision reminders": true,
  "Compliance deadlines": true,
  "Document expirations": true,
  "Pending approvals": true,
};

function loadSessionUser(users: User[]): User | null {
  const id = readStorage("session");
  if (!id) return null;
  return users.find((u) => u.id === id) ?? null;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [user, setUser] = useState<User | null>(() => loadSessionUser(seedUsers));
  const [onboarded, setOnboarded] = useState(() => readStorage("onboarded") === "1");
  const [fieldwork, setFieldwork] = useState(seedFieldwork);
  const [supervision, setSupervision] = useState(seedSupervision);
  const [compliance, setCompliance] = useState(seedCompliance);
  const [documents, setDocuments] = useState(seedDocuments);
  const [forms, setForms] = useState(seedForms);
  const [notifications, setNotifications] = useState(seedNotifications);
  const [activity, setActivity] = useState(seedActivity);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const value = useMemo<Store>(() => {
    const pushToast = (title: string, body?: string) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, title, body }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
    };

    return {
      users,
      user,
      onboarded,
      markOnboarded: () => {
        setOnboarded(true);
        writeStorage("onboarded", "1");
      },
      login: (email, password) => {
        const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!found || found.password !== password) return { ok: false, reason: "invalid" };
        if (found.role === "admin") return { ok: false, reason: "admin" };
        setUser(found);
        writeStorage("session", found.id);
        writeStorage("onboarded", "1");
        setOnboarded(true);
        return { ok: true };
      },
      register: (input) => {
        if (users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) {
          return { ok: false, reason: "exists" };
        }
        const created: User = {
          id: `u${Date.now()}`,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email: input.email.trim().toLowerCase(),
          phone: input.phone.trim(),
          password: input.password,
          role: input.role,
          bacbNumber: input.bacbNumber?.trim() || undefined,
        };
        setUsers((list) => [...list, created]);
        writeStorage("onboarded", "1");
        setOnboarded(true);
        return { ok: true, email: created.email };
      },
      logout: () => {
        setUser(null);
        clearStorage("session");
      },
      updateUser: (patch) => {
        if (!user) return;
        const next = { ...user, ...patch };
        setUser(next);
        setUsers((list) => list.map((u) => (u.id === next.id ? next : u)));
      },
      supervisor: seedSupervisor,
      fieldwork,
      addFieldwork: (entry) => {
        const next: FieldworkEntry = { ...entry, id: `fw${Date.now()}`, status: "pending" };
        setFieldwork((list) => [next, ...list]);
        setActivity((list) => [
          { id: `a${Date.now()}`, text: `Fieldwork logged — ${entry.hours.toFixed(1)} hrs`, time: "Just now", tone: "orange" },
          ...list,
        ]);
        pushToast("Fieldwork entry saved");
      },
      updateFieldwork: (id, patch) => setFieldwork((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e))),
      removeFieldwork: (id) => setFieldwork((list) => list.filter((e) => e.id !== id)),
      supervision,
      addSupervision: (entry) => {
        setSupervision((list) => [{ ...entry, id: `sv${Date.now()}` }, ...list]);
        pushToast(entry.status === "requested" ? "Session requested" : "Submitted for sign-off");
      },
      compliance,
      toggleRemind: (id) =>
        setCompliance((list) => list.map((c) => (c.id === id ? { ...c, remind: !c.remind } : c))),
      documents,
      addDocument: (doc) => {
        const next: AppDocument = {
          ...doc,
          id: `doc${Date.now()}`,
          status: doc.status ?? "pending",
          uploadedAt: new Date().toISOString().slice(0, 10),
        };
        setDocuments((list) => [next, ...list]);
        if (doc.category) {
          setCompliance((list) =>
            list.map((c) =>
              c.category === doc.category
                ? { ...c, documentId: next.id, status: "current", detail: "Pending review" }
                : c,
            ),
          );
        }
        pushToast("Document submitted");
      },
      replaceDocument: (id, name) => {
        setDocuments((list) => list.map((d) => (d.id === id ? { ...d, name, status: "pending" } : d)));
        pushToast("Document resubmitted");
      },
      removeDocument: (id) => setDocuments((list) => list.filter((d) => d.id !== id)),
      templates: seedTemplates,
      forms,
      submitForm: (record) => {
        const next: FormRecord = {
          ...record,
          id: `f${Date.now()}`,
          status: "pending",
          submittedAt: new Date().toISOString().slice(0, 10),
        };
        setForms((list) => [next, ...list.filter((f) => f.templateId !== record.templateId || f.status !== "todo")]);
        pushToast("Form submitted");
      },
      notifications,
      markAllRead: () => setNotifications((list) => list.map((n) => ({ ...n, read: true }))),
      markNotificationRead: (id) =>
        setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n))),
      activity,
      prefs,
      togglePref: (key) => setPrefs((p) => ({ ...p, [key]: !p[key] })),
      toasts,
      pushToast,
      dismissToast: (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    };
  }, [
    users,
    user,
    onboarded,
    fieldwork,
    supervision,
    compliance,
    documents,
    forms,
    notifications,
    activity,
    prefs,
    toasts,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
