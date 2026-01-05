import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";

// --- INITIALIZATION ---

let app: any;
let db: Firestore | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

export const initializeFirebase = async () => {
    // If already initialized, return existing instances
    if (app) return { db, auth, googleProvider };

    try {
        // Fetch config from backend function
        const response = await fetch('/.netlify/functions/get-config');
        if (!response.ok) throw new Error('Failed to fetch config');

        const config = await response.json();

        if (!getApps().length) {
            app = initializeApp(config);
        } else {
            app = getApp();
        }

        db = getFirestore(app);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();

        console.log("Firebase initialized successfully via BFF");
        return { db, auth, googleProvider };
    } catch (error) {
        console.warn("Firebase initialization failed (Network or Config error):", error);
        // Return nulls so app can still render in "Offline/Demo" mode if needed
        return { db: null, auth: null, googleProvider: null };
    }
};

export { db, auth, googleProvider };