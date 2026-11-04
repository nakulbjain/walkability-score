package com.property.intelligence.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "location_analyses")
public class LocationAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 500)
    private String formattedAddress;

    @Column(length = 150)
    private String locality;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private Double radiusKm;

    @ElementCollection(targetClass = AmenityCategory.class)
    @CollectionTable(
        name = "analysis_amenity_selections",
        joinColumns = @JoinColumn(name = "analysis_id")
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "amenity_category", nullable = false)
    private Set<AmenityCategory> selectedAmenities = new HashSet<>();

    // Phase 2 Scoring Engine Attributes
    @Column(name = "walkability_score")
    private Double walkabilityScore;

    @Column(name = "walkability_status", length = 30)
    private String walkabilityStatus;

    @Column(name = "location_score")
    private Double locationScore;

    @Column(name = "location_status", length = 30)
    private String locationStatus;

    @Column(name = "algorithm_version", length = 20)
    private String algorithmVersion;

    @Column(name = "scoring_timestamp")
    private LocalDateTime scoringTimestamp;

    @Column(name = "scoring_breakdown_json", columnDefinition = "TEXT")
    private String scoringBreakdownJson;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public LocationAnalysis() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public Double getWalkabilityScore() {
        return walkabilityScore;
    }

    public void setWalkabilityScore(Double walkabilityScore) {
        this.walkabilityScore = walkabilityScore;
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

    public String getScoringBreakdownJson() {
        return scoringBreakdownJson;
    }

    public void setScoringBreakdownJson(String scoringBreakdownJson) {
        this.scoringBreakdownJson = scoringBreakdownJson;
    }
}

