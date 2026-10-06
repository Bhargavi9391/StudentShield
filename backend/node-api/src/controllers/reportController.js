const Report = require("../models/Report");
const Opportunity = require("../models/Opportunity");

const createReport = async (req, res) => {
    try {
        const { opportunityId } = req.params;
        const { reason, description } = req.body;

        if (!reason) {
            return res.status(400).json({
                message: "Report reason is required"
            });
        }

        const opportunity = await Opportunity.findById(opportunityId);

        if (!opportunity) {
            return res.status(404).json({
                message: "Opportunity not found"
            });
        }

        const existingReport = await Report.findOne({
            opportunity: opportunityId,
            reportedBy: req.user.id
        });

        if (existingReport) {
            return res.status(400).json({
                message: "You have already reported this opportunity"
            });
        }

        console.log("REPORT DATA:", {
            opportunityId,
            userId: req.user.id,
            reason,
            description
        });

        const report = await Report.create({
            opportunity: opportunityId,
            reportedBy: req.user.id,
            reason,
            description
        });

        console.log("REPORT CREATED:", report._id);

        res.status(201).json({
            message: "Report submitted successfully",
            report
        });

    } catch (error) {
        console.error("CREATE REPORT ERROR:", error);

        res.status(500).json({
            message: "Failed to submit report",
            error: error.message
        });
    }
};


const getReportSummary = async (req, res) => {
    try {
        const { opportunityId } = req.params;

        const reports = await Report.find({
            opportunity: opportunityId
        });

        const reportCount = reports.length;

        const reasonCounts = {};

        reports.forEach((report) => {
            reasonCounts[report.reason] =
                (reasonCounts[report.reason] || 0) + 1;
        });

        res.json({
            opportunityId,
            reportCount,
            reasonCounts
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch reports",
            error: error.message
        });
    }
};


const getAllReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate(
                "opportunity",
                "title organization riskLevel trustScore"
            )
            .populate(
                "reportedBy",
                "name email"
            )
            .sort({
                createdAt: -1
            });

        res.json(reports);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch reports",
            error: error.message
        });
    }
};


const updateReportStatus = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { status } = req.body;

        if (!["reviewed", "dismissed"].includes(status)) {
            return res.status(400).json({
                message: "Invalid report status"
            });
        }

        const report = await Report.findByIdAndUpdate(
            reportId,
            { status },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({
                message: "Report not found"
            });
        }

        res.json({
            message: `Report marked as ${status}`,
            report
        });

    } catch (error) {
        console.error("UPDATE REPORT ERROR:", error);

        res.status(500).json({
            message: "Failed to update report status",
            error: error.message
        });
    }
};


module.exports = {
    createReport,
    getReportSummary,
    getAllReports,
    updateReportStatus
};