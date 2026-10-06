const express = require("express");

const {
    createOpportunity,
    verifyStudentOpportunity,
    getOpportunities,
    saveOpportunity,
    getSavedOpportunities,
    deleteOpportunity,
    updateOpportunity,
    getVerificationHistory,
    getVerificationReportById
} = require("../controllers/opportunityController");

const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

const router = express.Router();

router.post(
    "/verify",
    protect,
    verifyStudentOpportunity
);

router.get(
    "/verification-history",
    protect,
    getVerificationHistory
);

router.get(
    "/verification-history/:reportId",
    protect,
    getVerificationReportById
);

router.post(
    "/",
    protect,
    admin,
    createOpportunity
);

router.delete(
    "/:opportunityId",
    protect,
    admin,
    deleteOpportunity
);

router.put(
    "/:opportunityId",
    protect,
    admin,
    updateOpportunity
);

router.get(
    "/",
    getOpportunities
);

router.get(
    "/saved",
    protect,
    getSavedOpportunities
);

router.post(
    "/:opportunityId/save",
    protect,
    saveOpportunity
);

module.exports = router;