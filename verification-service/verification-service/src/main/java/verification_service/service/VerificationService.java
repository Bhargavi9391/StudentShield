package verification_service.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import verification_service.model.PlatformVerificationResult;
import verification_service.model.VerificationRequest;
import verification_service.model.VerificationResponse;
import verification_service.rules.RiskRules;

@Service
public class VerificationService {

    @Autowired
    private ExternalSourceService externalSourceService;

    @Autowired
    private OpportunityMatchingService opportunityMatchingService;

    @Autowired
    private PlatformVerificationService platformVerificationService;

    public VerificationResponse verify(
            VerificationRequest request) {

        // 1. Risk analysis
        List<String> riskIndicators =
                RiskRules.evaluate(request);

        int trustScore =
                RiskRules.calculateScore(request);

        // 2. Search external job data
        String searchKeyword =
        request.getTitle()
                + " "
                + request.getOrganization();

List<Map<String, String>> externalJobs =
        externalSourceService.searchJobs(
                searchKeyword
        );

        // 3. Match submitted opportunity
        List<Map<String, String>> matchingOpportunities =
                opportunityMatchingService.findMatches(
                        request.getTitle(),
                        request.getOrganization(),
                        "",
                        externalJobs
                );

        // 4. Check whether a strong external match exists
        boolean hasStrongMatch =
                hasStrongExternalMatch(
                        matchingOpportunities
                );

        /*
         * 5. Verify the submitted application link.
         *
         * This is separate from external platform discovery.
         * It confirms the platform only when the submitted
         * URL itself belongs to a known platform and contains
         * the submitted title + organization.
         */
        List<PlatformVerificationResult> submittedLinkResults =
                platformVerificationService.verifyPlatforms(
                        request.getTitle(),
                        request.getOrganization(),
                        request.getApplicationLink()
                );

        /*
         * 6. Discover actual platforms from independently
         * matched external opportunities.
         *
         * This is the main "Where is this job available?"
         * feature.
         */
        List<Map<String, String>> availablePlatforms =
                buildAvailablePlatforms(
                        matchingOpportunities
                );

        /*
         * Also include a platform confirmed directly from
         * the user's submitted application link.
         */
        mergeSubmittedLinkPlatforms(
                availablePlatforms,
                submittedLinkResults
        );

        // 7. Update trust score
        if (hasStrongMatch) {

            trustScore += 5;

        } else {

            trustScore =
                    Math.min(
                            trustScore,
                            75
                    );
        }

        if (!availablePlatforms.isEmpty()) {

            trustScore += 5;
        }

        trustScore =
                Math.max(
                        0,
                        Math.min(
                                trustScore,
                                100
                        )
                );

        // 8. Risk level
        String riskLevel =
                RiskRules.calculateRiskLevel(
                        trustScore
                );

        // 9. Company information
        Map<String, String> companyVerification =
                buildCompanyVerification(
                        request
                );

        // 10. Good signs
        List<String> goodSigns =
                buildGoodSigns(
                        request,
                        availablePlatforms,
                        hasStrongMatch
                );

        // 11. Warnings
        List<String> warnings =
                buildWarnings(
                        request,
                        availablePlatforms,
                        hasStrongMatch,
                        riskIndicators
                );

        // 12. Recommendation
        String recommendation =
                buildRecommendation(
                        trustScore,
                        riskLevel,
                        hasStrongMatch,
                        availablePlatforms
                );

        /*
         * Source verification should represent the same
         * independently confirmed platform evidence that
         * appears in "Where is this job available?"
         */
        List<Map<String, String>> sourceVerification =
                buildSourceVerification(
                        availablePlatforms
                );

        // 13. Final response
        return new VerificationResponse(
                trustScore,
                riskLevel,
                riskIndicators,
                sourceVerification,
                companyVerification,
                matchingOpportunities,
                recommendation,
                goodSigns,
                warnings,
                availablePlatforms
        );
    }

