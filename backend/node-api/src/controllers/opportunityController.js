const User = require("../models/User");
const VerificationReport = require("../models/VerificationReport");
const Opportunity = require("../models/Opportunity");
const { verifyOpportunity } = require("../services/verificationService");


// =====================================================
// CREATE OPPORTUNITY
// =====================================================

const createOpportunity = async (req, res) => {
    try {
        const opportunityData = req.body;

        const verificationResult =
            await verifyOpportunity(opportunityData);

        const opportunity = await Opportunity.create({
            ...opportunityData,

            trustScore:
                verificationResult.trustScore,

            riskLevel:
                verificationResult.riskLevel,

            riskIndicators:
                verificationResult.riskIndicators
        });

        res.status(201).json({
            message: "Opportunity created successfully",
            opportunity
        });

    } catch (error) {

        console.error(
            "Create opportunity error:",
            error.message
        );

        res.status(500).json({
            message: "Failed to create opportunity",
            error: error.message
        });
    }
};


// =====================================================
// GET ALL OPPORTUNITIES
// =====================================================

const getOpportunities = async (req, res) => {
    try {

        const opportunities =
            await Opportunity.find()
                .sort({
                    createdAt: -1
                });

        res.json(opportunities);

    } catch (error) {

        console.error(
            "Get opportunities error:",
            error.message
        );

        res.status(500).json({
            message: "Failed to fetch opportunities",
            error: error.message
        });
    }
};


// =====================================================
// SAVE OPPORTUNITY
// =====================================================

const saveOpportunity = async (req, res) => {
    try {

        const {
            opportunityId
        } = req.params;

        const user =
            await User.findById(
                req.user.id
            );

        if (!user) {

            return res.status(404).json({
                message: "User not found"
            });
        }

        if (
            user.savedOpportunities.includes(
                opportunityId
            )
        ) {

            return res.status(400).json({
                message: "Opportunity already saved"
            });
        }

        user.savedOpportunities.push(
            opportunityId
        );

        await user.save();

        res.json({
            message:
                "Opportunity saved successfully"
        });

    } catch (error) {

        console.error(
            "Save opportunity error:",
            error.message
        );

        res.status(500).json({
            message:
                "Failed to save opportunity",
            error: error.message
        });
    }
};


// =====================================================
// GET SAVED OPPORTUNITIES
// =====================================================

