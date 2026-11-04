package com.property.intelligence.dto;

import com.property.intelligence.entity.AmenityCategory;
import java.time.LocalDateTime;
import java.util.Set;

public class AnalysisHistoryItem {
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

    // Phase 2 Scoring Engine Attributes
    private Double walkabilityScore;
    private String walkabilityRating;
    private String walkabilityStatus;
    private Double locationScore;
    private String locationRating;
    private String locationStatus;
    private String algorithmVersion;
    private LocalDateTime scoringTimestamp;

    public AnalysisHistoryItem() {}

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