    private boolean hasStrongExternalMatch(
            List<Map<String, String>> matches) {

        if (matches == null ||
                matches.isEmpty()) {

            return false;
        }

        for (Map<String, String> match :
                matches) {

            int matchScore =
                    parseInt(
                            match.getOrDefault(
                                    "matchScore",
                                    "0"
                            )
                    );

            if (matchScore >= 80) {

                return true;
            }
        }

        return false;
    }

    /*
     * Builds the actual platform list from matched external
     * opportunities.
     *
     * A platform is added ONLY when:
     *
     * 1. The opportunity is strongly matched.
     * 2. The matching service confirmed the platform.
     * 3. The platform is one of our known platforms.
     *
     * Therefore an Adzuna URL by itself will never become
     * LinkedIn/Naukri/etc.
     */
    private List<Map<String, String>>
    buildAvailablePlatforms(
            List<Map<String, String>> matches) {

        List<Map<String, String>> platforms =
                new ArrayList<>();

        Set<String> addedPlatforms =
                new HashSet<>();

        if (matches == null) {

            return platforms;
        }

        for (Map<String, String> match :
                matches) {

            if (match == null) {
                continue;
            }

            int matchScore =
                    parseInt(
                            match.getOrDefault(
                                    "matchScore",
                                    "0"
                            )
                    );

            if (matchScore < 80) {
                continue;
            }

            String platform =
                    safe(
                            match.getOrDefault(
                                    "sourcePlatform",
                                    ""
                            )
                    );

            String platformConfirmed =
                    safe(
                            match.getOrDefault(
                                    "platformConfirmed",
                                    "false"
                            )
                    );

            String sourceUrl =
                    safe(
                            match.getOrDefault(
                                    "sourceUrl",
                                    ""
                            )
                    );

            String redirectUrl =
                    safe(
                            match.getOrDefault(
                                    "redirectUrl",
                                    ""
                            )
                    );

            String evidence =
                    safe(
                            match.getOrDefault(
                                    "sourceEvidence",
                                    ""
                            )
                    );

            /*
             * Never show a platform unless the matching
             * service explicitly confirmed it.
             */
            if (platform.isBlank()
                    || !"true".equalsIgnoreCase(
                            platformConfirmed)) {

                continue;
            }

            if (!isKnownPlatform(platform)) {

                continue;
            }

            String normalized =
                    platform.toLowerCase();

            if (addedPlatforms.contains(normalized)) {

                continue;
            }

            /*
             * Extra safety check:
             * make sure the URL actually belongs to
             * the claimed platform.
             */
            if (!hasPlatformDomain(
                    platform,
                    sourceUrl,
                    redirectUrl
            )) {

                continue;
            }

            addedPlatforms.add(
                    normalized
            );

            Map<String, String> platformData =
                    new HashMap<>();

            platformData.put(
                    "name",
                    platform
            );

            platformData.put(
                    "verified",
                    "true"
            );

            if (!sourceUrl.isBlank()) {

                platformData.put(
                        "url",
                        sourceUrl
                );

            } else {

                platformData.put(
                        "url",
                        redirectUrl
                );
            }

            platformData.put(
                    "evidence",
                    evidence.isBlank()
                            ? "A strongly matching external opportunity was found on this platform."
                            : evidence
            );

            platformData.put(
                    "matchScore",
                    String.valueOf(
                            matchScore
                    )
            );

            platforms.add(
                    platformData
            );
        }

        return platforms;
    }

