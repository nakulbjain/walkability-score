package com.property.intelligence.integration;

import java.awt.geom.Path2D;

public final class IndiaBoundaryValidator {

    // Bounding Box for preliminary fast exclusion (including Lakshadweep and Andaman & Nicobar)
    public static final double MIN_LAT = 6.0;
    public static final double MAX_LAT = 37.6;
    public static final double MIN_LON = 68.0;
    public static final double MAX_LON = 97.6;

    // Multi-point polygon defining the geographic perimeter of India
    // Approximating India's international borders and coastal perimeter
    private static final double[][] INDIA_MAINLAND_POLYGON = new double[][] {
            // Gujarat & Western border
            {23.7, 68.1}, {24.5, 68.8}, {24.7, 71.1}, {26.0, 70.3}, {27.5, 70.0},
            // Rajasthan / Punjab / J&K / Ladakh (North-West)
            {29.0, 71.5}, {31.2, 73.5}, {32.5, 74.5}, {34.0, 73.8}, {35.5, 74.5},
            {37.1, 74.8}, {37.3, 76.8}, {35.8, 77.8}, {34.5, 79.0}, {33.5, 79.3},
            // Himachal / Uttarakhand / Northern border
            {32.0, 78.8}, {31.0, 78.5}, {30.5, 80.5}, {30.1, 81.0},
            // Along Indo-Nepal border (Northern Uttar Pradesh / Bihar)
            {28.8, 80.1}, {27.4, 82.0}, {26.5, 85.0}, {26.8, 88.0},
            // Sikkim & Bhutan border
            {27.8, 88.5}, {27.2, 89.0}, {26.8, 90.0}, {27.0, 92.0},
            // Arunachal Pradesh / Northeast (Easternmost)
            {27.8, 92.5}, {28.5, 94.0}, {28.8, 96.0}, {28.2, 97.4}, {27.0, 96.5},
            // Nagaland, Manipur, Mizoram (Indo-Myanmar border)
            {26.0, 95.0}, {24.5, 94.5}, {23.0, 93.3}, {21.9, 92.9},
            // Southern Mizoram / Tripura / Meghalaya / Assam
            {22.0, 92.5}, {23.5, 91.2}, {25.2, 90.0}, {26.0, 89.8},
            // West Bengal / Bangladesh border & Sundarbans
            {25.0, 88.5}, {23.0, 89.0}, {21.6, 89.0}, {21.5, 87.5},
            // Eastern Coast (Odisha, Andhra Pradesh, Tamil Nadu)
            {19.8, 86.0}, {18.0, 84.0}, {16.0, 81.5}, {14.0, 80.2}, {13.0, 80.3},
            {10.5, 79.8}, {9.2, 79.2}, {8.1, 77.5}, // Kanyakumari
            // Western Coast (Kerala, Karnataka, Goa, Maharashtra, Gujarat)
            {8.5, 76.9}, {10.0, 76.2}, {11.8, 75.3}, {13.0, 74.8}, {15.0, 73.9},
            {19.0, 72.8}, {20.5, 72.8}, {21.2, 72.7}, {21.0, 70.0}, {22.5, 69.0},
            {23.7, 68.1} // Close polygon
    };

    private static final Path2D.Double POLYGON_PATH;

    static {
        POLYGON_PATH = new Path2D.Double();
        POLYGON_PATH.moveTo(INDIA_MAINLAND_POLYGON[0][1], INDIA_MAINLAND_POLYGON[0][0]); // lon, lat
        for (int i = 1; i < INDIA_MAINLAND_POLYGON.length; i++) {
            POLYGON_PATH.lineTo(INDIA_MAINLAND_POLYGON[i][1], INDIA_MAINLAND_POLYGON[i][0]);
        }
        POLYGON_PATH.closePath();
    }

    private IndiaBoundaryValidator() {}

    /**
     * Checks if given coordinates fall strictly within India's supported geographical boundaries.
     * Evaluates bounding box and polygonal path, plus islands (Andaman & Nicobar, Lakshadweep).
     */
    public static boolean isInsideIndia(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return false;
        }

        // 1. Fast bounding check
        if (latitude < MIN_LAT || latitude > MAX_LAT || longitude < MIN_LON || longitude > MAX_LON) {
            return false;
        }

        // 2. Island territories check
        // Andaman & Nicobar: Lat 6.5 to 14.0, Lon 92.0 to 94.5
        if (latitude >= 6.5 && latitude <= 14.0 && longitude >= 92.0 && longitude <= 94.5) {
            return true;
        }

        // Lakshadweep: Lat 8.0 to 12.5, Lon 71.5 to 74.0
        if (latitude >= 8.0 && latitude <= 12.5 && longitude >= 71.5 && longitude <= 74.0) {
            return true;
        }

        // 3. Mainland India Polygonal boundary check (point in polygon)
        return POLYGON_PATH.contains(longitude, latitude);
    }

    /**
     * Validates that the coordinates are within India or throws IllegalArgumentException.
     */
    public static void validateInsideIndia(Double latitude, Double longitude) {
        if (!isInsideIndia(latitude, longitude)) {
            throw new IllegalArgumentException(
                    "Location is outside India (" + latitude + ", " + longitude + "). " +
                    "Property Location Intelligence currently supports locations within India only."
            );
        }
    }
}

