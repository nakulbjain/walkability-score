package com.property.intelligence.scoring;

public class ScoredAmenity {
    private String id;
    private String name;
    private String category;
    private String address;
    private double latitude;
    private double longitude;
    private double haversineDistanceKm;
    private Double walkingDistanceMeters;
    private Double walkingDurationSeconds;
    private Integer walkingDurationMinutes;
    private Double accessibilityScore; // 100, 90, 75, 55, 25, 0
    private Double weightMultiplier; // 0.70, 0.20, 0.10
    private Double weightedPoints;

    public ScoredAmenity() {}

    public ScoredAmenity(
            String id,
            String name,
            String category,
            String address,
            double latitude,
            double longitude,
            double haversineDistanceKm,
            Double walkingDistanceMeters,
            Double walkingDurationSeconds,
            Double accessibilityScore) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.haversineDistanceKm = haversineDistanceKm;
        this.walkingDistanceMeters = walkingDistanceMeters;
        this.walkingDurationSeconds = walkingDurationSeconds;
        this.walkingDurationMinutes = walkingDurationSeconds != null ? (int) Math.round(walkingDurationSeconds / 60.0) : null;
        this.accessibilityScore = accessibilityScore;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public double getHaversineDistanceKm() {
        return haversineDistanceKm;
    }

    public void setHaversineDistanceKm(double haversineDistanceKm) {
        this.haversineDistanceKm = haversineDistanceKm;
    }

    public Double getWalkingDistanceMeters() {
        return walkingDistanceMeters;
    }

    public void setWalkingDistanceMeters(Double walkingDistanceMeters) {
        this.walkingDistanceMeters = walkingDistanceMeters;
    }

    public Double getWalkingDurationSeconds() {
        return walkingDurationSeconds;
    }

    public void setWalkingDurationSeconds(Double walkingDurationSeconds) {
        this.walkingDurationSeconds = walkingDurationSeconds;
        this.walkingDurationMinutes = walkingDurationSeconds != null ? (int) Math.round(walkingDurationSeconds / 60.0) : null;
    }

    public Integer getWalkingDurationMinutes() {
        return walkingDurationMinutes;
    }

    public void setWalkingDurationMinutes(Integer walkingDurationMinutes) {
        this.walkingDurationMinutes = walkingDurationMinutes;
    }

    public Double getAccessibilityScore() {
        return accessibilityScore;
    }

    public void setAccessibilityScore(Double accessibilityScore) {
        this.accessibilityScore = accessibilityScore;
    }

    public Double getWeightMultiplier() {
        return weightMultiplier;
    }

    public void setWeightMultiplier(Double weightMultiplier) {
        this.weightMultiplier = weightMultiplier;
    }

    public Double getWeightedPoints() {
        return weightedPoints;
    }

    public void setWeightedPoints(Double weightedPoints) {
        this.weightedPoints = weightedPoints;
    }
}

