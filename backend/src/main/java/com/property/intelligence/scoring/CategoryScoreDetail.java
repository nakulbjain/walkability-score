package com.property.intelligence.scoring;

import com.property.intelligence.entity.AmenityCategory;
import java.util.ArrayList;
import java.util.List;

public class CategoryScoreDetail {
    private AmenityCategory category;
    private String categoryName;
    private Double categoryScore; // 0 to 100, nullable if unavailable
    private Double walkabilityWeight; // e.g. 25.0
    private Double walkabilityContribution; // categoryScore * walkabilityWeight / 100
    private Double locationWeight; // e.g. 15.0
    private Double locationContribution; // categoryScore * locationWeight / 100
    private ScoringStatus status; // COMPLETE, PARTIAL, UNAVAILABLE
    private int discoveredCount;
    private int routedCount;
    private int failedRoutingCount;
    private int usedInScoringCount;
    private String dataSource;
    private String scoringMethod;
    private String explanation;
    private List<ScoredAmenity> topAmenities = new ArrayList<>();

    public CategoryScoreDetail() {}

    public CategoryScoreDetail(AmenityCategory category, String categoryName) {
        this.category = category;
        this.categoryName = categoryName;
        this.dataSource = "OpenStreetMap / Photon / Nominatim";
        this.scoringMethod = "Pedestrian Route-Based Top-Three Decay";
    }

    public AmenityCategory getCategory() {
        return category;
    }

    public void setCategory(AmenityCategory category) {
        this.category = category;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Double getCategoryScore() {
        return categoryScore;
    }

    public void setCategoryScore(Double categoryScore) {
        this.categoryScore = categoryScore;
    }

    public Double getWalkabilityWeight() {
        return walkabilityWeight;
    }

    public void setWalkabilityWeight(Double walkabilityWeight) {
        this.walkabilityWeight = walkabilityWeight;
    }

    public Double getWalkabilityContribution() {
        return walkabilityContribution;
    }

    public void setWalkabilityContribution(Double walkabilityContribution) {
        this.walkabilityContribution = walkabilityContribution;
    }

    public Double getLocationWeight() {
        return locationWeight;
    }

    public void setLocationWeight(Double locationWeight) {
        this.locationWeight = locationWeight;
    }

    public Double getLocationContribution() {
        return locationContribution;
    }

    public void setLocationContribution(Double locationContribution) {
        this.locationContribution = locationContribution;
    }

    public ScoringStatus getStatus() {
        return status;
    }

    public void setStatus(ScoringStatus status) {
        this.status = status;
    }

    public int getDiscoveredCount() {
        return discoveredCount;
    }

    public void setDiscoveredCount(int discoveredCount) {
        this.discoveredCount = discoveredCount;
    }

    public int getRoutedCount() {
        return routedCount;
    }

    public void setRoutedCount(int routedCount) {
        this.routedCount = routedCount;
    }

    public int getFailedRoutingCount() {
        return failedRoutingCount;
    }

    public void setFailedRoutingCount(int failedRoutingCount) {
        this.failedRoutingCount = failedRoutingCount;
    }

    public int getUsedInScoringCount() {
        return usedInScoringCount;
    }

    public void setUsedInScoringCount(int usedInScoringCount) {
        this.usedInScoringCount = usedInScoringCount;
    }

    public String getDataSource() {
        return dataSource;
    }

    public void setDataSource(String dataSource) {
        this.dataSource = dataSource;
    }

    public String getScoringMethod() {
        return scoringMethod;
    }

    public void setScoringMethod(String scoringMethod) {
        this.scoringMethod = scoringMethod;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public List<ScoredAmenity> getTopAmenities() {
        return topAmenities;
    }

    public void setTopAmenities(List<ScoredAmenity> topAmenities) {
        this.topAmenities = topAmenities;
    }
}

