
import cors, { type CorsOptions } from "cors";

function getAllowedOrigins(): string[] {
    const configuredOrigins = process.env.FRONTEND_URL
        ?.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    return configuredOrigins?.length
        ? configuredOrigins
        : ["http://localhost:3000"];
}

const corsOptions: CorsOptions = {
    origin(origin, callback) {
        // Allow requests without an Origin header, such as server-to-server calls.
        if (!origin || getAllowedOrigins().includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error("Origin not allowed by CORS."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
};

export default cors(corsOptions);
