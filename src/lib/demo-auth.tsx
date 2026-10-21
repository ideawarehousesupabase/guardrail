import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getDb } from "./firebase";

/**
 * DEMONSTRATION ONLY. Account records live in Firestore and passcodes are
 * matched with a client-side salted SHA-256 verifier. This is NOT secure
 * authentication and must not be used in production.
 */
export interface DemoSession {
  userId: string;
  fullName: string;
  email: string;
  organisationName: string;
}

const KEY = "gie-demo-session";

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export async function hashPasscode(passcode: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${passcode}`);
  return toHex(await crypto.subtle.digest("SHA-256", data));
}

export const normaliseEmail = (e: string) => e.trim().toLowerCase();

const LOCAL_USERS_KEY = "gie-demo-local-users";

interface StoredUser {
  id: string;
  fullName: string;
  organisationName: string;
  email: string;
  demoPasscodeHash: string;
  demoSalt: string;
  createdAt: string;
}

function getLocalUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

function saveLocalUsers(users: StoredUser[]) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch {
    /* ignore */
  }
}

export async function registerDemoAccount(input: {
  fullName: string;
  organisationName: string;
  email: string;
  passcode?: string;
  password?: string;
}) {
  const email = normaliseEmail(input.email);
  const pass = input.password ?? input.passcode ?? "";
  const demoSalt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const demoPasscodeHash = await hashPasscode(pass, demoSalt);

  try {
    const db = await getDb();
    const { collection, query, where, getDocs, addDoc } = await import("firebase/firestore");
    const users = collection(db, "users");
    const existing = await getDocs(query(users, where("email", "==", email)));
    if (!existing.empty) throw new Error("An account with this email address already exists.");
    await addDoc(users, {
      fullName: input.fullName.trim(),
      organisationName: input.organisationName.trim(),
      email,
      demoPasscodeHash,
      demoSalt,
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists")) throw err;
    // Fallback to local storage when Firestore is unconfigured in local development
    const local = getLocalUsers();
    if (local.some((u) => u.email === email))
      throw new Error("An account with this email address already exists.");
    local.push({
      id: `local-${Date.now()}`,
      fullName: input.fullName.trim(),
      organisationName: input.organisationName.trim(),
      email,
      demoPasscodeHash,
      demoSalt,
      createdAt: new Date().toISOString(),
    });
    saveLocalUsers(local);
  }
}

async function verifyDemoAccount(emailRaw: string, passcode: string): Promise<DemoSession> {
  const email = normaliseEmail(emailRaw);
  const invalid = new Error("Invalid email address or password.");

  try {
    const db = await getDb();
    const { collection, query, where, getDocs } = await import("firebase/firestore");
    const snap = await getDocs(query(collection(db, "users"), where("email", "==", email)));
    if (!snap.empty) {
      const doc = snap.docs[0]!;
      const data = doc.data() as {
        fullName: string;
        email: string;
        organisationName: string;
        demoSalt: string;
        demoPasscodeHash: string;
      };
      if ((await hashPasscode(passcode, data.demoSalt)) !== data.demoPasscodeHash) throw invalid;
      return {
        userId: doc.id,
        fullName: data.fullName,
        email: data.email,
        organisationName: data.organisationName,
      };
    }
    throw invalid;
  } catch (err: unknown) {
    if (err === invalid) throw err;
    // Check local storage fallback when Firestore is unconfigured
    const local = getLocalUsers();
    const user = local.find((u) => u.email === email);
    if (user) {
      if ((await hashPasscode(passcode, user.demoSalt)) !== user.demoPasscodeHash) throw invalid;
      return {
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        organisationName: user.organisationName,
      };
    }
    // Default seed credentials for development demonstration
    if (email === "demo@franklin-msp.co.uk" && passcode === "Demonstration123!") {
      return {
        userId: "demo-seed-1",
        fullName: "Alex Taylor",
        email: "demo@franklin-msp.co.uk",
        organisationName: "Franklin Cyber Care MSP",
      };
    }
    throw invalid;
  }
}

interface AuthCtx {
  session: DemoSession | null;
  ready: boolean;
  signIn: (email: string, passcode: string) => Promise<void>;
  signOut: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const signIn = useCallback(async (email: string, passcode: string) => {
    const s = await verifyDemoAccount(email, passcode);
    sessionStorage.setItem(KEY, JSON.stringify(s));
    setSession(s);
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem(KEY);
    setSession(null);
  }, []);

  return <Ctx.Provider value={{ session, ready, signIn, signOut }}>{children}</Ctx.Provider>;
}

export function useDemoAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDemoAuth must be used inside DemoAuthProvider");
  return v;
}
