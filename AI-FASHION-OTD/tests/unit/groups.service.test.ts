import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

const mocks = vi.hoisted(() => ({
    groupEventSave: vi.fn(),
    groupEventFind: vi.fn(),
    groupEventFindById: vi.fn(),
    groupEventFindOne: vi.fn(),
    groupEventCountDocuments: vi.fn(),
    memberCreate: vi.fn(),
    memberFind: vi.fn(),
    memberFindOneAndUpdate: vi.fn(),
    pollCreate: vi.fn(),
    optionInsertMany: vi.fn(),
}));

vi.mock("../../src/models/GroupEvent", () => {
    class MockGroupEvent {
        [key: string]: unknown;
        constructor(data: Record<string, unknown>) {
            Object.assign(this, data);
            this._id = new mongoose.Types.ObjectId();
        }
        save = mocks.groupEventSave;
        toObject = vi.fn().mockImplementation(function (this: any) {
            return { ...this };
        });
    }

    return {
        default: Object.assign(MockGroupEvent, {
            find: mocks.groupEventFind,
            findById: mocks.groupEventFindById,
            findOne: mocks.groupEventFindOne,
            countDocuments: mocks.groupEventCountDocuments,
        }),
    };
});

vi.mock("../../src/models/GroupEventMember", () => ({
    default: {
        create: mocks.memberCreate,
        find: mocks.memberFind,
        findOneAndUpdate: mocks.memberFindOneAndUpdate,
    },
}));

vi.mock("../../src/models/OutfitPoll", () => ({
    default: {
        create: mocks.pollCreate,
    },
}));

vi.mock("../../src/models/OutfitPollOption", () => ({
    default: {
        insertMany: mocks.optionInsertMany,
    },
}));

vi.mock("../../src/models/OutfitPollVote", () => ({
    default: {
        find: vi.fn(),
        create: vi.fn(),
    },
}));

import {
    createGroupEvent,
    getGroupEvents,
    getGroupEventById,
    updateMemberRsvp,
    createPoll,
    GroupServiceError,
} from "../../src/modules/groups/groups.service";

const TEST_USER_ID = "507f1f77bcf86cd799439011";
const TEST_EVENT_ID = "507f1f77bcf86cd799439012";

describe("Groups service unit tests", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("createGroupEvent", () => {
        it("should save event and add creator as organizer member", async () => {
            mocks.groupEventSave.mockResolvedValue(true);
            mocks.memberCreate.mockResolvedValue({});

            const result = await createGroupEvent(TEST_USER_ID, {
                title: "Fashion Week Brunch",
                description: "Annual fashion brunch",
                eventType: "party",
                startsAt: new Date(),
                endsAt: undefined,
                location: "Downtown Cafe",
                dressCode: "smart-casual",
                visibility: "invite-only",
                maxMembers: 20,
            });

            expect(result.title).toBe("Fashion Week Brunch");
            expect(mocks.groupEventSave).toHaveBeenCalled();
            expect(mocks.memberCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    role: "organizer",
                    status: "accepted",
                    rsvp: "attending",
                }),
            );
        });
    });

    describe("getGroupEvents", () => {
        it("should return events where user is creator or member", async () => {
            mocks.memberFind.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    lean: vi.fn().mockReturnValue({
                        exec: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            mocks.groupEventFind.mockReturnValue({
                sort: vi.fn().mockReturnValue({
                    skip: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                            lean: vi.fn().mockReturnValue({
                                exec: vi.fn().mockResolvedValue([
                                    { title: "Brunch", creatorId: new mongoose.Types.ObjectId(TEST_USER_ID) },
                                ]),
                            }),
                        }),
                    }),
                }),
            });

            mocks.groupEventCountDocuments.mockReturnValue({
                exec: vi.fn().mockResolvedValue(1),
            });

            const result = await getGroupEvents(TEST_USER_ID);
            expect(result.events.length).toBe(1);
            expect(result.pagination.total).toBe(1);
        });
    });

    describe("updateMemberRsvp", () => {
        it("should update rsvp to attending", async () => {
            const updatedMember = {
                groupEventId: new mongoose.Types.ObjectId(TEST_EVENT_ID),
                userId: new mongoose.Types.ObjectId(TEST_USER_ID),
                rsvp: "attending",
                status: "accepted",
            };

            mocks.memberFindOneAndUpdate.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(updatedMember),
                }),
            });

            const result = await updateMemberRsvp(TEST_USER_ID, TEST_EVENT_ID, "attending");
            expect(result.rsvp).toBe("attending");
        });

        it("should throw 404 if membership record not found", async () => {
            mocks.memberFindOneAndUpdate.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(null),
                }),
            });

            await expect(
                updateMemberRsvp(TEST_USER_ID, TEST_EVENT_ID, "attending"),
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Membership record not found.",
            });
        });
    });

    describe("createPoll", () => {
        it("should create poll and insert options", async () => {
            const mockPoll = {
                _id: new mongoose.Types.ObjectId(),
                creatorId: new mongoose.Types.ObjectId(TEST_USER_ID),
                title: "Which outfit for Saturday?",
                toObject: () => ({
                    _id: "poll123",
                    title: "Which outfit for Saturday?",
                }),
            };

            mocks.pollCreate.mockResolvedValue(mockPoll);
            mocks.optionInsertMany.mockResolvedValue([
                { label: "Option A", position: 0 },
                { label: "Option B", position: 1 },
            ]);

            const result = await createPoll(TEST_USER_ID, {
                title: "Which outfit for Saturday?",
                description: "Help me pick an outfit",
                visibility: "public",
                allowMultipleVotes: false,
                endsAt: undefined,
                options: [{ label: "Option A" }, { label: "Option B" }],
            });

            expect(result.title).toBe("Which outfit for Saturday?");
            expect(result.options.length).toBe(2);
            expect(mocks.optionInsertMany).toHaveBeenCalled();
        });
    });
});
