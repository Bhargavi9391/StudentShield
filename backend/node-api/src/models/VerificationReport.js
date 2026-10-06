const mongoose = require("mongoose");

const verificationReportSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        opportunity: {
            title: {
                type: String,
                default: ""
            },

            organization: {
                type: String,
                default: ""
            },

            applicationLink: {
                type: String,
                default: ""
            },

            officialWebsite: {
                type: String,
                default: ""
            },

            description: {
                type: String,
                default: ""
            },

            registrationFee: {
                type: Number,
                default: 0
            }
        },

        // Opportunity Identity / Fingerprint
        fingerprint: {
            type: String,
            default: "",
            index: true
        },

        fingerprintId: {
            type: String,
            default: ""
        },

        similarityScore: {
            type: Number,
            default: 0
        },

        similarOpportunityCount: {
            type: Number,
            default: 0
        },

        fingerprintWarning: {
            type: String,
            default: ""
        },

        trustScore: {
            type: Number,
            default: 0
        },

        riskLevel: {
            type: String,
            default: "UNKNOWN"
        },

        riskIndicators: {
            type: [String],
            default: []
        },

        sourceVerification: {
            type: Array,
            default: []
        },

        companyVerification: {
            type: Object,
            default: {}
        },

        matchingOpportunities: {
            type: Array,
            default: []
        },

        recommendation: {
            type: String,
            default: ""
        }
    },

    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "VerificationReport",
    verificationReportSchema
);