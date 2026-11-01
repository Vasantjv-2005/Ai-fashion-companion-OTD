"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const events_controller_1 = require("./events.controller");
const router = (0, express_1.Router)();
// Require authentication for all event endpoints.
router.use(auth_middleware_1.authMiddleware);
// Create an event.
router.post("/", events_controller_1.createEventController);
// List the authenticated user's events.
router.get("/", events_controller_1.getEventsController);
// Get one event by ID.
router.get("/:id", events_controller_1.getEventByIdController);
// Update an event.
router.patch("/:id", events_controller_1.updateEventController);
// Delete an event.
router.delete("/:id", events_controller_1.deleteEventController);
exports.default = router;
