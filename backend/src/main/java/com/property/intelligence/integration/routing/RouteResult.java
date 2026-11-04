package com.property.intelligence.integration.routing;

import java.util.List;

public class RouteResult {
    private String mode; // WALKING, DRIVING
    private double distanceMeters;
    private double distanceKm;
    private double durationSeconds;
    private int durationMinutes;
    private List<List<Double>> coordinates; // [[lon, lat], ...]
    private String provider; // e.g. OpenStreetMap / OSRM Foot, Valhalla Motorcycle
    private String routingProfile; // e.g. pedestrian, motorcycle, driving

    public RouteResult() {}

    public RouteResult(String mode, double distanceMeters, double durationSeconds, List<List<Double>> coordinates, String provider) {
        this(mode, distanceMeters, durationSeconds, coordinates, provider, mode);
    }

    public RouteResult(String mode, double distanceMeters, double durationSeconds, List<List<Double>> coordinates, String provider, String routingProfile) {
        this.mode = mode;
        this.distanceMeters = distanceMeters;
        this.distanceKm = Math.round((distanceMeters / 1000.0) * 100.0) / 100.0;
        this.durationSeconds = durationSeconds;
        this.durationMinutes = (int) Math.round(durationSeconds / 60.0);
        this.coordinates = coordinates;
        this.provider = provider;
        this.routingProfile = routingProfile;
    }

    public String getRoutingProfile() {
        return routingProfile;
    }

    public void setRoutingProfile(String routingProfile) {
        this.routingProfile = routingProfile;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public double getDistanceMeters() {
        return distanceMeters;
    }

    public void setDistanceMeters(double distanceMeters) {
        this.distanceMeters = distanceMeters;
        this.distanceKm = Math.round((distanceMeters / 1000.0) * 100.0) / 100.0;
    }

    public double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public double getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(double durationSeconds) {
        this.durationSeconds = durationSeconds;
        this.durationMinutes = (int) Math.round(durationSeconds / 60.0);
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(int durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public List<List<Double>> getCoordinates() {
        return coordinates;
    }

    public void setCoordinates(List<List<Double>> coordinates) {
        this.coordinates = coordinates;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }
}

