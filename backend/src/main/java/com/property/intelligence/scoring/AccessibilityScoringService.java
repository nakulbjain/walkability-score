package com.property.intelligence.scoring;

import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class AccessibilityScoringService {

    public static final double MULTIPLIER_TOP_1 = 0.70;
    public static final double MULTIPLIER_TOP_2 = 0.20;
    public static final double MULTIPLIER_TOP_3 = 0.10;

    /**
     * Piecewise walking-time accessibility decay algorithm.
     * Evaluates exact duration in seconds:
     * - 0–5 minutes (<= 300s): 100 points
     * - >5–10 minutes (> 300s and <= 600s): 90 points
     * - >10–15 minutes (> 600s and <= 900s): 75 points
     * - >15–20 minutes (> 900s and <= 1200s): 55 points
     * - >20–30 minutes (> 1200s and <= 1800s): 25 points
     * - >30 minutes (> 1800s): 0 points
     */
    public double calculateWalkingScore(double durationSeconds) {
        if (durationSeconds < 0) {
            return 0.0;
        }
        if (durationSeconds <= 300.0) {
            return 100.0;
        } else if (durationSeconds <= 600.0) {
            return 90.0;
        } else if (durationSeconds <= 900.0) {
            return 75.0;
        } else if (durationSeconds <= 1200.0) {
            return 55.0;
        } else if (durationSeconds <= 1800.0) {
            return 25.0;
        } else {
            return 0.0;
        }
    }

    /**
     * Motorized (scooter/motorbike and automobile) travel-time accessibility decay algorithm.
     * Evaluates exact urban motorized travel duration in seconds:
     * - 0–3 minutes (<= 180s): 100 points
     * - >3–6 minutes (> 180s and <= 360s): 90 points
     * - >6–10 minutes (> 360s and <= 600s): 75 points
     * - >10–15 minutes (> 600s and <= 900s): 55 points
     * - >15–25 minutes (> 900s and <= 1500s): 25 points
     * - >25 minutes (> 1500s): 0 points
     */
    public double calculateMotorizedScore(double durationSeconds) {
        if (durationSeconds < 0) {
            return 0.0;
        }
        if (durationSeconds <= 180.0) {
            return 100.0;
        } else if (durationSeconds <= 360.0) {
            return 90.0;
        } else if (durationSeconds <= 600.0) {
            return 75.0;
        } else if (durationSeconds <= 900.0) {
            return 55.0;
        } else if (durationSeconds <= 1500.0) {
            return 25.0;
        } else {
            return 0.0;
        }
    }

    /**
     * Comparator for candidate amenities:
     * Sort by accessibility score descending, then walking duration ascending, then stable place ID.
     */
    public Comparator<ScoredAmenity> getAmenityComparator() {
        return Comparator
                .comparing(ScoredAmenity::getAccessibilityScore, Comparator.reverseOrder())
                .thenComparing(ScoredAmenity::getWalkingDurationSeconds)
                .thenComparing(ScoredAmenity::getId);
    }

    /**
     * Calculates the category score using the Top Three weighted algorithm:
     * Category Score = 0.70 * S1 + 0.20 * S2 + 0.10 * S3
     * If 1 place exists: 0.70 * S1
     * If 2 places exist: 0.70 * S1 + 0.20 * S2
     * Missing positions contribute 0 (weights are not renormalized).
     */
    public double calculateTopThreeCategoryScore(List<ScoredAmenity> sortedScoredAmenities) {
        if (sortedScoredAmenities == null || sortedScoredAmenities.isEmpty()) {
            return 0.0;
        }

        double totalScore = 0.0;
        int count = sortedScoredAmenities.size();

        if (count >= 1) {
            ScoredAmenity a1 = sortedScoredAmenities.get(0);
            a1.setWeightMultiplier(MULTIPLIER_TOP_1);
            double points1 = Math.round(a1.getAccessibilityScore() * MULTIPLIER_TOP_1 * 100.0) / 100.0;
            a1.setWeightedPoints(points1);
            totalScore += a1.getAccessibilityScore() * MULTIPLIER_TOP_1;
        }

        if (count >= 2) {
            ScoredAmenity a2 = sortedScoredAmenities.get(1);
            a2.setWeightMultiplier(MULTIPLIER_TOP_2);
            double points2 = Math.round(a2.getAccessibilityScore() * MULTIPLIER_TOP_2 * 100.0) / 100.0;
            a2.setWeightedPoints(points2);
            totalScore += a2.getAccessibilityScore() * MULTIPLIER_TOP_2;
        }

        if (count >= 3) {
            ScoredAmenity a3 = sortedScoredAmenities.get(2);
            a3.setWeightMultiplier(MULTIPLIER_TOP_3);
            double points3 = Math.round(a3.getAccessibilityScore() * MULTIPLIER_TOP_3 * 100.0) / 100.0;
            a3.setWeightedPoints(points3);
            totalScore += a3.getAccessibilityScore() * MULTIPLIER_TOP_3;
        }

        return Math.round(totalScore * 100.0) / 100.0;
    }
}

