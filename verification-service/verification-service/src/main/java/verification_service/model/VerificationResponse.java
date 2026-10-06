package verification_service.model;

import java.util.List;
import java.util.Map;

public class VerificationResponse {

    private int trustScore;

    private String riskLevel;

    private List<String> riskIndicators;

    private List<Map<String, String>> sourceVerification;

    private Map<String, String> companyVerification;

    private List<Map<String, String>> matchingOpportunities;

    private String recommendation;

    private List<String> goodSigns;

    private List<String> warnings;

    private List<Map<String, String>> availablePlatforms;

    public VerificationResponse() {
    }

    public VerificationResponse(
            int trustScore,
            String riskLevel,
            List<String> riskIndicators,
            List<Map<String, String>> sourceVerification,
            Map<String, String> companyVerification,
            List<Map<String, String>> matchingOpportunities,
            String recommendation,
            List<String> goodSigns,
            List<String> warnings,
            List<Map<String, String>> availablePlatforms) {

        this.trustScore = trustScore;
        this.riskLevel = riskLevel;
        this.riskIndicators = riskIndicators;
        this.sourceVerification = sourceVerification;
        this.companyVerification = companyVerification;
        this.matchingOpportunities = matchingOpportunities;
        this.recommendation = recommendation;
        this.goodSigns = goodSigns;
        this.warnings = warnings;
        this.availablePlatforms = availablePlatforms;
    }

    public int getTrustScore() {
        return trustScore;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public List<String> getRiskIndicators() {
        return riskIndicators;
    }

    public List<Map<String, String>> getSourceVerification() {
        return sourceVerification;
    }

    public Map<String, String> getCompanyVerification() {
        return companyVerification;
    }

    public List<Map<String, String>> getMatchingOpportunities() {
        return matchingOpportunities;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public List<String> getGoodSigns() {
        return goodSigns;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public List<Map<String, String>> getAvailablePlatforms() {
        return availablePlatforms;
    }
}