package com.property.intelligence.scoring;

import com.property.intelligence.dto.PlaceDetails;
import com.property.intelligence.integration.DistanceCalculator;
import com.property.intelligence.integration.routing.RouteProvider;
import com.property.intelligence.integration.routing.RouteResult;
import com.property.intelligence.integration.routing.TravelMode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;

@Service
public class CandidateRoutingService {

    private static final Logger log = LoggerFactory.getLogger(CandidateRoutingService.class);

    private final RouteProvider routeProvider;
    private final RoutingCacheService routingCache;
    private final ScoringConfiguration scoringConfig;
    private final AccessibilityScoringService accessibilityService;
    private final ExecutorService executorService;

    public CandidateRoutingService(
            RouteProvider routeProvider,
            RoutingCacheService routingCache,
            ScoringConfiguration scoringConfig,
            AccessibilityScoringService accessibilityService) {
        this.routeProvider = routeProvider;
        this.routingCache = routingCache;
        this.scoringConfig = scoringConfig;
        this.accessibilityService = accessibilityService;
        // Bounded thread pool for concurrent candidate pedestrian routing
        this.executorService = Executors.newFixedThreadPool(16);
    }

    public static class CandidateRoutingResult {
        public final int discoveredCount;
        public final int routedCount;
        public final int failedRoutingCount;
        public final List<ScoredAmenity> scoredAmenities;

        public CandidateRoutingResult(int discoveredCount, int routedCount, int failedRoutingCount, List<ScoredAmenity> scoredAmenities) {
            this.discoveredCount = discoveredCount;
            this.routedCount = routedCount;
            this.failedRoutingCount = failedRoutingCount;
            this.scoredAmenities = scoredAmenities;
        }
    }

    /**
     * Filters candidate places by Haversine distance <= radiusKm, sorts by Haversine distance ascending,
     * routes a bounded shortlist of top candidates, converts walking durations into accessibility scores,
     * and returns the sorted scored candidates.
     */
    public CandidateRoutingResult routeAndScoreCandidates(
            double originLat,
            double originLon,
            double radiusKm,
            List<PlaceDetails> places) {

        if (places == null || places.isEmpty()) {
            return new CandidateRoutingResult(0, 0, 0, Collections.emptyList());
        }

        // 1. Filter places strictly inside Haversine search radius and deduplicate by stable ID
        Map<String, PlaceDetails> uniquePlaces = new LinkedHashMap<>();
        for (PlaceDetails p : places) {
            if (p.getId() != null && !p.getId().isBlank()) {
                double hDist = DistanceCalculator.haversineDistanceKm(originLat, originLon, p.getLatitude(), p.getLongitude());
                if (hDist <= radiusKm) {
                    uniquePlaces.putIfAbsent(p.getId(), p);
                }
            }
        }

        int discoveredCount = uniquePlaces.size();
        if (discoveredCount == 0) {
            return new CandidateRoutingResult(0, 0, 0, Collections.emptyList());
        }

        // 2. Rank candidates by Haversine distance ascending
        List<PlaceDetails> sortedCandidates = new ArrayList<>(uniquePlaces.values());
        sortedCandidates.sort(Comparator.comparingDouble(p ->
                DistanceCalculator.haversineDistanceKm(originLat, originLon, p.getLatitude(), p.getLongitude())));

        // 3. Select bounded shortlist
        int shortlistLimit = Math.max(3, scoringConfig.getCandidateShortlistLimit());
        List<PlaceDetails> shortlist = sortedCandidates.subList(0, Math.min(sortedCandidates.size(), shortlistLimit));

        // 4. Concurrently route candidates with caching and timeout
        List<Future<ScoredAmenity>> futures = new ArrayList<>();
        for (PlaceDetails candidate : shortlist) {
            futures.add(executorService.submit(() -> routeSingleCandidate(originLat, originLon, candidate)));
        }

        List<ScoredAmenity> scoredList = new ArrayList<>();
        int routedCount = 0;
        int failedCount = 0;

        for (Future<ScoredAmenity> future : futures) {
            try {
                ScoredAmenity scored = future.get(8, TimeUnit.SECONDS);
                if (scored != null) {
                    scoredList.add(scored);
                    routedCount++;
                } else {
                    failedCount++;
                }
            } catch (Exception e) {
                log.warn("Candidate routing error: {}", e.getMessage());
                failedCount++;
            }
        }

        // 5. Sort scored candidates: score desc, duration asc, placeId asc
        scoredList.sort(accessibilityService.getAmenityComparator());

        return new CandidateRoutingResult(discoveredCount, routedCount, failedCount, scoredList);
    }

    private ScoredAmenity routeSingleCandidate(double originLat, double originLon, PlaceDetails place) {
        double destLat = place.getLatitude();
        double destLon = place.getLongitude();
        double hDist = DistanceCalculator.haversineDistanceKm(originLat, originLon, destLat, destLon);

        // Check cache first (strictly pedestrian walking for Walkability and Location accessibility)
        RouteResult route = routingCache.get(originLat, originLon, destLat, destLon, TravelMode.WALKING);
        if (route == null) {
            try {
                route = routeProvider.calculateRoute(originLat, originLon, destLat, destLon, TravelMode.WALKING);
                if (route == null) {
                    route = routeProvider.calculateRoute(originLat, originLon, destLat, destLon, "WALKING");
                }
                if (route != null) {
                    routingCache.put(originLat, originLon, destLat, destLon, TravelMode.WALKING, route);
                }
            } catch (Exception e) {
                log.warn("Failed to fetch walking route to {}: {}", place.getName(), e.getMessage());
                return null;
            }
        }

        if (route == null) {
            return null; // Do not invent walking times if provider returns no valid route
        }

        double durationSeconds = route.getDurationSeconds();
        double accessibilityScore = accessibilityService.calculateWalkingScore(durationSeconds);

        return new ScoredAmenity(
                place.getId(),
                place.getName(),
                place.getCategory() != null ? place.getCategory() : "",
                place.getAddress(),
                destLat,
                destLon,
                hDist,
                route.getDistanceMeters(),
                durationSeconds,
                accessibilityScore
        );
    }
}
