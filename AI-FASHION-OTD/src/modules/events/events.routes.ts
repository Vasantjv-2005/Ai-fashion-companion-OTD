import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
    createEventController,
    getEventsController,
    getEventByIdController,
    updateEventController,
    deleteEventController,
} from "./events.controller";

const router = Router();

// Require authentication for all event endpoints.
router.use(authMiddleware);

// Create an event.
router.post("/", createEventController);

// List the authenticated user's events.
router.get("/", getEventsController);

// Get one event by ID.
router.get("/:id", getEventByIdController);

// Update an event.
router.patch("/:id", updateEventController);

// Delete an event.
router.delete("/:id", deleteEventController);

export default router;
