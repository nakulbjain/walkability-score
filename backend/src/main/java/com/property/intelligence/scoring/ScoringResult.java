package com.property.intelligence.scoring;

import com.property.intelligence.entity.AmenityCategory;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

public class ScoringResult {
    private Double walkabilityScore; // 0 to 100, nullable if unavailable
    private String walkabilityRating; // Excellent, Very Good, Good, Moderate, Poor, Very Poor, Unavailable
    private ScoringStatus walkabilityStatus; // COMPLETE, PARTIAL, UNAVAILABLE
    private String walkabilityExplanation;

    private Double locationScore; // 0 to 100, nullable if unavailable
    private String locationRating;
    private ScoringStatus locationStatus;
    private String locationExplanation;

    private Map<AmenityCategory, CategoryScoreDetail> categoryScores = new LinkedHashMap<>();
    private String algorithmVersion; // "2.0.0"
    private LocalDateTime calculatedAt;

    public ScoringResult() {
        this.calculatedAt = LocalDateTime.now();
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

    public ScoringStatus getWalkabilityStatus() {
        return walkabilityStatus;
    }

    public void setWalkabilityStatus(ScoringStatus walkabilityStatus) {
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

    public ScoringStatus getLocationStatus() {
        return locationStatus;
    }

    public void setLocationStatus(ScoringStatus locationStatus) {
        this.locationStatus = locationStatus;
    }

    public String getLocationExplanation() {
        return locationExplanation;
    }

    public void setLocationExplanation(String locationExplanation) {
        this.locationExplanation = locationExplanation;
    }

    public Map<AmenityCategory, CategoryScoreDetail> getCategoryScores() {
        return categoryScores;
    }

    public void setCategoryScores(Map<AmenityCategory, CategoryScoreDetail> categoryScores) {
        this.categoryScores = categoryScores;
    }

    public String getAlgorithmVersion() {
        return algorithmVersion;
    }

    public void setAlgorithmVersion(String algorithmVersion) {
        this.algorithmVersion = algorithmVersion;
    }

    public LocalDateTime getCalculatedAt() {
        return calculatedAt;
    }

    public void setCalculatedAt(LocalDateTime calculatedAt) {
        this.calculatedAt = calculatedAt;
    }
}

