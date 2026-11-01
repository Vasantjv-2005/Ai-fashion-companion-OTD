import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

const mocks = vi.hoisted(() => ({
    convCreate: vi.fn(),
    convFind: vi.fn(),
    convFindOne: vi.fn(),
    convFindOneAndUpdate: vi.fn(),
    saveMessage: vi.fn(),
    extractAndStoreMemory: vi.fn(),
    getConversationHistory: vi.fn(),
    wardrobeCountDocuments: vi.fn(),
}));

vi.mock("../../src/models/AIConversation", () => ({
    default: {
        create: mocks.convCreate,
        find: mocks.convFind,
        findOne: mocks.convFindOne,
        findOneAndUpdate: mocks.convFindOneAndUpdate,
    },
}));

vi.mock("../../src/models/WardrobeItem", () => ({
    default: {
        countDocuments: mocks.wardrobeCountDocuments,
    },
}));

vi.mock("../../src/modules/ai/ai-memory.service", () => ({
    saveMessage: mocks.saveMessage,
    extractAndStoreMemory: mocks.extractAndStoreMemory,
    getConversationHistory: mocks.getConversationHistory,
}));

import {
    createConversation,
    sendChatMessage,
    deleteConversation,
    AIServiceError,
} from "../../src/modules/ai/ai.service";

const TEST_USER_ID = "507f1f77bcf86cd799439011";
const TEST_CONV_ID = "507f1f77bcf86cd799439012";

describe("AI service unit tests", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        delete process.env.AI_SERVICE_URL;
    });

    describe("createConversation", () => {
        it("should create conversation with default title if omitted", async () => {
            const mockConv = {
                _id: new mongoose.Types.ObjectId(TEST_CONV_ID),
                userId: new mongoose.Types.ObjectId(TEST_USER_ID),
                title: "New stylist consultation",
                status: "active",
            };

            mocks.convCreate.mockResolvedValue({
                toObject: () => mockConv,
            });

            const result = await createConversation(TEST_USER_ID);
            expect(result.title).toBe("New stylist consultation");
            expect(mocks.convCreate).toHaveBeenCalled();
        });
    });

    describe("sendChatMessage", () => {
        it("should process chat message and use honest heuristics when AI_SERVICE_URL is unset", async () => {
            const mockConv = {
                _id: new mongoose.Types.ObjectId(TEST_CONV_ID),
                userId: new mongoose.Types.ObjectId(TEST_USER_ID),
            };

            mocks.convFindOne.mockReturnValue({
                exec: vi.fn().mockResolvedValue(mockConv),
            });

            mocks.saveMessage.mockImplementation((_u, _c, role, content) =>
                Promise.resolve({
                    id: "msg123",
                    role,
                    content,
                }),
            );

            mocks.extractAndStoreMemory.mockResolvedValue([]);
            mocks.wardrobeCountDocuments.mockReturnValue({
                exec: vi.fn().mockResolvedValue(12),
            });

            const result = await sendChatMessage(TEST_USER_ID, {
                conversationId: TEST_CONV_ID,
                content: "What should I wear for dinner?",
            });

            expect(result.conversationId).toBe(TEST_CONV_ID);
            expect(result.message.role).toBe("assistant");
            expect(result.message.content).toContain("12 pieces");
            expect(result.message.content).toContain("External AI model provider is currently unconfigured");
            expect(mocks.extractAndStoreMemory).toHaveBeenCalledWith(
                TEST_USER_ID,
                "What should I wear for dinner?",
            );
        });

        it("should throw 404 when existing conversationId does not belong to user", async () => {
            mocks.convFindOne.mockReturnValue({
                exec: vi.fn().mockResolvedValue(null),
            });

            await expect(
                sendChatMessage(TEST_USER_ID, {
                    conversationId: TEST_CONV_ID,
                    content: "Hello",
                }),
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Conversation not found or access denied.",
            });
        });
    });

    describe("deleteConversation", () => {
        it("should archive conversation", async () => {
            mocks.convFindOneAndUpdate.mockReturnValue({
                exec: vi.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(TEST_CONV_ID) }),
            });

            const result = await deleteConversation(TEST_USER_ID, TEST_CONV_ID);
            expect(result.success).toBe(true);
        });

        it("should throw 404 when conversation not found", async () => {
            mocks.convFindOneAndUpdate.mockReturnValue({
                exec: vi.fn().mockResolvedValue(null),
            });

            await expect(deleteConversation(TEST_USER_ID, TEST_CONV_ID)).rejects.toMatchObject({
                statusCode: 404,
                message: "Conversation not found.",
            });
        });
    });
});

