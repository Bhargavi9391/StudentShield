const axios = require("axios");
const { checkFingerprint } = require("./fingerprintService");

const verifyOpportunity = async (opportunityData) => {
    try {
        const response = await axios.post(
            "http://localhost:8080/api/verification/check",
            opportunityData
        );

        const verificationResult = response.data;

        const fingerprintResult = await checkFingerprint({
            title: opportunityData.title,
            organization: opportunityData.organization,
            description: opportunityData.details,
            applicationLink: opportunityData.applicationLink,
            officialWebsite: opportunityData.officialWebsite
        });

        return {
            ...verificationResult,

            opportunityIdentity: {
                fingerprint: fingerprintResult.fingerprint,
                fingerprintId: fingerprintResult.fingerprintId,
                similarityScore: fingerprintResult.similarityScore,
                similarOpportunityCount:
                    fingerprintResult.similarOpportunityCount,
                warning: fingerprintResult.fingerprintWarning,
applicationLinkChanged:
    fingerprintResult.applicationLinkChanged,
previousApplicationLink:
    fingerprintResult.previousApplicationLink
            }
        };

    } catch (error) {
        console.error(
            "Verification service error:",
            error.response?.data || error.message
        );

        throw new Error("Verification service unavailable");
    }
};

module.exports = {
    verifyOpportunity
};