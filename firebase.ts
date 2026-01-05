import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";

// --- CONFIGURATION ---
// TODO: Replace with your actual Firebase Project Config
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
let app;
let db: Firestore | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

// Only initialize if the API key is present in environment variables.
const isConfigured = !!firebaseConfig.apiKey;

if (isConfigured) {
    try {
        if (!getApps().length) {
            app = initializeApp(firebaseConfig);
        } else {
            app = getApp();
        }
        db = getFirestore(app);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
    } catch (error) {
        console.warn("Firebase initialization failed:", error);
    }
} else {
    console.warn("Firebase config not set. Running in Demo/Mock mode.");
}

export { db, auth, googleProvider };