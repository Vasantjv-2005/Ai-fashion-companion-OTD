/**
 * Bidirectional Calendar Events, Venues, Venue Intelligence, and Weather adapters.
 */

import type {
  BackendEventDto,
  BackendVenueDto,
  BackendVenueIntelligenceDto,
  BackendWeatherDataDto,
  CreateEventRequestDto,
  CreateVenueRequestDto,
  UpdateEventRequestDto,
  WeatherCoordinatesQueryDto,
} from '../types/api';
import type {
  GeoCoordinates,
  ScheduledEvent,
  VenueDressIntelligence,
  VenuePlace,
  WeatherContext,
} from '../types/domain';
import {
  extractRecordId,
  isMongoObjectId,
  normalizeStringArray,
  toIsoString,
} from './shared.adapter';

const DEFAULT_VENUE_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80';

export function mapEventDtoToDomain(dto: BackendEventDto): ScheduledEvent {
  const id = extractRecordId(dto);
  return {
    id,
    backendId: isMongoObjectId(id) ? id : undefined,
    origin: 'api',
    title: dto.title.trim(),
    description: dto.description ?? '',
    eventType: dto.eventType || 'casual',
    date: toIsoString(dto.date),
    location: dto.location ?? '',
    dressCode: dto.dressCode || 'casual',
    createdAt: dto.createdAt ? toIsoString(dto.createdAt) : undefined,
    updatedAt: dto.updatedAt ? toIsoString(dto.updatedAt) : undefined,
  };
}

/** Validated strictly against `createEventSchema.strict()` in events.validator.ts. */
export function mapScheduledEventToCreateDto(
  event: Pick<ScheduledEvent, 'title' | 'eventType' | 'date'> & Partial<ScheduledEvent>,
): CreateEventRequestDto {
  const dto: CreateEventRequestDto = {
    title: event.title.trim().slice(0, 100) || 'Planned Occasion',
    eventType: (event.eventType || 'casual').trim().slice(0, 50),
    date: toIsoString(event.date),
  };

  if (event.description?.trim()) {
    dto.description = event.description.trim().slice(0, 1000);
  }
  if (event.location?.trim()) {
    dto.location = event.location.trim().slice(0, 200);
  }
  if (event.dressCode?.trim()) {
    dto.dressCode = event.dressCode.trim().slice(0, 50);
  }

  return dto;
}

export function mapScheduledEventPatchToUpdateDto(
  patch: Partial<ScheduledEvent>,
): UpdateEventRequestDto {
  const dto: UpdateEventRequestDto = {};

  if (typeof patch.title === 'string' && patch.title.trim().length >= 2) {
    dto.title = patch.title.trim().slice(0, 100);
  }
  if (typeof patch.description === 'string') {
    dto.description = patch.description.trim().slice(0, 1000);
  }
  if (typeof patch.eventType === 'string' && patch.eventType.trim().length >= 2) {
    dto.eventType = patch.eventType.trim().slice(0, 50);
  }
  if (patch.date) {
    dto.date = toIsoString(patch.date);
  }
  if (typeof patch.location === 'string') {
    dto.location = patch.location.trim().slice(0, 200);
  }
  if (typeof patch.dressCode === 'string' && patch.dressCode.trim().length >= 2) {
    dto.dressCode = patch.dressCode.trim().slice(0, 50);
  }

  return dto;
}

function formatVenueTypeToLabel(venueType: BackendVenueDto['venueType']): string {
  switch (venueType) {
    case 'wedding_hall':
      return 'Weddings / Banquets';
    case 'party_hall':
      return 'Club / Party';
    case 'shopping_mall':
      return 'Shopping / Boutique';
    case 'office':
      return 'Corporate / Office';
    case 'cafe':
      return 'Cafe / Bistro';
    case 'restaurant':
      return 'Dining / Fine Restaurant';
    case 'hotel':
      return 'Luxury Hotel / Lounge';
    case 'outdoor':
      return 'Outdoor / Garden';
    case 'college':
      return 'Campus / Lecture';
    default:
      return 'Curated Destination';
  }
}

