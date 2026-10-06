const express = require("express");

const {
    createReport,
    getReportSummary,
    getAllReports,
    updateReportStatus
} = require("../controllers/reportController");

const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

const router = express.Router();


// Student submits a community report
router.post(
    "/:opportunityId",
    protect,
    createReport
);


// Admin views all community reports
router.get(
    "/admin/all",
    protect,
    admin,
    getAllReports
);


// Admin updates report status
router.patch(
    "/admin/:reportId/status",
    protect,
    admin,
    updateReportStatus
);


// Anyone can view report summary for an opportunity
router.get(
    "/:opportunityId/summary",
    getReportSummary
);


module.exports = router;