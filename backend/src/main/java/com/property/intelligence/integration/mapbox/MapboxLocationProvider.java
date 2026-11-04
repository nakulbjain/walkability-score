package com.property.intelligence.integration.mapbox;

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
 * Modular Mapbox provider stub.
 * Activated by setting app.location.provider=mapbox and providing app.location.mapbox.access-token.
 */
@Component
@ConditionalOnProperty(name = "app.location.provider", havingValue = "mapbox")
public class MapboxLocationProvider implements LocationProvider {

    private static final Logger log = LoggerFactory.getLogger(MapboxLocationProvider.class);

    private final String accessToken;

    public MapboxLocationProvider(@Value("${app.location.mapbox.access-token:}") String accessToken) {
        this.accessToken = accessToken;
        log.info("MapboxLocationProvider initialized with token presence: {}", accessToken != null && !accessToken.isBlank());
    }

    @Override
    public List<LocationSearchResult> searchLocations(String query) {
        log.info("Mapbox Geocoding forward search called for: {}", query);
        return Collections.emptyList();
    }

    @Override
    public ReverseGeocodeResult reverseGeocode(Double latitude, Double longitude) {
        log.info("Mapbox Geocoding reverse lookup called for: {}, {}", latitude, longitude);
        return new ReverseGeocodeResult("Mapbox Geocoded Address", "Locality", "City", "State", latitude, longitude);
    }

    @Override
    public List<PlaceDetails> searchNearbyPlaces(Double latitude, Double longitude, Double radiusKm, Set<AmenityCategory> categories) {
        log.info("Mapbox Tilequery / Search API called for {} categories within {} km", categories.size(), radiusKm);
        return Collections.emptyList();
    }
}

