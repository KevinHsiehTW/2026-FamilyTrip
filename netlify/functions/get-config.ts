import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event, context) => {
    // Return only the public variables needed for Firebase initialization
    const config = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
    };

    // Check if critical config is missing
    if (!config.apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server configuration missing" }),
        };
    }

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
    };
};
