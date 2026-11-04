package com.property.intelligence.integration.overpass;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.property.intelligence.dto.LocationSearchResult;
import com.property.intelligence.dto.PlaceDetails;
import com.property.intelligence.dto.ReverseGeocodeResult;
import com.property.intelligence.entity.AmenityCategory;
import com.property.intelligence.integration.DistanceCalculator;
import com.property.intelligence.integration.IndiaBoundaryValidator;
import com.property.intelligence.integration.LocationProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OverpassLocationProvider implements LocationProvider {

    private static final Logger log = LoggerFactory.getLogger(OverpassLocationProvider.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String overpassUrl;
    private final String nominatimUrl;

    // Cache to respect provider rate limits and ensure instant repeat exploration
    private final Map<String, List<PlaceDetails>> placeCache = new ConcurrentHashMap<>();
    private final Map<String, List<LocationSearchResult>> searchCache = new ConcurrentHashMap<>();
    private final Map<String, ReverseGeocodeResult> reverseCache = new ConcurrentHashMap<>();

    private static final String PHOTON_API_URL = "https://photon.komoot.io/api/";
    private static final String PHOTON_REVERSE_URL = "https://photon.komoot.io/reverse";

    public OverpassLocationProvider(
            RestTemplate restTemplate,
            ObjectMapper objectMapper,
            @Value("${app.location.overpass.url:https://overpass-api.de/api/interpreter}") String overpassUrl,
            @Value("${app.location.nominatim.url:https://nominatim.openstreetmap.org}") String nominatimUrl) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.overpassUrl = overpassUrl;
        this.nominatimUrl = nominatimUrl;
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "PropertyLocationIntelligence/1.2 (https://github.com/property-intelligence; contact@propertyintelligence.org)");
        headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON, MediaType.ALL));
        return headers;
    }

    @Override
    public List<LocationSearchResult> searchLocations(String query) {
        if (query == null || query.trim().length() < 2) {
            return Collections.emptyList();
        }

        String cacheKey = query.trim().toLowerCase();
        if (searchCache.containsKey(cacheKey)) {
            return searchCache.get(cacheKey);
        }

        List<LocationSearchResult> results = new ArrayList<>();

        // Try Photon OSM search first
        try {
            URI photonUri = UriComponentsBuilder.fromHttpUrl(PHOTON_API_URL)
                    .queryParam("q", query.trim())
                    .queryParam("limit", 10)
                    .build()
                    .encode()
                    .toUri();

            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
            ResponseEntity<String> response = restTemplate.exchange(photonUri, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode features = root.path("features");

                for (JsonNode f : features) {
                    JsonNode props = f.path("properties");
                    JsonNode geom = f.path("geometry");
                    JsonNode coords = geom.path("coordinates");

                    if (coords.isArray() && coords.size() >= 2) {
                        double lon = coords.get(0).asDouble();
                        double lat = coords.get(1).asDouble();

                        // Enforce India geographic scope
                        if (!IndiaBoundaryValidator.isInsideIndia(lat, lon)) {
                            continue;
                        }

                        String name = props.path("name").asText("");
                        if (name.isBlank()) {
                            name = props.path("street").asText("Location");
                        }

                        StringBuilder addressBuilder = new StringBuilder(name);
                        String street = props.path("street").asText("");
                        String district = props.path("district").asText("");
                        String city = props.path("city").asText("");
                        String state = props.path("state").asText("");
                        String country = props.path("country").asText("");

                        if (!street.isBlank() && !name.contains(street)) addressBuilder.append(", ").append(street);
                        if (!district.isBlank()) addressBuilder.append(", ").append(district);
                        if (!city.isBlank()) addressBuilder.append(", ").append(city);
                        if (!state.isBlank()) addressBuilder.append(", ").append(state);
                        if (!country.isBlank()) addressBuilder.append(", ").append(country);

                        String osmId = props.path("osm_type").asText("N") + "-" + props.path("osm_id").asText();

                        LocationSearchResult item = new LocationSearchResult();
                        item.setPlaceId(osmId);
                        item.setName(name);
                        item.setFormattedAddress(addressBuilder.toString());
                        item.setLatitude(lat);
                        item.setLongitude(lon);
                        item.setLocality(!district.isBlank() ? district : props.path("locality").asText(""));
                        item.setCity(city);
                        item.setState(state);

                        results.add(item);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Photon search issue: {}. Trying Nominatim...", e.getMessage());
        }

        // Fallback to Nominatim if needed
        if (results.isEmpty()) {
            try {
                URI uri = UriComponentsBuilder.fromHttpUrl(nominatimUrl + "/search")
                        .queryParam("q", query.trim())
                        .queryParam("format", "json")
                        .queryParam("countrycodes", "in")
                        .queryParam("addressdetails", 1)
                        .queryParam("limit", 8)
                        .build()
                        .encode()
                        .toUri();

                HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
                ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode array = objectMapper.readTree(response.getBody());
                    for (JsonNode item : array) {
                        double lat = item.path("lat").asDouble();
                        double lon = item.path("lon").asDouble();
                        if (!IndiaBoundaryValidator.isInsideIndia(lat, lon)) {
                            continue;
                        }

                        LocationSearchResult result = new LocationSearchResult();
                        result.setPlaceId(item.path("place_id").asText());
                        result.setName(item.path("display_name").asText().split(",")[0]);
                        result.setFormattedAddress(item.path("display_name").asText());
                        result.setLatitude(lat);
                        result.setLongitude(lon);

                        JsonNode address = item.path("address");
                        result.setLocality(extractLocality(address));
                        result.setCity(extractCity(address));
                        result.setState(address.path("state").asText(""));

                        results.add(result);
                    }
                }
            } catch (Exception e) {
                log.warn("Nominatim fallback search failed: {}", e.getMessage());
            }
        }

        if (!results.isEmpty()) {
            searchCache.put(cacheKey, results);
        }

        return results;
    }

    @Override
    public ReverseGeocodeResult reverseGeocode(Double latitude, Double longitude) {
        IndiaBoundaryValidator.validateInsideIndia(latitude, longitude);

        String cacheKey = String.format(Locale.US, "%.5f,%.5f", latitude, longitude);
        if (reverseCache.containsKey(cacheKey)) {
            return reverseCache.get(cacheKey);
        }

        // Try Photon reverse geocode
        try {
            URI photonUri = UriComponentsBuilder.fromHttpUrl(PHOTON_REVERSE_URL)
                    .queryParam("lat", latitude)
                    .queryParam("lon", longitude)
                    .build()
                    .encode()
                    .toUri();

            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
            ResponseEntity<String> response = restTemplate.exchange(photonUri, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode features = root.path("features");
                if (features.isArray() && features.size() > 0) {
                    JsonNode props = features.get(0).path("properties");
                    String name = props.path("name").asText("");
                    String street = props.path("street").asText("");
                    String locality = props.path("locality").asText("");
                    String district = props.path("district").asText("");
                    String city = props.path("city").asText("");
                    String state = props.path("state").asText("");
                    String country = props.path("country").asText("");

                    StringBuilder sb = new StringBuilder();
                    if (!name.isBlank()) sb.append(name).append(", ");
                    if (!street.isBlank()) sb.append(street).append(", ");
                    if (!district.isBlank()) sb.append(district).append(", ");
                    if (!city.isBlank()) sb.append(city).append(", ");
                    if (!state.isBlank()) sb.append(state).append(", ");
                    if (!country.isBlank()) sb.append(country);

                    String formatted = sb.toString().replaceAll(", $", "");
                    if (formatted.isBlank()) {
                        formatted = String.format(Locale.US, "Location at %.5f, %.5f", latitude, longitude);
                    }

                    ReverseGeocodeResult result = new ReverseGeocodeResult(
                            formatted,
                            !district.isBlank() ? district : locality,
                            city,
                            state,
                            latitude,
                            longitude
                    );
                    reverseCache.put(cacheKey, result);
                    return result;
                }
            }
        } catch (Exception e) {
            log.warn("Photon reverse geocode failed: {}", e.getMessage());
        }

        // Try Nominatim reverse geocode
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(nominatimUrl + "/reverse")
                    .queryParam("lat", latitude)
                    .queryParam("lon", longitude)
                    .queryParam("format", "json")
                    .queryParam("addressdetails", 1)
                    .build()
                    .encode()
                    .toUri();

            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
            ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode item = objectMapper.readTree(response.getBody());
                JsonNode address = item.path("address");
                String displayName = item.path("display_name").asText("Selected Location (" + latitude + ", " + longitude + ")");

                ReverseGeocodeResult result = new ReverseGeocodeResult(
                        displayName,
                        extractLocality(address),
                        extractCity(address),
                        address.path("state").asText(""),
                        latitude,
                        longitude
                );
                reverseCache.put(cacheKey, result);
                return result;
            }
        } catch (Exception e) {
            log.warn("Nominatim reverse geocode failed: {}", e.getMessage());
        }

        ReverseGeocodeResult fallback = new ReverseGeocodeResult(
                String.format(Locale.US, "Location at %.5f, %.5f", latitude, longitude),
                "Selected Area",
                "",
                "",
                latitude,
                longitude
        );
        return fallback;
    }

    @Override
    public List<PlaceDetails> searchNearbyPlaces(Double latitude, Double longitude, Double radiusKm, Set<AmenityCategory> categories) {
        if (categories == null || categories.isEmpty()) {
            return Collections.emptyList();
        }

        IndiaBoundaryValidator.validateInsideIndia(latitude, longitude);

        String cacheKey = String.format(Locale.US, "%.5f_%.5f_%.1f_%s", latitude, longitude, radiusKm, categories.toString());
        if (placeCache.containsKey(cacheKey)) {
            return placeCache.get(cacheKey);
        }

        List<PlaceDetails> verifiedPlaces = new ArrayList<>();
        Set<String> seenIds = new HashSet<>();

        // Calculate bounding box around property
        double dLat = radiusKm / 111.0;
        double dLon = radiusKm / (111.0 * Math.cos(Math.toRadians(latitude)));
        double minLat = latitude - dLat;
        double maxLat = latitude + dLat;
        double minLon = longitude - dLon;
        double maxLon = longitude + dLon;

        // Try Photon OSM index first
        try {
            String bbox = String.format(Locale.US, "%.5f,%.5f,%.5f,%.5f", minLon, minLat, maxLon, maxLat);
            Map<AmenityCategory, List<String>> keywordsMap = getCategoryKeywords();

            for (AmenityCategory cat : categories) {
                List<String> keywords = keywordsMap.getOrDefault(cat, Collections.emptyList());
                for (String kw : keywords) {
                    URI uri = UriComponentsBuilder.fromHttpUrl(PHOTON_API_URL)
                            .queryParam("q", kw)
                            .queryParam("bbox", bbox)
                            .queryParam("limit", 15)
                            .build()
                            .encode()
                            .toUri();

                    HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
                    ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        JsonNode root = objectMapper.readTree(response.getBody());
                        JsonNode features = root.path("features");

                        for (JsonNode f : features) {
                            JsonNode props = f.path("properties");
                            String name = props.path("name").asText("").trim();
                            if (name.isBlank()) continue;

                            String osmKey = props.path("osm_key").asText("");
                            String osmValue = props.path("osm_value").asText("");

                            // Validate amenity strictly against category schema
                            if (!isPlaceMatchingCategory(cat, osmKey, osmValue, name)) {
                                continue;
                            }

                            JsonNode coords = f.path("geometry").path("coordinates");
                            if (!coords.isArray() || coords.size() < 2) continue;

                            double placeLon = coords.get(0).asDouble();
                            double placeLat = coords.get(1).asDouble();

                            // Ensure place coordinates are inside India
                            if (!IndiaBoundaryValidator.isInsideIndia(placeLat, placeLon)) {
                                continue;
                            }

                            double distKm = DistanceCalculator.haversineDistanceKm(latitude, longitude, placeLat, placeLon);
                            if (distKm > radiusKm) continue;

                            String osmType = props.path("osm_type").asText("N");
                            String osmId = props.path("osm_id").asText("");
                            String uniqueId = "osm-" + osmType + "-" + osmId;

                            if (!seenIds.add(uniqueId)) continue;

                            PlaceDetails place = new PlaceDetails();
                            place.setId(uniqueId);
                            place.setProviderPlaceId(osmId);
                            place.setProvider("OpenStreetMap");
                            place.setName(name);
                            place.setCategory(cat.name());

                            String amenityType = !osmValue.isBlank() ? osmValue.replace('_', ' ') : kw;
                            place.setAmenityType(amenityType.substring(0, 1).toUpperCase() + amenityType.substring(1));
                            place.setLatitude(placeLat);
                            place.setLongitude(placeLon);
                            place.setDistanceKm(distKm);
                            place.setDistanceType("STRAIGHT_LINE");

                            StringBuilder addr = new StringBuilder();
                            String street = props.path("street").asText("");
                            String locality = props.path("locality").asText("");
                            String district = props.path("district").asText("");
                            String city = props.path("city").asText("");
                            String postcode = props.path("postcode").asText("");

                            if (!street.isBlank()) addr.append(street).append(", ");
                            if (!district.isBlank()) addr.append(district).append(", ");
                            else if (!locality.isBlank()) addr.append(locality).append(", ");
                            if (!city.isBlank()) addr.append(city).append(", ");
                            if (!postcode.isBlank()) addr.append(postcode);

                            String formattedAddress = addr.toString().replaceAll(", $", "");
                            if (formattedAddress.isBlank()) {
                                formattedAddress = String.format(Locale.US, "%.5f, %.5f", placeLat, placeLon);
                            }
                            place.setAddress(formattedAddress);

                            verifiedPlaces.add(place);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Photon place query encountered issue: {}. Attempting Nominatim OSM discovery...", e.getMessage());
        }

        // If Photon returned few or 0 items, query Nominatim with bounded viewbox
        if (verifiedPlaces.isEmpty()) {
            String viewbox = String.format(Locale.US, "%.5f,%.5f,%.5f,%.5f", minLon, maxLat, maxLon, minLat);
            Map<AmenityCategory, List<String>> keywordsMap = getCategoryKeywords();

            for (AmenityCategory cat : categories) {
                List<String> keywords = keywordsMap.getOrDefault(cat, Collections.emptyList());
                // Use the primary category keyword
                String term = keywords.isEmpty() ? cat.name().toLowerCase() : keywords.get(0);

                try {
                    URI uri = UriComponentsBuilder.fromHttpUrl(nominatimUrl + "/search")
                            .queryParam("q", term)
                            .queryParam("format", "jsonv2")
                            .queryParam("countrycodes", "in")
                            .queryParam("bounded", 1)
                            .queryParam("viewbox", viewbox)
                            .queryParam("limit", 10)
                            .queryParam("addressdetails", 1)
                            .build()
                            .encode()
                            .toUri();

                    HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
                    ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        JsonNode array = objectMapper.readTree(response.getBody());
                        if (array.isArray()) {
                            for (JsonNode item : array) {
                                double pLat = item.path("lat").asDouble();
                                double pLon = item.path("lon").asDouble();

                                if (!IndiaBoundaryValidator.isInsideIndia(pLat, pLon)) continue;

                                double distKm = DistanceCalculator.haversineDistanceKm(latitude, longitude, pLat, pLon);
                                if (distKm > radiusKm) continue;

                                String osmClass = item.path("class").asText("");
                                String osmTypeTag = item.path("type").asText("");
                                String name = item.path("name").asText("");
                                if (name.isBlank()) {
                                    name = item.path("display_name").asText().split(",")[0].trim();
                                }
                                if (name.isBlank()) continue;

                                if (!isPlaceMatchingCategory(cat, osmClass, osmTypeTag, name)) continue;

                                String osmType = item.path("osm_type").asText("N");
                                String osmId = item.path("osm_id").asText();
                                String uniqueId = "osm-" + osmType.charAt(0) + "-" + osmId;

                                if (!seenIds.add(uniqueId)) continue;

                                PlaceDetails place = new PlaceDetails();
                                place.setId(uniqueId);
                                place.setProviderPlaceId(osmId);
                                place.setProvider("OpenStreetMap");
                                place.setName(name);
                                place.setCategory(cat.name());

                                String typeStr = item.path("type").asText(term).replace('_', ' ');
                                place.setAmenityType(typeStr.substring(0, 1).toUpperCase() + typeStr.substring(1));
                                place.setLatitude(pLat);
                                place.setLongitude(pLon);
                                place.setDistanceKm(distKm);
                                place.setDistanceType("STRAIGHT_LINE");
                                place.setAddress(item.path("display_name").asText());

                                verifiedPlaces.add(place);
                            }
                        }
                    }
                    // Throttling to respect standard OSM usage limits
                    Thread.sleep(600);
                } catch (Exception e) {
                    log.warn("Nominatim query failed for {}: {}", term, e.getMessage());
                }
            }
        }

        // Sort results strictly nearest to farthest
        verifiedPlaces.sort(Comparator.comparingDouble(PlaceDetails::getDistanceKm));

        if (!verifiedPlaces.isEmpty()) {
            placeCache.put(cacheKey, verifiedPlaces);
        }

        return verifiedPlaces;
    }

    private Map<AmenityCategory, List<String>> getCategoryKeywords() {
        Map<AmenityCategory, List<String>> map = new EnumMap<>(AmenityCategory.class);
        map.put(AmenityCategory.HEALTHCARE, List.of("hospital", "clinic", "pharmacy", "medical"));
        map.put(AmenityCategory.EDUCATION, List.of("school", "college", "university", "institute"));
        map.put(AmenityCategory.GROCERY, List.of("supermarket", "grocery", "provision"));
        map.put(AmenityCategory.FITNESS, List.of("fitness", "gym", "sports"));
        map.put(AmenityCategory.PARK, List.of("park", "garden", "playground"));
        map.put(AmenityCategory.ENTERTAINMENT, List.of("cinema", "theatre", "mall", "multiplex"));
        map.put(AmenityCategory.DINING, List.of("restaurant", "cafe", "bakery", "bistro"));
        map.put(AmenityCategory.TRANSPORTATION, List.of("bus stop", "metro", "station", "terminal"));
        map.put(AmenityCategory.BANKING, List.of("bank", "atm"));
        return map;
    }

    private String extractLocality(JsonNode address) {
        if (address.has("suburb")) return address.path("suburb").asText();
        if (address.has("neighbourhood")) return address.path("neighbourhood").asText();
        if (address.has("residential")) return address.path("residential").asText();
        return "";
    }

    private String extractCity(JsonNode address) {
        if (address.has("city")) return address.path("city").asText();
        if (address.has("town")) return address.path("town").asText();
        if (address.has("county")) return address.path("county").asText();
        return "";
    }

    public static boolean isPlaceMatchingCategory(AmenityCategory cat, String osmKey, String osmValue, String name) {
        String key = osmKey != null ? osmKey.trim().toLowerCase() : "";
        String val = osmValue != null ? osmValue.trim().toLowerCase() : "";
        String n = name != null ? name.trim().toLowerCase() : "";

        // Never classify religious places or places of worship into amenity categories
        if ("place_of_worship".equals(val) || "place_of_worship".equals(key)) {
            return false;
        }
        if (n.contains("temple") || n.contains("mandir") || n.contains("masjid") || n.contains("mosque") || n.contains("church") || n.contains("gurudwara")) {
            return false;
        }

        // Generic road/highway filter: highways (except bus_stop) are streets, not establishments
        if ("highway".equals(key) && !"bus_stop".equals(val) && !"platform".equals(val)) {
            return false;
        }
        if (n.endsWith(" road") || n.endsWith(" street") || n.endsWith(" cross") || n.endsWith(" lane") || n.endsWith(" marg") || n.endsWith(" layout")) {
            if (!"bus_stop".equals(val) && !"station".equals(val)) {
                return false;
            }
        }

        return switch (cat) {
            case HEALTHCARE ->
                    ("amenity".equals(key) && Set.of("hospital", "clinic", "pharmacy", "doctors", "dentist", "health_post").contains(val))
                    || ("healthcare".equals(key) && Set.of("hospital", "clinic", "centre", "doctor", "pharmacy", "laboratory").contains(val))
                    || ("shop".equals(key) && Set.of("chemist", "pharmacy", "optician", "medical_supply").contains(val))
                    || (n.contains("hospital") || n.contains("clinic") || n.contains("dispensary") || n.contains("pharmacy") || n.contains("medicals"));

            case EDUCATION ->
                    ("amenity".equals(key) && Set.of("school", "college", "university", "kindergarten", "language_school", "library").contains(val))
                    || ((n.contains("school") || n.contains("college") || n.contains("university") || n.contains("vidyalaya") || n.contains("techno school") || n.contains("academy") || n.contains("institute")) && !"shop".equals(key));

            case GROCERY ->
                    !n.contains("school") && !n.contains("college") && !n.contains("hospital") && !n.contains("clinic")
                    && (("shop".equals(key) && Set.of("supermarket", "grocery", "convenience", "greengrocer", "bakery", "general", "department_store", "dairy", "fruits", "vegetables", "organic", "farm", "butcher", "seafood", "fishmonger").contains(val))
                        || ("amenity".equals(key) && Set.of("marketplace").contains(val))
                        || (n.contains("supermarket") || n.contains("grocery") || n.contains("hypermarket") || n.contains("provisions") || n.contains("mart") || n.contains("bazaar")));

            case FITNESS ->
                    ("leisure".equals(key) && Set.of("fitness_centre", "sports_centre", "fitness_station", "gym", "pitch", "track").contains(val))
                    || "sport".equals(key) || "sport".equals(val)
                    || ("amenity".equals(key) && Set.of("gym").contains(val))
                    || (n.contains("gym") || n.contains("fitness") || n.contains("crossfit") || n.contains("badminton") || n.contains("swimming"));

            case PARK ->
                    ("leisure".equals(key) && Set.of("park", "garden", "playground", "nature_reserve", "recreation_ground", "pitch").contains(val))
                    || ("landuse".equals(key) && Set.of("recreation_ground", "village_green").contains(val))
                    || (n.contains("park") || n.contains("garden") || n.contains("playground"));

            case ENTERTAINMENT ->
                    ("amenity".equals(key) && Set.of("cinema", "theatre", "arts_centre", "nightclub").contains(val))
                    || ("shop".equals(key) && Set.of("mall").contains(val))
                    || ("tourism".equals(key) && Set.of("theme_park", "aquarium", "zoo", "attraction").contains(val))
                    || ("leisure".equals(key) && Set.of("bowling_alley", "water_park", "amusement_arcade").contains(val))
                    || (n.contains("cinema") || n.contains("theatre") || n.contains("multiplex") || n.contains("pvr") || n.contains("inox") || n.contains("cinepolis") || n.contains("mall"));

            case DINING ->
                    ("amenity".equals(key) && Set.of("restaurant", "cafe", "fast_food", "food_court", "ice_cream", "pub", "bar", "bistro").contains(val))
                    || (n.contains("restaurant") || n.contains("cafe") || n.contains("bistro") || n.contains("bakery") || (n.contains("hotel") && n.contains("veg")));

            case TRANSPORTATION ->
                    !n.contains("temple") && !n.contains("mandir") && !n.contains("school") && !n.contains("college") && !n.contains("hospital")
                    && (("amenity".equals(key) && Set.of("bus_station", "bus_stop", "ferry_terminal").contains(val))
                        || ("railway".equals(key) && Set.of("station", "subway_entrance", "halt", "tram_stop").contains(val))
                        || ("highway".equals(key) && Set.of("bus_stop", "platform").contains(val))
                        || ("public_transport".equals(key) && Set.of("station", "stop_position", "platform").contains(val))
                        || (n.contains("metro station") || n.contains("bus station") || n.contains("railway station") || n.contains("bus stop")));

            case BANKING ->
                    ("amenity".equals(key) && Set.of("bank", "atm", "bureau_de_change").contains(val))
                    || (n.contains("bank") || n.contains("atm"));
        };
    }
}
