package com.property.intelligence.integration;

public final class DistanceCalculator {

    private static final double EARTH_RADIUS_KM = 6371.0088;

    private DistanceCalculator() {}

    /**
     * Calculates the great-circle / straight-line geospatial distance between two points
     * using the Haversine formula.
     *
     * @return distance in kilometers, rounded to 2 decimal places
     */
    public static double haversineDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = EARTH_RADIUS_KM * c;

        return Math.round(distance * 100.0) / 100.0;
    }
}

