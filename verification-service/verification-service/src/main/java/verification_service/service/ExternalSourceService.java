package verification_service.service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class ExternalSourceService {

    @Value("${adzuna.app.id}")
    private String appId;

    @Value("${adzuna.app.key}")
    private String appKey;

    private final HttpClient httpClient =
            HttpClient.newBuilder()
                    .followRedirects(
                            HttpClient.Redirect.NORMAL
                    )
                    .build();

    private final ObjectMapper objectMapper =
            new ObjectMapper();

    public List<Map<String, String>> searchJobs(
            String keyword) {

        List<Map<String, String>> jobs =
                new ArrayList<>();

        try {

            if (keyword == null ||
                    keyword.isBlank()) {

                return jobs;
            }

            String encodedKeyword =
        URLEncoder.encode(
                keyword,
                StandardCharsets.UTF_8
        );

            String url =
                    "https://api.adzuna.com/v1/api/jobs/in/search/1"
                    + "?app_id=" + appId
                    + "&app_key=" + appKey
                    + "&results_per_page=20"
                    + "&what=" + encodedKeyword
                    + "&content-type=application/json";

            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(URI.create(url))
                            .GET()
                            .header(
                                    "Accept",
                                    "application/json"
                            )
                            .build();

            HttpResponse<String> response =
                    httpClient.send(
                            request,
                            HttpResponse.BodyHandlers.ofString()
                    );

            if (response.statusCode() != 200) {

                System.out.println(
                        "Adzuna API status: "
                                + response.statusCode()
                );

                return jobs;
            }

            JsonNode root =
                    objectMapper.readTree(
                            response.body()
                    );

            JsonNode results =
                    root.get("results");

            if (results == null ||
                    !results.isArray()) {

                return jobs;
            }

            for (JsonNode job : results) {

                Map<String, String> jobData =
                        new HashMap<>();

                String title =
                        getText(
                                job,
                                "title"
                        );

                String company =
                        getNestedText(
                                job,
                                "company",
                                "display_name"
                        );

                String location =
                        getNestedText(
                                job,
                                "location",
                                "display_name"
                        );

                String redirectUrl =
                        getText(
                                job,
                                "redirect_url"
                        );

                String sourceUrl =
                        getText(
                                job,
                                "url"
                        );

                String sourcePlatform =
                        detectPlatform(
                                sourceUrl
                        );

                if (sourcePlatform.isBlank()) {

                    sourcePlatform =
                            detectPlatform(
                                    redirectUrl
                            );
                }

                jobData.put(
                        "title",
                        title
                );

                jobData.put(
                        "company",
                        company
                );

                jobData.put(
                        "location",
                        location
                );

                jobData.put(
                        "description",
                        getText(
                                job,
                                "description"
                        )
                );

                jobData.put(
                        "salaryMin",
                        getNumber(
                                job,
                                "salary_min"
                        )
                );

                jobData.put(
                        "salaryMax",
                        getNumber(
                                job,
                                "salary_max"
                        )
                );

                jobData.put(
                        "redirectUrl",
                        redirectUrl
                );

                jobData.put(
                        "sourceUrl",
                        sourceUrl
                );

                jobData.put(
                        "sourcePlatform",
                        sourcePlatform
                );
                System.out.println(
        "ADZUNA RESULT -> title="
                + title
                + " | company="
                + company
                + " | sourceUrl="
                + sourceUrl
                + " | redirectUrl="
                + redirectUrl
                + " | platform="
                + sourcePlatform
);

                jobs.add(jobData);
                
            }

        } catch (Exception e) {

            System.out.println(
                    "Adzuna search error: "
                            + e.getMessage()
            );
        }

        return jobs;
    }

    private String detectPlatform(
            String url) {

        if (url == null ||
                url.isBlank()) {

            return "";
        }

        String domain =
                extractDomain(url);

        if (domain.contains("linkedin.com") ||
                domain.contains("lnkd.in")) {

            return "LinkedIn";
        }

        if (domain.contains("naukri.com")) {

            return "Naukri";
        }

        if (domain.contains("indeed.com")) {

            return "Indeed";
        }

        if (domain.contains("foundit.in") ||
                domain.contains("monster.com")) {

            return "Foundit";
        }

        if (domain.contains("shine.com")) {

            return "Shine";
        }

        if (domain.contains("timesjobs.com")) {

            return "TimesJobs";
        }

        if (domain.contains("internshala.com")) {

            return "Internshala";
        }

        return "";
    }

    private String extractDomain(
            String url) {

        try {

            String normalized =
                    url.trim();

            if (!normalized.startsWith("http://") &&
                    !normalized.startsWith("https://")) {

                normalized =
                        "https://" + normalized;
            }

            URI uri =
                    URI.create(normalized);

            String host =
                    uri.getHost();

            if (host == null) {

                return "";
            }

            host =
                    host.toLowerCase();

            if (host.startsWith("www.")) {

                host =
                        host.substring(4);
            }

            return host;

        } catch (Exception e) {

            return "";
        }
    }

    private String getText(
            JsonNode node,
            String field) {

        JsonNode value =
                node.get(field);

        if (value == null ||
                value.isNull()) {

            return "";
        }

        return value.asText();
    }

    private String getNestedText(
            JsonNode node,
            String parent,
            String field) {

        JsonNode parentNode =
                node.get(parent);

        if (parentNode == null ||
                parentNode.isNull()) {

            return "";
        }

        return getText(
                parentNode,
                field
        );
    }

    private String getNumber(
            JsonNode node,
            String field) {

        JsonNode value =
                node.get(field);

        if (value == null ||
                value.isNull()) {

            return "";
        }

        return value.asText();
    }
}