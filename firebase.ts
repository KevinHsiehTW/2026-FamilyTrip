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
        const config = {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID
        };

        if (!config.apiKey) {
            console.warn("Firebase config missing. Running in offline/demo mode.");
            return { db: null, auth: null, googleProvider: null };
        }

        if (!getApps().length) {
            app = initializeApp(config);
        } else {
            app = getApp();
        }

        db = getFirestore(app);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();

        console.log("Firebase initialized successfully");
        return { db, auth, googleProvider };
    } catch (error) {
        console.warn("Firebase initialization failed:", error);
        return { db: null, auth: null, googleProvider: null };
    }
};

export { db, auth, googleProvider };