import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { email } = JSON.parse(event.body || "{}");

        if (!email) {
            return { statusCode: 400, body: "Email is required" };
        }

        const adminEmails = (process.env.ADMIN_EMAILS || "")
            .split(',')
            .map(e => e.trim())
            .filter(e => e.length > 0);

        const isAdmin = adminEmails.includes(email);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isAdmin }),
        };
    } catch (error) {
        return { statusCode: 400, body: "Invalid Request" };
    }
};
