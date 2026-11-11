/**
 * Frontend domain models for Calendar Events, Weekly Schedule,
 * Destination Venues, Venue Intelligence, and Weather Context.
 */

import type { EntityOrigin } from './common';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface OccasionDefinition {
  id: string;
  label: string;
  description?: string;
  defaultFormality?: number;
}

export interface VenueCategoryDefinition {
  id: string;
  label: string;
  dressCodeHint?: string;
}

export type VenuePlaceType =
  | 'restaurant'
  | 'cafe'
  | 'office'
  | 'college'
  | 'hotel'
  | 'wedding_hall'
  | 'party_hall'
  | 'outdoor'
  | 'shopping_mall'
  | 'other';

export interface VenuePlace {
  id: string;
  backendId?: string;
  origin: EntityOrigin;
  name: string;
  category: string;
  venueType: VenuePlaceType;
  city: string;
  address?: string;
  state?: string;
  country?: string;
  coordinates?: GeoCoordinates;
  vibe: string;
  dressCode: string;
  indoor: boolean;
  suitableOccasions: string[];
  description: string;
  imageUrl: string;
  websiteUrl?: string;
  trending?: boolean;
  isActive: boolean;
}

export interface VenueDressIntelligence {
  id?: string;
  venueId?: string;
  venueName: string;
  venueType?: string;
  occasion?: string;
  dressCode?: string;
  indoor: boolean;
  recommendedStyles: string[];
  recommendedColors: string[];
  recommendedClothing: string[];
  weatherSummary?: string;
  temperatureCelsius?: number;
  summary: string;
  recommendations: string[];
}

export type WeatherConditionType =
  | 'sunny'
  | 'cloudy'
  | 'partly_cloudy'
  | 'rainy'
  | 'stormy'
  | 'windy'
  | 'snowy'
  | 'foggy'
  | 'humid'
  | 'unknown';

export interface WeatherContext {
  city: string;
  country?: string;
  temperatureCelsius: number;
  feelsLikeCelsius?: number;
  humidity?: number;
  condition: WeatherConditionType;
  description?: string;
  isRaining: boolean;
  recordedAt?: string;
  clothingAdvice?: {
    layering: string;
    recommendedCategories: string[];
    recommendedMaterials: string[];
    tips: string[];
  };
}

export interface ScheduledEvent {
  id: string;
  backendId?: string;
  origin: EntityOrigin;
  title: string;
  description: string;
  eventType: string;
  date: string;
  location: string;
  dressCode: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WeekScheduleDayEntry {
  dayLabel: string;
  dateNum: string;
  isoDate?: string;
  isToday: boolean;
  event: string;
  occasion: string;
  weather: string;
  venue: string;
  status: string;
  eventId?: string;
}

