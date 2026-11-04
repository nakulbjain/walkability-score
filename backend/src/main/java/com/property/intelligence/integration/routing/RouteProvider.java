package com.property.intelligence.integration.routing;

public interface RouteProvider {
    /**
     * Calculates route between origin and destination coordinates for a given travel mode.
     * @param originLat latitude of origin
     * @param originLon longitude of origin
     * @param destLat latitude of destination
     * @param destLon longitude of destination
     * @param mode TravelMode (WALKING, MOTORBIKE, CAR)
     * @return RouteResult with geometry, distance, and duration from actual verified routing engine
     */
    RouteResult calculateRoute(double originLat, double originLon, double destLat, double destLon, TravelMode mode);

    default RouteResult calculateRoute(double originLat, double originLon, double destLat, double destLon, String modeStr) {
        return calculateRoute(originLat, originLon, destLat, destLon, TravelMode.fromString(modeStr));
    }
}

