package com.property.intelligence.integration.google;

import com.property.intelligence.dto.LocationSearchResult;
import com.property.intelligence.dto.PlaceDetails;
import com.property.intelligence.dto.ReverseGeocodeResult;
import com.property.intelligence.entity.AmenityCategory;
import com.property.intelligence.integration.LocationProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Set;

/**
 * Modular Google Maps Platform provider stub.
 * Activated by setting app.location.provider=google and providing app.location.google.api-key.
 */
@Component
@ConditionalOnProperty(name = "app.location.provider", havingValue = "google")
public class GoogleMapsLocationProvider implements LocationProvider {

    private static final Logger log = LoggerFactory.getLogger(GoogleMapsLocationProvider.class);

    private final String apiKey;

    public GoogleMapsLocationProvider(@Value("${app.location.google.api-key:}") String apiKey) {
        this.apiKey = apiKey;
        log.info("GoogleMapsLocationProvider initialized with API Key presence: {}", apiKey != null && !apiKey.isBlank());
    }

    @Override
    public List<LocationSearchResult> searchLocations(String query) {
        // Can be plugged with Google Places Autocomplete API
        log.info("Google Places autocomplete search called for: {}", query);
        return Collections.emptyList();
    }

    @Override
    public ReverseGeocodeResult reverseGeocode(Double latitude, Double longitude) {
        // Can be plugged with Google Geocoding API
        log.info("Google Geocoding reverse lookup called for: {}, {}", latitude, longitude);
        return new ReverseGeocodeResult("Google Geocoded Address", "Locality", "City", "State", latitude, longitude);
    }

    @Override
    public List<PlaceDetails> searchNearbyPlaces(Double latitude, Double longitude, Double radiusKm, Set<AmenityCategory> categories) {
        // Can be plugged with Google Places Nearby Search API
        log.info("Google Places nearby search called for {} categories within {} km", categories.size(), radiusKm);
        return Collections.emptyList();
    }
}

