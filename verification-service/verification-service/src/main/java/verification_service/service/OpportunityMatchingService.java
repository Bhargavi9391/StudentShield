package verification_service.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

@Service
public class OpportunityMatchingService {

    public List<Map<String, String>> findMatches(
            String submittedTitle,
            String submittedOrganization,
            String submittedLocation,
            List<Map<String, String>> externalJobs) {

        List<Map<String, String>> matches =
                new ArrayList<>();

        if (externalJobs == null ||
                externalJobs.isEmpty()) {

            return matches;
        }

        boolean companyProvided =
                submittedOrganization != null &&
                !submittedOrganization.isBlank();

        for (Map<String, String> job :
                externalJobs) {

            String externalTitle =
                    job.getOrDefault(
                            "title",
                            ""
                    );

            String externalCompany =
                    job.getOrDefault(
                            "company",
                            ""
                    );

            String externalLocation =
                    job.getOrDefault(
                            "location",
                            ""
                    );

            int titleScore =
                    calculateTitleSimilarity(
                            submittedTitle,
                            externalTitle
                    );

            int companyScore =
                    calculateCompanySimilarity(
                            submittedOrganization,
                            externalCompany
                    );

            int locationScore =
                    calculateTextSimilarity(
                            submittedLocation,
                            externalLocation
                    );

            if (companyProvided &&
                    companyScore < 70) {

                continue;
            }

            int matchScore =
                    calculateWeightedScore(
                            titleScore,
                            companyScore,
                            locationScore,
                            submittedOrganization,
                            submittedLocation
                    );

            String status;

            if (matchScore >= 80) {

                status = "MATCHED";

            } else if (matchScore >= 50) {

                status = "SIMILAR";

            } else {

                status = "NOT MATCHED";
            }

            Map<String, String> result =
                    new HashMap<>();

            result.put(
                    "status",
                    status
            );

            result.put(
                    "matchScore",
                    String.valueOf(matchScore)
            );

            result.put(
                    "titleScore",
                    String.valueOf(titleScore)
            );

            result.put(
                    "companyScore",
                    String.valueOf(companyScore)
            );

            result.put(
                    "locationScore",
                    String.valueOf(locationScore)
            );

            result.put(
                    "title",
                    externalTitle
            );

            result.put(
                    "company",
                    externalCompany
            );

            result.put(
                    "location",
                    externalLocation
            );

            result.put(
                    "salaryMin",
                    job.getOrDefault(
                            "salaryMin",
                            ""
                    )
            );

            result.put(
                    "salaryMax",
                    job.getOrDefault(
                            "salaryMax",
                            ""
                    )
            );

            result.put(
                    "description",
                    job.getOrDefault(
                            "description",
                            ""
                    )
            );

            result.put(
                    "redirectUrl",
                    job.getOrDefault(
                            "redirectUrl",
                            ""
                    )
            );

            result.put(
                    "sourceUrl",
                    job.getOrDefault(
                            "sourceUrl",
                            ""
                    )
            );

            /*
             * This value is only populated when the
             * external source URL identifies a known
             * recruitment platform.
             *
             * We never convert Adzuna itself into
             * LinkedIn/Naukri/etc.
             */
            result.put(
                    "sourcePlatform",
                    job.getOrDefault(
                            "sourcePlatform",
                            ""
                    )
            );

            result.put(
                    "sourceEvidence",
                    buildSourceEvidence(
                            job
                    )
            );

            result.put(
        "platformConfirmed",
        String.valueOf(
                isPlatformConfirmed(
                        job
                )
        )
);

            result.put(
                    "matchedFields",
                    buildMatchedFields(
                            titleScore,
                            companyScore,
                            locationScore
                    )
            );

            matches.add(
                    result
            );
        }

        matches.sort(
                (a, b) ->
                        Integer.compare(
                                Integer.parseInt(
                                        b.get(
                                                "matchScore"
                                        )
                                ),
                                Integer.parseInt(
                                        a.get(
                                                "matchScore"
                                        )
                                )
                        )
        );

        return matches;
    }

    private boolean isPlatformConfirmed(
            Map<String, String> job) {

        String platform =
                job.getOrDefault(
                        "sourcePlatform",
                        ""
                );

        String sourceUrl =
                job.getOrDefault(
                        "sourceUrl",
                        ""
                );

        String redirectUrl =
                job.getOrDefault(
                        "redirectUrl",
                        ""
                );

        if (platform.isBlank()) {
            return false;
        }

        return isKnownPlatform(
                platform
        ) &&
                hasPlatformDomain(
                        platform,
                        sourceUrl,
                        redirectUrl
                );
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
            return combined.contains("linkedin.com") ||
                    combined.contains("lnkd.in");
        }

        if (platform.equalsIgnoreCase("Naukri")) {
            return combined.contains("naukri.com");
        }

