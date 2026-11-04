package com.property.intelligence.scoring;

import com.property.intelligence.entity.AmenityCategory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class LocationScoringService {

    private final ScoringConfiguration scoringConfig;

    // All 9 categories evaluated for Property Location Score
    public static final Set<AmenityCategory> LOCATION_CATEGORIES = Set.of(
            AmenityCategory.HEALTHCARE,
            AmenityCategory.EDUCATION,
            AmenityCategory.GROCERY,
            AmenityCategory.TRANSPORTATION,
            AmenityCategory.PARK,
            AmenityCategory.DINING,
            AmenityCategory.FITNESS,
            AmenityCategory.ENTERTAINMENT,
            AmenityCategory.BANKING
    );

    public LocationScoringService(ScoringConfiguration scoringConfig) {
        this.scoringConfig = scoringConfig;
    }

    public static class LocationScoreResult {
        public final Double score;
        public final String rating;
        public final ScoringStatus status;
        public final String explanation;

        public LocationScoreResult(Double score, String rating, ScoringStatus status, String explanation) {
            this.score = score;
            this.rating = rating;
            this.status = status;
            this.explanation = explanation;
        }
    }

    /**
     * Calculates the overall Property Location Score from category details.
     * Evaluates all 9 convenience categories.
     * Publishes a definitive score only when all 9 categories have status COMPLETE.
     */
    public LocationScoreResult calculateLocationScore(
            Map<AmenityCategory, CategoryScoreDetail> categoryScores,
            Set<AmenityCategory> selectedCategories) {

        if (selectedCategories == null || selectedCategories.isEmpty()) {
            return new LocationScoreResult(
                    null,
                    "Unavailable",
                    ScoringStatus.UNAVAILABLE,
                    "No categories selected for property location scoring."
            );
        }

        int n = selectedCategories.size();
        double equalWeight = 100.0 / n;
        boolean anyUnavailable = false;
        boolean anyPartial = false;
        double scoreSum = 0.0;

        for (AmenityCategory cat : selectedCategories) {
            CategoryScoreDetail detail = categoryScores.get(cat);
            if (detail == null || detail.getStatus() == ScoringStatus.UNAVAILABLE) {
                anyUnavailable = true;
            } else if (detail.getStatus() == ScoringStatus.PARTIAL) {
                anyPartial = true;
                if (detail.getCategoryScore() != null) {
                    scoreSum += detail.getCategoryScore();
                }
            } else if (detail.getStatus() == ScoringStatus.COMPLETE) {
                if (detail.getCategoryScore() != null) {
                    scoreSum += detail.getCategoryScore();
                }
            }
        }

        if (anyUnavailable) {
            return new LocationScoreResult(
                    null,
                    "Unavailable",
                    ScoringStatus.UNAVAILABLE,
                    "Score unavailable — incomplete routing or amenity data."
            );
        }

        if (anyPartial) {
            return new LocationScoreResult(
                    null,
                    "Incomplete Data",
                    ScoringStatus.PARTIAL,
                    "Score unavailable — incomplete routing or amenity data."
            );
        }

        // All n selected categories are COMPLETE
        double finalScore = Math.round((scoreSum / n) * 100.0) / 100.0;
        finalScore = Math.max(0.0, Math.min(100.0, finalScore)); // Bound [0, 100]
        String rating = ScoringConfiguration.getRatingLabel(finalScore);
        String explanation = String.format(
                Locale.US,
                "Amenity-based location convenience score across %d selected sectors with equal %.1f%% weighting (%s: %.1f/100).",
                n, equalWeight, rating, finalScore
        );

        return new LocationScoreResult(finalScore, rating, ScoringStatus.COMPLETE, explanation);
    }

    public LocationScoreResult calculateLocationScore(Map<AmenityCategory, CategoryScoreDetail> categoryScores) {
        return calculateLocationScore(categoryScores, EnumSet.allOf(AmenityCategory.class));
    }
}