export function mapVenueDtoToDomain(dto: BackendVenueDto): VenuePlace {
  const id = extractRecordId(dto);
  const coordinates: GeoCoordinates | undefined =
    typeof dto.latitude === 'number' && typeof dto.longitude === 'number'
      ? { latitude: dto.latitude, longitude: dto.longitude }
      : undefined;

  return {
    id,
    backendId: isMongoObjectId(id) ? id : undefined,
    origin: 'api',
    name: dto.name.trim(),
    category: formatVenueTypeToLabel(dto.venueType),
    venueType: dto.venueType,
    city: dto.city?.trim() || dto.address?.trim() || 'Unknown City',
    address: dto.address,
    state: dto.state,
    country: dto.country,
    coordinates,
    vibe: dto.dressCode?.trim() || 'Smart Casual',
    dressCode: dto.dressCode?.trim() || 'Casual',
    indoor: Boolean(dto.indoor),
    suitableOccasions: normalizeStringArray(dto.suitableOccasions),
    description: dto.description?.trim() || '',
    imageUrl: dto.imageUrl?.trim() || DEFAULT_VENUE_IMAGE,
    websiteUrl: dto.websiteUrl,
    isActive: dto.isActive,
  };
}

export function mapVenuePlaceToCreateDto(
  venue: Pick<VenuePlace, 'name'> & Partial<VenuePlace>,
): CreateVenueRequestDto {
  const dto: CreateVenueRequestDto = {
    name: venue.name.trim().slice(0, 200),
    address: (venue.address || venue.city || 'Address pending').trim().slice(0, 500),
    venueType: venue.venueType ?? 'other',
    dressCode: (venue.dressCode || 'casual').trim().slice(0, 200),
    indoor: venue.indoor ?? true,
    suitableOccasions: normalizeStringArray(venue.suitableOccasions),
  };

  if (venue.description?.trim()) dto.description = venue.description.trim().slice(0, 2000);
  if (venue.city?.trim()) dto.city = venue.city.trim().slice(0, 100);
  if (venue.state?.trim()) dto.state = venue.state.trim().slice(0, 100);
  if (venue.country?.trim()) dto.country = venue.country.trim().slice(0, 100);
  if (venue.coordinates) {
    dto.latitude = venue.coordinates.latitude;
    dto.longitude = venue.coordinates.longitude;
  }
  if (venue.imageUrl && /^https?:\/\/.+/i.test(venue.imageUrl)) {
    dto.imageUrl = venue.imageUrl;
  }
  if (venue.websiteUrl && /^https?:\/\/.+/i.test(venue.websiteUrl)) {
    dto.websiteUrl = venue.websiteUrl;
  }

  return dto;
}

export function mapVenueIntelligenceDtoToDomain(
  dto: BackendVenueIntelligenceDto,
): VenueDressIntelligence {
  return {
    id: extractRecordId(dto) || undefined,
    venueId: dto.venueId ? String(dto.venueId) : undefined,
    venueName: dto.venueName,
    venueType: dto.venueType,
    occasion: dto.occasion,
    dressCode: dto.dressCode,
    indoor: dto.indoor ?? true,
    recommendedStyles: normalizeStringArray(dto.recommendedStyles),
    recommendedColors: normalizeStringArray(dto.recommendedColors),
    recommendedClothing: normalizeStringArray(dto.recommendedClothing),
    weatherSummary: dto.weatherSummary,
    temperatureCelsius: dto.temperatureCelsius,
    summary: dto.summary,
    recommendations: normalizeStringArray(dto.recommendations),
  };
}

/**
 * Translates domain `GeoCoordinates` (`latitude`, `longitude`) -> backend `GET /api/weather`
 * query params (`lat`, `lon` as validated by `weather.validator.ts`).
 */
export function mapCoordinatesToWeatherQuery(coords: GeoCoordinates): WeatherCoordinatesQueryDto {
  return {
    lat: coords.latitude,
    lon: coords.longitude,
  };
}

export function mapWeatherDtoToDomain(dto: BackendWeatherDataDto): WeatherContext {
  return {
    city: dto.city,
    country: dto.country,
    temperatureCelsius: dto.temperatureCelsius,
    feelsLikeCelsius: dto.feelsLikeCelsius,
    humidity: dto.humidity,
    condition: dto.condition,
    description: dto.description,
    isRaining: dto.isRaining,
    recordedAt: dto.recordedAt ? toIsoString(dto.recordedAt) : undefined,
    clothingAdvice: dto.clothingAdvice
      ? {
          layering: dto.clothingAdvice.layering,
          recommendedCategories: normalizeStringArray(dto.clothingAdvice.recommendedCategories),
          recommendedMaterials: normalizeStringArray(dto.clothingAdvice.recommendedMaterials),
          tips: normalizeStringArray(dto.clothingAdvice.tips),
        }
      : undefined,
  };
}

