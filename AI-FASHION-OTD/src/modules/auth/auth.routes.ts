
import { Router } from "express";

import {
    registerController,
    loginController,
    refreshController,
    logoutController,
} from "./auth.controller";

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user.
 */
router.post("/register", registerController);

/**
 * POST /api/auth/login
 * Log in an existing user.
 */
router.post("/login", loginController);

/**
 * POST /api/auth/refresh
 * Rotate the refresh token and issue a new access token.
 */
router.post("/refresh", refreshController);

/**
 * POST /api/auth/logout
 * Revoke the refresh token and clear the refresh cookie.
 */
router.post("/logout", logoutController);

export default router;
