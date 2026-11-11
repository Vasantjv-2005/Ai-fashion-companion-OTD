/**
 * Frontend domain models for Digital Closet garments, intake drafts,
 * duplicate detection, image uploads, and AI recognition confirmation.
 */

import type {
  EntityOrigin,
  FormalityTier,
  GarmentCategory,
  GarmentFit,
  GarmentSeason,
  GarmentStyleTag,
} from './common';

export interface ClosetGarment {
  id: string;
  backendId?: string;
  origin: EntityOrigin;
  name: string;
  category: GarmentCategory;
  /** Structural garment silhouette used in UI (e.g. "Oxford Shirt", "Pleated Trousers"). */
  subType: string;
  /** High-level style tag required by backend WardrobeItem (`casual`, `formal`, etc.). */
  style: GarmentStyleTag;
  color: string;
  normalizedColor?: string;
  colorHex?: string;
  secondaryColor?: string;
  brand: string;
  season: GarmentSeason[];
  formality: FormalityTier;
  fit: string;
  normalizedFit: GarmentFit;
  occasions: string[];
  wearCount: number;
  icon: string;
  imageUrl?: string;
  imageFileId?: string;
  description?: string;
  notes?: string;
  material?: string;
  pattern?: string;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type GarmentDraftStatus = 'pending' | 'processing' | 'ready' | 'error';

export type GarmentIntakeSource = 'gallery' | 'camera' | 'preset';

export interface GarmentDraftItem {
  id: string;
  file?: File;
  previewUrl: string;
  source: GarmentIntakeSource;
  status: GarmentDraftStatus;
  name: string;
  category: GarmentCategory;
  subType: string;
  style?: GarmentStyleTag;
  color: string;
  colorHex: string;
  brand: string;
  fit: string;
  formality: FormalityTier;
  season: GarmentSeason[];
  occasions: string[];
  description?: string;
  material?: string;
  pattern?: string;
  icon: string;
  recognitionConfidence?: number;
  requiresUserConfirmation?: boolean;
  errorMessage?: string;
}

export interface GarmentDraftSession {
  drafts: GarmentDraftItem[];
  activeDraftId: string | null;
  choice: GarmentIntakeSource | null;
  updatedAt: number;
}

export interface GarmentRecognitionCandidate {
  suggestedCategory: GarmentCategory;
  suggestedSubType: string;
  suggestedStyle: GarmentStyleTag;
  rawAiCategory: string;
  primaryColor?: string;
  colorHex?: string;
  secondaryColor?: string;
  material?: string;
  pattern?: string;
  seasons: GarmentSeason[];
  occasions: string[];
  confidence: number;
  isLowConfidence: boolean;
}

export interface GarmentRecognitionDraftResult {
  candidates: GarmentRecognitionCandidate[];
  modelVersion?: string;
  requestId?: string;
  requiresUserConfirmation: boolean;
  cutoutImageUrl?: string;
}

export interface GarmentDuplicateMatch {
  existingGarment: ClosetGarment;
  reason: 'exact_name' | 'brand_and_silhouette' | 'identical_image';
  explanation: string;
}

export interface GarmentImageUploadAsset {
  garmentId: string;
  fileId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

