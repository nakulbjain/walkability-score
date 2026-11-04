package com.property.intelligence.dto;

import com.property.intelligence.entity.AmenityCategory;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class AnalysisResponse {
    private Long id;
    private String formattedAddress;
    private String locality;
    private String city;
    private String state;
    private Double latitude;
    private Double longitude;
    private Double radiusKm;
    private Set<AmenityCategory> selectedAmenities;
    private LocalDateTime createdAt;

    // Overview summary per category
    private Map<AmenityCategory, CategorySummary> categorySummaries;

    // Categorized detailed place results (sorted nearest to farthest)
    private Map<AmenityCategory, List<PlaceDetails>> categorizedPlaces;

    // Flat list of all places (for map markers)
    private List<PlaceDetails> allPlaces;

    // Phase 2 Scoring Engine Results
    private Double walkabilityScore;
    private String walkabilityRating;
    private String walkabilityStatus;
    private String walkabilityExplanation;

    private Double locationScore;
    private String locationRating;
    private String locationStatus;
    private String locationExplanation;

    private com.property.intelligence.scoring.ScoringResult scoringResult;
    private String algorithmVersion;
    private LocalDateTime scoringTimestamp;

    public AnalysisResponse() {}

    public static class CategorySummary {
        private AmenityCategory category;
        private int totalCount;
        private Double nearestDistanceKm;
        private String nearestPlaceName;

        public CategorySummary() {}

        public CategorySummary(AmenityCategory category, int totalCount, Double nearestDistanceKm, String nearestPlaceName) {
            this.category = category;
            this.totalCount = totalCount;
            this.nearestDistanceKm = nearestDistanceKm;
            this.nearestPlaceName = nearestPlaceName;
        }

        public AmenityCategory getCategory() {
            return category;
        }

        public void setCategory(AmenityCategory category) {
            this.category = category;
        }

        public int getTotalCount() {
            return totalCount;
        }

        public void setTotalCount(int totalCount) {
            this.totalCount = totalCount;
        }

        public Double getNearestDistanceKm() {
            return nearestDistanceKm;
        }

        public void setNearestDistanceKm(Double nearestDistanceKm) {
            this.nearestDistanceKm = nearestDistanceKm;
        }

        public String getNearestPlaceName() {
            return nearestPlaceName;
        }

        public void setNearestPlaceName(String nearestPlaceName) {
            this.nearestPlaceName = nearestPlaceName;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFormattedAddress() {
        return formattedAddress;
    }

    public void setFormattedAddress(String formattedAddress) {
        this.formattedAddress = formattedAddress;
    }

    public String getLocality() {
        return locality;
    }

    public void setLocality(String locality) {
        this.locality = locality;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getRadiusKm() {
        return radiusKm;
    }

    public void setRadiusKm(Double radiusKm) {
        this.radiusKm = radiusKm;
    }

    public Set<AmenityCategory> getSelectedAmenities() {
        return selectedAmenities;
    }

    public void setSelectedAmenities(Set<AmenityCategory> selectedAmenities) {
        this.selectedAmenities = selectedAmenities;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Map<AmenityCategory, CategorySummary> getCategorySummaries() {
        return categorySummaries;
    }

    public void setCategorySummaries(Map<AmenityCategory, CategorySummary> categorySummaries) {
        this.categorySummaries = categorySummaries;
    }

    public Map<AmenityCategory, List<PlaceDetails>> getCategorizedPlaces() {
        return categorizedPlaces;
    }

    public void setCategorizedPlaces(Map<AmenityCategory, List<PlaceDetails>> categorizedPlaces) {
        this.categorizedPlaces = categorizedPlaces;
    }

    public List<PlaceDetails> getAllPlaces() {
        return allPlaces;
    }

    public void setAllPlaces(List<PlaceDetails> allPlaces) {
        this.allPlaces = allPlaces;
    }

    public Double getWalkabilityScore() {
        return walkabilityScore;
    }

    public void setWalkabilityScore(Double walkabilityScore) {
        this.walkabilityScore = walkabilityScore;
    }

    public String getWalkabilityRating() {
        return walkabilityRating;
    }

    public void setWalkabilityRating(String walkabilityRating) {
        this.walkabilityRating = walkabilityRating;
    }

    public String getWalkabilityStatus() {
        return walkabilityStatus;
    }

    public void setWalkabilityStatus(String walkabilityStatus) {
        this.walkabilityStatus = walkabilityStatus;
    }

    public String getWalkabilityExplanation() {
        return walkabilityExplanation;
    }

    public void setWalkabilityExplanation(String walkabilityExplanation) {
        this.walkabilityExplanation = walkabilityExplanation;
    }

    public Double getLocationScore() {
        return locationScore;
    }

    public void setLocationScore(Double locationScore) {
        this.locationScore = locationScore;
    }

    public String getLocationRating() {
        return locationRating;
    }

    public void setLocationRating(String locationRating) {
        this.locationRating = locationRating;
    }

    public String getLocationStatus() {
        return locationStatus;
    }

    public void setLocationStatus(String locationStatus) {
        this.locationStatus = locationStatus;
    }

    public String getLocationExplanation() {
        return locationExplanation;
    }

    public void setLocationExplanation(String locationExplanation) {
        this.locationExplanation = locationExplanation;
    }

    public com.property.intelligence.scoring.ScoringResult getScoringResult() {
        return scoringResult;
    }

    public void setScoringResult(com.property.intelligence.scoring.ScoringResult scoringResult) {
        this.scoringResult = scoringResult;
    }

    public String getAlgorithmVersion() {
        return algorithmVersion;
    }

    public void setAlgorithmVersion(String algorithmVersion) {
        this.algorithmVersion = algorithmVersion;
    }

    public LocalDateTime getScoringTimestamp() {
        return scoringTimestamp;
    }

    public void setScoringTimestamp(LocalDateTime scoringTimestamp) {
        this.scoringTimestamp = scoringTimestamp;
    }
}