        if (platform.equalsIgnoreCase("Indeed")) {
            return combined.contains("indeed.com");
        }

        if (platform.equalsIgnoreCase("Foundit")) {
            return combined.contains("foundit.in") ||
                    combined.contains("monster.com");
        }

        if (platform.equalsIgnoreCase("Shine")) {
            return combined.contains("shine.com");
        }

        if (platform.equalsIgnoreCase("TimesJobs")) {
            return combined.contains("timesjobs.com");
        }

        if (platform.equalsIgnoreCase("Internshala")) {
            return combined.contains("internshala.com");
        }

        return false;
    }

    private String buildSourceEvidence(
            Map<String, String> job) {

        String platform =
                job.getOrDefault(
                        "sourcePlatform",
                        ""
                );

        String sourceUrl =
                job.getOrDefault(
                        "sourceUrl",
                        ""
                );

        if (platform.isBlank()) {

            return "No known recruitment platform was identified from the external source.";
        }

        if (!isPlatformConfirmed(job)) {

            return "A platform name could not be independently confirmed from the source URL.";
        }

        return "The external job source URL identifies "
                + platform
                + " as the recruitment platform.";
    }

    private int calculateTitleSimilarity(
            String first,
            String second) {

        if (first == null ||
                second == null ||
                first.isBlank() ||
                second.isBlank()) {

            return 0;
        }

        String firstText =
                normalize(first);

        String secondText =
                normalize(second);

        if (firstText.equals(
                secondText)) {

            return 100;
        }

        if (firstText.contains(
                secondText) ||
                secondText.contains(
                        firstText)) {

            return 90;
        }

        String[] firstWords =
                firstText.split(" ");

        String[] secondWords =
                secondText.split(" ");

        Set<String> firstSet =
                new HashSet<>();

        Set<String> secondSet =
                new HashSet<>();

        for (String word : firstWords) {

            if (isUsefulWord(word)) {

                firstSet.add(word);
            }
        }

        for (String word : secondWords) {

            if (isUsefulWord(word)) {

                secondSet.add(word);
            }
        }

        if (firstSet.isEmpty() ||
                secondSet.isEmpty()) {

            return 0;
        }

        int matchedWords = 0;

        for (String word : firstSet) {

            if (secondSet.contains(word)) {

                matchedWords++;
            }
        }

        int smallerSize =
                Math.min(
                        firstSet.size(),
                        secondSet.size()
                );

        int largerSize =
                Math.max(
                        firstSet.size(),
                        secondSet.size()
                );

        double coverage =
                ((double) matchedWords /
                        smallerSize) * 100;

        double overlap =
                ((double) matchedWords /
                        largerSize) * 100;

        int score =
                (int) (
                        coverage * 0.70
                                + overlap * 0.30
                );

        if (hasRelatedRoleWords(
                firstSet,
                secondSet)) {

            score += 10;
        }

        return Math.min(
                score,
                100
        );
    }

    private int calculateCompanySimilarity(
            String submittedCompany,
            String externalCompany) {

        if (submittedCompany == null ||
                externalCompany == null ||
                submittedCompany.isBlank() ||
                externalCompany.isBlank()) {

            return 0;
        }

        String first =
                normalizeCompany(
                        submittedCompany
                );

        String second =
                normalizeCompany(
                        externalCompany
                );

        if (first.isBlank() ||
                second.isBlank()) {

            return 0;
        }

        if (first.equals(second)) {

            return 100;
        }

        if (first.contains(second) ||
                second.contains(first)) {

            return 90;
        }

        if (isKnownCompanyAlias(
                first,
                second
        )) {

            return 100;
        }

        Set<String> firstWords =
                usefulWords(
                        first
                );

        Set<String> secondWords =
                usefulWords(
                        second
                );

        if (firstWords.isEmpty() ||
                secondWords.isEmpty()) {

            return 0;
        }

        int matchedWords = 0;

        for (String word : firstWords) {

            if (secondWords.contains(word)) {

                matchedWords++;
            }
        }

        int score =
                (matchedWords * 100)
                        / Math.max(
                                firstWords.size(),
                                secondWords.size()
                        );

        return Math.min(
                score,
                100
        );
    }

    private int calculateTextSimilarity(
            String first,
            String second) {

        if (first == null ||
                second == null ||
                first.isBlank() ||
                second.isBlank()) {

            return 0;
        }

        String firstText =
                normalize(first);

        String secondText =
                normalize(second);

        if (firstText.equals(
                secondText)) {

            return 100;
        }

        if (firstText.contains(
                secondText) ||
                secondText.contains(
                        firstText)) {

            return 90;
        }

        String[] firstWords =
                firstText.split(" ");

        String[] secondWords =
                secondText.split(" ");

        Set<String> firstSet =
                new HashSet<>();

        Set<String> secondSet =
                new HashSet<>();

        for (String word : firstWords) {

            if (isUsefulWord(word)) {

                firstSet.add(word);
            }
        }

        for (String word : secondWords) {

            if (isUsefulWord(word)) {

                secondSet.add(word);
            }
        }

        if (firstSet.isEmpty() ||
                secondSet.isEmpty()) {

            return 0;
        }

        int matchedWords = 0;

        for (String word : firstSet) {

            if (secondSet.contains(word)) {

                matchedWords++;
            }
        }

        int score =
                (matchedWords * 100)
                        / Math.max(
                                firstSet.size(),
                                secondSet.size()
                        );

        return Math.min(
                score,
                100
        );
    }

    private int calculateWeightedScore(
            int titleScore,
            int companyScore,
            int locationScore,
            String submittedOrganization,
            String submittedLocation) {

        boolean hasCompany =
                submittedOrganization != null &&
                !submittedOrganization.isBlank();

        boolean hasLocation =
                submittedLocation != null &&
                !submittedLocation.isBlank();

        double totalWeight = 0;

        double weightedScore = 0;

        weightedScore +=
                titleScore * 0.50;

        totalWeight += 0.50;

        if (hasCompany) {

            weightedScore +=
                    companyScore * 0.40;

            totalWeight += 0.40;
        }

        if (hasLocation) {

            weightedScore +=
                    locationScore * 0.10;

            totalWeight += 0.10;
        }

        if (totalWeight == 0) {

            return titleScore;
        }

        return (int) Math.round(
                weightedScore /
                        totalWeight
        );
    }

    private boolean isKnownCompanyAlias(
            String first,
            String second) {

        if ((first.equals("tcs") &&
                second.contains(
                        "tata consultancy services"
                )) ||
            (second.equals("tcs") &&
                first.contains(
                        "tata consultancy services"
                ))) {

            return true;
        }

        if ((first.equals("ibm") &&
                second.contains(
                        "international business machines"
                )) ||
            (second.equals("ibm") &&
                first.contains(
                        "international business machines"
                ))) {

            return true;
        }

        if ((first.equals("accenture") &&
                second.contains(
                        "accenture"
                )) ||
            (second.equals("accenture") &&
                first.contains(
                        "accenture"
                ))) {

            return true;
        }

        return false;
    }

    private Set<String> usefulWords(
            String text) {

        Set<String> words =
                new HashSet<>();

        for (String word :
                text.split(" ")) {

            if (isUsefulWord(word)) {

                words.add(word);
            }
        }

        return words;
    }

    private boolean hasRelatedRoleWords(
            Set<String> first,
            Set<String> second) {

        boolean developerMatch =
                first.contains("developer") &&
                (
                        second.contains("developer") ||
                        second.contains("programmer")
                );

        boolean engineerMatch =
                first.contains("engineer") &&
                (
                        second.contains("engineer") ||
                        second.contains("software")
                );

        boolean softwareMatch =
                first.contains("software") &&
                second.contains("software");

        boolean javaMatch =
                first.contains("java") &&
                second.contains("java");

        return developerMatch ||
                engineerMatch ||
                softwareMatch ||
                javaMatch;
    }

    private boolean isUsefulWord(
            String word) {

        if (word == null ||
                word.isBlank()) {

            return false;
        }

        return !word.equals("and") &&
                !word.equals("or") &&
                !word.equals("the") &&
                !word.equals("for") &&
                !word.equals("with") &&
                !word.equals("fresher") &&
                !word.equals("freshers") &&
                !word.equals("trainee") &&
                !word.equals("intern") &&
                !word.equals("internship") &&
                !word.equals("private") &&
                !word.equals("limited") &&
                !word.equals("pvt") &&
                !word.equals("ltd");
    }

    private String normalizeCompany(
            String text) {

        return text
                .toLowerCase()
                .replaceAll(
                        "[^a-z0-9 ]",
                        " "
                )
                .replaceAll(
                        "\\s+",
                        " "
                )
                .trim();
    }

    private String normalize(
            String text) {

        return text
                .toLowerCase()
                .replaceAll(
                        "[^a-z0-9 ]",
                        " "
                )
                .replaceAll(
                        "\\s+",
                        " "
                )
                .trim();
    }

    private String buildMatchedFields(
            int titleScore,
            int companyScore,
            int locationScore) {

        List<String> fields =
                new ArrayList<>();

        if (titleScore >= 70) {

            fields.add(
                    "Job Title"
            );
        }

        if (companyScore >= 70) {

            fields.add(
                    "Company"
            );
        }

        if (locationScore >= 70) {

            fields.add(
                    "Location"
            );
        }

        if (fields.isEmpty()) {

            return "No strong fields matched";
        }

        return String.join(
                ", ",
                fields
        );
    }
}