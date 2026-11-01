import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
    createGroupEventController,
    getGroupEventsController,
    getGroupEventByIdController,
    updateGroupEventController,
    updateRsvpController,
    createPollController,
    getPollByIdController,
    voteOnPollController,
} from "./groups.controller";

const router = Router();

router.use(authMiddleware);

// Polls routes (mounted before :id)
router.post("/polls", createPollController);
router.get("/polls/:pollId", getPollByIdController);
router.post("/polls/:pollId/vote", voteOnPollController);

// Group Events routes
router.post("/", createGroupEventController);
router.get("/", getGroupEventsController);
router.get("/:id", getGroupEventByIdController);
router.patch("/:id", updateGroupEventController);
router.post("/:id/rsvp", updateRsvpController);

export default router;

