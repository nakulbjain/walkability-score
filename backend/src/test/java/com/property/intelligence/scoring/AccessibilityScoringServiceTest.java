package com.property.intelligence.scoring;

import com.property.intelligence.dto.PlaceDetails;
import com.property.intelligence.entity.AmenityCategory;
import com.property.intelligence.integration.DistanceCalculator;
import com.property.intelligence.integration.routing.RouteProvider;
import com.property.intelligence.integration.routing.RouteResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AccessibilityScoringServiceTest {

    private AccessibilityScoringService scoringService;
    private ScoringConfiguration config;

    @BeforeEach
    void setUp() {
        scoringService = new AccessibilityScoringService();
        config = new ScoringConfiguration();
    }

    @Test
    @DisplayName("Item 1: Haversine distance correctly filters boundaries")
    void testHaversineRadiusBoundaries() {
        double originLat = 12.9716;
        double originLon = 77.5946;

        // Exactly at origin
        double d0 = DistanceCalculator.haversineDistanceKm(originLat, originLon, originLat, originLon);
        assertEquals(0.0, d0, 0.001);

        // Point approximately 0.5 km away
        double dNear = DistanceCalculator.haversineDistanceKm(originLat, originLon, 12.9750, 77.5946);
        assertTrue(dNear <= 1.0, "Point should be within 1km radius");

        // Point approximately 1.5 km away (12.9850, 77.5946)
        double dFar = DistanceCalculator.haversineDistanceKm(originLat, originLon, 12.9850, 77.5946);
        assertTrue(dFar > 1.0, "Point should be outside 1km radius");
    }

    @ParameterizedTest(name = "Duration {0}s should score {1} pts")
    @CsvSource({
            "0.0, 100.0",
            "150.0, 100.0",
            "300.0, 100.0",     // Boundary: 5 min exact
            "300.1, 90.0",      // Just over 5 min
            "599.9, 90.0",
            "600.0, 90.0",      // Boundary: 10 min exact
            "600.1, 75.0",      // Just over 10 min
            "900.0, 75.0",      // Boundary: 15 min exact
            "900.1, 55.0",      // Just over 15 min
            "1200.0, 55.0",     // Boundary: 20 min exact
            "1200.1, 25.0",     // Just over 20 min
            "1800.0, 25.0",     // Boundary: 30 min exact
            "1800.1, 0.0",      // Over 30 min
            "3600.0, 0.0"       // 60 min
    })
    @DisplayName("Item 2: Walking-time thresholds decay model evaluation")
    void testWalkingTimeThresholds(double durationSeconds, double expectedScore) {
        double actualScore = scoringService.calculateWalkingScore(durationSeconds);
        assertEquals(expectedScore, actualScore, 0.001,
                "Duration " + durationSeconds + "s should yield " + expectedScore + " points");
    }

    @Test
    @DisplayName("Item 3: Top-three weighted calculation (0.70*S1 + 0.20*S2 + 0.10*S3)")
    void testTopThreeCalculation() {
        List<ScoredAmenity> places = new ArrayList<>();
        places.add(new ScoredAmenity("p1", "Place 1", "GROCERY", "Addr 1", 12.9, 77.5, 0.2, 200.0, 180.0, 100.0));
        places.add(new ScoredAmenity("p2", "Place 2", "GROCERY", "Addr 2", 12.9, 77.5, 0.5, 500.0, 450.0, 90.0));
        places.add(new ScoredAmenity("p3", "Place 3", "GROCERY", "Addr 3", 12.9, 77.5, 0.8, 800.0, 720.0, 75.0));

        double categoryScore = scoringService.calculateTopThreeCategoryScore(places);
        // Expected: 0.70 * 100 + 0.20 * 90 + 0.10 * 75 = 70 + 18 + 7.5 = 95.5
        assertEquals(95.5, categoryScore, 0.01);
    }

    @Test
    @DisplayName("Item 4: One-place (0.70*S1) and Two-place (0.70*S1 + 0.20*S2) cases without renormalizing")
    void testOneAndTwoPlaceCases() {
        // 1 place case
        List<ScoredAmenity> onePlace = List.of(
                new ScoredAmenity("p1", "Solo Place", "GROCERY", "Addr 1", 12.9, 77.5, 0.2, 200.0, 180.0, 100.0)
        );
        double scoreOne = scoringService.calculateTopThreeCategoryScore(onePlace);
        // Expected: 0.70 * 100 = 70.0 (missing positions contribute zero)
        assertEquals(70.0, scoreOne, 0.01);

        // 2 places case
        List<ScoredAmenity> twoPlaces = List.of(
                new ScoredAmenity("p1", "Place 1", "GROCERY", "Addr 1", 12.9, 77.5, 0.2, 200.0, 180.0, 100.0),
                new ScoredAmenity("p2", "Place 2", "GROCERY", "Addr 2", 12.9, 77.5, 0.5, 500.0, 450.0, 90.0)
        );
        double scoreTwo = scoringService.calculateTopThreeCategoryScore(twoPlaces);
        // Expected: 0.70 * 100 + 0.20 * 90 = 70.0 + 18.0 = 88.0
        assertEquals(88.0, scoreTwo, 0.01);
    }

    @Test
    @DisplayName("Item 5: Zero confirmed places returns zero")
    void testZeroPlaces() {
        double scoreEmpty = scoringService.calculateTopThreeCategoryScore(Collections.emptyList());
        assertEquals(0.0, scoreEmpty, 0.001);

        double scoreNull = scoringService.calculateTopThreeCategoryScore(null);
        assertEquals(0.0, scoreNull, 0.001);
    }

    @Test
    @DisplayName("Item 6 & 7: Missing walking routes and partial provider failures")
    void testCandidateRoutingWithMissingRoutes() {
        RouteProvider mockRouteProvider = mock(RouteProvider.class);
        RoutingCacheService cache = new RoutingCacheService();
        CandidateRoutingService routingService = new CandidateRoutingService(
                mockRouteProvider, cache, config, scoringService
        );

        PlaceDetails p1 = new PlaceDetails();
        p1.setId("p1");
        p1.setName("Accessible Store");
        p1.setCategory("GROCERY");
        p1.setLatitude(12.9720);
        p1.setLongitude(77.5950);

        PlaceDetails p2 = new PlaceDetails();
        p2.setId("p2");
        p2.setName("Unreachable Store");
        p2.setCategory("GROCERY");
        p2.setLatitude(12.9730);
        p2.setLongitude(77.5960);

        // p1 returns a valid walking route (300s = 5m -> 100 pts)
        when(mockRouteProvider.calculateRoute(12.9716, 77.5946, 12.9720, 77.5950, "WALKING"))
                .thenReturn(new RouteResult("WALKING", 350.0, 280.0, Collections.emptyList(), "OSRM"));

        // p2 fails or returns null (unreachable pedestrian path)
        when(mockRouteProvider.calculateRoute(12.9716, 77.5946, 12.9730, 77.5960, "WALKING"))
                .thenReturn(null);

        CandidateRoutingService.CandidateRoutingResult result =
                routingService.routeAndScoreCandidates(12.9716, 77.5946, 1.0, List.of(p1, p2));

        assertEquals(2, result.discoveredCount);
        assertEquals(1, result.routedCount);
        assertEquals(1, result.failedRoutingCount);
        assertEquals(1, result.scoredAmenities.size());
        assertEquals("p1", result.scoredAmenities.get(0).getId());
        assertEquals(100.0, result.scoredAmenities.get(0).getAccessibilityScore(), 0.01);
    }
}

