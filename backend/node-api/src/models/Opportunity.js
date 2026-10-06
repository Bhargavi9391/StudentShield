const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },

        organization: {
            type: String,
            required: true
        },

        type: {
            type: String,
            enum: [
                "Internship",
                "Job",
                "Scholarship",
                "Hackathon",
                "Course"
            ],
            required: true
        },

        officialWebsite: {
            type: String,
            default: ""
        },

        email: {
            type: String,
            default: ""
        },

        registrationFee: {
            type: Number,
            default: 0
        },

        applicationLink: {
            type: String,
            required: true
        },

        deadline: {
            type: Date
        },

        description: {
            type: String,
            default: ""
        },

        trustScore: {
            type: Number,
            default: 100
        },

        riskLevel: {
            type: String,
            default: "LOW"
        },

        riskIndicators: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Opportunity",
    opportunitySchema
);