import type { Firestore } from "firebase/firestore";
import { getFirebaseWebConfig } from "./firebase-config.functions";

let dbPromise: Promise<Firestore> | null = null;

/** Lazily initialises Firebase (Firestore only) in the browser. */
export function getDb(): Promise<Firestore> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const [{ initializeApp, getApps, getApp }, { getFirestore }, keys] = await Promise.all([
        import("firebase/app"),
        import("firebase/firestore"),
        getFirebaseWebConfig(),
      ]);
      if (!keys.apiKey) throw new Error("Firebase API key is not configured.");
      const firebaseConfig = {
        apiKey: keys.apiKey,
        authDomain: import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"],
        projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"],
        storageBucket: import.meta.env["VITE_FIREBASE_STORAGE_BUCKET"],
        messagingSenderId: import.meta.env["VITE_FIREBASE_MESSAGING_SENDER_ID"],
        appId: import.meta.env["VITE_FIREBASE_APP_ID"],
        ...(keys.measurementId ? { measurementId: keys.measurementId } : {}),
      };
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      return getFirestore(app);
    })().catch((e) => {
      dbPromise = null;
      throw e;
    });
  }
  return dbPromise;
}
