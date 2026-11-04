package com.property.intelligence.integration.routing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class OsrmRouteProvider implements RouteProvider {

    private static final Logger log = LoggerFactory.getLogger(OsrmRouteProvider.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // 1. OSRM Dedicated Endpoints
    private static final String OSRM_FOOT_URL = "https://routing.openstreetmap.de/routed-foot/route/v1/foot/%f,%f;%f,%f?overview=full&geometries=geojson";
    private static final String OSRM_CAR_URL = "https://routing.openstreetmap.de/routed-car/route/v1/driving/%f,%f;%f,%f?overview=full&geometries=geojson";
    private static final String FALLBACK_CAR_URL = "http://router.project-osrm.org/route/v1/driving/%f,%f;%f,%f?overview=full&geometries=geojson";

    // 2. Valhalla OSM Multi-Modal Endpoint (Supports genuine pedestrian, motorcycle, and auto profiles)
    private static final String VALHALLA_URL = "https://valhalla1.openstreetmap.de/route";

    public OsrmRouteProvider(ObjectMapper objectMapper) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(3000);
        requestFactory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(requestFactory);
        this.objectMapper = objectMapper;
    }

    @Override
    public RouteResult calculateRoute(double originLat, double originLon, double destLat, double destLon, TravelMode mode) {
        if (mode == null) {
            mode = TravelMode.WALKING;
        }

        return switch (mode) {
            case WALKING -> calculateWalkingRoute(originLat, originLon, destLat, destLon);
            case MOTORBIKE -> calculateMotorbikeRoute(originLat, originLon, destLat, destLon);
            case CAR -> calculateCarRoute(originLat, originLon, destLat, destLon);
        };
    }

    /**
     * Genuine pedestrian routing.
     * Primary: OSRM foot profile (routing.openstreetmap.de)
     * Secondary: Valhalla pedestrian profile (valhalla1.openstreetmap.de)
     * Never falls back to car routing.
     */
    private RouteResult calculateWalkingRoute(double originLat, double originLon, double destLat, double destLon) {
        // Try primary OSRM Foot
        String osrmUrl = String.format(Locale.US, OSRM_FOOT_URL, originLon, originLat, destLon, destLat);
        RouteResult result = executeOsrmRequest(osrmUrl, "WALKING", "OpenStreetMap / OSRM Foot", "pedestrian");
        if (result != null) {
            return result;
        }

        // Try secondary Valhalla Pedestrian
        log.info("OSRM Foot unavailable, trying Valhalla pedestrian fallback for ({}, {}) -> ({}, {})", originLat, originLon, destLat, destLon);
        result = executeValhallaRequest(originLat, originLon, destLat, destLon, "WALKING", "pedestrian", "OpenStreetMap / Valhalla Foot");
        if (result != null) {
            return result;
        }

        log.warn("All genuine pedestrian routing backends failed for ({}, {}) -> ({}, {})", originLat, originLon, destLat, destLon);
        return null;
    }

    /**
     * Genuine motorized two-wheeler routing.
     * Uses Valhalla's motorcycle costing profile.
     * If unavailable, returns null (never silently substitutes car).
     */
    private RouteResult calculateMotorbikeRoute(double originLat, double originLon, double destLat, double destLon) {
        RouteResult result = executeValhallaRequest(originLat, originLon, destLat, destLon, "MOTORBIKE", "motorcycle", "OpenStreetMap / Valhalla Motorcycle");
        if (result != null) {
            return result;
        }

        log.warn("Valhalla motorcycle routing failed or unavailable for ({}, {}) -> ({}, {})", originLat, originLon, destLat, destLon);
        return null;
    }

    /**
     * Genuine automobile routing.
     * Primary: OSRM Car (routing.openstreetmap.de)
     * Secondary: Valhalla Auto (valhalla1.openstreetmap.de)
     * Tertiary: Project-OSRM Car (router.project-osrm.org)
     */
    private RouteResult calculateCarRoute(double originLat, double originLon, double destLat, double destLon) {
        // Primary OSRM Car
        String osrmUrl = String.format(Locale.US, OSRM_CAR_URL, originLon, originLat, destLon, destLat);
        RouteResult result = executeOsrmRequest(osrmUrl, "CAR", "OpenStreetMap / OSRM Car", "driving");
        if (result != null) {
            return result;
        }

        // Secondary Valhalla Auto
        result = executeValhallaRequest(originLat, originLon, destLat, destLon, "CAR", "auto", "OpenStreetMap / Valhalla Auto");
        if (result != null) {
            return result;
        }

        // Tertiary Project-OSRM Car
        String fallbackCarUrl = String.format(Locale.US, FALLBACK_CAR_URL, originLon, originLat, destLon, destLat);
        result = executeOsrmRequest(fallbackCarUrl, "CAR", "Project-OSRM Car", "driving");
        if (result != null) {
            return result;
        }

        log.warn("All car routing backends failed for ({}, {}) -> ({}, {})", originLat, originLon, destLat, destLon);
        return null;
    }

    private RouteResult executeOsrmRequest(String url, String mode, String providerName, String profileName) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "PropertyLocationIntelligence/2.3 (contact@propertyintelligence.org)");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                if ("Ok".equalsIgnoreCase(root.path("code").asText())) {
                    JsonNode route = root.path("routes").get(0);
                    if (route != null) {
                        double distanceMeters = route.path("distance").asDouble(0.0);
                        double durationSeconds = route.path("duration").asDouble(0.0);

                        List<List<Double>> coords = new ArrayList<>();
                        JsonNode coordinatesNode = route.path("geometry").path("coordinates");
                        if (coordinatesNode.isArray()) {
                            for (JsonNode pt : coordinatesNode) {
                                if (pt.isArray() && pt.size() >= 2) {
                                    coords.add(List.of(pt.get(0).asDouble(), pt.get(1).asDouble()));
                                }
                            }
                        }

                        return new RouteResult(mode, distanceMeters, durationSeconds, coords, providerName, profileName);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("OSRM routing request failed for {}: {}", url, e.getMessage());
        }
        return null;
    }

    private RouteResult executeValhallaRequest(
            double originLat, double originLon,
            double destLat, double destLon,
            String mode, String costing,
            String providerName) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", "PropertyLocationIntelligence/2.3 (contact@propertyintelligence.org)");

            Map<String, Object> payload = new HashMap<>();
            payload.put("locations", List.of(
                    Map.of("lat", originLat, "lon", originLon),
                    Map.of("lat", destLat, "lon", destLon)
            ));
            payload.put("costing", costing);
            payload.put("directions_options", Map.of("units", "kilometers"));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.exchange(VALHALLA_URL, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode summary = root.path("trip").path("summary");
                double durationSeconds = summary.path("time").asDouble(0.0);
                double lengthKm = summary.path("length").asDouble(0.0);
                double distanceMeters = lengthKm * 1000.0;

                JsonNode legs = root.path("trip").path("legs");
                if (legs.isArray() && legs.size() > 0) {
                    String shape = legs.get(0).path("shape").asText("");
                    List<List<Double>> coords = decodePolyline6(shape);
                    if (!coords.isEmpty()) {
                        return new RouteResult(mode, distanceMeters, durationSeconds, coords, providerName, costing);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Valhalla routing request failed for mode {} (costing {}): {}", mode, costing, e.getMessage());
        }
        return null;
    }

    public static List<List<Double>> decodePolyline6(String encoded) {
        List<List<Double>> poly = new ArrayList<>();
        if (encoded == null || encoded.isEmpty()) {
            return poly;
        }
        int index = 0, len = encoded.length();
        int lat = 0, lng = 0;

        while (index < len) {
            int b, shift = 0, result = 0;
            do {
                b = encoded.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                b = encoded.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            poly.add(List.of(lng / 1e6, lat / 1e6));
        }
        return poly;
    }
}
