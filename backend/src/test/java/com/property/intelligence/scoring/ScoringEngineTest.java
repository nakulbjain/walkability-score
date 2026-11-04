package com.property.intelligence.scoring;

import com.property.intelligence.dto.PlaceDetails;
import com.property.intelligence.entity.AmenityCategory;
import com.property.intelligence.integration.routing.RouteProvider;
import com.property.intelligence.integration.routing.RouteResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ScoringEngineTest {

    private ScoringConfiguration config;
    private AccessibilityScoringService accessibilityService;
    private WalkabilityScoringService walkabilityService;
    private LocationScoringService locationService;
    private CandidateRoutingService candidateRoutingService;
    private ScoringEngineService scoringEngine;
    private RouteProvider mockRouteProvider;

    @BeforeEach
    void setUp() {
        config = new ScoringConfiguration();
        accessibilityService = new AccessibilityScoringService();
        walkabilityService = new WalkabilityScoringService(config);
        locationService = new LocationScoringService(config);
        mockRouteProvider = mock(RouteProvider.class);
        RoutingCacheService cache = new RoutingCacheService();
        candidateRoutingService = new CandidateRoutingService(
                mockRouteProvider, cache, config, accessibilityService
        );
        scoringEngine = new ScoringEngineService(
                candidateRoutingService,
                accessibilityService,
                walkabilityService,
                locationService,
                config
        );
    }

    @Test
    @DisplayName("Task 3: Equal sector weighting: 100 / N percent, summing to 100%")
    void testEqualSectorWeights() {
        // When 4 sectors are selected, each gets exactly 25.0%
        assertEquals(25.0, ScoringConfiguration.calculateEqualWeight(4), 0.0001);
        assertEquals(100.0, 4 * ScoringConfiguration.calculateEqualWeight(4), 0.0001);

        // When 3 sectors are selected, each gets 33.3333...%
        assertEquals(100.0 / 3, ScoringConfiguration.calculateEqualWeight(3), 0.0001);
        assertEquals(100.0, 3 * ScoringConfiguration.calculateEqualWeight(3), 0.0001);

        // Walkability eligible categories must have exactly 8 categories and exclude ENTERTAINMENT
        assertEquals(8, ScoringConfiguration.WALKABILITY_ELIGIBLE_CATEGORIES.size());
        assertFalse(ScoringConfiguration.WALKABILITY_ELIGIBLE_CATEGORIES.contains(AmenityCategory.ENTERTAINMENT));
        assertTrue(ScoringConfiguration.WALKABILITY_ELIGIBLE_CATEGORIES.contains(AmenityCategory.GROCERY));
        assertTrue(ScoringConfiguration.WALKABILITY_ELIGIBLE_CATEGORIES.contains(AmenityCategory.TRANSPORTATION));
        assertTrue(ScoringConfiguration.WALKABILITY_ELIGIBLE_CATEGORIES.contains(AmenityCategory.HEALTHCARE));
        assertTrue(ScoringConfiguration.WALKABILITY_ELIGIBLE_CATEGORIES.contains(AmenityCategory.DINING));
    }

    @Test
    @DisplayName("Task 3 & 6: Deterministic scoring with equal sector weights, bounds 0-100, and algorithm version 2.2.0")
    void testDeterministicScoring() {
        double originLat = 12.9716;
        double originLon = 77.5946;
        double radiusKm = 1.0;

        // Build deterministic places fixture across all 9 categories
        Map<AmenityCategory, List<PlaceDetails>> places = new LinkedHashMap<>();

        // Route duration returns 240s (4 min -> 100 pts) for all places
        when(mockRouteProvider.calculateRoute(anyDouble(), anyDouble(), anyDouble(), anyDouble(), eq("WALKING")))
                .thenReturn(new RouteResult("WALKING", 250.0, 240.0, Collections.emptyList(), "OSRM"));

        for (AmenityCategory cat : AmenityCategory.values()) {
            List<PlaceDetails> list = new ArrayList<>();
            // Create 3 places per category
            for (int i = 1; i <= 3; i++) {
                PlaceDetails p = new PlaceDetails();
                p.setId("place-" + cat.name() + "-" + i);
                p.setName(cat.name() + " Venue " + i);
                p.setCategory(cat.name());
                p.setLatitude(originLat + (0.001 * i));
                p.setLongitude(originLon + (0.001 * i));
                list.add(p);
            }
            places.put(cat, list);
        }

        ScoringResult result = scoringEngine.calculateScores(originLat, originLon, radiusKm, places);

        assertNotNull(result);
        assertEquals(ScoringConfiguration.ALGORITHM_VERSION, result.getAlgorithmVersion());
        assertEquals("2.2.0", result.getAlgorithmVersion());

        // Since each place has walking score 100, each category score = 100.0
        // Equal weighting yields 100.0
        assertEquals(ScoringStatus.COMPLETE, result.getWalkabilityStatus());
        assertEquals(100.0, result.getWalkabilityScore(), 0.01);
        assertEquals("Excellent", result.getWalkabilityRating());

        // Location score = 100.0
        assertEquals(ScoringStatus.COMPLETE, result.getLocationStatus());
        assertEquals(100.0, result.getLocationScore(), 0.01);
        assertEquals("Excellent", result.getLocationRating());

        // Check bounds
        assertTrue(result.getWalkabilityScore() >= 0.0 && result.getWalkabilityScore() <= 100.0);
        assertTrue(result.getLocationScore() >= 0.0 && result.getLocationScore() <= 100.0);

        // Verify all 9 category scores exist
        assertEquals(9, result.getCategoryScores().size());
        for (AmenityCategory cat : AmenityCategory.values()) {
            CategoryScoreDetail detail = result.getCategoryScores().get(cat);
            assertNotNull(detail);
            assertEquals(100.0, detail.getCategoryScore(), 0.01);
            assertEquals(ScoringStatus.COMPLETE, detail.getStatus());
            assertEquals(3, detail.getUsedInScoringCount());
        }
    }

    @Test
    @DisplayName("Item 11: All-zero confirmed places results in 0 score with COMPLETE status")
    void testAllZeroPlacesScoresZero() {
        Map<AmenityCategory, List<PlaceDetails>> emptyPlaces = new LinkedHashMap<>();
        for (AmenityCategory cat : AmenityCategory.values()) {
            emptyPlaces.put(cat, Collections.emptyList());
        }

        ScoringResult result = scoringEngine.calculateScores(12.9716, 77.5946, 1.0, emptyPlaces);

        assertEquals(ScoringStatus.COMPLETE, result.getWalkabilityStatus());
        assertEquals(0.0, result.getWalkabilityScore(), 0.001);
        assertEquals("Very Poor", result.getWalkabilityRating());

        assertEquals(ScoringStatus.COMPLETE, result.getLocationStatus());
        assertEquals(0.0, result.getLocationScore(), 0.001);
        assertEquals("Very Poor", result.getLocationRating());
    }

    @Test
    @DisplayName("Reliability check: If a required category route provider fails, score is UNAVAILABLE and not silently zero")
    void testRouteProviderFailureYieldsUnavailable() {
        // Route provider returns null for all requests
        when(mockRouteProvider.calculateRoute(anyDouble(), anyDouble(), anyDouble(), anyDouble(), eq("WALKING")))
                .thenReturn(null);

        Map<AmenityCategory, List<PlaceDetails>> places = new LinkedHashMap<>();
        PlaceDetails p = new PlaceDetails();
        p.setId("store-1");
        p.setName("Supermarket");
        p.setCategory("GROCERY");
        p.setLatitude(12.9720);
        p.setLongitude(77.5950);
        places.put(AmenityCategory.GROCERY, List.of(p));

        ScoringResult result = scoringEngine.calculateScores(12.9716, 77.5946, 1.0, places);

        // GROCERY had places discovered, but routing failed
        CategoryScoreDetail groceryDetail = result.getCategoryScores().get(AmenityCategory.GROCERY);
        assertEquals(ScoringStatus.UNAVAILABLE, groceryDetail.getStatus());
        assertNull(groceryDetail.getCategoryScore());

        // Overall score must be UNAVAILABLE and NOT silently treated as zero
        assertEquals(ScoringStatus.UNAVAILABLE, result.getWalkabilityStatus());
        assertNull(result.getWalkabilityScore());
        assertEquals("Unavailable", result.getWalkabilityRating());
        assertEquals("Score unavailable — incomplete routing or amenity data.", result.getWalkabilityExplanation());
    }
}

