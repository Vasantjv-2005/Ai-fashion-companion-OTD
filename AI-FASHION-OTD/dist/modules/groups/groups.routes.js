"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const groups_controller_1 = require("./groups.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Polls routes (mounted before :id)
router.post("/polls", groups_controller_1.createPollController);
router.get("/polls/:pollId", groups_controller_1.getPollByIdController);
router.post("/polls/:pollId/vote", groups_controller_1.voteOnPollController);
// Group Events routes
router.post("/", groups_controller_1.createGroupEventController);
router.get("/", groups_controller_1.getGroupEventsController);
router.get("/:id", groups_controller_1.getGroupEventByIdController);
router.patch("/:id", groups_controller_1.updateGroupEventController);
router.post("/:id/rsvp", groups_controller_1.updateRsvpController);
exports.default = router;
