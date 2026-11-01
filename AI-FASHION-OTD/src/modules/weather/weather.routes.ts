import { Router } from "express";
import { getWeatherController } from "./weather.controller";

const router = Router();

// Retrieve current weather and clothing recommendation
router.get("/", getWeatherController);

export default router;

