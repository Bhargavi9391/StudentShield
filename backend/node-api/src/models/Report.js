const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        opportunity: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Opportunity",
            required: true
        },

        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        reason: {
            type: String,
            enum: [
                "Registration fee asked",
                "Suspicious website",
                "Suspicious application link",
                "Organization details unclear",
                "Misleading information"
            ],
            required: true
        },

        description: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: ["pending", "reviewed", "dismissed"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Report", reportSchema);