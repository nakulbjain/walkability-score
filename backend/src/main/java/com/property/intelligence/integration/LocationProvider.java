package com.property.intelligence.integration;

import com.property.intelligence.dto.LocationSearchResult;
import com.property.intelligence.dto.PlaceDetails;
import com.property.intelligence.dto.ReverseGeocodeResult;
import com.property.intelligence.entity.AmenityCategory;

import java.util.List;
import java.util.Set;

public interface LocationProvider {

    /**
     * Search for locations matching a query (state, city, locality, address, landmark)
     */
    List<LocationSearchResult> searchLocations(String query);

    /**
     * Reverse geocode a latitude and longitude to find formatted address, locality, city, and state
     */
    ReverseGeocodeResult reverseGeocode(Double latitude, Double longitude);

    /**
     * Search for nearby places for the given amenity categories within the specified radius (in km).
     * Any returned place MUST strictly be within radiusKm of the center coordinate.
     */
    List<PlaceDetails> searchNearbyPlaces(Double latitude, Double longitude, Double radiusKm, Set<AmenityCategory> categories);
}

