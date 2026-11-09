import type { Request, Response, NextFunction } from "express";
import { AIClientError } from "../../integrations/ai/ai.client";
import {
  getWardrobeAnalytics,
  analyzeWardrobeGaps,
  getWardrobeGaps,
  updateGapStatus,
  logWardrobeUsage,
  getItemUsageStats,
  recognizeClothingImage,
  WardrobeIntelligenceServiceError,
} from "./wardrobe-intelligence.service";
import {
  validateLogUsage,
  validateUpdateGapStatus,
  validateGapQuery,
} from "./wardrobe-intelligence.validator";

function getUserId(req: Request): string | null {
  const user = (
    req as Request & { user?: { id?: string; _id?: string } }
  ).user;

  return user?.id ?? user?._id ?? null;
}

function handleIntelligenceError(
  error: unknown,
  res: Response,
  next: NextFunction,
): void {
  if (error instanceof AIClientError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  if (error instanceof WardrobeIntelligenceServiceError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  next(error);
}

export async function recognizeClothingImageController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!getUserId(req)) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  if (!req.file || req.file.size === 0) {
    res.status(400).json({
      success: false,
      message: "A non-empty image file is required.",
    });
    return;
  }

  try {
    const result = await recognizeClothingImage({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
    });

    res.status(200).json({
      success: true,
      requiresUserConfirmation: result.requiresUserConfirmation,
      data: result.prediction,
    });
  } catch (error: unknown) {
    handleIntelligenceError(error, res, next);
  }
}

export async function getAnalyticsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  try {
    const analytics = await getWardrobeAnalytics(userId);
    res.status(200).json({ success: true, data: analytics });
  } catch (error: unknown) {
    handleIntelligenceError(error, res, next);
  }
}

export async function analyzeGapsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  try {
    const gaps = await analyzeWardrobeGaps(userId);
    res.status(200).json({ success: true, data: gaps });
  } catch (error: unknown) {
    handleIntelligenceError(error, res, next);
  }
}

export async function getGapsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  const validation = validateGapQuery(req.query);
  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid query parameters.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  try {
    const gaps = await getWardrobeGaps(userId, validation.data);
    res.status(200).json({ success: true, data: gaps });
  } catch (error: unknown) {
    handleIntelligenceError(error, res, next);
  }
}

export async function updateGapStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  const gapId = req.params.id as string;
  if (!gapId) {
    res.status(400).json({
      success: false,
      message: "Gap ID is required.",
    });
    return;
  }

  const validation = validateUpdateGapStatus(req.body);
  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  try {
    const gap = await updateGapStatus(
      userId,
      gapId,
      validation.data.status,
    );
    res.status(200).json({ success: true, data: gap });
  } catch (error: unknown) {
    handleIntelligenceError(error, res, next);
  }
}

export async function logUsageController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  const validation = validateLogUsage(req.body);
  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  try {
    const usage = await logWardrobeUsage(userId, validation.data);
    res.status(201).json({ success: true, data: usage });
  } catch (error: unknown) {
    handleIntelligenceError(error, res, next);
  }
}

export async function getItemStatsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  const itemId = req.params.itemId as string;
  if (!itemId) {
    res.status(400).json({
      success: false,
      message: "Item ID is required.",
    });
    return;
  }

  try {
    const stats = await getItemUsageStats(userId, itemId);
    res.status(200).json({ success: true, data: stats });
  } catch (error: unknown) {
    handleIntelligenceError(error, res, next);
  }
}
