package verification_service.rules;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import verification_service.model.VerificationRequest;

public class RiskRules {

    public static List<String> evaluate(
            VerificationRequest request) {

        List<String> risks =
                new ArrayList<>();

        if (request.getOfficialWebsite() == null ||
                request.getOfficialWebsite().isBlank()) {

            risks.add(
                    "Official website is missing"
            );
        }

        if (request.getRegistrationFee() > 0) {

            risks.add(
                    "Registration fee is required"
            );
        }

        String details =
                safe(request.getDescription());

        String lowerDetails =
                details.toLowerCase(Locale.ROOT);

        if (containsGuaranteedJobClaim(lowerDetails)) {

            risks.add(
                    "The opportunity makes a guaranteed job or placement claim"
            );
        }

        if (containsPaymentClaim(lowerDetails)) {

            risks.add(
                    "The opportunity requests or emphasizes upfront payment"
            );
        }

        String officialDomain =
                extractDomain(
                        request.getOfficialWebsite()
                );

        String applicationDomain =
                extractDomain(
                        request.getApplicationLink()
                );

        if (!officialDomain.isBlank() &&
                !applicationDomain.isBlank() &&
                !isTrustedApplicationSource(
                        applicationDomain
                ) &&
                !sameDomain(
                        officialDomain,
                        applicationDomain
                )) {

            risks.add(
                    "Application domain differs from official domain"
            );
        }

        return risks;
    }

    public static int calculateScore(
            VerificationRequest request) {

        int score = 100;

        if (request.getOfficialWebsite() == null ||
                request.getOfficialWebsite().isBlank()) {

            score -= 20;
        }

        /*
         * Upfront registration/application fees are treated
         * as a strong risk signal.
         */
        if (request.getRegistrationFee() > 0) {

            score -= 50;
        }

        String details =
                safe(request.getDescription());

        String lowerDetails =
                details.toLowerCase(Locale.ROOT);

        /*
         * Guaranteed job/placement claims are a strong
         * warning signal when combined with an opportunity.
         */
        if (containsGuaranteedJobClaim(lowerDetails)) {

            score -= 25;
        }

        /*
         * Explicit upfront-payment language adds another
         * risk signal.
         */
        if (containsPaymentClaim(lowerDetails)) {

            score -= 10;
        }

        String officialDomain =
                extractDomain(
                        request.getOfficialWebsite()
                );

        String applicationDomain =
                extractDomain(
                        request.getApplicationLink()
                );

        if (!officialDomain.isBlank() &&
                !applicationDomain.isBlank() &&
                !isTrustedApplicationSource(
                        applicationDomain
                ) &&
                !sameDomain(
                        officialDomain,
                        applicationDomain
                )) {

            score -= 15;
        }

        return Math.max(
                score,
                0
        );
    }

    public static String calculateRiskLevel(
            int score) {

        if (score >= 80) {

            return "LOW";
        }

        if (score >= 50) {

            return "MEDIUM";
        }

        return "HIGH";
    }

    private static boolean containsGuaranteedJobClaim(
        String details) {

    return details.contains(
            "guaranteed job"
    )
            || details.contains(
                    "guaranteed placement"
            )
            || details.contains(
                    "job guaranteed"
            )
            || details.contains(
                    "job placement is guaranteed"
            )
            || details.contains(
                    "placement is guaranteed"
            )
            || details.contains(
                    "guaranteed employment"
            )
            || details.contains(
                    "100% placement"
            )
            || details.contains(
                    "100 percent placement"
            );
}
    private static boolean containsPaymentClaim(
            String details) {

        return details.contains(
                "upfront payment"
        )
                || details.contains(
                        "pay before interview"
                )
                || details.contains(
                        "pay before joining"
                )
                || details.contains(
                        "verification fee"
                )
                || details.contains(
                        "registration fee"
                )
                || details.contains(
                        "placement fee"
                )
                || details.contains(
                        "pay to get selected"
                );
    }

    private static boolean sameDomain(
            String officialDomain,
            String applicationDomain) {

        return officialDomain.equalsIgnoreCase(
                applicationDomain
        )
                || applicationDomain.endsWith(
                        "." + officialDomain
                );
    }

    private static boolean isTrustedApplicationSource(
            String domain) {

        String normalized =
                domain.toLowerCase();

        return normalized.equals("linkedin.com")
                || normalized.equals("lnkd.in")
                || normalized.equals("indeed.com")
                || normalized.equals("naukri.com")
                || normalized.equals("foundit.in")
                || normalized.equals("adzuna.in")
                || normalized.equals("adzuna.com");
    }

    private static String extractDomain(
            String url) {

        if (url == null ||
                url.isBlank()) {

            return "";
        }

        try {

            String normalizedUrl =
                    url.trim();

            if (!normalizedUrl.startsWith("http://") &&
                    !normalizedUrl.startsWith("https://")) {

                normalizedUrl =
                        "https://" + normalizedUrl;
            }

            URI uri =
                    URI.create(
                            normalizedUrl
                    );

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

    private static String safe(
            String value) {

        return value == null
                ? ""
                : value.trim();
    }
}