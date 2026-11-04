package com.property.intelligence.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.property.intelligence.dto.*;
import com.property.intelligence.entity.AmenityCategory;
import com.property.intelligence.entity.LocationAnalysis;
import com.property.intelligence.entity.User;
import com.property.intelligence.exception.ResourceNotFoundException;
import com.property.intelligence.integration.DistanceCalculator;
import com.property.intelligence.integration.IndiaBoundaryValidator;
import com.property.intelligence.integration.LocationProvider;
import com.property.intelligence.repository.LocationAnalysisRepository;
import com.property.intelligence.repository.UserRepository;
import com.property.intelligence.scoring.ScoreRequest;
import com.property.intelligence.scoring.ScoringConfiguration;
import com.property.intelligence.scoring.ScoringEngineService;
import com.property.intelligence.scoring.ScoringResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class LocationAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(LocationAnalysisService.class);

    private final LocationAnalysisRepository analysisRepository;
    private final UserRepository userRepository;
    private final LocationProvider locationProvider;
    private final ScoringEngineService scoringEngineService;
    private final ObjectMapper objectMapper;

    public LocationAnalysisService(
            LocationAnalysisRepository analysisRepository,
            UserRepository userRepository,
            LocationProvider locationProvider,
            ScoringEngineService scoringEngineService,
            ObjectMapper objectMapper) {
        this.analysisRepository = analysisRepository;
        this.userRepository = userRepository;
        this.locationProvider = locationProvider;
        this.scoringEngineService = scoringEngineService;
        this.objectMapper = objectMapper;
    }

    public List<LocationSearchResult> searchLocations(String query) {
        return locationProvider.searchLocations(query);
    }

    public ReverseGeocodeResult reverseGeocode(Double latitude, Double longitude) {
        IndiaBoundaryValidator.validateInsideIndia(latitude, longitude);
        return locationProvider.reverseGeocode(latitude, longitude);
    }

    @Transactional
    public AnalysisResponse analyzeLocation(Long userId, AnalysisRequest request) {
        IndiaBoundaryValidator.validateInsideIndia(request.getLatitude(), request.getLongitude());

        if (request.getAmenities() == null || request.getAmenities().isEmpty()) {
            throw new IllegalArgumentException("At least one amenity category must be selected for analysis.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Format address if not passed from client
        String address = request.getFormattedAddress();
        String locality = request.getLocality();
        String city = request.getCity();
        String state = request.getState();

        if (address == null || address.isBlank()) {
            ReverseGeocodeResult rev = locationProvider.reverseGeocode(request.getLatitude(), request.getLongitude());
            address = rev.getFormattedAddress();
            locality = rev.getLocality();
            city = rev.getCity();
            state = rev.getState();
        }

        Set<AmenityCategory> selectedCategories = new LinkedHashSet<>(request.getAmenities());

        // Fetch verified places across selected categories only
        List<PlaceDetails> allDiscoveredPlaces = locationProvider.searchNearbyPlaces(
                request.getLatitude(),
                request.getLongitude(),
                request.getRadiusKm(),
                selectedCategories
        );

        // Filter strictly within search radius (Haversine) and sort nearest first
        List<PlaceDetails> validPlaces = allDiscoveredPlaces.stream()
                .filter(p -> p.getDistanceKm() <= request.getRadiusKm())
                .sorted(Comparator.comparingDouble(PlaceDetails::getDistanceKm))
                .toList();

        // Group places by selected category
        Map<AmenityCategory, List<PlaceDetails>> placesByCategory = new LinkedHashMap<>();
        for (AmenityCategory cat : selectedCategories) {
            List<PlaceDetails> catList = validPlaces.stream()
                    .filter(p -> p.getCategory() != null && p.getCategory().equalsIgnoreCase(cat.name()))
                    .collect(Collectors.toList());
            placesByCategory.put(cat, catList);
        }

        // Calculate explainable Phase 2.2 Walkability & Property Location Scores with equal sector weights
        ScoringResult scoringResult = scoringEngineService.calculateScores(
                request.getLatitude(),
                request.getLongitude(),
                request.getRadiusKm(),
                placesByCategory,
                selectedCategories
        );

        // Save Analysis Record to PostgreSQL
        LocationAnalysis analysis = new LocationAnalysis();
        analysis.setUser(user);
        analysis.setFormattedAddress(address);
        analysis.setLocality(locality != null ? locality : "");
        analysis.setCity(city != null ? city : "");
        analysis.setState(state != null ? state : "");
        analysis.setLatitude(request.getLatitude());
        analysis.setLongitude(request.getLongitude());
        analysis.setRadiusKm(request.getRadiusKm());
        analysis.setSelectedAmenities(new HashSet<>(selectedCategories));

        // Populate Scoring Details
        analysis.setWalkabilityScore(scoringResult.getWalkabilityScore());
        analysis.setWalkabilityStatus(scoringResult.getWalkabilityStatus() != null ? scoringResult.getWalkabilityStatus().name() : null);
        analysis.setLocationScore(scoringResult.getLocationScore());
        analysis.setLocationStatus(scoringResult.getLocationStatus() != null ? scoringResult.getLocationStatus().name() : null);
        analysis.setAlgorithmVersion(scoringResult.getAlgorithmVersion());
        analysis.setScoringTimestamp(scoringResult.getCalculatedAt());
        try {
            analysis.setScoringBreakdownJson(objectMapper.writeValueAsString(scoringResult));
        } catch (Exception e) {
            log.warn("Failed to serialize scoring breakdown: {}", e.getMessage());
        }

        LocationAnalysis saved = analysisRepository.save(analysis);

        // Display places match the selected categories
        List<PlaceDetails> displayPlaces = validPlaces.stream()
                .filter(p -> selectedCategories.stream().anyMatch(cat -> cat.name().equalsIgnoreCase(p.getCategory())))
                .toList();

        AnalysisResponse response = buildAnalysisResponse(saved, displayPlaces, scoringResult);
        return response;
    }

    @Transactional(readOnly = true)
    public ScoringResult calculateScoresOnly(ScoreRequest request) {
        IndiaBoundaryValidator.validateInsideIndia(request.getLatitude(), request.getLongitude());

        Set<AmenityCategory> evaluatedCategories = (request.getAmenities() != null && !request.getAmenities().isEmpty())
                ? new LinkedHashSet<>(request.getAmenities())
                : EnumSet.allOf(AmenityCategory.class);

        List<PlaceDetails> allPlaces = locationProvider.searchNearbyPlaces(
                request.getLatitude(),
                request.getLongitude(),
                request.getRadiusKm(),
                evaluatedCategories
        );

        List<PlaceDetails> validPlaces = allPlaces.stream()
                .filter(p -> p.getDistanceKm() <= request.getRadiusKm())
                .toList();

        Map<AmenityCategory, List<PlaceDetails>> placesByCategory = new LinkedHashMap<>();
        for (AmenityCategory cat : evaluatedCategories) {
            List<PlaceDetails> catList = validPlaces.stream()
                    .filter(p -> p.getCategory() != null && p.getCategory().equalsIgnoreCase(cat.name()))
                    .collect(Collectors.toList());
            placesByCategory.put(cat, catList);
        }

        return scoringEngineService.calculateScores(
                request.getLatitude(),
                request.getLongitude(),
                request.getRadiusKm(),
                placesByCategory,
                evaluatedCategories
        );
    }

    @Transactional(readOnly = true)
    public AnalysisResponse getAnalysisById(Long analysisId, Long userId) {
        LocationAnalysis analysis = analysisRepository.findByIdAndUserId(analysisId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis not found with id: " + analysisId));

        // Re-query places for this location using saved parameters
        List<PlaceDetails> places = locationProvider.searchNearbyPlaces(
                analysis.getLatitude(),
                analysis.getLongitude(),
                analysis.getRadiusKm(),
                analysis.getSelectedAmenities()
        );

        List<PlaceDetails> validPlaces = places.stream()
                .filter(p -> p.getDistanceKm() <= analysis.getRadiusKm())
                .sorted(Comparator.comparingDouble(PlaceDetails::getDistanceKm))
                .toList();

        // Restore saved scoring result from JSON without recalculating
        ScoringResult restoredScoring = null;
        if (analysis.getScoringBreakdownJson() != null && !analysis.getScoringBreakdownJson().isBlank()) {
            try {
                restoredScoring = objectMapper.readValue(analysis.getScoringBreakdownJson(), ScoringResult.class);
            } catch (Exception e) {
                log.warn("Failed to deserialize saved scoring breakdown: {}", e.getMessage());
            }
        }

        return buildAnalysisResponse(analysis, validPlaces, restoredScoring);
    }

    @Transactional(readOnly = true)
    public List<AnalysisHistoryItem> getAnalysisHistory(Long userId) {
        return analysisRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToHistoryItem)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteAnalysis(Long analysisId, Long userId) {
        LocationAnalysis analysis = analysisRepository.findByIdAndUserId(analysisId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis not found with id: " + analysisId));
        analysisRepository.delete(analysis);
    }

    @Transactional
    public void clearAnalysisHistory(Long userId) {
        List<LocationAnalysis> userAnalyses = analysisRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (!userAnalyses.isEmpty()) {
            analysisRepository.deleteAll(userAnalyses);
        }
    }

    private AnalysisResponse buildAnalysisResponse(
            LocationAnalysis entity,
            List<PlaceDetails> places,
            ScoringResult scoringResult) {
        AnalysisResponse res = new AnalysisResponse();
        res.setId(entity.getId());
        res.setFormattedAddress(entity.getFormattedAddress());
        res.setLocality(entity.getLocality());
        res.setCity(entity.getCity());
        res.setState(entity.getState());
        res.setLatitude(entity.getLatitude());
        res.setLongitude(entity.getLongitude());
        res.setRadiusKm(entity.getRadiusKm());
        res.setSelectedAmenities(entity.getSelectedAmenities());
        res.setCreatedAt(entity.getCreatedAt());
        res.setAllPlaces(places);

        // Group places by category
        Map<AmenityCategory, List<PlaceDetails>> categorized = new LinkedHashMap<>();
        for (AmenityCategory cat : entity.getSelectedAmenities()) {
            List<PlaceDetails> catPlaces = places.stream()
                    .filter(p -> p.getCategory() != null && p.getCategory().equalsIgnoreCase(cat.name()))
                    .sorted(Comparator.comparingDouble(PlaceDetails::getDistanceKm))
                    .collect(Collectors.toList());
            categorized.put(cat, catPlaces);
        }
        res.setCategorizedPlaces(categorized);

        // Build category overview summaries
        Map<AmenityCategory, AnalysisResponse.CategorySummary> summaries = new LinkedHashMap<>();
        for (AmenityCategory cat : entity.getSelectedAmenities()) {
            List<PlaceDetails> catPlaces = categorized.getOrDefault(cat, Collections.emptyList());
            int count = catPlaces.size();
            Double nearestDist = count > 0 ? catPlaces.get(0).getDistanceKm() : null;
            String nearestName = count > 0 ? catPlaces.get(0).getName() : null;

            summaries.put(cat, new AnalysisResponse.CategorySummary(cat, count, nearestDist, nearestName));
        }
        res.setCategorySummaries(summaries);

        // Populate Scoring Results
        if (scoringResult != null) {
            res.setWalkabilityScore(scoringResult.getWalkabilityScore());
            res.setWalkabilityRating(scoringResult.getWalkabilityRating());
            res.setWalkabilityStatus(scoringResult.getWalkabilityStatus() != null ? scoringResult.getWalkabilityStatus().name() : null);
            res.setWalkabilityExplanation(scoringResult.getWalkabilityExplanation());

            res.setLocationScore(scoringResult.getLocationScore());
            res.setLocationRating(scoringResult.getLocationRating());
            res.setLocationStatus(scoringResult.getLocationStatus() != null ? scoringResult.getLocationStatus().name() : null);
            res.setLocationExplanation(scoringResult.getLocationExplanation());

            res.setScoringResult(scoringResult);
            res.setAlgorithmVersion(scoringResult.getAlgorithmVersion());
            res.setScoringTimestamp(scoringResult.getCalculatedAt());
        } else {
            res.setWalkabilityScore(entity.getWalkabilityScore());
            res.setWalkabilityRating(ScoringConfiguration.getRatingLabel(entity.getWalkabilityScore()));
            res.setWalkabilityStatus(entity.getWalkabilityStatus());
            res.setLocationScore(entity.getLocationScore());
            res.setLocationRating(ScoringConfiguration.getRatingLabel(entity.getLocationScore()));
            res.setLocationStatus(entity.getLocationStatus());
            res.setAlgorithmVersion(entity.getAlgorithmVersion());
            res.setScoringTimestamp(entity.getScoringTimestamp());
        }

        return res;
    }

    private AnalysisHistoryItem mapToHistoryItem(LocationAnalysis entity) {
        AnalysisHistoryItem item = new AnalysisHistoryItem();
        item.setId(entity.getId());
        item.setFormattedAddress(entity.getFormattedAddress());
        item.setLocality(entity.getLocality());
        item.setCity(entity.getCity());
        item.setState(entity.getState());
        item.setLatitude(entity.getLatitude());
        item.setLongitude(entity.getLongitude());
        item.setRadiusKm(entity.getRadiusKm());
        item.setSelectedAmenities(entity.getSelectedAmenities());
        item.setCreatedAt(entity.getCreatedAt());

        // Scoring history attributes
        item.setWalkabilityScore(entity.getWalkabilityScore());
        item.setWalkabilityRating(ScoringConfiguration.getRatingLabel(entity.getWalkabilityScore()));
        item.setWalkabilityStatus(entity.getWalkabilityStatus());
        item.setLocationScore(entity.getLocationScore());
        item.setLocationRating(ScoringConfiguration.getRatingLabel(entity.getLocationScore()));
        item.setLocationStatus(entity.getLocationStatus());
        item.setAlgorithmVersion(entity.getAlgorithmVersion());
        item.setScoringTimestamp(entity.getScoringTimestamp());

        return item;
    }
}