const getSavedOpportunities = async (req, res) => {
    try {

        const user =
            await User.findById(
                req.user.id
            ).populate(
                "savedOpportunities"
            );

        if (!user) {

            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json(
            user.savedOpportunities
        );

    } catch (error) {

        console.error(
            "Get saved opportunities error:",
            error.message
        );

        res.status(500).json({
            message:
                "Failed to fetch saved opportunities",
            error: error.message
        });
    }
};


// =====================================================
// DELETE OPPORTUNITY
// =====================================================

const deleteOpportunity = async (req, res) => {
    try {

        const {
            opportunityId
        } = req.params;

        const opportunity =
            await Opportunity.findByIdAndDelete(
                opportunityId
            );

        if (!opportunity) {

            return res.status(404).json({
                message:
                    "Opportunity not found"
            });
        }

        res.json({
            message:
                "Opportunity deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete opportunity error:",
            error.message
        );

        res.status(500).json({
            message:
                "Failed to delete opportunity",
            error: error.message
        });
    }
};


// =====================================================
// VERIFY STUDENT OPPORTUNITY
// =====================================================

const verifyStudentOpportunity = async (
    req,
    res
) => {

    try {

        const opportunityData =
            req.body;

        if (
            !opportunityData.title &&
            !opportunityData.organization &&
            !opportunityData.applicationLink &&
            !opportunityData.description
        ) {

            return res.status(400).json({
                message:
                    "Please provide opportunity details"
            });
        }


        // ---------------------------------------------
        // SEND DATA TO SPRING BOOT VERIFICATION SERVICE
        // ---------------------------------------------

        const verificationResult =
            await verifyOpportunity(
                opportunityData
            );


        // ---------------------------------------------
        // SAVE COMPLETE VERIFICATION REPORT
        // ---------------------------------------------

        const report =
            await VerificationReport.create({

                user: req.user.id,


                opportunity: {

                    title:
                        opportunityData.title ||
                        "",

                    organization:
                        opportunityData.organization ||
                        "",

                    applicationLink:
                        opportunityData.applicationLink ||
                        "",

                    officialWebsite:
                        opportunityData.officialWebsite ||
                        "",

                    description:
                        opportunityData.description ||
                        "",

                    registrationFee:
                        Number(
                            opportunityData.registrationFee ||
                            0
                        )
                },


                trustScore:
                    verificationResult.trustScore ||
                    0,


                riskLevel:
                    verificationResult.riskLevel ||
                    "UNKNOWN",


                riskIndicators:
                    verificationResult.riskIndicators ||
                    [],


                sourceVerification:
                    verificationResult.sourceVerification ||
                    [],


                companyVerification:
                    verificationResult.companyVerification ||
                    {},


                matchingOpportunities:
                    verificationResult.matchingOpportunities ||
                    [],


                                recommendation:
                    verificationResult.recommendation ||
                    "",

                fingerprint:
                    verificationResult.opportunityIdentity?.fingerprint ||
                    "",

                fingerprintId:
                    verificationResult.opportunityIdentity?.fingerprintId ||
                    "",

                similarityScore:
                    verificationResult.opportunityIdentity?.similarityScore ||
                    0,

                similarOpportunityCount:
                    verificationResult.opportunityIdentity?.similarOpportunityCount ||
                    0,

                fingerprintWarning:
                    verificationResult.opportunityIdentity?.warning ||
                    ""            });


        // ---------------------------------------------
        // SEND RESULT TO FRONTEND
        // ---------------------------------------------

        res.json({

            message:
                "Opportunity analyzed successfully",

            result:
                verificationResult,

            reportId:
                report._id
        });


    } catch (error) {

        console.error(
            "Student opportunity verification error:",
            error.message
        );

        res.status(500).json({

            message:
                "Failed to analyze opportunity",

            error:
                error.message
        });
    }
};


// =====================================================
// UPDATE OPPORTUNITY
// =====================================================

const updateOpportunity = async (
    req,
    res
) => {

    try {

        const {
            opportunityId
        } = req.params;


        const opportunity =
            await Opportunity.findById(
                opportunityId
            );


        if (!opportunity) {

            return res.status(404).json({
                message:
                    "Opportunity not found"
            });
        }


        const updatedData =
            req.body;


        // ---------------------------------------------
        // RE-VERIFY UPDATED OPPORTUNITY
        // ---------------------------------------------

        const verificationResult =
            await verifyOpportunity(
                updatedData
            );


        // ---------------------------------------------
        // UPDATE OPPORTUNITY DATA
        // ---------------------------------------------

        Object.assign(
            opportunity,
            updatedData
        );


        // ---------------------------------------------
        // UPDATE VERIFICATION DATA
        // ---------------------------------------------

        opportunity.trustScore =
            verificationResult.trustScore;


        opportunity.riskLevel =
            verificationResult.riskLevel;


        opportunity.riskIndicators =
            verificationResult.riskIndicators;


        await opportunity.save();


        res.json({

            message:
                "Opportunity updated successfully",

            opportunity
        });


    } catch (error) {

        console.error(
            "Update opportunity error:",
            error.message
        );

        res.status(500).json({

            message:
                "Failed to update opportunity",

            error:
                error.message
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

const getVerificationHistory = async (req, res) => {
    try {
        const reports = await VerificationReport.find({
            user: req.user.id
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .select(
                "opportunity trustScore riskLevel fingerprintId similarityScore similarOpportunityCount fingerprintWarning createdAt"
            )
            .lean();

        res.json({
            count: reports.length,
            history: reports
        });

    } catch (error) {
        console.error("VERIFICATION HISTORY ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch verification history",
            error: error.message
        });
    }
};

const getVerificationReportById = async (req, res) => {
    try {
        const report = await VerificationReport.findOne({
            _id: req.params.reportId,
            user: req.user.id
        }).lean();

        if (!report) {
            return res.status(404).json({
                message: "Verification report not found"
            });
        }

        res.json(report);

    } catch (error) {
        console.error(
            "GET VERIFICATION REPORT ERROR:",
            error.message
        );

        res.status(500).json({
            message: "Failed to load verification report",
            error: error.message
        });
    }
};
module.exports = {

    createOpportunity,
    getVerificationHistory,
    getVerificationReportById,

    verifyStudentOpportunity,
    getOpportunities,

    saveOpportunity,

    getSavedOpportunities,

    deleteOpportunity,

    updateOpportunity

};