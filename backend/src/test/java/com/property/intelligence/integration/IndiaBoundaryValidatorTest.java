package com.property.intelligence.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

class IndiaBoundaryValidatorTest {

    @ParameterizedTest(name = "{0}: ({1}, {2}) should be inside India")
    @CsvSource({
            "Bengaluru, 12.9716, 77.5946",
            "Whitefield Bengaluru, 12.9698, 77.7499",
            "New Delhi, 28.6139, 77.2090",
            "Mumbai, 19.0760, 72.8777",
            "Kolkata, 22.5726, 88.3639",
            "Chennai, 13.0827, 80.2707",
            "Hyderabad, 17.3850, 78.4867",
            "Kochi Kerala, 9.9312, 76.2673",
            "Jaipur Rajasthan, 26.9124, 75.7873",
            "Guwahati Assam, 26.1445, 91.7362",
            "Srinagar Kashmir, 34.0837, 74.7973",
            "Port Blair Andaman, 11.6234, 92.7265",
            "Kavaratti Lakshadweep, 10.5667, 72.6417"
    })
    @DisplayName("Verify legitimate locations across India pass validation")
    void testInsideIndiaLocations(String city, double lat, double lon) {
        assertTrue(IndiaBoundaryValidator.isInsideIndia(lat, lon), city + " should be inside India");
        assertDoesNotThrow(() -> IndiaBoundaryValidator.validateInsideIndia(lat, lon));
    }

    @ParameterizedTest(name = "{0}: ({1}, {2}) should be outside India")
    @CsvSource({
            "New York USA, 40.7128, -74.0060",
            "London UK, 51.5074, -0.1278",
            "Paris France, 48.8566, 2.3522",
            "Tokyo Japan, 35.6762, 139.6503",
            "Sydney Australia, -33.8688, 151.2093",
            "Dubai UAE, 25.2048, 55.2708",
            "Arabian Sea Deep Water, 15.0, 64.0",
            "Indian Ocean Deep Water, 2.0, 78.0",
            "North Pole, 90.0, 0.0"
    })
    @DisplayName("Verify locations outside India are rejected")
    void testOutsideIndiaLocations(String city, double lat, double lon) {
        assertFalse(IndiaBoundaryValidator.isInsideIndia(lat, lon), city + " should be outside India");
        assertThrows(IllegalArgumentException.class, () -> IndiaBoundaryValidator.validateInsideIndia(lat, lon));
    }

    @Test
    @DisplayName("Verify null coordinates are rejected safely")
    void testNullCoordinates() {
        assertFalse(IndiaBoundaryValidator.isInsideIndia(null, 77.59));
        assertFalse(IndiaBoundaryValidator.isInsideIndia(12.97, null));
        assertFalse(IndiaBoundaryValidator.isInsideIndia(null, null));
    }
}

