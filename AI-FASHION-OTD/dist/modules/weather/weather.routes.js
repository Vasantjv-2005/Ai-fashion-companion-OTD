"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const weather_controller_1 = require("./weather.controller");
const router = (0, express_1.Router)();
// Retrieve current weather and clothing recommendation
router.get("/", weather_controller_1.getWeatherController);
exports.default = router;
