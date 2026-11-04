package com.property.intelligence.scoring;

import com.property.intelligence.integration.routing.OsrmRouteProvider;
import com.property.intelligence.integration.routing.RouteResult;
import com.property.intelligence.integration.routing.TravelMode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class MultiModeRoutingTest {

    @Test
    @DisplayName("Task 3: TravelMode enum values and resilient parsing")
    void testTravelModeEnum() {
        assertEquals(TravelMode.WALKING, TravelMode.fromString("WALKING"));
        assertEquals(TravelMode.WALKING, TravelMode.fromString("foot"));
        assertEquals(TravelMode.WALKING, TravelMode.fromString("pedestrian"));
        assertEquals(TravelMode.WALKING, TravelMode.fromString("walk"));

        assertEquals(TravelMode.MOTORBIKE, TravelMode.fromString("MOTORBIKE"));
        assertEquals(TravelMode.MOTORBIKE, TravelMode.fromString("bike"));
        assertEquals(TravelMode.MOTORBIKE, TravelMode.fromString("scooter"));
        assertEquals(TravelMode.MOTORBIKE, TravelMode.fromString("motorcycle"));
        assertEquals(TravelMode.MOTORBIKE, TravelMode.fromString("two_wheeler"));

        assertEquals(TravelMode.CAR, TravelMode.fromString("CAR"));
        assertEquals(TravelMode.CAR, TravelMode.fromString("driving"));
        assertEquals(TravelMode.CAR, TravelMode.fromString("auto"));
        assertEquals(TravelMode.CAR, TravelMode.fromString("four_wheeler"));

        // Defaults to WALKING on null or unknown
        assertEquals(TravelMode.WALKING, TravelMode.fromString(null));
        assertEquals(TravelMode.WALKING, TravelMode.fromString("UNKNOWN_MODE"));
    }

    @Test
    @DisplayName("Task 1 & 6: Polyline6 decoding for Valhalla multi-mode responses")
    void testPolyline6Decoding() {
        // Valhalla polyline6 encoding test
        // Empty string yields empty list
        assertTrue(OsrmRouteProvider.decodePolyline6("").isEmpty());
        assertTrue(OsrmRouteProvider.decodePolyline6(null).isEmpty());

        // Decode a known polyline6 string
        // Point (12.9438, 77.5741) encoded in polyline6
        String testShape = "k}omA_n|zL";
        List<List<Double>> coords = OsrmRouteProvider.decodePolyline6(testShape);
        assertFalse(coords.isEmpty());
        // [longitude, latitude] GeoJSON format
        assertEquals(2, coords.get(0).size());
    }

    @Test
    @DisplayName("Task 4: Motorized scoring decay thresholds are distinct from walking")
    void testMotorizedAccessibilityThresholds() {
        AccessibilityScoringService service = new AccessibilityScoringService();

        // Walking: <= 300s (5m) is 100, 600s is 90
        assertEquals(100.0, service.calculateWalkingScore(300.0));
        assertEquals(90.0, service.calculateWalkingScore(600.0));
        assertEquals(75.0, service.calculateWalkingScore(900.0));
        assertEquals(55.0, service.calculateWalkingScore(1200.0));
        assertEquals(25.0, service.calculateWalkingScore(1800.0));
        assertEquals(0.0, service.calculateWalkingScore(1900.0));

        // Motorized: <= 180s (3m) is 100, 360s is 90, 600s is 75, 900s is 55, 1500s is 25, >1500s is 0
        assertEquals(100.0, service.calculateMotorizedScore(180.0));
        assertEquals(90.0, service.calculateMotorizedScore(360.0));
        assertEquals(75.0, service.calculateMotorizedScore(600.0));
        assertEquals(55.0, service.calculateMotorizedScore(900.0));
        assertEquals(25.0, service.calculateMotorizedScore(1500.0));
        assertEquals(0.0, service.calculateMotorizedScore(1600.0));
    }

    @Test
    @DisplayName("Task 7: Routing cache key format includes mode and v2.3 version")
    void testRoutingCacheKey() {
        RoutingCacheService cache = new RoutingCacheService();
        String walkKey = cache.generateKey(12.9438, 77.5741, 12.9460, 77.5750, TravelMode.WALKING);
        String bikeKey = cache.generateKey(12.9438, 77.5741, 12.9460, 77.5750, TravelMode.MOTORBIKE);
        String carKey = cache.generateKey(12.9438, 77.5741, 12.9460, 77.5750, TravelMode.CAR);

        assertTrue(walkKey.contains("WALKING:v2.3"));
        assertTrue(bikeKey.contains("MOTORBIKE:v2.3"));
        assertTrue(carKey.contains("CAR:v2.3"));
        assertNotEquals(walkKey, bikeKey);
        assertNotEquals(bikeKey, carKey);

        // Does not cache null or empty result
        cache.put(12.9438, 77.5741, 12.9460, 77.5750, TravelMode.WALKING, null);
        assertNull(cache.get(12.9438, 77.5741, 12.9460, 77.5750, TravelMode.WALKING));

        RouteResult dummy = new RouteResult("WALKING", 350.0, 280.0, List.of(List.of(77.5741, 12.9438)), "OSRM", "pedestrian");
        cache.put(12.9438, 77.5741, 12.9460, 77.5750, TravelMode.WALKING, dummy);
        assertNotNull(cache.get(12.9438, 77.5741, 12.9460, 77.5750, TravelMode.WALKING));
        // Different mode must not return walking route
        assertNull(cache.get(12.9438, 77.5741, 12.9460, 77.5750, TravelMode.MOTORBIKE));
    }
}

