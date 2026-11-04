import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Edit, Upload, Trash2, Check, AlertCircle } from 'lucide-react';
import type { ClosetItem } from '../context/ClosetContext';
import { compressImageFile } from '../utils/imageCompressor';

export interface EditPieceModalProps {
  isOpen: boolean;
  item: ClosetItem | null;
  onClose: () => void;
  onSave: (updatedItem: ClosetItem) => void;
}

const getCategoryIcon = (category: ClosetItem['category']): string => {
  switch (category) {
    case 'tops':
      return '👕';
    case 'bottoms':
      return '👖';
    case 'outerwear':
      return '🧥';
    case 'footwear':
      return '👞';
    case 'accessories':
      return '⌚';
    default:
      return '✨';
  }
};

interface EditFormContentProps {
  item: ClosetItem;
  onClose: () => void;
  onSave: (updatedItem: ClosetItem) => void;
}

const EditFormContent: React.FC<EditFormContentProps> = ({
  item,
  onClose,
  onSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields initialized directly from item
  const [name, setName] = useState(item.name || '');
  const [brand, setBrand] = useState(item.brand || '');
  const [category, setCategory] = useState<ClosetItem['category']>(item.category || 'outerwear');
  const [subType, setSubType] = useState(item.subType || '');
  const [color, setColor] = useState(item.color || '');
  const [fit, setFit] = useState<ClosetItem['fit']>(item.fit || 'Regular');
  const [formality, setFormality] = useState<ClosetItem['formality']>(item.formality ?? 3);
  const [description, setDescription] = useState(item.description || '');

  // Image & preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(item.imageUrl || null);
  const [icon, setIcon] = useState(item.icon || getCategoryIcon(item.category || 'outerwear'));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Validation & status state
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    brand?: string;
    color?: string;
  }>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Determine if user has made any changes
  const isDirty = Boolean(
    name.trim() !== (item.name || '').trim() ||
      brand.trim() !== (item.brand || '').trim() ||
      category !== item.category ||
      subType.trim() !== (item.subType || '').trim() ||
      color.trim() !== (item.color || '').trim() ||
      fit !== item.fit ||
      formality !== item.formality ||
      description.trim() !== (item.description || '').trim() ||
      (previewUrl || null) !== (item.imageUrl || null) ||
      selectedFile !== null
  );

  const handleAttemptClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Keyboard accessibility: ESC key to attempt close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
        } else {
          handleAttemptClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDiscardConfirm, handleAttemptClose]);

  const handleFile = async (file: File) => {
    setFileError(null);
    if (!file.type.startsWith('image/')) {
      setFileError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setFileError('Image size exceeds 15MB limit. Please choose a smaller file.');
      return;
    }

    setSelectedFile(file);
    try {
      // Compress the image before storing to prevent localStorage QuotaExceededError
      const compressedDataUrl = await compressImageFile(file, 800, 0.82);
      setPreviewUrl(compressedDataUrl);
    } catch {
      // Fallback to raw FileReader if canvas compression fails
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPreviewUrl(dataUrl);
      };
      reader.onerror = () => {
        setFileError('Unable to read selected file. Please try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCategoryChange = (newCat: ClosetItem['category']) => {
    setCategory(newCat);
    if (!previewUrl) {
      setIcon(getCategoryIcon(newCat));
    }
  };

  const validate = (): boolean => {
    const errors: { name?: string; brand?: string; color?: string } = {};
    if (!name.trim()) {
      errors.name = 'Garment name is required.';
    }
    if (!brand.trim()) {
      errors.brand = 'Brand or maker is required.';
    }
    if (!color.trim()) {
      errors.color = 'Color family is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);

    const updatedItem: ClosetItem = {
      ...item,
      id: item.id, // Preserves the selected garment's unique ID
      name: name.trim(),
      brand: brand.trim(),
      category,
      subType: subType.trim() || item.subType || 'Garment Piece',
      color: color.trim(),
      fit,
      formality,
      icon: icon || getCategoryIcon(category),
      imageUrl: previewUrl ? previewUrl : undefined,
      description: description.trim() ? description.trim() : undefined,
    };

    setIsSuccess(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSuccess(false);
      onSave(updatedItem);
    }, 450);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-garment-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={handleAttemptClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') handleAttemptClose();
      }}
    >
      <div
        className="relative w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 border border-[var(--border-gold)] shadow-2xl bg-[var(--bg-card)] text-[var(--text-body)] max-h-[92vh] overflow-y-auto transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleAttemptClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
          aria-label="Close edit modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold-primary)] shrink-0">
            <Edit className="w-6 h-6" />
          </div>
          <div>
            <h3 id="edit-garment-title" className="font-playfair text-2xl font-bold text-[var(--text-heading)]">
              Edit Garment Piece
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-medium">
              Update garment details, tailoring specifications, and imagery
            </p>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Garment Image Preview & Replacement Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-3.5 rounded-2xl border transition-all ${
              isDragging
                ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] scale-[1.01]'
                : 'border-[var(--border-card)] bg-[var(--pill-bg)]/60'
            }`}
          >
            <div className="flex items-center gap-3.5">
              {/* Preview Thumbnail */}
              <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden bg-neutral-900 border border-[var(--border-gold)] shrink-0 flex items-center justify-center text-3xl shadow-sm relative group">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={name || 'Garment'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{icon}</span>
                )}
              </div>

              {/* Image Info & Controls */}
              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[10px] uppercase font-mono font-semibold text-[var(--gold-primary)] block">
                  {previewUrl ? 'Garment Imagery' : 'Icon Representation'}
                </span>
                <p className="text-xs font-bold text-[var(--text-heading)] truncate">
                  {name || 'Garment Piece'}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(0)} KB • New replacement photo`
                    : previewUrl
                    ? 'Active photo attached'
                    : 'No photo • Category icon active'}
                </p>

                {/* Image Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[var(--border-gold)] bg-[var(--bg-card)] text-[var(--gold-primary)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer text-[11px] font-semibold"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{previewUrl ? 'Change Image' : 'Upload Image'}</span>
                  </button>

                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-[11px] font-semibold"
                      title="Remove image and revert to icon"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Drag & Drop Hint */}
            <div className="mt-2.5 pt-2 border-t border-[var(--border-card)]/60 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
              <span>Supports JPG, PNG, WebP up to 10MB</span>
              <span className="hidden sm:inline">Drag & drop photo directly to replace</span>
            </div>
          </div>

          {/* File Error Alert */}
          {fileError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Field: Garment Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[var(--text-muted)] mb-1">
                Garment Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) {
                    setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                placeholder="e.g. Double-Breasted Wool Blazer"
                className={`w-full bg-[var(--bg-card)] border rounded-xl px-3 py-2 text-[var(--text-heading)] font-medium outline-none transition-colors ${
                  fieldErrors.name
                    ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200'
                    : 'border-[var(--border-card)] focus:border-[var(--gold-primary)]'
                }`}
              />
              {fieldErrors.name && (
                <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] uppercase font-semibold text-[var(--text-muted)] mb-1">
                Brand / Maker <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  if (fieldErrors.brand) {
                    setFieldErrors((prev) => ({ ...prev, brand: undefined }));
                  }
                }}
                placeholder="e.g. Loro Piana, Zegna, Bespoke"
                className={`w-full bg-[var(--bg-card)] border rounded-xl px-3 py-2 text-[var(--text-heading)] font-medium outline-none transition-colors ${
                  fieldErrors.brand
                    ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200'
                    : 'border-[var(--border-card)] focus:border-[var(--gold-primary)]'
                }`}
              />
              {fieldErrors.brand && (
                <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                  {fieldErrors.brand}
                </p>
              )}
            </div>
          </div>

          {/* Field: Category & Sub-Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[var(--text-muted)] mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as ClosetItem['category'])}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-[var(--text-heading)] font-medium outline-none focus:border-[var(--gold-primary)] cursor-pointer"
              >
                <option value="tops">Tops / Shirts / Knits</option>
                <option value="bottoms">Bottoms / Trousers / Denim</option>
                <option value="outerwear">Outerwear / Jackets</option>
                <option value="footwear">Footwear / Shoes</option>
                <option value="accessories">Accessories / Timepiece</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-semibold text-[var(--text-muted)] mb-1">
                Garment Sub-Type / Cut
              </label>
              <input
                type="text"
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                placeholder="e.g. Overcoat, Flannel Trousers, Oxford Shirt"
                className="w-full bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-[var(--text-heading)] font-medium outline-none focus:border-[var(--gold-primary)]"
              />
            </div>
          </div>

          {/* Field: Color Family & Fit Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[var(--text-muted)] mb-1">
                Color Family <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  if (fieldErrors.color) {
                    setFieldErrors((prev) => ({ ...prev, color: undefined }));
                  }
                }}
                placeholder="e.g. Vicuna Camel, Ivory Cream, Deep Navy"
                className={`w-full bg-[var(--bg-card)] border rounded-xl px-3 py-2 text-[var(--text-heading)] font-medium outline-none transition-colors ${
                  fieldErrors.color
                    ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200'
                    : 'border-[var(--border-card)] focus:border-[var(--gold-primary)]'
                }`}
              />
              {fieldErrors.color && (
                <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                  {fieldErrors.color}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] uppercase font-semibold text-[var(--text-muted)] mb-1">
                Fit Profile <span className="text-rose-500">*</span>
              </label>
              <select
                value={fit}
                onChange={(e) => setFit(e.target.value as ClosetItem['fit'])}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-[var(--text-heading)] font-medium outline-none focus:border-[var(--gold-primary)] cursor-pointer"
              >
                <option value="Slim">Slim / Tailored</option>
                <option value="Regular">Regular Classic</option>
                <option value="Relaxed / Tailored">Relaxed / Drape</option>
              </select>
            </div>
          </div>

          {/* Field: Formality Tier */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[var(--text-muted)] mb-1">
              Formality Tier (1–5) <span className="text-rose-500">*</span>
            </label>
            <select
              value={formality}
              onChange={(e) => setFormality(Number(e.target.value) as ClosetItem['formality'])}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-[var(--text-heading)] font-medium outline-none focus:border-[var(--gold-primary)] cursor-pointer"
            >
              <option value={1}>Tier 1: Casual Street / Lounge</option>
              <option value={2}>Tier 2: Smart Casual</option>
              <option value={3}>Tier 3: Elevated Social / Date</option>
              <option value={4}>Tier 4: Business Sartorial</option>
              <option value={5}>Tier 5: Formal Black-Tie</option>
            </select>
          </div>

          {/* Field: Optional Description */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[var(--text-muted)] mb-1">
              Garment Notes / Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 6-ply undyed Scottish cashmere, ideal for crisp autumn layering and formal date ensembles..."
              rows={2}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-[var(--text-heading)] font-medium outline-none focus:border-[var(--gold-primary)] resize-none"
            />
          </div>

          {/* Action Buttons: Cancel and Save Changes */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="px-5 py-2.5 rounded-xl border border-[var(--border-card)] text-xs font-semibold hover:bg-[var(--pill-bg)] text-[var(--text-heading)] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md hover:opacity-95 transition-all disabled:opacity-50"
            >
              {isSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span>Changes Saved!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Discard Unsaved Changes Confirmation Modal */}
      {showDiscardConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowDiscardConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[var(--bg-card)] border border-[var(--border-gold)] p-6 space-y-4 shadow-2xl text-xs text-center animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-[var(--pill-bg)] text-[var(--gold-primary)] flex items-center justify-center mx-auto border border-[var(--border-gold)]">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-playfair text-lg font-bold text-[var(--text-heading)]">
                Discard Unsaved Changes?
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                You have unsaved changes on <strong>"{item.name}"</strong>. Closing now will discard your modifications.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border-card)] font-semibold text-[var(--text-heading)] hover:bg-[var(--pill-bg)] cursor-pointer transition-colors"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-sm transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const EditPieceModal: React.FC<EditPieceModalProps> = ({
  isOpen,
  item,
  onClose,
  onSave,
}) => {
  if (!isOpen || !item) return null;

  return (
    <EditFormContent
      key={item.id}
      item={item}
      onClose={onClose}
      onSave={onSave}
    />
  );
};
