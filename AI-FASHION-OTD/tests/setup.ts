import { afterEach, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-access-secret-minimum-32-characters-long-key-for-testing";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret-minimum-32-characters-long-key-for-testing";
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ai_fashion_test";

afterEach(() => {
    vi.clearAllMocks();
});
