package com.property.intelligence.dto;

import com.property.intelligence.entity.AmenityCategory;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.Set;

public class AnalysisRequest {

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private Double longitude;

    @NotNull(message = "Search radius is required")
    @DecimalMin(value = "0.5", message = "Radius must be at least 0.5 km")
    @DecimalMax(value = "25.0", message = "Radius must not exceed 25 km")
    private Double radiusKm;

    @NotEmpty(message = "At least one amenity category must be selected")
    private Set<AmenityCategory> amenities;

    private String formattedAddress;
    private String locality;
    private String city;
    private String state;

    public AnalysisRequest() {}

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getRadiusKm() {
        return radiusKm;
    }

    public void setRadiusKm(Double radiusKm) {
        this.radiusKm = radiusKm;
    }

    public Set<AmenityCategory> getAmenities() {
        return amenities;
    }

    public void setAmenities(Set<AmenityCategory> amenities) {
        this.amenities = amenities;
    }

    public String getFormattedAddress() {
        return formattedAddress;
    }

    public void setFormattedAddress(String formattedAddress) {
        this.formattedAddress = formattedAddress;
    }

    public String getLocality() {
        return locality;
    }

    public void setLocality(String locality) {
        this.locality = locality;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }
}

