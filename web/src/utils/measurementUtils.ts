/**
 * Shared measurement parsing, conversion, validation, and formatting helpers
 * keeping OnboardingModal, UserProfileModal, SettingsModal, and profile adapters synchronized.
 */

export type MeasurementUnitSystem = 'metric' | 'imperial';
export type HeightUnit = 'cm' | 'ft';
export type WeightUnit = 'kg' | 'lbs';

export interface ParsedHeight {
  value: string;
  unit: HeightUnit;
}

export interface ParsedWeight {
  value: string;
  unit: WeightUnit;
}

function parseImperialHeightInches(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Match forms like `5'11"`, `5' 11`, `5 ft 11 in`, `5ft`
  const ftInMatch = trimmed.match(/^(\d)\s*(?:'|ft|feet)\s*(\d{1,2})?\s*(?:"|in|inches)?$/i);
  if (ftInMatch?.[1]) {
    const feet = Number(ftInMatch[1]);
    const inches = ftInMatch[2] !== undefined ? Number(ftInMatch[2]) : 0;
    if (Number.isFinite(feet) && Number.isFinite(inches) && feet >= 2 && feet <= 8 && inches >= 0 && inches < 12) {
      return feet * 12 + inches;
    }
    return null;
  }

  // Fallback for decimal feet like `5.9`
  if (/^\d(?:\.\d{1,2})?$/.test(trimmed)) {
    const decimalFeet = Number(trimmed);
    if (Number.isFinite(decimalFeet) && decimalFeet >= 2 && decimalFeet <= 8.95) {
      return Math.round(decimalFeet * 12);
    }
  }

  return null;
}

function formatInchesAsFeetInches(totalInches: number): string {
  const rounded = Math.round(totalInches);
  const feet = Math.floor(rounded / 12);
  const inches = rounded % 12;
  return `${feet}'${inches}"`;
}

export function parseHeightPrefill(
  raw?: string,
  preferredSystem: MeasurementUnitSystem = 'metric',
): ParsedHeight {
  const defaultUnit: HeightUnit = preferredSystem === 'imperial' ? 'ft' : 'cm';
  const trimmed = (raw || '').trim();
  if (!trimmed) {
    return { value: '', unit: defaultUnit };
  }

  const cmMatch = trimmed.match(/(\d{2,3}(?:\.\d+)?)\s*cm\b/i);
  const impMatch = trimmed.match(/(\d)\s*(?:'|ft)\s*(\d{1,2})?\s*(?:"|in)?/i);

  // When dual-format string like `5'11" (180 cm)` is stored, honor active Settings measurementUnit
  if (cmMatch && impMatch) {
    if (preferredSystem === 'imperial') {
      const feet = impMatch[1];
      const inches = impMatch[2] ?? '0';
      return { value: `${feet}'${inches}"`, unit: 'ft' };
    }
    return { value: String(Math.round(Number(cmMatch[1]))), unit: 'cm' };
  }

  if (cmMatch?.[1]) {
    return { value: String(Math.round(Number(cmMatch[1]))), unit: 'cm' };
  }

  if (impMatch?.[1]) {
    const feet = impMatch[1];
    const inches = impMatch[2] !== undefined ? impMatch[2] : '0';
    return { value: `${feet}'${inches}"`, unit: 'ft' };
  }

  if (/^\d{2,3}(?:\.\d+)?$/.test(trimmed)) {
    return { value: trimmed, unit: 'cm' };
  }

  return { value: trimmed, unit: defaultUnit };
}

export function parseWeightPrefill(
  raw?: string,
  preferredSystem: MeasurementUnitSystem = 'metric',
): ParsedWeight {
  const defaultUnit: WeightUnit = preferredSystem === 'imperial' ? 'lbs' : 'kg';
  const trimmed = (raw || '').trim();
  if (!trimmed) {
    return { value: '', unit: defaultUnit };
  }

  const lbsMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*lbs?\b/i);
  if (lbsMatch?.[1]) {
    return { value: lbsMatch[1], unit: 'lbs' };
  }

  const kgMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*kg\b/i);
  if (kgMatch?.[1]) {
    return { value: kgMatch[1], unit: 'kg' };
  }

  return { value: trimmed, unit: defaultUnit };
}

export function convertHeightValue(
  rawValue: string,
  fromUnit: HeightUnit,
  toUnit: HeightUnit,
): string {
  const trimmed = rawValue.trim();
  if (!trimmed || fromUnit === toUnit) return trimmed;

  if (fromUnit === 'cm' && toUnit === 'ft') {
    const cm = Number(trimmed.replace(/\s*cm\s*$/i, ''));
    if (Number.isFinite(cm) && cm >= 50 && cm <= 300) {
      return formatInchesAsFeetInches(cm / 2.54);
    }
    return trimmed;
  }

  if (fromUnit === 'ft' && toUnit === 'cm') {
    const totalInches = parseImperialHeightInches(trimmed);
    if (totalInches !== null) {
      const cm = Math.round(totalInches * 2.54);
      if (cm >= 50 && cm <= 300) {
        return String(cm);
      }
    }
    return trimmed;
  }

  return trimmed;
}

export function convertWeightValue(
  rawValue: string,
  fromUnit: WeightUnit,
  toUnit: WeightUnit,
): string {
  const trimmed = rawValue.trim();
  if (!trimmed || fromUnit === toUnit) return trimmed;

  const numeric = Number(trimmed.replace(/\s*(?:kg|lbs?)\s*$/i, ''));
  if (!Number.isFinite(numeric) || numeric <= 0) return trimmed;

  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return String(Math.round(numeric * 2.20462));
  }

  if (fromUnit === 'lbs' && toUnit === 'kg') {
    return String(Math.round(numeric / 2.20462));
  }

  return trimmed;
}

export function normalizeHeightForSystem(
  raw: string | undefined,
  targetSystem: MeasurementUnitSystem,
): string {
  const parsed = parseHeightPrefill(raw, targetSystem);
  if (!parsed.value) return '';
  const targetUnit: HeightUnit = targetSystem === 'imperial' ? 'ft' : 'cm';
  const converted = convertHeightValue(parsed.value, parsed.unit, targetUnit);
  return formatHeightForStorage(converted, targetUnit);
}

export function normalizeWeightForSystem(
  raw: string | undefined,
  targetSystem: MeasurementUnitSystem,
): string {
  const parsed = parseWeightPrefill(raw, targetSystem);
  if (!parsed.value) return '';
  const targetUnit: WeightUnit = targetSystem === 'imperial' ? 'lbs' : 'kg';
  const converted = convertWeightValue(parsed.value, parsed.unit, targetUnit);
  return formatWeightForStorage(converted, targetUnit);
}

export function validateOptionalHeight(raw: string, unit: HeightUnit): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (unit === 'cm') {
    const numeric = Number(trimmed.replace(/\s*cm\s*$/i, ''));
    if (!Number.isFinite(numeric) || numeric < 50 || numeric > 300) {
      return `Enter height between 50 and 300 cm (or leave blank — 100% optional).`;
    }
    return null;
  }

  const inches = parseImperialHeightInches(trimmed);
  if (inches === null || inches < 24 || inches > 108) {
    return `Enter height in ft/in (e.g. 5'10") or leave blank — 100% optional.`;
  }
  return null;
}

