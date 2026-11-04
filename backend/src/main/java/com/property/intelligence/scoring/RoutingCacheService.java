package com.property.intelligence.scoring;

import com.property.intelligence.integration.routing.RouteResult;
import com.property.intelligence.integration.routing.TravelMode;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RoutingCacheService {

    private static class CacheEntry {
        final RouteResult result;
        final long expiresAt;

        CacheEntry(RouteResult result, long ttlMillis) {
            this.result = result;
            this.expiresAt = System.currentTimeMillis() + ttlMillis;
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }

    private static final long DEFAULT_TTL_MILLIS = 24 * 60 * 60 * 1000L; // 24 hours
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public String generateKey(double originLat, double originLon, double destLat, double destLon, TravelMode mode) {
        return String.format(Locale.US, "%.5f,%.5f:%.5f,%.5f:%s:v2.3", originLat, originLon, destLat, destLon, mode.name());
    }

    public RouteResult get(double originLat, double originLon, double destLat, double destLon, TravelMode mode) {
        String key = generateKey(originLat, originLon, destLat, destLon, mode);
        CacheEntry entry = cache.get(key);
        if (entry != null) {
            if (!entry.isExpired()) {
                return entry.result;
            } else {
                cache.remove(key);
            }
        }
        return null;
    }

    public void put(double originLat, double originLon, double destLat, double destLon, TravelMode mode, RouteResult result) {
        // Enforce Task 7: Do not cache a failed route as a successful result
        if (result != null && result.getCoordinates() != null && !result.getCoordinates().isEmpty() && result.getDurationSeconds() > 0) {
            String key = generateKey(originLat, originLon, destLat, destLon, mode);
            cache.put(key, new CacheEntry(result, DEFAULT_TTL_MILLIS));
        }
    }

    // Overloads for string mode compatibility
    public RouteResult get(double originLat, double originLon, double destLat, double destLon, String mode) {
        return get(originLat, originLon, destLat, destLon, TravelMode.fromString(mode));
    }

    public void put(double originLat, double originLon, double destLat, double destLon, String mode, RouteResult result) {
        put(originLat, originLon, destLat, destLon, TravelMode.fromString(mode), result);
    }

    public void clear() {
        cache.clear();
    }

    public int size() {
        return cache.size();
    }
}
