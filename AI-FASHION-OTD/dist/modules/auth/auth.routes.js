"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const router = (0, express_1.Router)();
/**
 * POST /api/auth/register
 * Register a new user.
 */
router.post("/register", auth_controller_1.registerController);
/**
 * POST /api/auth/login
 * Log in an existing user.
 */
router.post("/login", auth_controller_1.loginController);
/**
 * POST /api/auth/refresh
 * Rotate the refresh token and issue a new access token.
 */
router.post("/refresh", auth_controller_1.refreshController);
/**
 * POST /api/auth/logout
 * Revoke the refresh token and clear the refresh cookie.
 */
router.post("/logout", auth_controller_1.logoutController);
exports.default = router;