    /*
     * Adds evidence from the submitted application link
     * if PlatformVerificationService independently confirmed it.
     */
    private void mergeSubmittedLinkPlatforms(
            List<Map<String, String>> availablePlatforms,
            List<PlatformVerificationResult> submittedResults) {

        if (availablePlatforms == null ||
                submittedResults == null) {

            return;
        }

        Set<String> existing =
                new HashSet<>();

        for (Map<String, String> platform :
                availablePlatforms) {

            String name =
                    safe(
                            platform.getOrDefault(
                                    "name",
                                    ""
                            )
                    );

            if (!name.isBlank()) {

                existing.add(
                        name.toLowerCase()
                );
            }
        }

        for (PlatformVerificationResult result :
                submittedResults) {

            if (result == null) {
                continue;
            }

            String platform =
                    safe(result.getPlatform());

            String status =
                    safe(result.getStatus());

            String url =
                    safe(result.getUrl());

            String evidence =
                    safe(result.getEvidence());

            if (platform.isBlank()
                    || !"CONFIRMED".equalsIgnoreCase(
                            status)) {

                continue;
            }

            if (!isKnownPlatform(platform)) {

                continue;
            }

            if (!hasPlatformDomain(
                    platform,
                    url,
                    ""
            )) {

                continue;
            }

            String normalized =
                    platform.toLowerCase();

            if (existing.contains(normalized)) {

                continue;
            }

            Map<String, String> platformData =
                    new HashMap<>();

            platformData.put(
                    "name",
                    platform
            );

            platformData.put(
                    "verified",
                    "true"
            );

            platformData.put(
                    "url",
                    url
            );

            platformData.put(
                    "evidence",
                    evidence
            );

            platformData.put(
                    "matchScore",
                    "100"
            );

            availablePlatforms.add(
                    platformData
            );

            existing.add(
                    normalized
            );
        }
    }

    private boolean isKnownPlatform(
            String platform) {

        return platform.equalsIgnoreCase("LinkedIn") ||
                platform.equalsIgnoreCase("Naukri") ||
                platform.equalsIgnoreCase("Indeed") ||
                platform.equalsIgnoreCase("Foundit") ||
                platform.equalsIgnoreCase("Shine") ||
                platform.equalsIgnoreCase("TimesJobs") ||
                platform.equalsIgnoreCase("Internshala");
    }

    private boolean hasPlatformDomain(
            String platform,
            String sourceUrl,
            String redirectUrl) {

        String source =
                sourceUrl == null
                        ? ""
                        : sourceUrl.toLowerCase();

        String redirect =
                redirectUrl == null
                        ? ""
                        : redirectUrl.toLowerCase();

        String combined =
                source + " " + redirect;

        if (platform.equalsIgnoreCase("LinkedIn")) {

            return combined.contains(
                    "linkedin.com"
            ) ||
                    combined.contains(
                            "lnkd.in"
                    );
        }

        if (platform.equalsIgnoreCase("Naukri")) {

            return combined.contains(
                    "naukri.com"
            );
        }

        if (platform.equalsIgnoreCase("Indeed")) {

            return combined.contains(
                    "indeed.com"
            );
        }

        if (platform.equalsIgnoreCase("Foundit")) {

            return combined.contains(
                    "foundit.in"
            ) ||
                    combined.contains(
                            "monster.com"
                    );
        }

        if (platform.equalsIgnoreCase("Shine")) {

            return combined.contains(
                    "shine.com"
            );
        }

        if (platform.equalsIgnoreCase("TimesJobs")) {

            return combined.contains(
                    "timesjobs.com"
            );
        }

        if (platform.equalsIgnoreCase("Internshala")) {

            return combined.contains(
                    "internshala.com"
            );
        }

        return false;
    }

    private List<String> buildGoodSigns(
            VerificationRequest request,
            List<Map<String, String>> platforms,
            boolean hasStrongMatch) {

        List<String> signs =
                new ArrayList<>();

        if (request.getOfficialWebsite() != null
                && !request.getOfficialWebsite().isBlank()) {

            signs.add(
                    "An official website was provided."
            );
        }

        if (request.getEmail() != null
                && !request.getEmail().isBlank()) {

            signs.add(
                    "A contact email address was provided."
            );
        }

        if (request.getRegistrationFee() <= 0) {

            signs.add(
                    "No registration fee was reported."
            );
        }

        if (hasStrongMatch) {

            signs.add(
                    "A strong matching opportunity was found in external job data."
            );
        }

        if (platforms != null
                && !platforms.isEmpty()) {

            signs.add(
                    platforms.size()
                            + " independently confirmed recruitment platform"
                            + (platforms.size() > 1
                            ? "s were"
                            : " was")
                            + " found."
            );
        }

        return signs;
    }

