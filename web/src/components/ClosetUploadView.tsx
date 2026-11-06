import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  FileText,
  ArrowLeft,
  X,
  Check,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Plus,
  Layers,
  ChevronRight,
  ChevronLeft,
  SwitchCamera,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  HelpCircle,
  HardDrive,
  Copy,
} from 'lucide-react';
import { useCloset, type ClosetItem } from '../context/ClosetContext';
import { compressImageFile } from '../utils/imageCompressor';
import {
  saveDraftSession,
  loadDraftSession,
  clearDraftSession,
  formatDraftTime,
  isIndexedDBAvailable,
  setSimulateIndexedDBFailure,
  getSimulateIndexedDBFailure,
  type DraftSessionData,
} from '../utils/draftStorage';
import { detectDuplicateGarment, type DuplicateMatchResult } from '../utils/duplicateDetector';

export interface ClosetUploadViewProps {
  onBack: () => void;
  onComplete: () => void;
}

export type IntakeChoice = 'camera' | 'library' | 'manual';

export type GarmentDraftStatus =
  | 'selected'
  | 'preparing'
  | 'ready'
  | 'needs_attention'
  | 'failed'
  | 'saved';

export interface GarmentDraft {
  id: string;
  name: string;
  category: ClosetItem['category'];
  subType: string;
  brand: string;
  color: string;
  secondaryColor?: string;
  fit: ClosetItem['fit'];
  formality: ClosetItem['formality'];
  icon: string;
  imageUrl?: string;
  season: ('spring' | 'summer' | 'autumn' | 'winter' | 'all-season')[];
  pattern: string;
  description: string;
  fileName?: string;
  fileSize?: number;

  // Task 7 Lifecycle & Error Handling State
  status: GarmentDraftStatus;
  progress?: number; // 0-100% for local processing tasks
  processingStep?: string;
  errorMessage?: string;
  errorCode?: 'PROCESSING_FAILED' | 'FILE_TOO_LARGE' | 'UNSUPPORTED_FORMAT' | 'STORAGE_QUOTA' | 'RESTORE_FAILED';
  needsReview?: boolean;
  duplicateOfId?: string;
  duplicateReason?: string;
  duplicateWarningDismissed?: boolean;
  replaceTargetId?: string;
  rawFile?: File; // Session memory reference for retry
}

const CATEGORY_DEFAULT_ICONS: Record<ClosetItem['category'], string> = {
  tops: '👔',
  bottoms: '👖',
  outerwear: '🧥',
  footwear: '👞',
  accessories: '⌚',
};

const CATEGORY_SUBTYPES: Record<ClosetItem['category'], string[]> = {
  tops: ['Knitwear / Sweater', 'Dress Shirt', 'Silk Shirt', 'Camp Collar Shirt', 'Polo', 'T-Shirt', 'Cardigan'],
  bottoms: ['Flannel Trousers', 'Pleated Chinos', 'Raw Denim', 'Tailored Shorts', 'Linen Trousers', 'Wool Slacks'],
  outerwear: ['Tailored Blazer', 'Overcoat', 'Trench Coat', 'Safari Overshirt', 'Leather Bomber', 'Harrington'],
  footwear: ['Penny Loafers', 'Horsebit Loafers', 'Chelsea Boots', 'Minimalist Sneakers', 'Oxford Shoes', 'Monkstraps'],
  accessories: ['Dress Timepiece', 'Silk Scarf', 'Leather Belt', 'Sunglasses', 'Pocket Square', 'Weekender Bag'],
};

const PALETTE_SWATCHES = [
  { name: 'Charcoal Noir', hex: '#262626' },
  { name: 'Vicuna Camel', hex: '#C19A6B' },
  { name: 'Navy Midnight', hex: '#1B263B' },
  { name: 'Oatmeal Beige', hex: '#D7C4B7' },
  { name: 'Olive Forest', hex: '#4A533E' },
  { name: 'Burgundy Noir', hex: '#581825' },
  { name: 'Chalk White', hex: '#F4F1EA' },
  { name: 'Cognac Brown', hex: '#834333' },
];

const PRESET_EDITORIAL_PIECES = [
  {
    name: 'Double-Faced Camel Wool Overcoat',
    brand: 'Loro Piana',
    category: 'outerwear' as const,
    subType: 'Overcoat',
    color: 'Vicuna Camel',
    secondaryColor: 'Espresso',
    fit: 'Relaxed / Tailored' as const,
    formality: 4 as const,
    icon: '🧥',
    imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80',
    season: ['autumn', 'winter'] as ('autumn' | 'winter')[],
    pattern: 'Solid',
    description: 'Supple double-faced virgin wool and cashmere overcoat with hand-stitched pick lapels.',
  },
  {
    name: 'Forward-Pleat Oatmeal Wool Flannel Trousers',
    brand: 'Fox Brothers',
    category: 'bottoms' as const,
    subType: 'Flannel Trousers',
    color: 'Oatmeal Beige',
    secondaryColor: 'Sand',
    fit: 'Regular' as const,
    formality: 4 as const,
    icon: '👖',
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
    season: ['autumn', 'winter', 'spring'] as ('autumn' | 'winter' | 'spring')[],
    pattern: 'Solid Melange',
    description: 'High-rise forward double pleats with side adjusters and a gentle natural drape.',
  },
  {
    name: 'Calfskin 1953 Horsebit Loafers',
    brand: 'Gucci 1953',
    category: 'footwear' as const,
    subType: 'Horsebit Loafers',
    color: 'Burgundy Noir',
    secondaryColor: 'Burnished Brass',
    fit: 'Regular' as const,
    formality: 4 as const,
    icon: '👞',
    imageUrl: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=600&q=80',
    season: ['all-season'] as ('all-season')[],
    pattern: 'Smooth Grain',
    description: 'Iconic tubular moccasin construction with antique gold-tone horsebit hardware.',
  },
  {
    name: 'Silk-Cashmere Fine Gauge Turtleneck',
    brand: 'Brunello Cucinelli',
    category: 'tops' as const,
    subType: 'Knitwear / Sweater',
    color: 'Charcoal Noir',
    secondaryColor: 'Ash',
    fit: 'Slim' as const,
    formality: 3 as const,
    icon: '👔',
    imageUrl: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=600&q=80',
    season: ['autumn', 'winter', 'spring'] as ('autumn' | 'winter' | 'spring')[],
    pattern: 'Fine Knit',
    description: 'Ultralight Solomeo silk and cashmere blend with refined ribbed collar and cuffs.',
  },
];

let draftCounter = 0;
const generateDraftId = () => `draft_${Date.now()}_${++draftCounter}`;

