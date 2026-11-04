package com.property.intelligence.scoring;

import com.property.intelligence.entity.AmenityCategory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Set;

@Configuration
@ConfigurationProperties(prefix = "app.scoring")
public class ScoringConfiguration {

    public static final String ALGORITHM_VERSION = "2.2.0";
    public static final int DEFAULT_CANDIDATE_SHORTLIST_LIMIT = 5;

    // Categories eligible for the pedestrian Walkability Model (Entertainment excluded)
    public static final Set<AmenityCategory> WALKABILITY_ELIGIBLE_CATEGORIES = Set.of(
            AmenityCategory.GROCERY,
            AmenityCategory.TRANSPORTATION,
            AmenityCategory.DINING,
            AmenityCategory.HEALTHCARE,
            AmenityCategory.PARK,
            AmenityCategory.FITNESS,
            AmenityCategory.EDUCATION,
            AmenityCategory.BANKING
    );

    private int candidateShortlistLimit = DEFAULT_CANDIDATE_SHORTLIST_LIMIT;

    public String getAlgorithmVersion() {
        return ALGORITHM_VERSION;
    }

    public int getCandidateShortlistLimit() {
        return candidateShortlistLimit;
    }

    public void setCandidateShortlistLimit(int candidateShortlistLimit) {
        this.candidateShortlistLimit = candidateShortlistLimit;
    }

    /**
     * Calculates equal weight per sector: 100.0 / count (full floating-point precision).
     */
    public static double calculateEqualWeight(int count) {
        if (count <= 0) return 0.0;
        return 100.0 / count;
    }

    public static String getRatingLabel(Double score) {
        if (score == null) return "Unavailable";
        if (score >= 90.0) return "Excellent";
        if (score >= 75.0) return "Very Good";
        if (score >= 60.0) return "Good";
        if (score >= 40.0) return "Moderate";
        if (score >= 20.0) return "Poor";
        return "Very Poor";
    }

    public static String getCategoryDisplayName(AmenityCategory category) {
        return switch (category) {
            case GROCERY -> "Daily Essentials";
            case TRANSPORTATION -> "Transportation";
            case DINING -> "Food & Dining";
            case HEALTHCARE -> "Healthcare";
            case PARK -> "Recreation & Parks";
            case FITNESS -> "Fitness";
            case EDUCATION -> "Education";
            case BANKING -> "Banking & Services";
            case ENTERTAINMENT -> "Entertainment";
        };
    }
}
