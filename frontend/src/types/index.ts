export type AmenityCategory =
  | 'HEALTHCARE'
  | 'EDUCATION'
  | 'GROCERY'
  | 'FITNESS'
  | 'PARK'
  | 'ENTERTAINMENT'
  | 'DINING'
  | 'TRANSPORTATION'
  | 'BANKING';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  id: number;
  fullName: string;
  email: string;
  phone: string;
}

export interface LocationSearchResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  locality?: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
}

export type TravelMode = 'WALKING' | 'MOTORBIKE' | 'CAR';

export interface RouteResult {
  mode: TravelMode | string;
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  coordinates: [number, number][]; // [lon, lat] pairs from routing GeoJSON
  provider: string;
  routingProfile?: string;
}

export interface PlaceDetails {
  id: string;
  name: string;
  category: AmenityCategory;
  amenityType: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  distanceType: string;
  rating?: number | null;
  userRatingsTotal?: number | null;
  openNow?: boolean | null;
  openingHours?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  provider?: string | null;
  providerPlaceId?: string | null;
}

export type ScoringStatus = 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE';

export interface ScoredAmenity {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  haversineDistanceKm: number;
  walkingDistanceMeters?: number | null;
  walkingDurationSeconds?: number | null;
  walkingDurationMinutes?: number | null;
  accessibilityScore?: number | null;
  weightMultiplier?: number | null;
  weightedPoints?: number | null;
}

export interface CategoryScoreDetail {
  category: AmenityCategory;
  categoryName: string;
  categoryScore?: number | null;
  walkabilityWeight?: number;
  walkabilityContribution?: number | null;
  locationWeight?: number;
  locationContribution?: number | null;
  status: ScoringStatus;
  discoveredCount: number;
  routedCount: number;
  failedRoutingCount: number;
  usedInScoringCount: number;
  dataSource: string;
  scoringMethod: string;
  explanation: string;
  topAmenities: ScoredAmenity[];
}

export interface ScoringResult {
  walkabilityScore?: number | null;
  walkabilityRating?: string;
  walkabilityStatus: ScoringStatus;
  walkabilityExplanation?: string;
  locationScore?: number | null;
  locationRating?: string;
  locationStatus: ScoringStatus;
  locationExplanation?: string;
  categoryScores: Record<AmenityCategory, CategoryScoreDetail>;
  algorithmVersion: string;
  calculatedAt: string;
}

export interface CategorySummary {
  category: AmenityCategory;
  totalCount: number;
  nearestDistanceKm?: number;
  nearestPlaceName?: string;
}

export interface AnalysisResponse {
  id: number;
  formattedAddress: string;
  locality?: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  selectedAmenities: AmenityCategory[];
  createdAt: string;
  categorySummaries: Record<AmenityCategory, CategorySummary>;
  categorizedPlaces: Record<AmenityCategory, PlaceDetails[]>;
  allPlaces: PlaceDetails[];

  // Phase 2 Scoring Engine Results
  walkabilityScore?: number | null;
  walkabilityRating?: string;
  walkabilityStatus?: ScoringStatus;
  walkabilityExplanation?: string;
  locationScore?: number | null;
  locationRating?: string;
  locationStatus?: ScoringStatus;
  locationExplanation?: string;
  scoringResult?: ScoringResult;
  algorithmVersion?: string;
  scoringTimestamp?: string;
}

export interface AnalysisHistoryItem {
  id: number;
  formattedAddress: string;
  locality?: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  selectedAmenities: AmenityCategory[];
  createdAt: string;

  // Phase 2 Scoring History
  walkabilityScore?: number | null;
  walkabilityRating?: string;
  walkabilityStatus?: ScoringStatus;
  locationScore?: number | null;
  locationRating?: string;
  locationStatus?: ScoringStatus;
  algorithmVersion?: string;
  scoringTimestamp?: string;
}