export function validateOptionalWeight(raw: string, unit: WeightUnit): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const numeric = Number(trimmed.replace(/\s*(?:kg|lbs?)\s*$/i, ''));
  if (!Number.isFinite(numeric)) {
    return `Enter a numeric weight in ${unit} (or leave blank — 100% optional).`;
  }

  if (unit === 'kg' && (numeric < 20 || numeric > 350)) {
    return `Enter weight between 20 and 350 kg (or leave blank).`;
  }

  if (unit === 'lbs' && (numeric < 45 || numeric > 770)) {
    return `Enter weight between 45 and 770 lbs (or leave blank).`;
  }

  return null;
}

export function formatHeightForStorage(raw: string, unit: HeightUnit): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  if (unit === 'ft') {
    const inches = parseImperialHeightInches(trimmed);
    if (inches !== null) {
      return formatInchesAsFeetInches(inches);
    }
    if (/\bft\b/i.test(trimmed) || trimmed.includes("'")) {
      return trimmed;
    }
    return `${trimmed} ft`;
  }

  const stripped = trimmed.replace(/\s*cm\s*$/i, '').trim();
  return `${stripped} cm`;
}

export function formatWeightForStorage(raw: string, unit: WeightUnit): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const stripped = trimmed.replace(/\s*(?:kg|lbs?)\s*$/i, '').trim();
  return `${stripped} ${unit}`;
}

