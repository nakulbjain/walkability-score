package com.property.intelligence.integration.routing;

public enum TravelMode {
    WALKING("Walking", "pedestrian"),
    MOTORBIKE("Scooter / Motorbike", "motorcycle"),
    CAR("Car", "auto");

    private final String displayName;
    private final String engineProfile;

    TravelMode(String displayName, String engineProfile) {
        this.displayName = displayName;
        this.engineProfile = engineProfile;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getEngineProfile() {
        return engineProfile;
    }

    public static TravelMode fromString(String mode) {
        if (mode == null || mode.isBlank()) {
            return WALKING;
        }
        String clean = mode.trim().toUpperCase();
        try {
            return TravelMode.valueOf(clean);
        } catch (IllegalArgumentException e) {
            return switch (clean) {
                case "DRIVING", "AUTO", "FOUR_WHEELER" -> CAR;
                case "BIKE", "SCOOTER", "MOTORCYCLE", "TWO_WHEELER", "MOPED" -> MOTORBIKE;
                case "FOOT", "PEDESTRIAN", "WALK" -> WALKING;
                default -> WALKING;
            };
        }
    }
}