    private List<String> buildWarnings(
            VerificationRequest request,
            List<Map<String, String>> platforms,
            boolean hasStrongMatch,
            List<String> riskIndicators) {

        List<String> warnings =
                new ArrayList<>();

        if (riskIndicators != null) {

            warnings.addAll(
                    riskIndicators
            );
        }

        if (!hasStrongMatch) {

            warnings.add(
                    "No strong matching listing was independently confirmed in the checked external job data."
            );
        }

        if (platforms == null
                || platforms.isEmpty()) {

            warnings.add(
                    "No known platform listing was independently confirmed."
            );
        }

        if (request.getRegistrationFee() > 0) {

            warnings.add(
                    "The opportunity requires a registration or application fee."
            );
        }

        return removeDuplicates(
                warnings
        );
    }

    private Map<String, String>
    buildCompanyVerification(
            VerificationRequest request) {

        Map<String, String> company =
                new HashMap<>();

        String organization =
                safe(request.getOrganization());

        String website =
                safe(request.getOfficialWebsite());

        String email =
                safe(request.getEmail());

        company.put(
                "organization",
                organization
        );

        company.put(
                "website",
                website
        );

        company.put(
                "email",
                email
        );

        company.put(
                "websiteStatus",
                website.isBlank()
                        ? "Not provided"
                        : "Provided"
        );

        company.put(
                "emailStatus",
                email.isBlank()
                        ? "Not provided"
                        : "Provided"
        );

        return company;
    }

    private List<Map<String, String>>
    buildSourceVerification(
            List<Map<String, String>> availablePlatforms) {

        List<Map<String, String>> sources =
                new ArrayList<>();

        if (availablePlatforms == null) {

            return sources;
        }

        Set<String> added =
                new HashSet<>();

        for (Map<String, String> platform :
                availablePlatforms) {

            if (platform == null) {
                continue;
            }

            String name =
                    safe(
                            platform.getOrDefault(
                                    "name",
                                    ""
                            )
                    );

            String url =
                    safe(
                            platform.getOrDefault(
                                    "url",
                                    ""
                            )
                    );

            if (name.isBlank()) {
                continue;
            }

            String normalized =
                    name.toLowerCase();

            if (added.contains(normalized)) {
                continue;
            }

            added.add(
                    normalized
            );

            Map<String, String> source =
                    new HashMap<>();

            source.put(
                    "platform",
                    name
            );

            source.put(
                    "status",
                    "CONFIRMED"
            );

            source.put(
                    "url",
                    url
            );

            sources.add(
                    source
            );
        }

        return sources;
    }

    private String buildRecommendation(
            int trustScore,
            String riskLevel,
            boolean hasStrongMatch,
            List<Map<String, String>> platforms) {

        if (riskLevel.equals("LOW")) {

            if (platforms != null
                    && !platforms.isEmpty()) {

                return "The opportunity has good verification signals and independent platform evidence. You can proceed, but still verify the official company communication before sharing sensitive information.";
            }

            return "The opportunity has relatively good verification signals. Verify the company and official communication before proceeding.";
        }

        if (riskLevel.equals("MEDIUM")) {

            if (hasStrongMatch
                    || (platforms != null
                    && !platforms.isEmpty())) {

                return "Some verification evidence is available, but additional checks are recommended before proceeding.";
            }

            return "Proceed with caution. Independent platform evidence is limited, so verify the company, recruiter and application details before proceeding.";
        }

        return "High-risk signals were detected. Avoid paying money or sharing sensitive personal information until the opportunity is independently verified.";
    }

    private int parseInt(String value) {

        try {

            return Integer.parseInt(value);

        } catch (Exception e) {

            return 0;
        }
    }

    private String safe(String value) {

        return value == null
                ? ""
                : value.trim();
    }

    private List<String>
    removeDuplicates(
            List<String> values) {

        return new ArrayList<>(
                new LinkedHashSet<>(
                        values
                )
        );
    }
}