export const ClosetUploadView: React.FC<ClosetUploadViewProps> = ({ onBack, onComplete }) => {
  const { closet, addClosetItem, updateClosetItem } = useCloset();

  // Screen stage
  const [stage, setStage] = useState<'select' | 'camera' | 'library' | 'form'>('select');

  // Multi-item drafts
  const [drafts, setDrafts] = useState<GarmentDraft[]>([]);
  const [activeDraftIndex, setActiveDraftIndex] = useState(0);

  // Recoverable Draft State
  const [persistedDraftSession, setPersistedDraftSession] = useState<DraftSessionData | null>(null);
  const [showDiscardConfirmModal, setShowDiscardConfirmModal] = useState(false);
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);

  // Replacement Confirmation Modal State
  const [pendingReplacementMatch, setPendingReplacementMatch] = useState<DuplicateMatchResult | null>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [availableVideoDevices, setAvailableVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Library multi-file state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stagedFiles, setStagedFiles] = useState<Array<{ file: File; previewUrl: string }>>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isCompressingBatch, setIsCompressingBatch] = useState(false);
  const [batchProgressSummary, setBatchProgressSummary] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form validation & submission state
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Development-only QA flag
  const isDev = import.meta.env.DEV;

  // Global Storage Quota Alert State
  const [quotaExceededNotice, setQuotaExceededNotice] = useState<string | null>(null);

  // IndexedDB availability status
  const [isIndexedDBRestricted, setIsIndexedDBRestricted] = useState(() => !isIndexedDBAvailable());

  // Developer / QA Simulation Tools Drawer
  const [showTestingControls, setShowTestingControls] = useState(false);

  // Listen for storage quota events dispatched by the application
  useEffect(() => {
    const handleQuotaExceeded = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      setQuotaExceededNotice(
        customEvent.detail?.message ||
          'Browser storage limit reached. Please reduce image sizes or clear unused closet records.'
      );
    };

    window.addEventListener('otd:storage-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('otd:storage-quota-exceeded', handleQuotaExceeded);
  }, []);

  // Check for existing recoverable drafts in IndexedDB or fallback on mount
  useEffect(() => {
    let isMounted = true;
    loadDraftSession()
      .then((session) => {
        if (isMounted && session && session.drafts.length > 0) {
          setPersistedDraftSession(session);
        }
      })
      .catch((err) => {
        console.warn('Draft session recovery check failed:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced auto-save of active drafts to IndexedDB
  useEffect(() => {
    if (drafts.length === 0 || stage === 'select') return;

    // Do not save drafts if all are marked as 'saved'
    const hasUnsaved = drafts.some((d) => d.status !== 'saved');
    if (!hasUnsaved) return;

    const timer = setTimeout(() => {
      saveDraftSession(drafts, stage, activeDraftIndex).catch((err) => {
        console.warn('Auto-save to IndexedDB encountered an issue:', err);
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [drafts, stage, activeDraftIndex]);

  // Clean up camera stream and hardware tracks
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore cleanup errors
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Stop camera tracks on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Handle ESC key to return safely with camera cleanup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pendingReplacementMatch) {
          setPendingReplacementMatch(null);
        } else if (showDiscardConfirmModal) {
          setShowDiscardConfirmModal(false);
        } else if (stage === 'camera') {
          stopCameraStream();
          setStage('select');
        } else if (stage === 'library') {
          setStage('select');
        } else if (stage === 'form') {
          setStage('select');
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, onBack, stopCameraStream, pendingReplacementMatch, showDiscardConfirmModal]);

  // =========================================================================
  // DRAFT RECOVERY WORKFLOW
  // =========================================================================
  const handleResumeDraft = () => {
    if (!persistedDraftSession) return;
    setIsRestoringDraft(true);
    try {
      setDrafts(persistedDraftSession.drafts);
      setActiveDraftIndex(persistedDraftSession.activeDraftIndex || 0);
      setStage(persistedDraftSession.stage === 'library' ? 'library' : 'form');
      setPersistedDraftSession(null);
    } catch {
      setValidationError('Failed to restore draft session. You can start a fresh garment entry.');
    } finally {
      setIsRestoringDraft(false);
    }
  };

  const handleConfirmDiscardDraft = async () => {
    setShowDiscardConfirmModal(false);
    await clearDraftSession();
    setPersistedDraftSession(null);
    setDrafts([]);
    setActiveDraftIndex(0);
    setStage('select');
  };

  // =========================================================================
  // OPTION A: TAKE PHOTO (Rear camera preference & cleanup)
  // =========================================================================
  const startCameraStream = useCallback(
    async (facing: 'environment' | 'user' = 'environment', deviceId?: string) => {
      stopCameraStream();
      setCameraError(null);
      setCapturedPhotoUrl(null);
      setStage('camera');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser. Please use library upload instead.');
        return;
      }

      try {
        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        };

        if (deviceId) {
          videoConstraints.deviceId = { exact: deviceId };
        } else {
          videoConstraints.facingMode = { ideal: facing };
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        streamRef.current = stream;
        setIsCameraActive(true);
        setCameraFacingMode(facing);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setAvailableVideoDevices(videoInputs);
        } catch {
          // ignore enumeration error
        }
      } catch (err: unknown) {
        stopCameraStream();
        const error = err as { name?: string; message?: string };
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setCameraError('Camera access was declined. You can upload an image from your library or enter details manually.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setCameraError('No camera device was detected on your device. Please use library upload or manual entry.');
        } else {
          setCameraError('Unable to activate camera preview. Please check device permissions or select a photo from your library.');
        }
      }
    },
    [stopCameraStream]
  );

  const handleStartCamera = () => {
    setSelectedDeviceId(null);
    startCameraStream('environment');
  };

  const handleSwitchCamera = () => {
    if (availableVideoDevices.length > 1) {
      const currentIndex = availableVideoDevices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % availableVideoDevices.length;
      const nextDevice = availableVideoDevices[nextIndex];
      setSelectedDeviceId(nextDevice.deviceId);
      const label = nextDevice.label.toLowerCase();
      const nextFacing = label.includes('front') || label.includes('user') ? 'user' : 'environment';
      startCameraStream(nextFacing, nextDevice.deviceId);
    } else {
      const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
      setSelectedDeviceId(null);
      startCameraStream(nextFacing);
    }
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const snapshotUrl = canvas.toDataURL('image/jpeg', 0.88);
        setCapturedPhotoUrl(snapshotUrl);
        stopCameraStream();
      }
    } catch {
      setCameraError('Could not capture frame. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhotoUrl(null);
    startCameraStream(cameraFacingMode, selectedDeviceId || undefined);
  };

  const handleConfirmPhoto = () => {
    if (!capturedPhotoUrl) return;
    stopCameraStream();

    const newDraft: GarmentDraft = {
      id: generateDraftId(),
      name: 'Captured Garment',
      category: 'tops',
      subType: 'Dress Shirt',
      brand: 'Bespoke Atelier',
      color: 'Classic Neutral',
      secondaryColor: '',
      fit: 'Regular',
      formality: 3,
      icon: CATEGORY_DEFAULT_ICONS.tops,
      imageUrl: capturedPhotoUrl,
      season: ['all-season'],
      pattern: 'Solid',
      description: 'Captured via camera intake.',
      status: 'ready',
      progress: 100,
      processingStep: 'Live snapshot prepared locally.',
    };

    // Check for duplicate heuristic
    const duplicateMatch = detectDuplicateGarment(newDraft, closet);
    if (duplicateMatch) {
      newDraft.status = 'needs_attention';
      newDraft.duplicateOfId = duplicateMatch.existingItem.id;
      newDraft.duplicateReason = duplicateMatch.explanation;
    }

    setDrafts([newDraft]);
    setActiveDraftIndex(0);
    setStage('form');
  };

  const handleExitCamera = () => {
    stopCameraStream();
    setStage('select');
  };

  // =========================================================================
  // OPTION B: UPLOAD FROM LIBRARY (Multi-image, sequential compression & errors)
  // =========================================================================
  const handleOpenLibrary = () => {
    stopCameraStream();
    setFileError(null);
    setStagedFiles([]);
    setStage('library');
  };

  const handleAddFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setFileError(null);

    const validExtensions = ['image/jpeg', 'image/png', 'image/webp'];
    const newStaged: Array<{ file: File; previewUrl: string }> = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!validExtensions.includes(file.type)) {
        setFileError(`File "${file.name}" has an unsupported format. Please upload JPEG, PNG, or WebP images only.`);
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        setFileError(`File "${file.name}" exceeds the 15MB limit. Please upload a smaller image.`);
        continue;
      }

      const preview = URL.createObjectURL(file);
      newStaged.push({ file, previewUrl: preview });
    }

    setStagedFiles((prev) => [...prev, ...newStaged]);
  };

  const handleRemoveStagedFile = (index: number) => {
    setStagedFiles((prev) => {
      const item = prev[index];
      if (item && item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleProceedFromLibrary = async () => {
    if (stagedFiles.length === 0) {
      setFileError('Please select at least one garment photo from your library to proceed.');
      return;
    }

    setIsCompressingBatch(true);
    setFileError(null);

    const total = stagedFiles.length;
    const createdDrafts: GarmentDraft[] = [];

    for (let i = 0; i < total; i++) {
      const { file, previewUrl } = stagedFiles[i];
      setBatchProgressSummary(`Preparing image ${i + 1} of ${total} (${Math.round(((i + 1) / total) * 100)}%)`);

      let compressedDataUrl = previewUrl;
      let hasError = false;
      let errorMsg: string | undefined;

      try {
        compressedDataUrl = await compressImageFile(file, 800, 0.82);
      } catch (err) {
        console.warn(`Local compression failed for ${file.name}:`, err);
        hasError = true;
        errorMsg = 'Local image processing encountered an issue. You can retry or switch to manual entry.';
      }

      // Format default clean name
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .trim();
      const formattedName = cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : `Garment ${i + 1}`;

      // Infer default category/subtype based on file name if possible
      const lowerName = cleanName.toLowerCase();
      let cat: ClosetItem['category'] = 'tops';
      let sub = 'Knitwear / Sweater';

      if (lowerName.includes('trouser') || lowerName.includes('pant') || lowerName.includes('jean') || lowerName.includes('chino')) {
        cat = 'bottoms';
        sub = 'Flannel Trousers';
      } else if (lowerName.includes('coat') || lowerName.includes('jacket') || lowerName.includes('blazer') || lowerName.includes('trench')) {
        cat = 'outerwear';
        sub = 'Tailored Blazer';
      } else if (lowerName.includes('shoe') || lowerName.includes('boot') || lowerName.includes('loafer') || lowerName.includes('sneaker')) {
        cat = 'footwear';
        sub = 'Penny Loafers';
      } else if (lowerName.includes('watch') || lowerName.includes('scarf') || lowerName.includes('belt') || lowerName.includes('bag')) {
        cat = 'accessories';
        sub = 'Dress Timepiece';
      }

      const draft: GarmentDraft = {
        id: generateDraftId(),
        name: formattedName,
        category: cat,
        subType: sub,
        brand: 'Bespoke Atelier',
        color: 'Neutral',
        secondaryColor: '',
        fit: 'Regular',
        formality: 3,
        icon: CATEGORY_DEFAULT_ICONS[cat],
        imageUrl: compressedDataUrl,
        season: ['all-season'],
        pattern: 'Solid',
        description: '',
        fileName: file.name,
        fileSize: file.size,
        status: hasError ? 'failed' : 'ready',
        progress: 100,
        processingStep: hasError ? 'Processing failed' : 'Downsampled and optimized locally',
        errorMessage: errorMsg,
        errorCode: hasError ? 'PROCESSING_FAILED' : undefined,
        rawFile: file,
      };

      // Heuristic duplicate detection
      if (!hasError) {
        const duplicateMatch = detectDuplicateGarment(draft, closet);
        if (duplicateMatch) {
          draft.status = 'needs_attention';
          draft.duplicateOfId = duplicateMatch.existingItem.id;
          draft.duplicateReason = duplicateMatch.explanation;
        }
      }

      createdDrafts.push(draft);
    }

    setDrafts(createdDrafts);
    setActiveDraftIndex(0);
    setIsCompressingBatch(false);
    setBatchProgressSummary(null);
    setStage('form');
  };

  // Retry processing for a single failed draft
  const handleRetryProcessing = async (draftId: string) => {
    const targetDraft = drafts.find((d) => d.id === draftId);
    if (!targetDraft) return;

    // Set draft to preparing
    setDrafts((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, status: 'preparing', progress: 40, errorMessage: undefined } : d))
    );

    try {
      let compressedUrl = targetDraft.imageUrl;
      if (targetDraft.rawFile) {
        compressedUrl = await compressImageFile(targetDraft.rawFile, 800, 0.82);
      }

      setDrafts((prev) =>
        prev.map((d) => {
          if (d.id !== draftId) return d;
          const updated: GarmentDraft = {
            ...d,
            imageUrl: compressedUrl,
            status: 'ready',
            progress: 100,
            processingStep: 'Successfully reprocessed locally',
            errorMessage: undefined,
            errorCode: undefined,
          };
          const dup = detectDuplicateGarment(updated, closet);
          if (dup) {
            updated.status = 'needs_attention';
            updated.duplicateOfId = dup.existingItem.id;
            updated.duplicateReason = dup.explanation;
          }
          return updated;
        })
      );
    } catch {
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === draftId
            ? {
                ...d,
                status: 'failed',
                errorMessage: 'Retry failed. You can proceed with manual entry or select another image.',
              }
            : d
        )
      );
    }
  };

  // =========================================================================
  // OPTION C: MANUAL ENTRY (No image required)
  // =========================================================================
  const handleStartManualEntry = () => {
    stopCameraStream();
    const manualDraft: GarmentDraft = {
      id: generateDraftId(),
      name: '',
      category: 'tops',
      subType: 'Dress Shirt',
      brand: '',
      color: '',
      secondaryColor: '',
      fit: 'Regular',
      formality: 3,
      icon: CATEGORY_DEFAULT_ICONS.tops,
      imageUrl: undefined,
      season: ['all-season'],
      pattern: 'Solid',
      description: '',
      status: 'needs_attention', // highlighted until required name & color are filled
      needsReview: true,
      progress: 100,
      processingStep: 'Manual specification mode active.',
    };
    setDrafts([manualDraft]);
    setActiveDraftIndex(0);
    setStage('form');
  };

  // Switch a failed or image draft to manual entry (preserving metadata)
  const handleSwitchToManual = (draftId: string) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== draftId) return d;
        return {
          ...d,
          imageUrl: undefined,
          status: d.name && d.color ? 'ready' : 'needs_attention',
          errorMessage: undefined,
          errorCode: undefined,
          processingStep: 'Converted to manual specification.',
        };
      })
    );
  };

  // Sample preset quick-picker
  const handleSelectPreset = (preset: (typeof PRESET_EDITORIAL_PIECES)[0]) => {
    stopCameraStream();
    const presetDraft: GarmentDraft = {
      id: generateDraftId(),
      name: preset.name,
      category: preset.category,
      subType: preset.subType,
      brand: preset.brand,
      color: preset.color,
      secondaryColor: preset.secondaryColor,
      fit: preset.fit,
      formality: preset.formality,
      icon: preset.icon,
      imageUrl: preset.imageUrl,
      season: [...preset.season],
      pattern: preset.pattern,
      description: preset.description,
      status: 'ready',
      progress: 100,
      processingStep: 'Calibrated specimen loaded.',
    };

    // Check duplicate heuristic
    const duplicateMatch = detectDuplicateGarment(presetDraft, closet);
    if (duplicateMatch) {
      presetDraft.status = 'needs_attention';
      presetDraft.duplicateOfId = duplicateMatch.existingItem.id;
      presetDraft.duplicateReason = duplicateMatch.explanation;
    }

    setDrafts([presetDraft]);
    setActiveDraftIndex(0);
    setStage('form');
  };

  // Update active draft helper
  const updateActiveDraft = (updates: Partial<GarmentDraft>) => {
    setDrafts((prev) =>
      prev.map((draft, idx) => {
        if (idx !== activeDraftIndex) return draft;
        const updated = { ...draft, ...updates };

        if (updates.category && !updates.icon) {
          updated.icon = CATEGORY_DEFAULT_ICONS[updates.category];
        }

        // Recalculate duplicate heuristic if name, brand, subType, color or image changed
        if (
          !updated.duplicateWarningDismissed &&
          (updates.name !== undefined ||
            updates.brand !== undefined ||
            updates.category !== undefined ||
            updates.subType !== undefined ||
            updates.color !== undefined ||
            updates.imageUrl !== undefined)
        ) {
          const dup = detectDuplicateGarment(updated, closet);
          if (dup) {
            updated.duplicateOfId = dup.existingItem.id;
            updated.duplicateReason = dup.explanation;
            if (updated.status !== 'failed') {
              updated.status = 'needs_attention';
            }
          } else {
            updated.duplicateOfId = undefined;
            updated.duplicateReason = undefined;
            if (updated.status === 'needs_attention' && !updated.needsReview && updated.name && updated.color) {
              updated.status = 'ready';
            }
          }
        }

        // Check if required fields are satisfied
        if (updated.status === 'needs_attention' && !updated.duplicateOfId && updated.name.trim() && updated.color.trim()) {
          updated.status = 'ready';
        }

        return updated;
      })
    );
  };

  // Remove a draft from multi-draft queue
  const handleRemoveDraft = (draftIndex: number) => {
    setDrafts((prev) => {
      const next = prev.filter((_, idx) => idx !== draftIndex);
      if (next.length === 0) {
        setStage('select');
        clearDraftSession();
        return [];
      }
      setActiveDraftIndex((current) => Math.min(current, next.length - 1));
      return next;
    });
  };

  const activeDraft = drafts[activeDraftIndex] || null;

  // Active draft duplicate match
  const activeDuplicateItem: ClosetItem | undefined = activeDraft?.duplicateOfId
    ? closet.find((item) => item.id === activeDraft.duplicateOfId)
    : undefined;

  // Duplicate resolution actions
  const handleKeepBothDuplicates = () => {
    if (!activeDraft) return;
    updateActiveDraft({
      duplicateWarningDismissed: true,
      duplicateOfId: undefined,
      duplicateReason: undefined,
      replaceTargetId: undefined,
      status: activeDraft.name.trim() && activeDraft.color.trim() ? 'ready' : 'needs_attention',
    });
  };

  const handleOpenReplaceConfirmation = () => {
    if (!activeDraft || !activeDuplicateItem) return;
    setPendingReplacementMatch({
      existingItem: activeDuplicateItem,
      reason: 'exact_name',
      explanation: activeDraft.duplicateReason || 'Matches existing wardrobe entry.',
    });
  };

  const handleConfirmReplace = () => {
    if (!activeDraft || !pendingReplacementMatch) return;
    updateActiveDraft({
      duplicateWarningDismissed: true,
      replaceTargetId: pendingReplacementMatch.existingItem.id,
      status: activeDraft.name.trim() && activeDraft.color.trim() ? 'ready' : 'needs_attention',
    });
    setPendingReplacementMatch(null);
  };

  const handleCancelDuplicateUpload = () => {
    handleRemoveDraft(activeDraftIndex);
  };

  // Save all drafts to ClosetContext
  const handleSaveAll = async () => {
    setValidationError(null);

    // Validate that every draft has at least a Name and Primary Color
    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      if (d.status === 'failed') {
        setActiveDraftIndex(i);
        setValidationError(`Garment #${i + 1} has a processing error. Please retry, convert to manual entry, or remove it.`);
        return;
      }
      if (!d.name.trim()) {
        setActiveDraftIndex(i);
        setValidationError(`Please provide a garment name for piece #${i + 1}.`);
        return;
      }
      if (!d.color.trim()) {
        setActiveDraftIndex(i);
        setValidationError(`Please specify a primary color for "${d.name || `piece #${i + 1}`}".`);
        return;
      }
    }

    setIsSaving(true);

    try {
      drafts.forEach((draft) => {
        const pieceData = {
          name: draft.name.trim(),
          category: draft.category,
          subType: draft.subType || CATEGORY_SUBTYPES[draft.category][0],
          brand: draft.brand.trim() || 'Bespoke Atelier',
          color: draft.color.trim(),
          secondaryColor: draft.secondaryColor?.trim() || undefined,
          fit: draft.fit,
          formality: draft.formality,
          icon: draft.icon || CATEGORY_DEFAULT_ICONS[draft.category],
          imageUrl: draft.imageUrl || undefined,
          season: draft.season,
          pattern: draft.pattern || 'Solid',
          description: draft.description.trim() || undefined,
        };

        if (draft.replaceTargetId) {
          // Explicitly confirmed replacement: update existing item
          updateClosetItem(draft.replaceTargetId, pieceData);
        } else {
          // Add as fresh wardrobe item
          addClosetItem(pieceData);
        }
      });

      // Mark all as saved
      setDrafts((prev) => prev.map((d) => ({ ...d, status: 'saved' })));

      // Clear the temporary draft session from storage so it does not reappear
      await clearDraftSession();

      const replacedDrafts = drafts.filter((d) => Boolean(d.replaceTargetId));
      const replacedCount = replacedDrafts.length;
      let msg = '';
      if (replacedCount > 0 && drafts.length === 1) {
        const targetName = closet.find((i) => i.id === drafts[0].replaceTargetId)?.name || drafts[0].name;
        msg = `"${targetName}" successfully updated in your Digital Closet (original ID preserved).`;
      } else if (replacedCount > 0) {
        msg = `${drafts.length} garments processed (${replacedCount} replaced, ${drafts.length - replacedCount} added).`;
      } else {
        msg =
          drafts.length === 1
            ? `"${drafts[0].name}" successfully cataloged into your Digital Closet.`
            : `${drafts.length} garments successfully cataloged into your Digital Closet.`;
      }
      setSuccessMessage(msg);

      setTimeout(() => {
        setIsSaving(false);
        onComplete();
      }, 700);
    } catch {
      setIsSaving(false);
      setValidationError('Failed to save to closet. Please check browser storage capacity or try again.');
    }
  };

  // Calculate overall draft status counters
  const draftCounters = {
    total: drafts.length,
    ready: drafts.filter((d) => d.status === 'ready').length,
    needsAttention: drafts.filter((d) => d.status === 'needs_attention').length,
    failed: drafts.filter((d) => d.status === 'failed').length,
    preparing: drafts.filter((d) => d.status === 'preparing').length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-200">
      {/* Editorial Breadcrumb & Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-card)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (stage === 'camera') {
                stopCameraStream();
                setStage('select');
              } else if (stage === 'library' || stage === 'form') {
                setStage('select');
              } else {
                onBack();
              }
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[var(--pill-bg)] border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:border-[var(--gold-primary)] transition-all flex items-center gap-2 cursor-pointer text-xs font-semibold"
            aria-label="Back to previous screen"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">
              {stage === 'select' ? 'Back to Digital Closet' : 'Back to Intake Choices'}
            </span>
          </button>

          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--gold-primary)] font-semibold flex items-center gap-1.5">
              <span>Wardrobe Acquisition • Task 7</span>
              {drafts.length > 0 && stage === 'form' && (
                <span className="text-[9px] bg-[var(--pill-bg)] px-2 py-0.5 rounded-full border border-[var(--border-gold)]">
                  {draftCounters.ready}/{draftCounters.total} Ready
                </span>
              )}
            </span>
            <h1 className="font-playfair text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-heading)]">
              {stage === 'select' && 'Garment Intake Atelier'}
              {stage === 'camera' && 'Live Camera Capture'}
              {stage === 'library' && 'Editorial Library Intake'}
              {stage === 'form' && 'Garment Specification & Metadata'}
            </h1>
          </div>
        </div>

        {stage === 'form' && drafts.length > 0 && (
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Discard Draft Button */}
            <button
              onClick={() => setShowDiscardConfirmModal(true)}
              className="p-2.5 rounded-full bg-[var(--pill-bg)] border border-[var(--border-card)] text-[var(--text-muted)] hover:text-rose-500 hover:border-rose-500/40 transition-all cursor-pointer"
              title="Discard draft and reset"
              aria-label="Discard draft"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isSaving || draftCounters.failed > 0}
              className="px-5 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Cataloging into Closet...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{drafts.length > 1 ? `Save All ${drafts.length} Pieces` : 'Save to Closet'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* IndexedDB Restricted Advisory */}
      {isIndexedDBRestricted && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5 animate-in fade-in">
          <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Storage Advisory:</strong> Persistent browser database (IndexedDB) is restricted. Garment metadata will be preserved across refreshes, but photo attachments cannot be persistently cached until cataloged.
          </span>
        </div>
      )}

      {/* Recoverable Draft Found Alert Banner */}
      {persistedDraftSession && stage === 'select' && (
        <div
          role="status"
          aria-live="polite"
          className="p-5 rounded-3xl bg-[var(--bg-card)] border-2 border-[var(--border-gold)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold-primary)] shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-heading)]">
                  {persistedDraftSession.imagesPreserved !== false
                    ? 'Recoverable Garment Draft Found'
                    : 'Metadata-Only Garment Draft Found'}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    persistedDraftSession.imagesPreserved !== false
                      ? 'text-[var(--gold-primary)] bg-[var(--pill-bg)]'
                      : 'text-amber-800 dark:text-amber-300 bg-amber-500/20'
                  }`}
                >
                  {persistedDraftSession.imagesPreserved !== false
                    ? `IndexedDB • ${formatDraftTime(persistedDraftSession.updatedAt)}`
                    : 'Storage Fallback • Photos Omitted'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {persistedDraftSession.imagesPreserved !== false
                  ? `You have ${persistedDraftSession.drafts.length} un-cataloged garment${
                      persistedDraftSession.drafts.length > 1 ? 's' : ''
                    } saved locally. You can resume editing or discard the draft.`
                  : `Restored ${persistedDraftSession.drafts.length} garment specification(s). Photos could not be preserved due to browser storage restrictions, but all metadata, silhouettes, and colors are intact.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowDiscardConfirmModal(true)}
              className="px-4 py-2 rounded-xl border border-[var(--border-card)] text-xs font-semibold text-[var(--text-muted)] hover:text-rose-500 hover:border-rose-500/30 transition-all cursor-pointer"
            >
              Discard Draft
            </button>
            <button
              onClick={handleResumeDraft}
              disabled={isRestoringDraft}
              className="px-5 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resume Editing</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Storage Quota Exceeded Notification */}
      {quotaExceededNotice && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-950 dark:text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-center gap-3">
            <HardDrive className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="font-bold">Storage Capacity Advisory</p>
              <p className="text-[11px] opacity-90">{quotaExceededNotice}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {stage === 'form' && drafts.some((d) => d.imageUrl) && (
              <button
                type="button"
                onClick={() => {
                  setDrafts((prev) =>
                    prev.map((d) => ({
                      ...d,
                      imageUrl: undefined,
                      processingStep: 'Converted to manual specification to conserve storage quota.',
                    }))
                  );
                  setQuotaExceededNotice(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-all cursor-pointer"
              >
                Save as Manual (Omit Photos)
              </button>
            )}
            <button
              onClick={() => setQuotaExceededNotice(null)}
              className="p-1 text-amber-800 dark:text-amber-300 hover:opacity-75 cursor-pointer"
              aria-label="Dismiss storage notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Notification Banner */}
      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-3 animate-in fade-in"
        >
          <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Validation Error Banner */}
      {validationError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
          <button
            onClick={() => setValidationError(null)}
            className="p-1 text-rose-700 dark:text-rose-300 hover:opacity-75 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 1: THREE-WAY INTAKE SELECTION                                      */}
      {/* ========================================================================= */}
      {stage === 'select' && (
        <div className="space-y-8">
          <div>
            <p className="text-sm text-[var(--text-muted)] max-w-2xl leading-relaxed">
              Select how you would like to catalog your garment into the OTD ecosystem. All metadata remains fully editable, whether captured directly with your camera, chosen from your gallery, or entered manually without photography.
            </p>
          </div>

          {/* Three Primary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Choice 1: Take Photo */}
            <button
              type="button"
              onClick={handleStartCamera}
              className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--gold-primary)] transition-all cursor-pointer group flex flex-col justify-between hover:shadow-xl relative overflow-hidden text-left w-full"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold-primary)] group-hover:scale-110 transition-transform">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--gold-primary)] font-bold">
                    Option A • Live Lens
                  </span>
                  <h3 className="font-playfair text-xl font-bold text-[var(--text-heading)] mt-0.5">
                    Take Photo
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
                    Activate camera preview to photograph physical wardrobe garments directly on a hanger or flat lay.
                  </p>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-between text-xs font-bold text-[var(--text-heading)] group-hover:text-[var(--gold-primary)] transition-colors">
                <span>Launch Camera</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Choice 2: Upload from Library */}
            <button
              type="button"
              onClick={handleOpenLibrary}
              className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--gold-primary)] transition-all cursor-pointer group flex flex-col justify-between hover:shadow-xl relative overflow-hidden text-left w-full"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold-primary)] group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--gold-primary)] font-bold">
                    Option B • Batch Gallery
                  </span>
                  <h3 className="font-playfair text-xl font-bold text-[var(--text-heading)] mt-0.5">
                    Upload from Library
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
                    Select one or multiple photos (JPEG, PNG, WebP) from your device. Each image creates an independent garment entry.
                  </p>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-between text-xs font-bold text-[var(--text-heading)] group-hover:text-[var(--gold-primary)] transition-colors">
                <span>Select Photos</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Choice 3: Manual Entry */}
            <button
              type="button"
              onClick={handleStartManualEntry}
              className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--gold-primary)] transition-all cursor-pointer group flex flex-col justify-between hover:shadow-xl relative overflow-hidden text-left w-full"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold-primary)] group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--gold-primary)] font-bold">
                    Option C • Direct Spec
                  </span>
                  <h3 className="font-playfair text-xl font-bold text-[var(--text-heading)] mt-0.5">
                    Manual Entry
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
                    Catalog a garment without a photo. Specify bespoke brand, silhouettes, fabric tones, and formality tiers directly.
                  </p>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-between text-xs font-bold text-[var(--text-heading)] group-hover:text-[var(--gold-primary)] transition-colors">
                <span>Direct Form</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* Quick Curated Editorial Presets */}
          <div className="pt-6 border-t border-[var(--border-card)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] font-semibold">
                  Or Test Instantly with Editorial Specimens
                </span>
                <p className="text-xs text-[var(--text-muted)]">
                  Click any curated sartorial archetype to pre-load a calibrated garment specification.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_EDITORIAL_PIECES.map((piece, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(piece)}
                  className="p-3 rounded-2xl border border-[var(--border-card)] bg-[var(--pill-bg)]/40 hover:border-[var(--gold-primary)] text-left transition-all cursor-pointer group hover:scale-[1.02] flex flex-col justify-between space-y-2"
                >
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-neutral-900 border border-[var(--border-card)] relative">
                    <img
                      src={piece.imageUrl}
                      alt={piece.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5 text-xs bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded-md text-white font-mono">
                      {piece.icon}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[var(--gold-primary)] font-semibold block truncate">
                      {piece.brand}
                    </span>
                    <h4 className="text-xs font-bold text-[var(--text-heading)] line-clamp-1">
                      {piece.name}
                    </h4>
                    <span className="text-[10px] text-[var(--text-muted)] block truncate">
                      {piece.color} • {piece.subType}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2: LIVE CAMERA PREVIEW & CAPTURE                                   */}
      {/* ========================================================================= */}
      {stage === 'camera' && (
        <div className="space-y-6">
          {cameraError ? (
            <div className="p-8 rounded-3xl bg-[var(--bg-card)] border border-amber-500/30 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-playfair text-lg font-bold text-[var(--text-heading)]">
                  Camera Lens Unavailable
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {cameraError}
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleOpenLibrary}
                  className="px-5 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Photo from Library</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartManualEntry}
                  className="px-5 py-2.5 rounded-full bg-[var(--pill-bg)] border border-[var(--border-card)] text-[var(--text-heading)] text-xs font-semibold hover:border-[var(--gold-primary)] transition-all cursor-pointer"
                >
                  Proceed with Manual Entry
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Viewfinder Frame */}
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-black border-2 border-[var(--border-gold)] shadow-2xl flex items-center justify-center">
                {!capturedPhotoUrl ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Viewfinder Overlay Crosshairs */}
                    <div className="absolute inset-6 border border-white/20 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                      <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-white/70">
                        <span className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          OTD • {cameraFacingMode === 'environment' ? 'Rear Lens (Macro/Wide)' : 'Front Lens'}
                        </span>
                        {(availableVideoDevices.length > 1 || isCameraActive) && (
                          <div className="pointer-events-auto">
                            <button
                              type="button"
                              onClick={handleSwitchCamera}
                              className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/25 hover:border-[var(--gold-primary)] hover:text-[var(--gold-primary)] transition-all cursor-pointer shadow-md flex items-center gap-1.5 text-[10px] font-mono"
                              aria-label="Switch camera lens"
                              title="Switch camera lens"
                            >
                              <SwitchCamera className="w-3.5 h-3.5" />
                              <span>Switch Lens</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <span className="text-[11px] font-sans font-medium text-white/80 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full">
                          Frame garment centered in natural lighting
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={capturedPhotoUrl}
                      alt="Captured Garment Snapshot"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white font-mono flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Snapshot Frozen</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Actions Bar */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)]">
                <button
                  type="button"
                  onClick={handleExitCamera}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {!capturedPhotoUrl ? (
                  <button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    disabled={isCapturing || !isCameraActive}
                    className="w-16 h-16 rounded-full border-4 border-[var(--gold-primary)] p-1 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg group disabled:opacity-50"
                    aria-label="Capture photograph"
                  >
                    <div className="w-full h-full rounded-full bg-black dark:bg-white group-hover:opacity-90 transition-opacity" />
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleRetakePhoto}
                      className="px-4 py-2.5 rounded-xl border border-[var(--border-card)] text-xs font-semibold text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retake</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmPhoto}
                      className="px-6 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 transition-all cursor-pointer shadow-md flex items-center gap-2"
                    >
                      <span>Use Photo & Specify Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {!capturedPhotoUrl ? (
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    className="px-3 py-2 rounded-xl border border-[var(--border-card)] bg-[var(--pill-bg)] text-xs font-semibold text-[var(--text-heading)] hover:border-[var(--gold-primary)] hover:text-[var(--gold-primary)] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    aria-label="Switch camera"
                    title={cameraFacingMode === 'environment' ? 'Switch to front camera' : 'Switch to rear camera'}
                  >
                    <SwitchCamera className="w-4 h-4 text-[var(--gold-primary)]" />
                    <span className="hidden sm:inline">
                      {cameraFacingMode === 'environment' ? 'Rear Lens' : 'Front Lens'}
                    </span>
                  </button>
                ) : (
                  <div className="w-14" />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 3: LIBRARY SELECTION & MULTI-IMAGE GALLERY                         */}
      {/* ========================================================================= */}
      {stage === 'library' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Hidden multi-file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleAddFiles(e.target.files)}
          />

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleAddFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all group ${
              isDragging
                ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] scale-[1.01]'
                : 'border-[var(--border-gold)] hover:bg-[var(--pill-bg)]/50'
            }`}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--pill-bg)] border border-[var(--border-card)] flex items-center justify-center text-[var(--gold-primary)] group-hover:scale-110 transition-transform mb-3 shadow-xs">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="font-playfair text-lg sm:text-xl font-bold text-[var(--text-heading)]">
              Choose Garment Photos from Device
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-sm mx-auto">
              Select one or multiple images (JPEG, PNG, WebP up to 15MB each). Each photo creates a distinct garment entry.
            </p>
            <button
              type="button"
              className="mt-4 px-5 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold pointer-events-none shadow-sm"
            >
              Browse Local Library
            </button>
          </div>

          {fileError && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Staged Images Gallery */}
          {stagedFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-heading)]">
                    Staged Photos ({stagedFiles.length})
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    Review and remove any unintended files before cataloging.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl border border-[var(--border-card)] text-xs font-semibold text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add More</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {stagedFiles.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-900 border border-[var(--border-card)] group shadow-xs"
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-2.5 flex flex-col justify-between opacity-90 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveStagedFile(idx);
                          }}
                          className="p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                          aria-label={`Remove photo ${item.file.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-white text-[10px]">
                        <p className="font-semibold truncate">{item.file.name}</p>
                        <p className="text-white/70 font-mono">{(item.file.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Real Measurable Local Processing Progress */}
              {isCompressingBatch && (
                <div className="p-4 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text-heading)] flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--gold-primary)]" />
                      {batchProgressSummary || 'Preparing images locally...'}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">Client-side compression</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div className="h-full bg-[var(--gold-primary)] transition-all duration-300 w-full animate-pulse" />
                  </div>
                </div>
              )}

              {/* Proceed Action */}
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStage('select')}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border-card)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProceedFromLibrary}
                  disabled={isCompressingBatch}
                  className="px-7 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 transition-all cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {isCompressingBatch ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Optimizing Images...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue with {stagedFiles.length} Garment{stagedFiles.length > 1 ? 's' : ''}</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 4: GARMENT METADATA & REUSABLE DETAILS FORM                        */}
      {/* ========================================================================= */}
      {stage === 'form' && activeDraft && (
        <div className="space-y-6">
          {/* Multi-garment Stepper Tabs with Independent Status Badges */}
          <div className="p-4 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-card)] space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--gold-primary)]" />
                <span className="font-bold text-[var(--text-heading)]">
                  Garment Queue: {activeDraftIndex + 1} of {drafts.length}
                </span>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  ({draftCounters.ready} ready • {draftCounters.needsAttention} needs attention
                  {draftCounters.failed > 0 ? ` • ${draftCounters.failed} failed` : ''})
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">
                Local draft auto-saved to IndexedDB
              </span>
            </div>

            {/* Stepper Tabs */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {drafts.map((draft, idx) => {
                const isSelected = idx === activeDraftIndex;

                let statusBadgeBg = 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';
                let statusLabel = 'Selected';
                if (draft.status === 'preparing') {
                  statusBadgeBg = 'bg-amber-500/20 text-amber-700 dark:text-amber-300';
                  statusLabel = 'Preparing';
                } else if (draft.status === 'ready') {
                  statusBadgeBg = 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300';
                  statusLabel = 'Ready';
                } else if (draft.status === 'needs_attention') {
                  statusBadgeBg = 'bg-amber-500/25 text-amber-800 dark:text-amber-200';
                  statusLabel = 'Needs Review';
                } else if (draft.status === 'failed') {
                  statusBadgeBg = 'bg-rose-500/20 text-rose-700 dark:text-rose-300';
                  statusLabel = 'Failed';
                } else if (draft.status === 'saved') {
                  statusBadgeBg = 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
                  statusLabel = 'Saved';
                }

                return (
                  <button
                    key={draft.id}
                    type="button"
                    onClick={() => {
                      setValidationError(null);
                      setActiveDraftIndex(idx);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 shrink-0 cursor-pointer border ${
                      isSelected
                        ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                        : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-md overflow-hidden bg-neutral-900 border border-white/20 shrink-0 flex items-center justify-center text-xs">
                      {draft.imageUrl ? (
                        <img src={draft.imageUrl} alt={draft.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{draft.icon}</span>
                      )}
                    </div>
                    <div className="text-left">
                      <span className="truncate max-w-[110px] block leading-tight font-medium">
                        {draft.name || `Piece #${idx + 1}`}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono uppercase inline-block mt-0.5 ${
                          isSelected ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black' : statusBadgeBg
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DUPLICATE GARMENT HEURISTIC WARNING BANNER */}
          {activeDraft.duplicateOfId && !activeDraft.duplicateWarningDismissed && activeDuplicateItem && (
            <div
              role="alert"
              className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-950 dark:text-amber-100 space-y-4 animate-in fade-in"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-playfair text-sm sm:text-base font-bold">
                      Possible Duplicate Garment Detected
                    </h4>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200">
                      Frontend Heuristic
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                    This staged garment closely matches an existing active item in your Digital Closet ({activeDraft.duplicateReason || 'shared attributes'}).
                    Pending AI recognition verification, please choose how you would like to proceed:
                  </p>
                </div>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Existing Closet Item */}
                <div className="p-3 rounded-2xl bg-white/60 dark:bg-black/40 border border-amber-500/30 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 border border-black/10 shrink-0 flex items-center justify-center text-lg">
                    {activeDuplicateItem.imageUrl ? (
                      <img
                        src={activeDuplicateItem.imageUrl}
                        alt={activeDuplicateItem.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{activeDuplicateItem.icon}</span>
                    )}
                  </div>
                  <div className="min-w-0 text-xs">
                    <span className="text-[10px] uppercase font-mono text-[var(--gold-primary)] font-semibold block">
                      Existing in Wardrobe
                    </span>
                    <p className="font-bold truncate text-[var(--text-heading)]">{activeDuplicateItem.name}</p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {activeDuplicateItem.brand} • {activeDuplicateItem.color} • {activeDuplicateItem.subType}
                    </p>
                  </div>
                </div>

                {/* Newly Staged Garment */}
                <div className="p-3 rounded-2xl bg-white/60 dark:bg-black/40 border border-amber-500/30 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 border border-black/10 shrink-0 flex items-center justify-center text-lg">
                    {activeDraft.imageUrl ? (
                      <img
                        src={activeDraft.imageUrl}
                        alt={activeDraft.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{activeDraft.icon}</span>
                    )}
                  </div>
                  <div className="min-w-0 text-xs">
                    <span className="text-[10px] uppercase font-mono text-amber-600 dark:text-amber-400 font-semibold block">
                      Newly Staged Upload
                    </span>
                    <p className="font-bold truncate text-[var(--text-heading)]">
                      {activeDraft.name || 'Unnamed Piece'}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {activeDraft.brand || 'Bespoke Atelier'} • {activeDraft.color || 'No color'} • {activeDraft.subType}
                    </p>
                  </div>
                </div>
              </div>

              {/* Three Required Action Controls */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleKeepBothDuplicates}
                  className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 transition-all cursor-pointer shadow-sm"
                >
                  Keep Both Pieces
                </button>
                <button
                  type="button"
                  onClick={handleOpenReplaceConfirmation}
                  className="px-4 py-2 rounded-xl border border-amber-600/40 bg-amber-500/20 text-amber-950 dark:text-amber-100 text-xs font-bold hover:bg-amber-500/30 transition-all cursor-pointer"
                >
                  Replace Existing Item...
                </button>
                <button
                  type="button"
                  onClick={handleCancelDuplicateUpload}
                  className="px-4 py-2 rounded-xl border border-black/15 dark:border-white/15 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel This Upload
                </button>
              </div>
            </div>
          )}

          {/* REPLACEMENT ACTIVE NOTIFICATION (When user confirmed Replace Existing) */}
          {activeDraft.replaceTargetId && (
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-900 dark:text-blue-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  <strong>Replacement Queued:</strong> Saving will update and replace{' '}
                  <strong>
                    "{closet.find((i) => i.id === activeDraft.replaceTargetId)?.name || 'existing piece'}"
                  </strong>{' '}
                  while preserving its original wardrobe ID.
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateActiveDraft({ replaceTargetId: undefined })}
                className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:underline cursor-pointer shrink-0"
              >
                Revert to Keep Both
              </button>
            </div>
          )}

          {/* FAILED LOCAL PROCESSING RECOVERY CARD */}
          {activeDraft.status === 'failed' && (
            <div
              role="alert"
              className="p-5 rounded-3xl bg-rose-500/10 border-2 border-rose-500/40 text-rose-950 dark:text-rose-100 space-y-3 animate-in fade-in"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-playfair text-sm sm:text-base font-bold">
                    Local Image Processing Failed
                  </h4>
                  <p className="text-xs text-rose-900/90 dark:text-rose-200/90 mt-0.5 leading-relaxed">
                    {activeDraft.errorMessage ||
                      'The browser could not downscale or encode this image file. Your metadata is fully preserved.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleRetryProcessing(activeDraft.id)}
                  className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Local Processing</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchToManual(activeDraft.id)}
                  className="px-4 py-2 rounded-xl border border-rose-500/30 bg-[var(--pill-bg)] text-xs font-semibold text-[var(--text-heading)] hover:border-[var(--gold-primary)] transition-all cursor-pointer"
                >
                  Proceed with Manual Entry (Discard Photo)
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveDraft(activeDraftIndex)}
                  className="px-4 py-2 rounded-xl border border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer"
                >
                  Remove Item
                </button>
              </div>
            </div>
          )}

          {/* LOW-CONFIDENCE RECOGNITION REVIEW NOTICE */}
          {(activeDraft.needsReview || activeDraft.status === 'needs_attention') &&
            !activeDraft.duplicateOfId &&
            activeDraft.status !== 'failed' && (
              <div className="p-4 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-[var(--gold-primary)] font-bold">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Review Details Required</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Please verify or complete all highlighted fields below. Garment name and primary color are required before cataloging into your Digital Closet.
                </p>
              </div>
            )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Visual Asset Preview */}
            <div className="lg:col-span-4 space-y-4">
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-neutral-900 border border-[var(--border-card)] shadow-lg flex items-center justify-center">
                {activeDraft.imageUrl ? (
                  <>
                    <img
                      src={activeDraft.imageUrl}
                      alt={activeDraft.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-[10px] bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-white font-mono">
                        {activeDraft.icon} {activeDraft.category.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateActiveDraft({ imageUrl: undefined })}
                        className="p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors text-[10px] cursor-pointer"
                        title="Remove photo (switch to manual spec)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-card)] flex items-center justify-center text-3xl">
                      {activeDraft.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-heading)]">Manual Specification</p>
                      <p className="text-[11px] text-[var(--text-muted)]">No photo attached</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Preset Color Swatches */}
              <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] font-semibold block">
                  Quick Palette Swatches:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PALETTE_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.name}
                      type="button"
                      onClick={() => updateActiveDraft({ color: swatch.name })}
                      className="w-7 h-7 rounded-full border border-black/20 dark:border-white/20 transition-transform hover:scale-110 cursor-pointer shadow-xs"
                      style={{ backgroundColor: swatch.hex }}
                      title={swatch.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Detailed Editable Form Fields */}
            <div className="lg:col-span-8 space-y-5 bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-card)]">
              {/* Row 1: Name and Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-heading)] mb-1.5">
                    Garment Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Silk-Cashmere Knit Sweater"
                    value={activeDraft.name}
                    onChange={(e) => updateActiveDraft({ name: e.target.value })}
                    className={`w-full bg-[var(--pill-bg)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-heading)] outline-none font-medium transition-colors ${
                      !activeDraft.name.trim()
                        ? 'border-amber-500/70 focus:border-amber-500'
                        : 'border-[var(--border-card)] focus:border-[var(--gold-primary)]'
                    }`}
                  />
                  {!activeDraft.name.trim() && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block">
                      Name is required for cataloging.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-heading)] mb-1.5">
                    Brand / Atelier <span className="text-[10px] text-[var(--text-muted)] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Loro Piana, Zegna, Bespoke"
                    value={activeDraft.brand}
                    onChange={(e) => updateActiveDraft({ brand: e.target.value })}
                    className="w-full bg-[var(--pill-bg)] border border-[var(--border-card)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-heading)] outline-none focus:border-[var(--gold-primary)] font-medium"
                  />
                </div>
              </div>

              {/* Row 2: Category and Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-heading)] mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={activeDraft.category}
                    onChange={(e) => {
                      const newCat = e.target.value as ClosetItem['category'];
                      updateActiveDraft({
                        category: newCat,
                        subType: CATEGORY_SUBTYPES[newCat][0],
                        icon: CATEGORY_DEFAULT_ICONS[newCat],
                      });
                    }}
                    className="w-full bg-[var(--pill-bg)] border border-[var(--border-card)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-heading)] outline-none focus:border-[var(--gold-primary)] font-medium cursor-pointer"
                  >
                    <option value="tops">👔 Tops / Shirts / Knits</option>
                    <option value="bottoms">👖 Bottoms / Trousers / Denim</option>
                    <option value="outerwear">🧥 Outerwear / Tailoring / Coats</option>
                    <option value="footwear">👞 Footwear / Shoes / Boots</option>
                    <option value="accessories">⌚ Accessories / Horology / Accents</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-heading)] mb-1.5">
                    Subcategory Silhouette
                  </label>
                  <select
                    value={activeDraft.subType}
                    onChange={(e) => updateActiveDraft({ subType: e.target.value })}
                    className="w-full bg-[var(--pill-bg)] border border-[var(--border-card)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-heading)] outline-none focus:border-[var(--gold-primary)] font-medium cursor-pointer"
                  >
                    {CATEGORY_SUBTYPES[activeDraft.category].map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Primary Color & Secondary Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-heading)] mb-1.5">
                    Primary Color Tone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Vicuna Camel, Charcoal"
                    value={activeDraft.color}
                    onChange={(e) => updateActiveDraft({ color: e.target.value })}
                    className={`w-full bg-[var(--pill-bg)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-heading)] outline-none font-medium transition-colors ${
                      !activeDraft.color.trim()
                        ? 'border-amber-500/70 focus:border-amber-500'
                        : 'border-[var(--border-card)] focus:border-[var(--gold-primary)]'
                    }`}
                  />
                  {!activeDraft.color.trim() && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block">
                      Primary color is required for outfit harmony.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-heading)] mb-1.5">
                    Secondary Accent Color <span className="text-[10px] text-[var(--text-muted)] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Antique Brass, Sand"
                    value={activeDraft.secondaryColor || ''}
                    onChange={(e) => updateActiveDraft({ secondaryColor: e.target.value })}
                    className="w-full bg-[var(--pill-bg)] border border-[var(--border-card)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-heading)] outline-none focus:border-[var(--gold-primary)] font-medium"
                  />
                </div>
              </div>

              {/* Row 4: Fit Profile & Formality Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-heading)] mb-1.5">
                    Fit Profile
                  </label>
                  <select
                    value={activeDraft.fit}
                    onChange={(e) => updateActiveDraft({ fit: e.target.value as ClosetItem['fit'] })}
                    className="w-full bg-[var(--pill-bg)] border border-[var(--border-card)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-heading)] outline-none focus:border-[var(--gold-primary)] font-medium cursor-pointer"
                  >
                    <option value="Slim">Slim / Architectural Tailored</option>
                    <option value="Regular">Regular Classic</option>
                    <option value="Relaxed / Tailored">Relaxed / Flowing Drape</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-heading)] mb-1.5">
                    Formality Tier (1-5)
                  </label>
                  <select
                    value={activeDraft.formality}
                    onChange={(e) => updateActiveDraft({ formality: Number(e.target.value) as ClosetItem['formality'] })}
                    className="w-full bg-[var(--pill-bg)] border border-[var(--border-card)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-heading)] outline-none focus:border-[var(--gold-primary)] font-medium cursor-pointer"
                  >
                    <option value={1}>Tier 1: Casual Street / Lounge</option>
                    <option value={2}>Tier 2: Smart Casual</option>
                    <option value={3}>Tier 3: Elevated Social / Date Night</option>
                    <option value={4}>Tier 4: Business Sartorial</option>
                    <option value={5}>Tier 5: Formal Black-Tie</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Season Suitability */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-heading)] mb-1.5">
                  Season Calibration
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['all-season', 'spring', 'summer', 'autumn', 'winter'] as const).map((seasonKey) => {
                    const isSelected = activeDraft.season.includes(seasonKey);
                    return (
                      <button
                        key={seasonKey}
                        type="button"
                        onClick={() => {
                          if (seasonKey === 'all-season') {
                            updateActiveDraft({ season: ['all-season'] });
                          } else {
                            const withoutAll = activeDraft.season.filter((s) => s !== 'all-season');
                            const next = isSelected
                              ? withoutAll.filter((s) => s !== seasonKey)
                              : [...withoutAll, seasonKey];
                            updateActiveDraft({ season: next.length === 0 ? ['all-season'] : next });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                            : 'bg-[var(--pill-bg)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                        }`}
                      >
                        {seasonKey.charAt(0).toUpperCase() + seasonKey.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 6: Pattern & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-heading)] mb-1.5">
                    Pattern & Fabric Weave
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Solid, Chalkstripe, Houndstooth"
                    value={activeDraft.pattern}
                    onChange={(e) => updateActiveDraft({ pattern: e.target.value })}
                    className="w-full bg-[var(--pill-bg)] border border-[var(--border-card)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-heading)] outline-none focus:border-[var(--gold-primary)] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-heading)] mb-1.5">
                    Styling Notes <span className="text-[10px] text-[var(--text-muted)] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Pair with flannel trousers"
                    value={activeDraft.description}
                    onChange={(e) => updateActiveDraft({ description: e.target.value })}
                    className="w-full bg-[var(--pill-bg)] border border-[var(--border-card)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-heading)] outline-none focus:border-[var(--gold-primary)] font-medium"
                  />
                </div>
              </div>

              {/* Navigation between multiple items */}
              {drafts.length > 1 && (
                <div className="pt-4 border-t border-[var(--border-card)] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setValidationError(null);
                      setActiveDraftIndex((prev) => Math.max(0, prev - 1));
                    }}
                    disabled={activeDraftIndex === 0}
                    className="px-4 py-2 rounded-xl border border-[var(--border-card)] text-xs font-semibold text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous Piece</span>
                  </button>

                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    {activeDraftIndex + 1} / {drafts.length}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setValidationError(null);
                      setActiveDraftIndex((prev) => Math.min(drafts.length - 1, prev + 1));
                    }}
                    disabled={activeDraftIndex === drafts.length - 1}
                    className="px-4 py-2 rounded-xl border border-[var(--border-card)] text-xs font-semibold text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <span>Next Piece</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EXPLICIT REPLACEMENT CONFIRMATION                                */}
      {/* ========================================================================= */}
      {pendingReplacementMatch && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-[var(--bg-card)] border-2 border-amber-500/50 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-playfair text-lg font-bold text-[var(--text-heading)]">
                  Confirm Wardrobe Replacement
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                  You are about to replace <strong>"{pendingReplacementMatch.existingItem.name}"</strong> with this new upload.
                  The existing item will be updated upon saving.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-card)] text-xs space-y-1">
              <p className="font-semibold text-[var(--text-heading)]">
                Target: {pendingReplacementMatch.existingItem.name}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                Brand: {pendingReplacementMatch.existingItem.brand} • Category: {pendingReplacementMatch.existingItem.category}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingReplacementMatch(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border-card)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReplace}
                className="px-5 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Confirm & Queue Replacement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DISCARD DRAFT CONFIRMATION                                      */}
      {/* ========================================================================= */}
      {showDiscardConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-[var(--bg-card)] border border-rose-500/40 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-playfair text-lg font-bold text-[var(--text-heading)]">
                  Discard Upload Draft?
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                  Are you sure you want to discard this draft session? All unsaved garment specifications and staged photos will be permanently deleted from local storage.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border-card)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-all cursor-pointer"
              >
                Keep Editing Draft
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscardDraft}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Yes, Discard Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUDITING & SIMULATION TOOLS (Development-only)                            */}
      {/* ========================================================================= */}
      {isDev && (
        <div className="pt-6 border-t border-[var(--border-card)]">
          <button
            type="button"
            onClick={() => setShowTestingControls((prev) => !prev)}
            className="text-[11px] font-mono text-[var(--gold-primary)] hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showTestingControls ? 'Hide QA Simulation Controls' : 'Show Task 7 QA Simulation Controls (Dev Only)'}</span>
          </button>

          {showTestingControls && (
            <div className="mt-3 p-4 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-card)] space-y-3 animate-in fade-in">
              <div>
                <p className="text-xs font-bold text-[var(--text-heading)]">Development QA Simulation Triggers</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Use these controls to test edge cases, error states, and storage recovery without real corrupted files.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (activeDraft) {
                      // Match the first item in closet
                      const target = closet[0];
                      if (target) {
                        updateActiveDraft({
                          name: target.name,
                          brand: target.brand,
                          category: target.category,
                          subType: target.subType,
                          color: target.color,
                          duplicateWarningDismissed: false,
                        });
                      }
                    }
                  }}
                  disabled={!activeDraft || stage !== 'form'}
                  className="px-3 py-1.5 rounded-xl border border-[var(--border-card)] text-[10px] font-semibold text-[var(--text-heading)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer disabled:opacity-40"
                >
                  Trigger Duplicate Garment Heuristic
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (activeDraft) {
                      updateActiveDraft({
                        name: '',
                        color: '',
                        status: 'needs_attention',
                        needsReview: true,
                      });
                    }
                  }}
                  disabled={!activeDraft || stage !== 'form'}
                  className="px-3 py-1.5 rounded-xl border border-[var(--border-card)] text-[10px] font-semibold text-[var(--text-heading)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer disabled:opacity-40"
                >
                  Simulate Low-Confidence AI Draft
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (activeDraft) {
                      updateActiveDraft({
                        status: 'failed',
                        errorMessage: 'Simulated image compression failure for QA testing.',
                        errorCode: 'PROCESSING_FAILED',
                      });
                    }
                  }}
                  disabled={!activeDraft || stage !== 'form'}
                  className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[10px] font-semibold hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-40"
                >
                  Simulate Processing Error
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const currentSim = getSimulateIndexedDBFailure();
                    setSimulateIndexedDBFailure(!currentSim);
                    setIsIndexedDBRestricted(!currentSim);
                    if (!currentSim && drafts.length > 0) {
                      saveDraftSession(drafts, stage, activeDraftIndex);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-[var(--border-card)] text-[10px] font-semibold text-[var(--text-heading)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
                >
                  Toggle Simulated IndexedDB Failure ({getSimulateIndexedDBFailure() ? 'Active' : 'Off'})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('otd:storage-quota-exceeded', {
                        detail: {
                          message: 'Simulated storage quota exceeded event for testing browser error states.',
                        },
                      })
                    );
                  }}
                  className="px-3 py-1.5 rounded-xl border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-semibold hover:bg-amber-500/10 transition-colors cursor-pointer"
                >
                  Simulate Storage Quota Event
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
