/**
 * Backend API DTO contracts for Events, Venues, Venue Intelligence, and Weather.
 * Mirrors AI-FASHION-OTD/src/modules/{events,venues,weather}/* and models/{Event,Venue,VenueIntelligence,WeatherSnapshot}.ts.
 */

import type { IsoDateString, MongoRecordDto, ObjectIdString } from './common.dto';

export interface BackendEventDto extends MongoRecordDto {
  id: ObjectIdString;
  userId: ObjectIdString;
  title: string;
  description: string;
  eventType: string;
  date: IsoDateString;
  location: string;
  dressCode: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

/** Validated by `createEventSchema.strict()` in events.validator.ts. */
export interface CreateEventRequestDto {
  title: string;
  description?: string;
  eventType: string;
  date: IsoDateString;
  location?: string;
  dressCode?: string;
}

export type UpdateEventRequestDto = Partial<CreateEventRequestDto>;

export interface EventListQueryDto {
  page?: number;
  limit?: number;
  eventType?: string;
  fromDate?: IsoDateString;
  toDate?: IsoDateString;
  search?: string;
  sortBy?: 'date' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export type BackendVenueTypeDto =
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

export interface BackendVenueDto extends MongoRecordDto {
  name: string;
  venueType: BackendVenueTypeDto;
  description?: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  dressCode?: string;
  indoor: boolean;
  suitableOccasions: string[];
  imageUrl?: string;
  websiteUrl?: string;
  createdBy?: ObjectIdString;
  isActive: boolean;
}

export interface CreateVenueRequestDto {
  name: string;
  venueType?: BackendVenueTypeDto;
  description?: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  dressCode?: string;
  indoor?: boolean;
  suitableOccasions?: string[];
  imageUrl?: string;
  websiteUrl?: string;
}

export interface VenueListQueryDto {
  city?: string;
  venueType?: BackendVenueTypeDto;
  search?: string;
  indoor?: boolean;
  page?: number;
  limit?: number;
}

export type BackendVenueIntelligenceTypeDto =
  | 'dress_code'
  | 'weather'
  | 'occasion'
  | 'style_recommendation'
  | 'cultural_guidelines'
  | 'general';

export interface BackendVenueIntelligenceDto extends MongoRecordDto {
  venueId?: ObjectIdString;
  userId: ObjectIdString;
  venueName: string;
  venueType?: string;
  occasion?: string;
  dressCode?: string;
  recommendedStyles: string[];
  recommendedColors: string[];
  recommendedClothing: string[];
  weatherSummary?: string;
  temperatureCelsius?: number;
  indoor?: boolean;
  intelligenceType: BackendVenueIntelligenceTypeDto;
  summary: string;
  recommendations: string[];
  source?: string;
  expiresAt?: IsoDateString;
}

export type BackendWeatherConditionDto =
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

/**
 * Validated by `weatherCoordinatesQuerySchema` in weather.validator.ts.
 * Note: HTTP query params use `lat` & `lon` (NOT `latitude`/`longitude`).
 */
export interface WeatherCoordinatesQueryDto {
  lat: number;
  lon: number;
}

export interface WeatherCityQueryDto {
  city: string;
  country?: string;
}

export interface BackendWeatherDataDto {
  city: string;
  country?: string;
  temperatureCelsius: number;
  feelsLikeCelsius?: number;
  humidity?: number;
  condition: BackendWeatherConditionDto;
  description?: string;
  isRaining: boolean;
  recordedAt: IsoDateString;
  clothingAdvice: {
    layering: string;
    recommendedCategories: string[];
    recommendedMaterials: string[];
    tips: string[];
  };
}

