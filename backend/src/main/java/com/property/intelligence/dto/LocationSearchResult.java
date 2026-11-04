package com.property.intelligence.dto;

public class LocationSearchResult {
    private String placeId;
    private String name;
    private String formattedAddress;
    private String locality;
    private String city;
    private String state;
    private Double latitude;
    private Double longitude;

    public LocationSearchResult() {}

    public LocationSearchResult(String placeId, String name, String formattedAddress, String locality, String city, String state, Double latitude, Double longitude) {
        this.placeId = placeId;
        this.name = name;
        this.formattedAddress = formattedAddress;
        this.locality = locality;
        this.city = city;
        this.state = state;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getPlaceId() {
        return placeId;
    }

    public void setPlaceId(String placeId) {
        this.placeId = placeId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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
}

