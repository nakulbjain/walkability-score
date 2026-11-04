package com.property.intelligence.scoring;

import com.property.intelligence.dto.PlaceDetails;
import com.property.intelligence.entity.AmenityCategory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ScoringEngineService {

    private final CandidateRoutingService candidateRoutingService;
    private final AccessibilityScoringService accessibilityService;
    private final WalkabilityScoringService walkabilityService;
    private final LocationScoringService locationService;
    private final ScoringConfiguration scoringConfig;

    public ScoringEngineService(
            CandidateRoutingService candidateRoutingService,
            AccessibilityScoringService accessibilityService,
            WalkabilityScoringService walkabilityService,
            LocationScoringService locationService,
            ScoringConfiguration scoringConfig) {
        this.candidateRoutingService = candidateRoutingService;
        this.accessibilityService = accessibilityService;
        this.walkabilityService = walkabilityService;
        this.locationService = locationService;
        this.scoringConfig = scoringConfig;
    }

    /**
     * Calculates explainable Walkability and Property Location scores across all categories.
     *
     * @param originLat property latitude
     * @param originLon property longitude
     * @param radiusKm search radius
     * @param placesByCategory verified places grouped by amenity category
     * @return comprehensive ScoringResult
     */
    public ScoringResult calculateScores(
            double originLat,
            double originLon,
            double radiusKm,
            Map<AmenityCategory, List<PlaceDetails>> placesByCategory,
            Set<AmenityCategory> selectedCategories) {

        Set<AmenityCategory> evaluatedCategories = (selectedCategories != null && !selectedCategories.isEmpty())
                ? selectedCategories
                : EnumSet.allOf(AmenityCategory.class);

        int totalSelected = evaluatedCategories.size();
        double locEqualWeight = ScoringConfiguration.calculateEqualWeight(totalSelected);

        Set<AmenityCategory> eligibleWalkCategories = new LinkedHashSet<>();
        for (AmenityCategory cat : evaluatedCategories) {
            if (ScoringConfiguration.WALKABILITY_ELIGIBLE_CATEGORIES.contains(cat)) {
                eligibleWalkCategories.add(cat);
            }
        }
        int totalWalkEligible = eligibleWalkCategories.size();
        double walkEqualWeight = ScoringConfiguration.calculateEqualWeight(totalWalkEligible);

        Map<AmenityCategory, CategoryScoreDetail> categoryScores = new LinkedHashMap<>();

        // Evaluate ONLY selected categories with equal sector weights
        for (AmenityCategory category : evaluatedCategories) {
            List<PlaceDetails> categoryPlaces = placesByCategory != null
                    ? placesByCategory.getOrDefault(category, Collections.emptyList())
                    : Collections.emptyList();

            CandidateRoutingService.CandidateRoutingResult routingResult =
                    candidateRoutingService.routeAndScoreCandidates(originLat, originLon, radiusKm, categoryPlaces);

            CategoryScoreDetail detail = new CategoryScoreDetail(
                    category,
                    ScoringConfiguration.getCategoryDisplayName(category)
            );
            detail.setDiscoveredCount(routingResult.discoveredCount);
            detail.setRoutedCount(routingResult.routedCount);
            detail.setFailedRoutingCount(routingResult.failedRoutingCount);

            boolean isWalkEligible = ScoringConfiguration.WALKABILITY_ELIGIBLE_CATEGORIES.contains(category);
            detail.setLocationWeight(locEqualWeight);
            detail.setWalkabilityWeight(isWalkEligible ? walkEqualWeight : 0.0);

            if (routingResult.discoveredCount == 0) {
                // Confirmed zero establishments in radius
                detail.setCategoryScore(0.0);
                detail.setStatus(ScoringStatus.COMPLETE);
                detail.setUsedInScoringCount(0);
                detail.setExplanation(String.format(Locale.US, "Confirmed zero verified establishments found within %.1f km.", radiusKm));
                detail.setTopAmenities(Collections.emptyList());
                detail.setWalkabilityContribution(0.0);
                detail.setLocationContribution(0.0);
            } else if (routingResult.routedCount == 0) {
                // Places discovered, but 0 routing requests succeeded (provider failure)
                detail.setCategoryScore(null);
                detail.setStatus(ScoringStatus.UNAVAILABLE);
                detail.setUsedInScoringCount(0);
                detail.setExplanation("Walking route provider temporarily unavailable for candidate establishments.");
                detail.setTopAmenities(Collections.emptyList());
                detail.setWalkabilityContribution(null);
                detail.setLocationContribution(null);
            } else {
                // At least one valid route was obtained
                List<ScoredAmenity> top3 = routingResult.scoredAmenities.subList(
                        0, Math.min(routingResult.scoredAmenities.size(), 3)
                );
                double catScore = accessibilityService.calculateTopThreeCategoryScore(top3);
                detail.setCategoryScore(catScore);
                detail.setUsedInScoringCount(top3.size());
                detail.setTopAmenities(top3);

                if (routingResult.routedCount >= 3 || routingResult.routedCount == routingResult.discoveredCount) {
                    detail.setStatus(ScoringStatus.COMPLETE);
                    ScoredAmenity best = top3.get(0);
                    detail.setExplanation(String.format(
                            Locale.US,
                            "Score %.1f based on %d best walkable establishments (top: %s, %d min walk, %.1f pts).",
                            catScore, top3.size(), best.getName(), best.getWalkingDurationMinutes(), best.getAccessibilityScore()
                    ));
                } else {
                    detail.setStatus(ScoringStatus.PARTIAL);
                    detail.setExplanation(String.format(
                            Locale.US,
                            "Partial score %.1f based on %d routed establishments (%d routing attempts failed).",
                            catScore, top3.size(), routingResult.failedRoutingCount
                    ));
                }

                if (isWalkEligible) {
                    detail.setWalkabilityContribution(Math.round(catScore * (walkEqualWeight / 100.0) * 100.0) / 100.0);
                } else {
                    detail.setWalkabilityContribution(0.0);
                }
                detail.setLocationContribution(Math.round(catScore * (locEqualWeight / 100.0) * 100.0) / 100.0);
            }

            categoryScores.put(category, detail);
        }

        // Calculate overall scores
        WalkabilityScoringService.WalkabilityResult walkabilityResult =
                walkabilityService.calculateWalkabilityScore(categoryScores, evaluatedCategories);
        LocationScoringService.LocationScoreResult locationResult =
                locationService.calculateLocationScore(categoryScores, evaluatedCategories);

        ScoringResult result = new ScoringResult();
        result.setWalkabilityScore(walkabilityResult.score);
        result.setWalkabilityRating(walkabilityResult.rating);
        result.setWalkabilityStatus(walkabilityResult.status);
        result.setWalkabilityExplanation(walkabilityResult.explanation);

        result.setLocationScore(locationResult.score);
        result.setLocationRating(locationResult.rating);
        result.setLocationStatus(locationResult.status);
        result.setLocationExplanation(locationResult.explanation);

        result.setCategoryScores(categoryScores);
        result.setAlgorithmVersion(scoringConfig.getAlgorithmVersion());
        result.setCalculatedAt(LocalDateTime.now());

        return result;
    }

    public ScoringResult calculateScores(
            double originLat,
            double originLon,
            double radiusKm,
            Map<AmenityCategory, List<PlaceDetails>> placesByCategory) {
        return calculateScores(originLat, originLon, radiusKm, placesByCategory, EnumSet.allOf(AmenityCategory.class));
    }
}

