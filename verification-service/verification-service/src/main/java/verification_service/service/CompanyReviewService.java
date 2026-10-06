package verification_service.service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import verification_service.model.CompanyReviewResult;

@Service
public class CompanyReviewService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${google.places.api.key:}")
    private String googleApiKey;

    public CompanyReviewService() {

        this.httpClient = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();

        this.objectMapper = new ObjectMapper();
    }

    public CompanyReviewResult getCompanyReviews(String organization) {

        if (organization == null || organization.isBlank()) {

            return createUnavailableResult(
                    "",
                    "Company name was not provided."
            );
        }

        if (googleApiKey == null || googleApiKey.isBlank()) {

            return createUnavailableResult(
                    organization.trim(),
                    "Verified company review data is not configured yet."
            );
        }

        try {

            String placeId = findPlaceId(organization.trim());

            if (placeId == null || placeId.isBlank()) {

                return createUnavailableResult(
                        organization.trim(),
                        "No verified company/place was found."
                );
            }

            return getPlaceDetails(
                    organization.trim(),
                    placeId
            );

        } catch (Exception e) {

            return createUnavailableResult(
                    organization.trim(),
                    "Company review service is temporarily unavailable."
            );
        }
    }

    private String findPlaceId(String organization)
            throws Exception {

        String encodedQuery = URLEncoder.encode(
                organization,
                StandardCharsets.UTF_8
        );

        String url =
                "https://places.googleapis.com/v1/places:searchText";

        String body =
                "{"
                        + "\"textQuery\":\""
                        + escapeJson(organization)
                        + "\""
                        + "}";

        HttpRequest request =
                HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header(
                                "Content-Type",
                                "application/json"
                        )
                        .header(
                                "X-Goog-Api-Key",
                                googleApiKey
                        )
                        .header(
                                "X-Goog-FieldMask",
                                "places.id,places.displayName"
                        )
                        .POST(
                                HttpRequest.BodyPublishers.ofString(body)
                        )
                        .build();

        HttpResponse<String> response =
                httpClient.send(
                        request,
                        HttpResponse.BodyHandlers.ofString()
                );

        if (response.statusCode() < 200
                || response.statusCode() >= 300) {

            return null;
        }

        JsonNode root =
                objectMapper.readTree(response.body());

        JsonNode places =
                root.path("places");

        if (!places.isArray()
                || places.isEmpty()) {

            return null;
        }

        return places
                .get(0)
                .path("id")
                .asText("");
    }

    private CompanyReviewResult getPlaceDetails(
            String organization,
            String placeId)
            throws Exception {

        String url =
                "https://places.googleapis.com/v1/places/"
                        + URLEncoder.encode(
                                placeId,
                                StandardCharsets.UTF_8
                        );

        HttpRequest request =
                HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header(
                                "X-Goog-Api-Key",
                                googleApiKey
                        )
                        .header(
                                "X-Goog-FieldMask",
                                "displayName,rating,userRatingCount,reviews,googleMapsUri"
                        )
                        .GET()
                        .build();

        HttpResponse<String> response =
                httpClient.send(
                        request,
                        HttpResponse.BodyHandlers.ofString()
                );

        if (response.statusCode() < 200
                || response.statusCode() >= 300) {

            return createUnavailableResult(
                    organization,
                    "Unable to retrieve verified review data."
            );
        }

        JsonNode root =
                objectMapper.readTree(response.body());

        String company =
                root.path("displayName")
                        .path("text")
                        .asText(organization);

        String rating =
                root.path("rating")
                        .asText("");

        String reviewCount =
                root.path("userRatingCount")
                        .asText("");

        String sourceUrl =
                root.path("googleMapsUri")
                        .asText("");

        List<String> positiveReviews =
                new ArrayList<>();

        List<String> negativeReviews =
                new ArrayList<>();

        JsonNode reviews =
                root.path("reviews");

        if (reviews.isArray()) {

            for (JsonNode review : reviews) {

                String text =
                        review.path("text")
                                .path("text")
                                .asText("");

                if (text.isBlank()) {
                    continue;
                }

                double ratingValue =
                        review.path("rating")
                                .asDouble(0);

                if (ratingValue >= 4) {

                    positiveReviews.add(text);

                } else if (ratingValue <= 2) {

                    negativeReviews.add(text);
                }
            }
        }

        CompanyReviewResult result =
                new CompanyReviewResult();

        result.setCompany(company);
        result.setStatus("VERIFIED");
        result.setSource("Google Maps");
        result.setSourceUrl(sourceUrl);
        result.setRating(rating);
        result.setReviewCount(reviewCount);
        result.setPositiveReviews(positiveReviews);
        result.setNegativeReviews(negativeReviews);

        return result;
    }

    private CompanyReviewResult createUnavailableResult(
            String company,
            String message) {

        CompanyReviewResult result =
                new CompanyReviewResult();

        result.setCompany(company);
        result.setStatus("UNAVAILABLE");
        result.setSource("");
        result.setSourceUrl("");
        result.setRating("");
        result.setReviewCount("");
        result.setPositiveReviews(
                new ArrayList<>()
        );
        result.setNegativeReviews(
                new ArrayList<>()
        );

        return result;
    }

    private String escapeJson(String value) {

        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }
}