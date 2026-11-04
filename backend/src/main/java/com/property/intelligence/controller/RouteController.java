package com.property.intelligence.controller;

import com.property.intelligence.integration.routing.RouteProvider;
import com.property.intelligence.integration.routing.RouteResult;
import com.property.intelligence.integration.routing.TravelMode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private final RouteProvider routeProvider;

    public RouteController(RouteProvider routeProvider) {
        this.routeProvider = routeProvider;
    }

    @GetMapping
    public ResponseEntity<?> getRoute(
            @RequestParam double originLat,
            @RequestParam double originLon,
            @RequestParam double destLat,
            @RequestParam double destLon,
            @RequestParam(defaultValue = "WALKING") String mode
    ) {
        TravelMode travelMode = TravelMode.fromString(mode);
        RouteResult result = routeProvider.calculateRoute(originLat, originLon, destLat, destLon, travelMode);
        if (result == null) {
            String message = (travelMode == TravelMode.MOTORBIKE)
                    ? "Motorbike-specific routing is temporarily unavailable from the provider."
                    : "Could not calculate actual " + travelMode.getDisplayName().toLowerCase() + " route between the specified coordinates.";
            return ResponseEntity.status(404).body(Map.of(
                    "error", "Route unavailable",
                    "mode", travelMode.name(),
                    "message", message
            ));
        }
        return ResponseEntity.ok(result);
    }
}
