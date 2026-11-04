package com.property.intelligence.scoring;

import com.property.intelligence.entity.AmenityCategory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class WalkabilityScoringService {

    private final ScoringConfiguration scoringConfig;

    // The 8 categories that constitute the Walkability Score
    public static final Set<AmenityCategory> WALKABILITY_CATEGORIES = Set.of(
            AmenityCategory.GROCERY,
            AmenityCategory.TRANSPORTATION,
            AmenityCategory.DINING,
            AmenityCategory.HEALTHCARE,
            AmenityCategory.PARK,
            AmenityCategory.FITNESS,
            AmenityCategory.EDUCATION,
            AmenityCategory.BANKING
    );

    public WalkabilityScoringService(ScoringConfiguration scoringConfig) {
        this.scoringConfig = scoringConfig;
    }

    public static class WalkabilityResult {
        public final Double score;
        public final String rating;
        public final ScoringStatus status;
        public final String explanation;

        public WalkabilityResult(Double score, String rating, ScoringStatus status, String explanation) {
            this.score = score;
            this.rating = rating;
            this.status = status;
            this.explanation = explanation;
        }
    }

    /**
     * Calculates the overall Walkability Score from category details.
     * Evaluates all 8 walkability categories.
     * Publishes a definitive score only when all 8 categories have status COMPLETE.
     */
    public WalkabilityResult calculateWalkabilityScore(
            Map<AmenityCategory, CategoryScoreDetail> categoryScores,
            Set<AmenityCategory> selectedCategories) {

        if (selectedCategories == null || selectedCategories.isEmpty()) {
            return new WalkabilityResult(
                    null,
                    "Unavailable",
                    ScoringStatus.UNAVAILABLE,
                    "No categories selected for walkability scoring."
            );
        }

        // Filter selected categories to those eligible for walkability (excludes ENTERTAINMENT)
        Set<AmenityCategory> eligibleCategories = new LinkedHashSet<>();
        for (AmenityCategory cat : selectedCategories) {
            if (ScoringConfiguration.WALKABILITY_ELIGIBLE_CATEGORIES.contains(cat)) {
                eligibleCategories.add(cat);
            }
        }

        int nWalk = eligibleCategories.size();
        if (nWalk == 0) {
            return new WalkabilityResult(
                    null,
                    "Not Applicable",
                    ScoringStatus.UNAVAILABLE,
                    "No walkability-eligible categories selected (Entertainment is excluded from pedestrian walkability index)."
            );
        }

        double equalWeight = 100.0 / nWalk;
        boolean anyUnavailable = false;
        boolean anyPartial = false;
        double scoreSum = 0.0;

        for (AmenityCategory cat : eligibleCategories) {
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
            return new WalkabilityResult(
                    null,
                    "Unavailable",
                    ScoringStatus.UNAVAILABLE,
                    "Score unavailable — incomplete routing or amenity data."
            );
        }

        if (anyPartial) {
            return new WalkabilityResult(
                    null,
                    "Incomplete Data",
                    ScoringStatus.PARTIAL,
                    "Score unavailable — incomplete routing or amenity data."
            );
        }

        // All eligible categories are COMPLETE
        double finalScore = Math.round((scoreSum / nWalk) * 100.0) / 100.0;
        finalScore = Math.max(0.0, Math.min(100.0, finalScore)); // Ensure bound [0, 100]
        String rating = ScoringConfiguration.getRatingLabel(finalScore);
        String explanation = String.format(
                Locale.US,
                "Walkability index computed across %d selected eligible sectors with equal %.1f%% weighting (%s: %.1f/100).",
                nWalk, equalWeight, rating, finalScore
        );

        return new WalkabilityResult(finalScore, rating, ScoringStatus.COMPLETE, explanation);
    }

    public WalkabilityResult calculateWalkabilityScore(Map<AmenityCategory, CategoryScoreDetail> categoryScores) {
        return calculateWalkabilityScore(categoryScores, ScoringConfiguration.WALKABILITY_ELIGIBLE_CATEGORIES);
    }
}

