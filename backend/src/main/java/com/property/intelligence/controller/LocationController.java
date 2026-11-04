package com.property.intelligence.controller;

import com.property.intelligence.dto.LocationSearchResult;
import com.property.intelligence.dto.ReverseGeocodeResult;
import com.property.intelligence.service.LocationAnalysisService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/location")
public class LocationController {

    private final LocationAnalysisService analysisService;

    public LocationController(LocationAnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<LocationSearchResult>> searchLocations(@RequestParam("q") String query) {
        List<LocationSearchResult> results = analysisService.searchLocations(query);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/reverse")
    public ResponseEntity<ReverseGeocodeResult> reverseGeocode(
            @RequestParam("lat") Double latitude,
            @RequestParam("lon") Double longitude) {
        ReverseGeocodeResult result = analysisService.reverseGeocode(latitude, longitude);
        return ResponseEntity.ok(result);
    }
}

