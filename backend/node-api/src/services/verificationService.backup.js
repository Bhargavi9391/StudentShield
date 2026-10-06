const axios = require("axios");

const verifyOpportunity = async (opportunityData) => {
    try {
        const response = await axios.post(
            "http://localhost:8080/api/verification/check",
            opportunityData
        );

        return response.data;
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