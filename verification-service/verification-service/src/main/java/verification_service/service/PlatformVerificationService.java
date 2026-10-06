package verification_service.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import verification_service.model.PlatformVerificationResult;

@Service
public class PlatformVerificationService {

    private final HttpClient httpClient;

    public PlatformVerificationService() {

        this.httpClient = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    public List<PlatformVerificationResult> verifyPlatforms(
            String title,
            String organization,
            String applicationLink) {

        List<PlatformVerificationResult> results =
                new ArrayList<>();

        if (applicationLink == null
                || applicationLink.isBlank()) {

            return results;
        }

        String platform =
                detectPlatform(applicationLink);

        if (platform == null) {
            return results;
        }

        String pageContent =
                fetchPageContent(applicationLink);

        if (pageContent == null
                || pageContent.isBlank()) {

            return results;
        }

        boolean titleMatch =
                containsText(pageContent, title);

        boolean organizationMatch =
                containsText(pageContent, organization);

        /*
         * We only confirm the platform when both
         * opportunity title and organization are
         * visible in the submitted page.
         */

        if (titleMatch && organizationMatch) {

            results.add(
                    new PlatformVerificationResult(
                            platform,
                            "CONFIRMED",
                            applicationLink,
                            "The submitted platform page is reachable and contains both the opportunity title and organization."
                    )
            );
        }

        return results;
    }

    private String detectPlatform(String url) {

        String lowerUrl =
                url.toLowerCase();

        if (lowerUrl.contains("linkedin.com")
                || lowerUrl.contains("lnkd.in")) {

            return "LinkedIn";
        }

        if (lowerUrl.contains("naukri.com")) {

            return "Naukri";
        }

        if (lowerUrl.contains("indeed.com")) {

            return "Indeed";
        }

        if (lowerUrl.contains("foundit.in")
                || lowerUrl.contains("monster.com")) {

            return "Foundit";
        }

        if (lowerUrl.contains("shine.com")) {

            return "Shine";
        }

        if (lowerUrl.contains("timesjobs.com")) {

            return "TimesJobs";
        }

        if (lowerUrl.contains("internshala.com")) {

            return "Internshala";
        }

        return null;
    }

    private String fetchPageContent(String url) {

        try {

            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(URI.create(url))
                            .GET()
                            .header(
                                    "User-Agent",
                                    "Mozilla/5.0"
                            )
                            .header(
                                    "Accept",
                                    "text/html,application/xhtml+xml"
                            )
                            .build();

            HttpResponse<String> response =
                    httpClient.send(
                            request,
                            HttpResponse.BodyHandlers.ofString()
                    );

            if (response.statusCode() >= 200
                    && response.statusCode() < 400) {

                return response.body();
            }

        } catch (Exception e) {

            return null;
        }

        return null;
    }

    private boolean containsText(
            String pageContent,
            String value) {

        if (value == null
                || value.isBlank()) {

            return false;
        }

        String normalizedPage =
                normalize(pageContent);

        String normalizedValue =
                normalize(value);

        return normalizedPage.contains(
                normalizedValue
        );
    }

    private String normalize(String value) {

        return value
                .toLowerCase()
                .replaceAll("<[^>]*>", " ")
                .replaceAll(
                        "[^a-z0-9]+",
                        " "
                )
                .replaceAll(
                        "\\s+",
                        " "
                )
                .trim();
    }
}