const crypto = require("crypto");
const VerificationReport = require("../models/VerificationReport");

const normalize = (value = "") => {
    return value
        .toString()
        .toLowerCase()
        .replace(/https?:\/\//g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

const getDomain = (url = "") => {
    try {
        return new URL(url).hostname
            .replace(/^www\./, "")
            .toLowerCase();
    } catch {
        return "";
    }
};

const createFingerprint = ({
    title,
    organization,
    description,
    applicationLink,
    officialWebsite
}) => {
    const applicationDomain = getDomain(applicationLink);
    const officialDomain = getDomain(officialWebsite);

    const fingerprintSource = [
        normalize(title),
        normalize(organization),
        normalize(description),
        applicationDomain,
        officialDomain
    ].join("|");

    const hash = crypto
        .createHash("sha256")
        .update(fingerprintSource)
        .digest("hex");

    return {
        fingerprint: hash,
        fingerprintId:
            `SS-${hash.substring(0, 4).toUpperCase()}-${hash.substring(4, 8).toUpperCase()}`,
        normalizedData: {
            title: normalize(title),
            organization: normalize(organization),
            description: normalize(description),
            applicationDomain,
            officialDomain
        }
    };
};

const calculateSimilarity = (current, previous) => {
    const fields = [
        "title",
        "organization",
        "description",
        "applicationDomain",
        "officialDomain"
    ];

    let matched = 0;
    let available = 0;

    fields.forEach((field) => {
        const currentValue = current[field] || "";
        const previousValue = previous[field] || "";

        if (!currentValue && !previousValue) {
            return;
        }

        available++;

        if (
            currentValue === previousValue ||
            currentValue.includes(previousValue) ||
            previousValue.includes(currentValue)
        ) {
            matched++;
        }
    });

    if (available === 0) {
        return 0;
    }

    return Math.round((matched / available) * 100);
};

const checkFingerprint = async ({
    title,
    organization,
    description,
    applicationLink,
    officialWebsite
}) => {

    const current = createFingerprint({
        title,
        organization,
        description,
        applicationLink,
        officialWebsite
    });

    const previousReports = await VerificationReport.find({
        "opportunity.title": { $exists: true }
    })
        .select(
            "opportunity fingerprint fingerprintId createdAt"
        )
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    let highestSimilarity = 0;
    let similarCount = 0;
    let exactMatch = null;
    let changedLinkMatch = null;

    for (const report of previousReports) {

        if (report.fingerprint === current.fingerprint) {

            exactMatch = report;
            highestSimilarity = 100;
            similarCount++;

            continue;
        }

        const previous = {
            title: normalize(report.opportunity?.title),
            organization: normalize(report.opportunity?.organization),
            description: normalize(report.opportunity?.description),
            applicationDomain: getDomain(
                report.opportunity?.applicationLink
            ),
            officialDomain: getDomain(
                report.opportunity?.officialWebsite
            )
        };

        const similarity = calculateSimilarity(
            current.normalizedData,
            previous
        );

        if (similarity >= 60) {
            similarCount++;
        }

        if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
        }

        // Same opportunity details but different application domain
        const sameOpportunity =
            current.normalizedData.title === previous.title &&
            current.normalizedData.organization === previous.organization &&
            current.normalizedData.description === previous.description &&
            current.normalizedData.officialDomain === previous.officialDomain;

        const differentApplicationLink =
            current.normalizedData.applicationDomain &&
            previous.applicationDomain &&
            current.normalizedData.applicationDomain !==
                previous.applicationDomain;

        if (sameOpportunity && differentApplicationLink) {
            changedLinkMatch = report;
        }
    }

    let warning = "";

    if (changedLinkMatch) {

        warning =
            "The opportunity details match a previous submission, but the application link is different.";

    } else if (exactMatch) {

        warning =
            "This opportunity was already checked on StudentShield.";

    } else if (highestSimilarity >= 80) {

        warning =
            "A highly similar opportunity was previously checked. Verify the application link carefully.";

    } else if (highestSimilarity >= 60) {

        warning =
            "A similar opportunity was previously checked. Compare the details before applying.";
    }

    return {
        fingerprint: current.fingerprint,
        fingerprintId: current.fingerprintId,
        similarityScore: highestSimilarity,
        similarOpportunityCount: similarCount,
        fingerprintWarning: warning,
        applicationLinkChanged: Boolean(changedLinkMatch),
        previousApplicationLink:
            changedLinkMatch?.opportunity?.applicationLink || ""
    };
};

module.exports = {
    checkFingerprint
};