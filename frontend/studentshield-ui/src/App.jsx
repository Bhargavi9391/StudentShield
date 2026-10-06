
import { useEffect, useState } from "react";
import axios from "axios";
import Login from "./Login";
import Register from "./Register";
import AdminDashboard from "./AdminDashboard";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import "./index.css";

function App() {
    const [page, setPage] = useState("login");
    const [user, setUser] = useState(null);
    const [resetToken, setResetToken] = useState("");

    const [opportunities, setOpportunities] = useState([]);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [loading, setLoading] = useState(true);

    const [savedOpportunities, setSavedOpportunities] = useState([]);
    const [savedLoading, setSavedLoading] = useState(false);

    const [selectedOpportunity, setSelectedOpportunity] =
        useState(null);

    const [verificationResult, setVerificationResult] =
        useState(null);

    const [verificationLoading, setVerificationLoading] =
        useState(false);

    const [verificationReports, setVerificationReports] =
        useState([]);

    const [reportsLoading, setReportsLoading] =
        useState(false);

    const [selectedReport, setSelectedReport] =
        useState(null);

    const [verifyForm, setVerifyForm] = useState({
        title: "",
        organization: "",
        officialWebsite: "",
        applicationLink: "",
        email: "",
        description: "",
        registrationFee: 0
    });

    /* =========================
       RESTORE LOGIN SESSION
    ========================= */

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (savedUser && token) {
            try {
                const parsedUser = JSON.parse(savedUser);

                setUser(parsedUser);
                setPage("dashboard");
            } catch (error) {
                console.error(
                    "Failed to restore user:",
                    error
                );

                localStorage.removeItem("user");
                localStorage.removeItem("token");

                setPage("login");
            }
        } else {
            setPage("login");
        }
    }, []);

    /* =========================
       FETCH OPPORTUNITIES
    ========================= */

    useEffect(() => {
        if (page === "dashboard") {
            fetchOpportunities();
        }
    }, [page]);

    /* =========================
       FETCH SAVED
    ========================= */

    useEffect(() => {
        if (page === "saved") {
            fetchSavedOpportunities();
        }
    }, [page]);

    const fetchOpportunities = async () => {
        try {
            setLoading(true);

            const response = await axios.get(
                "http://localhost:5000/api/opportunities"
            );

            const opportunitiesWithReports =
                await Promise.all(
                    response.data.map(async (opportunity) => {
                        try {
                            const reportResponse =
                                await axios.get(
                                    `http://localhost:5000/api/reports/${opportunity._id}/summary`
                                );

                            return {
                                ...opportunity,
                                reportCount:
                                    reportResponse.data.reportCount
                            };
                        } catch {
                            return {
                                ...opportunity,
                                reportCount: 0
                            };
                        }
                    })
                );

            setOpportunities(opportunitiesWithReports);
        } catch (error) {
            console.error(
                "Failed to fetch opportunities:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchSavedOpportunities = async () => {
        try {
            setSavedLoading(true);

            const token =
                localStorage.getItem("token");

            if (!token) {
                alert("Please login first");
                setPage("login");
                return;
            }

            const response = await axios.get(
                "http://localhost:5000/api/opportunities/saved",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setSavedOpportunities(response.data);
        } catch (error) {
            console.error(
                "Failed to fetch saved opportunities:",
                error
            );
        } finally {
            setSavedLoading(false);
        }
    };

    /* =========================
       AUTH
    ========================= */

    const handleLogin = (loggedInUser) => {
        setUser(loggedInUser);
        setPage("dashboard");
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
        setSelectedReport(null);
        setVerificationResult(null);

        setPage("login");
    };

    const handleAdminDashboard = () => {
        if (!user) {
            setPage("login");
            return;
        }

        if (user.role !== "admin") {
            alert("Admin access required");
            return;
        }

        setPage("admin");
    };

    /* =========================
       OPPORTUNITY DETAILS
    ========================= */

    const handleViewDetails = (opportunity) => {
        setSelectedOpportunity(opportunity);
        setPage("details");
    };

    /* =========================
       VERIFY OPPORTUNITY
    ========================= */

    const handleVerifyOpportunity = async (e) => {
        e.preventDefault();

        if (
            !verifyForm.title &&
            !verifyForm.organization &&
            !verifyForm.applicationLink &&
            !verifyForm.description
        ) {
            alert("Please enter opportunity details");
            return;
        }

        try {
            setVerificationLoading(true);
            setVerificationResult(null);

            const token =
                localStorage.getItem("token");

            if (!token) {
                alert("Please login first");
                setPage("login");
                return;
            }

            const response = await axios.post(
                "http://localhost:5000/api/opportunities/verify",
                {
                    ...verifyForm,
                    registrationFee: Number(
                        verifyForm.registrationFee || 0
                    )
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setVerificationResult(
                response.data.result
            );
        } catch (error) {
            console.error(
                "Verification error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to analyze opportunity"
            );
        } finally {
            setVerificationLoading(false);
        }
    };

    /* =========================
       VERIFICATION REPORTS
    ========================= */

    const fetchVerificationReports = async () => {
        try {
            setReportsLoading(true);

            const token =
                localStorage.getItem("token");

            if (!token) {
                setPage("login");
                return;
            }

            const response = await axios.get(
                "http://localhost:5000/api/opportunities/verification-history",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setVerificationReports(
                response.data.history || []
            );
        } catch (error) {
            console.error(
                "Fetch verification reports error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to load reports"
            );
        } finally {
            setReportsLoading(false);
        }
    };

    const handleViewVerificationReport = async (
        reportId
    ) => {
        try {
            console.log(
                "VIEW REPORT CLICKED:",
                reportId
            );

            const token =
                localStorage.getItem("token");

            if (!token) {
                alert("Please login first");
                setPage("login");
                return;
            }

            const response = await axios.get(
                `http://localhost:5000/api/opportunities/verification-history/${reportId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log(
                "REPORT LOADED:",
                response.data
            );

            setSelectedReport(response.data);
        } catch (error) {
            console.error(
                "Fetch verification report error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to load report"
            );
        }
    };

    /* =========================
       SAVE
    ========================= */

    const handleSave = async (opportunityId) => {
        try {
            const token =
                localStorage.getItem("token");

            if (!token) {
                alert("Please login first");
                setPage("login");
                return;
            }

            const response = await axios.post(
                `http://localhost:5000/api/opportunities/${opportunityId}/save`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert(response.data.message);
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Failed to save opportunity"
            );
        }
    };

    /* =========================
       REPORT OPPORTUNITY
    ========================= */

    const handleReport = async (opportunityId) => {
        const choice = prompt(
            "Enter report reason:\n" +
            "1. Registration fee asked\n" +
            "2. Suspicious website\n" +
            "3. Suspicious application link\n" +
            "4. Organization details unclear\n" +
            "5. Misleading information"
        );

        if (!choice) return;

        const reasons = {
            "1": "Registration fee asked",
            "2": "Suspicious website",
            "3": "Suspicious application link",
            "4": "Organization details unclear",
            "5": "Misleading information"
        };

        const reason =
            reasons[choice.trim()];

        if (!reason) {
            alert(
                "Please enter a valid option from 1 to 5."
            );
            return;
        }

        try {
            const token =
                localStorage.getItem("token");

            if (!token) {
                alert("Please login first");
                setPage("login");
                return;
            }

            const response = await axios.post(
                `http://localhost:5000/api/reports/${opportunityId}`,
                {
                    reason,
                    description:
                        "Reported by student"
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert(response.data.message);
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Failed to submit report"
            );

            console.error(
                "Report error:",
                error
            );
        }
    };

    /* =========================
       HELPERS
    ========================= */

    const filteredOpportunities =
        opportunities.filter(
            (opportunity) => {
                const title =
                    opportunity.title || "";

                const organization =
                    opportunity.organization || "";

                const matchesSearch =
                    title
                        .toLowerCase()
                        .includes(
                            search.toLowerCase()
                        ) ||
                    organization
                        .toLowerCase()
                        .includes(
                            search.toLowerCase()
                        );

                const matchesType =
                    typeFilter === "All" ||
                    opportunity.type ===
                        typeFilter;

                return (
                    matchesSearch &&
                    matchesType
                );
            }
        );

    const getRiskClass = (riskLevel) => {
        if (riskLevel === "LOW") {
            return "low";
        }

        if (riskLevel === "MEDIUM") {
            return "medium";
        }

        return "high";
    };

    const getDeadlineStatus = (deadline) => {
        if (!deadline) {
            return "No deadline";
        }

        const deadlineDate =
            new Date(deadline);

        const today = new Date();

        return deadlineDate < today
            ? "Expired"
            : "Active";
    };

    /* =========================
       COMPANY INFORMATION
    ========================= */

    const renderCompanyVerification = (
        company
    ) => {
        if (
            !company ||
            Object.keys(company).length === 0
        ) {
            return (
                <p>
                    Company information is not
                    available yet.
                </p>
            );
        }

        return (
            <div className="company-info">
                <p>
                    <strong>
                        Organization:
                    </strong>{" "}
                    {company.organization ||
                        "Not available"}
                </p>

                <p>
                    <strong>
                        Official Website:
                    </strong>{" "}

                    {company.website ? (
                        <a
                            href={company.website}
                            target="_blank"
                            rel="noreferrer"
                            className="company-link"
                        >
                            {company.website}
                        </a>
                    ) : (
                        "Not provided"
                    )}
                </p>

                <p>
                    <strong>
                        Website Verification:
                    </strong>{" "}
                    {company.websiteStatus ||
                        "Not checked"}
                </p>

                <p>
                    <strong>
                        Contact Email:
                    </strong>{" "}
                    {company.email ||
                        "Not provided"}
                </p>

                <p>
                    <strong>
                        Email Status:
                    </strong>{" "}
                    {company.emailStatus ||
                        "Not checked"}
                </p>
            </div>
        );
    };

    /* =========================
       PLATFORM DISPLAY
    ========================= */

    const getPlatformIcon = (name) => {
        const platform =
            String(name || "")
                .toLowerCase();

        if (
            platform.includes("linkedin")
        ) {
            return "💼";
        }

        if (
            platform.includes("naukri")
        ) {
            return "🟠";
        }

        if (
            platform.includes("indeed")
        ) {
            return "🔵";
        }

        if (
            platform.includes("foundit")
        ) {
            return "🟣";
        }

        if (
            platform.includes("shine")
        ) {
            return "🟡";
        }

        if (
            platform.includes("timesjobs")
        ) {
            return "🟢";
        }

        if (
            platform.includes("internshala")
        ) {
            return "🟣";
        }

        return "🌐";
    };

    const renderAvailablePlatforms = (
        result
    ) => {
        const platforms =
            result?.availablePlatforms || [];

        if (platforms.length === 0) {
            return (
                <section className="verification-section">
                    <div className="platform-heading-row">
                        <div>
                            <h3>
                                🌐 Where is this job available?
                            </h3>

                            <p>
                                No independently confirmed
                                platform listing found yet.
                            </p>
                        </div>
                    </div>
                </section>
            );
        }

        return (
            <section className="verification-section">
                <div className="platform-heading-row">
                    <div>
                        <h3>
                            🌐 Where is this job available?
                        </h3>

                        <p>
                            Confirmed on{" "}
                            {platforms.length} platform
                            {platforms.length !== 1
                                ? "s"
                                : ""}
                        </p>
                    </div>

                    <span className="platform-count">
                        {platforms.length} confirmed
                    </span>
                </div>

                <div className="available-platforms">
                    {platforms.map(
                        (
                            platform,
                            index
                        ) => (
                            <div
                                className="platform-card"
                                key={`${platform.name}-${index}`}
                            >
                                <span className="platform-icon">
                                    {getPlatformIcon(
                                        platform.name
                                    )}
                                </span>

                                <span className="platform-name">
                                    {platform.name}
                                </span>

                                <span className="platform-check">
                                    ✓
                                </span>
                            </div>
                        )
                    )}
                </div>
            </section>
        );
    };

    /* =========================
       GOOD SIGNS
    ========================= */

    const renderGoodSigns = (
        result
    ) => {
        const signs =
            result?.goodSigns || [];

        if (signs.length === 0) {
            return (
                <section className="verification-section">
                    <h3>
                        👍 Good Signs
                    </h3>

                    <p>
                        No positive verification
                        signals were confirmed yet.
                    </p>
                </section>
            );
        }

        return (
            <section className="verification-section">
                <h3>
                    👍 Good Signs
                </h3>

                <ul className="good-signs-list">
                    {signs.map(
                        (sign, index) => (
                            <li key={index}>
                                ✓ {sign}
                            </li>
                        )
                    )}
                </ul>
            </section>
        );
    };

    /* =========================
       WARNINGS
    ========================= */

    const renderWarnings = (
        result
    ) => {
        const warnings =
            result?.warnings?.length > 0
                ? result.warnings
                : result?.riskIndicators ||
                  [];

        if (warnings.length === 0) {
            return (
                <section className="verification-section">
                    <h3>
                        ⚠️ Things to Check
                    </h3>

                    <div className="no-warning-box">
                        ✅ No major warning signs
                        were detected.
                    </div>
                </section>
            );
        }

        return (
            <section className="verification-section">
                <h3>
                    ⚠️ Things to Check
                </h3>

                <ul className="warning-list">
                    {warnings.map(
                        (
                            warning,
                            index
                        ) => (
                            <li key={index}>
                                ⚠ {warning}
                            </li>
                        )
                    )}
                </ul>
            </section>
        );
    };

    /* =========================
       VERIFICATION RESULT
    ========================= */

    const renderUserVerificationResult = (
        result
    ) => {
        if (!result) {
            return null;
        }

        return (
            <div className="verification-result">
                <h2>
                    🔎 Verification Result
                </h2>

                <div className="verification-score">
                    <span>
                        Trust Score
                    </span>

                    <strong>
                        {result.trustScore}/100
                    </strong>
                </div>

                <div
                    className={`risk-badge ${getRiskClass(
                        result.riskLevel
                    )}`}
                >
                    {result.riskLevel} RISK
                </div>

                {renderAvailablePlatforms(
                    result
                )}

                {renderGoodSigns(
                    result
                )}

                {renderWarnings(
                    result
                )}

                <section className="verification-section">
                    <h3>
                        🏢 Company
                    </h3>

                    {renderCompanyVerification(
                        result.companyVerification
                    )}
                </section>

                {result.opportunityIdentity && (
                    <section className="verification-section opportunity-identity-section">
                        <h3>
                            🔐 Opportunity Identity
                        </h3>

                        <div className="identity-card">
                            <div className="identity-row">
                                <span>
                                    Fingerprint
                                </span>

                                <strong>
                                    {
                                        result
                                            .opportunityIdentity
                                            .fingerprintId ||
                                        "Not generated"
                                    }
                                </strong>
                            </div>

                            <div className="identity-row">
                                <span>
                                    Similar opportunities checked
                                </span>

                                <strong>
                                    {
                                        result
                                            .opportunityIdentity
                                            .similarOpportunityCount ??
                                        0
                                    }
                                </strong>
                            </div>

                            <div className="identity-row">
                                <span>
                                    Similarity with previous submissions
                                </span>

                                <strong>
                                    {
                                        result
                                            .opportunityIdentity
                                            .similarityScore ??
                                        0
                                    }
                                    %
                                </strong>
                            </div>

                            {result
                                .opportunityIdentity
                                .warning ? (
                                <div className="identity-warning">
                                    ⚠️{" "}
                                    {
                                        result
                                            .opportunityIdentity
                                            .warning
                                    }
                                </div>
                            ) : (
                                <div className="identity-safe">
                                    ✓ No similar opportunity found
                                </div>
                            )}
                        </div>
                    </section>
                )}

                <section className="recommendation-section">
                    <h3>
                        💡 Final Recommendation
                    </h3>

                    <div className="recommendation-box">
                        {result.recommendation ||
                            "Review the opportunity carefully before applying."}
                    </div>
                </section>
            </div>
        );
    };

    /* =========================
       LOGIN
    ========================= */

    if (page === "login") {
        return (
            <Login
                onLogin={handleLogin}
                onRegister={() =>
                    setPage("register")
                }
                onForgotPassword={() =>
                    setPage("forgot-password")
                }
            />
        );
    }

    /* =========================
       FORGOT PASSWORD
    ========================= */

    if (page === "forgot-password") {
        return (
            <ForgotPassword
                onBack={() =>
                    setPage("login")
                }
                onReset={(token) => {
                    setResetToken(token);
                    setPage("reset-password");
                }}
            />
        );
    }

    /* =========================
       RESET PASSWORD
    ========================= */

    if (page === "reset-password") {
        return (
            <ResetPassword
                token={resetToken}
                onLogin={() =>
                    setPage("login")
                }
            />
        );
    }

    /* =========================
       REGISTER
    ========================= */

    if (page === "register") {
        return (
            <Register
                onLogin={() =>
                    setPage("login")
                }
            />
        );
    }

    /* =========================
       FULL VERIFICATION REPORT
    ========================= */

    if (
        page === "verification-reports" &&
        selectedReport
    ) {
        return (
            <div className="app">
                <nav className="navbar">
                    <div className="logo">
                        🛡️ StudentShield
                    </div>

                    <div className="nav-links">
                        <span
                            onClick={() => {
                                setSelectedReport(null);
                                setPage(
                                    "verification-reports"
                                );
                            }}
                        >
                            ← My Reports
                        </span>

                        <span className="welcome-user">
                            Hi, {user?.name}
                        </span>

                        <button
                            className="login-btn"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </nav>

                <main className="reports-page">
                    <div className="reports-container">
                        <div className="full-report">
                            <button
                                className="back-btn"
                                onClick={() =>
                                    setSelectedReport(
                                        null
                                    )
                                }
                            >
                                ← Back to Reports
                            </button>

                            <div className="full-report-card">
                                <h1>
                                    🔎 Verification Report
                                </h1>

                                <div className="full-report-title">
                                    <h2>
                                        {
                                            selectedReport
                                                .opportunity
                                                ?.title ||
                                            "Untitled Opportunity"
                                        }
                                    </h2>

                                    <p>
                                        🏢{" "}
                                        {
                                            selectedReport
                                                .opportunity
                                                ?.organization ||
                                            "Unknown Organization"
                                        }
                                    </p>
                                </div>

                                {renderUserVerificationResult(
                                    selectedReport
                                )}

                                <section className="report-section">
                                    <h3>
                                        📝 Opportunity Details
                                    </h3>

                                    <p>
                                        {
                                            selectedReport
                                                .opportunity
                                                ?.description ||
                                            "No description available."
                                        }
                                    </p>
                                </section>

                                <p className="report-date">
                                    Analyzed on{" "}
                                    {new Date(
                                        selectedReport.createdAt
                                    ).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    /* =========================
       VERIFICATION REPORTS
    ========================= */

    if (
        page === "verification-reports"
    ) {
        return (
            <div className="app">
                <nav className="navbar">
                    <div className="logo">
                        🛡️ StudentShield
                    </div>

                    <div className="nav-links">
                        <span
                            onClick={() =>
                                setPage("dashboard")
                            }
                        >
                            Home
                        </span>

                        <span className="welcome-user">
                            Hi, {user?.name}
                        </span>

                        <button
                            className="login-btn"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </nav>

                <main className="reports-page">
                    <div className="reports-container">
                        <div className="reports-header">
                            <div>
                                <h1>
                                    📋 My Verification Reports
                                </h1>

                                <p>
                                    View opportunities
                                    you have analyzed
                                    with StudentShield.
                                </p>
                            </div>

                            <button
                                className="verify-btn"
                                onClick={() => {
                                    setVerificationResult(
                                        null
                                    );

                                    setVerifyForm({
                                        title: "",
                                        organization: "",
                                        officialWebsite: "",
                                        applicationLink: "",
                                        email: "",
                                        description: "",
                                        registrationFee: 0
                                    });

                                    setPage("verify");
                                }}
                            >
                                🔍 Verify New Opportunity
                            </button>
                        </div>

                        {reportsLoading ? (
                            <div className="reports-loading">
                                🔄 Loading reports...
                            </div>
                        ) : verificationReports.length ===
                          0 ? (
                            <div className="no-reports">
                                <div className="no-reports-icon">
                                    🛡️
                                </div>

                                <h2>
                                    No verification reports yet
                                </h2>

                                <p>
                                    Analyze an opportunity
                                    to create your first
                                    safety report.
                                </p>

                                <button
                                    className="verify-btn"
                                    onClick={() =>
                                        setPage("verify")
                                    }
                                >
                                    🔍 Verify Opportunity
                                </button>
                            </div>
                        ) : (
                            <div className="reports-list">
                                {verificationReports.map(
                                    (report) => (
                                        <div
                                            className="report-card"
                                            key={report._id}
                                        >
                                            <div className="report-card-top">
                                                <div>
                                                    <h2>
                                                        {
                                                            report
                                                                .opportunity
                                                                ?.title ||
                                                            "Untitled Opportunity"
                                                        }
                                                    </h2>

                                                    <p>
                                                        {
                                                            report
                                                                .opportunity
                                                                ?.organization ||
                                                            "Unknown Organization"
                                                        }
                                                    </p>
                                                </div>

                                                <span
                                                    className={`risk-badge ${getRiskClass(
                                                        report.riskLevel
                                                    )}`}
                                                >
                                                    {
                                                        report.riskLevel
                                                    }
                                                </span>
                                            </div>

                                            <div className="report-score">
                                                <span>
                                                    Trust Score
                                                </span>

                                                <strong>
                                                    {
                                                        report.trustScore
                                                    }
                                                    /100
                                                </strong>
                                            </div>

                                            <div className="report-date">
                                                Analyzed on{" "}
                                                {new Date(
                                                    report.createdAt
                                                ).toLocaleDateString()}
                                            </div>

                                            <button
                                                className="view-report-btn"
                                                onClick={() =>
                                                    handleViewVerificationReport(
                                                        report._id
                                                    )
                                                }
                                            >
                                                View Full Report →
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    /* =========================
       VERIFY PAGE
    ========================= */

    if (page === "verify") {
        return (
            <div className="app">
                <nav className="navbar">
                    <div className="logo">
                        🛡️ StudentShield
                    </div>

                    <div className="nav-links">
                        <span
                            onClick={() =>
                                setPage("dashboard")
                            }
                        >
                            Home
                        </span>

                        <span
                            onClick={() => {
                                setSelectedReport(null);
                                setPage(
                                    "verification-reports"
                                );
                                fetchVerificationReports();
                            }}
                        >
                            📋 My Reports
                        </span>

                        <span className="welcome-user">
                            Hi, {user?.name}
                        </span>

                        <button
                            className="login-btn"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </nav>

                <main className="verify-page">
                    <div className="verify-card">
                        <h1>
                            🛡️ Verify an Opportunity
                        </h1>

                        <p className="verify-subtitle">
                            Received an opportunity
                            from Gmail, WhatsApp,
                            LinkedIn or somewhere else?
                            Check its risk before
                            applying.
                        </p>

                        <form
                            onSubmit={
                                handleVerifyOpportunity
                            }
                        >
                            <label>
                                Opportunity Title
                            </label>

                            <input
                                type="text"
                                placeholder="Example: Software Developer Internship"
                                value={
                                    verifyForm.title
                                }
                                onChange={(e) =>
                                    setVerifyForm({
                                        ...verifyForm,
                                        title:
                                            e.target.value
                                    })
                                }
                            />

                            <label>
                                Organization
                            </label>

                            <input
                                type="text"
                                placeholder="Company / Organization name"
                                value={
                                    verifyForm.organization
                                }
                                onChange={(e) =>
                                    setVerifyForm({
                                        ...verifyForm,
                                        organization:
                                            e.target.value
                                    })
                                }
                            />

                            <label>
                                Official Website
                            </label>

                            <input
                                type="url"
                                placeholder="https://company.com"
                                value={
                                    verifyForm.officialWebsite
                                }
                                onChange={(e) =>
                                    setVerifyForm({
                                        ...verifyForm,
                                        officialWebsite:
                                            e.target.value
                                    })
                                }
                            />

                            <label>
                                Application Link
                            </label>

                            <input
                                type="url"
                                placeholder="https://..."
                                value={
                                    verifyForm.applicationLink
                                }
                                onChange={(e) =>
                                    setVerifyForm({
                                        ...verifyForm,
                                        applicationLink:
                                            e.target.value
                                    })
                                }
                            />

                            <label>
                                Application Email
                            </label>

                            <input
                                type="email"
                                placeholder="example@company.com"
                                value={
                                    verifyForm.email
                                }
                                onChange={(e) =>
                                    setVerifyForm({
                                        ...verifyForm,
                                        email:
                                            e.target.value
                                    })
                                }
                            />

                            <label>
                                Registration Fee
                            </label>

                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={
                                    verifyForm.registrationFee
                                }
                                onChange={(e) =>
                                    setVerifyForm({
                                        ...verifyForm,
                                        registrationFee:
                                            e.target.value
                                    })
                                }
                            />

                            <label>
                                Opportunity Details
                            </label>

                            <textarea
                                rows="6"
                                placeholder="Paste the opportunity message/details you received..."
                                value={
                                    verifyForm.description
                                }
                                onChange={(e) =>
                                    setVerifyForm({
                                        ...verifyForm,
                                        description:
                                            e.target.value
                                    })
                                }
                            />

                            <button
                                type="submit"
                                className="verify-btn"
                                disabled={
                                    verificationLoading
                                }
                            >
                                {verificationLoading
                                    ? "🔍 Analyzing..."
                                    : "🔍 Analyze Risk"}
                            </button>
                        </form>

                        {verificationResult &&
                            renderUserVerificationResult(
                                verificationResult
                            )}
                    </div>
                </main>
            </div>
        );
    }

    /* =========================
       DETAILS PAGE
    ========================= */

    if (
        page === "details" &&
        selectedOpportunity
    ) {
        return (
            <div className="app">
                <nav className="navbar">
                    <div className="logo">
                        🛡️ StudentShield
                    </div>

                    <div className="nav-links">
                        <span
                            onClick={() =>
                                setPage("dashboard")
                            }
                        >
                            Home
                        </span>

                        <span
                            onClick={() =>
                                setPage("dashboard")
                            }
                        >
                            Opportunities
                        </span>

                        <span
                            onClick={() => {
                                if (!user) {
                                    alert(
                                        "Please login first"
                                    );
                                    setPage("login");
                                    return;
                                }

                                setPage("saved");
                            }}
                        >
                            Saved
                        </span>

                        {user && (
                            <>
                                <span className="welcome-user">
                                    Hi, {user.name}
                                </span>

                                {user.role ===
                                    "student" && (
                                    <button
                                        className="login-btn"
                                        onClick={() => {
                                            setSelectedReport(
                                                null
                                            );

                                            setPage(
                                                "verification-reports"
                                            );

                                            fetchVerificationReports();
                                        }}
                                    >
                                        📋 My Reports
                                    </button>
                                )}

                                <button
                                    className="login-btn"
                                    onClick={
                                        handleLogout
                                    }
                                >
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </nav>

                <main className="details-page">
                    <button
                        className="back-btn"
                        onClick={() =>
                            setPage("dashboard")
                        }
                    >
                        ← Back to Opportunities
                    </button>

                    <div className="details-card">
                        <div className="details-header">
                            <div>
                                <span className="type-badge">
                                    {
                                        selectedOpportunity.type
                                    }
                                </span>

                                <h1>
                                    {
                                        selectedOpportunity.title
                                    }
                                </h1>

                                <p className="organization">
                                    🏢{" "}
                                    {
                                        selectedOpportunity.organization
                                    }
                                </p>
                            </div>

                            <span
                                className={`risk-badge ${getRiskClass(
                                    selectedOpportunity.riskLevel
                                )}`}
                            >
                                {
                                    selectedOpportunity.riskLevel
                                }
                            </span>
                        </div>

                        <div className="details-score">
                            <div>
                                <small>
                                    Trust Score
                                </small>

                                <strong>
                                    {
                                        selectedOpportunity.trustScore
                                    }/100
                                </strong>
                            </div>

                            <div>
                                <small>
                                    Community Reports
                                </small>

                                <strong>
                                    👥{" "}
                                    {
                                        selectedOpportunity.reportCount ||
                                        0
                                    }
                                </strong>
                            </div>

                            <div>
                                <small>
                                    Registration Fee
                                </small>

                                <strong>
                                    ₹
                                    {
                                        selectedOpportunity.registrationFee
                                    }
                                </strong>
                            </div>
                        </div>

                        <section className="details-section">
                            <h2>
                                📝 Description
                            </h2>

                            <p>
                                {
                                    selectedOpportunity.description ||
                                    "No description provided."
                                }
                            </p>
                        </section>

                        <section className="details-section">
                            <h2>
                                ⚠️ Risk Information
                            </h2>

                            {selectedOpportunity
                                .riskIndicators &&
                            selectedOpportunity
                                .riskIndicators
                                .length > 0 ? (
                                <ul className="details-risk-list">
                                    {selectedOpportunity
                                        .riskIndicators
                                        .map(
                                            (
                                                indicator,
                                                index
                                            ) => (
                                                <li
                                                    key={
                                                        index
                                                    }
                                                >
                                                    {
                                                        indicator
                                                    }
                                                </li>
                                            )
                                        )}
                                </ul>
                            ) : (
                                <p>
                                    No risk indicators
                                    detected.
                                </p>
                            )}
                        </section>

                        <section className="details-section">
                            <h2>
                                📅 Application Deadline
                            </h2>

                            <p>
                                {
                                    selectedOpportunity.deadline
                                        ? new Date(
                                            selectedOpportunity.deadline
                                        ).toLocaleDateString()
                                        : "No deadline specified"
                                }
                            </p>
                        </section>

                        <section className="details-section">
                            <h2>
                                🌐 Official Website
                            </h2>

                            <p>
                                {
                                    selectedOpportunity
                                        .officialWebsite ||
                                    "Not provided"
                                }
                            </p>
                        </section>

                        <div className="details-actions">
                            <button
                                className="save-btn"
                                onClick={() =>
                                    handleSave(
                                        selectedOpportunity
                                            ._id
                                    )
                                }
                            >
                                💾 Save
                            </button>

                            <button
                                className="report-btn"
                                onClick={() =>
                                    handleReport(
                                        selectedOpportunity
                                            ._id
                                    )
                                }
                            >
                                🚩 Report
                            </button>

                            {getDeadlineStatus(
                                selectedOpportunity
                                    .deadline
                            ) === "Expired" ? (
                                <button
                                    className="apply-btn"
                                    disabled
                                >
                                    🔴 Application Closed
                                </button>
                            ) : (
                                <a
                                    className="apply-btn"
                                    href={
                                        selectedOpportunity
                                            .applicationLink
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Apply →
                                </a>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    /* =========================
       SAVED PAGE
    ========================= */

    if (page === "saved") {
        return (
            <div className="app">
                <nav className="navbar">
                    <div className="logo">
                        🛡️ StudentShield
                    </div>

                    <div className="nav-links">
                        <span
                            onClick={() =>
                                setPage("dashboard")
                            }
                        >
                            Home
                        </span>

                        <span
                            onClick={() =>
                                setPage("dashboard")
                            }
                        >
                            Opportunities
                        </span>

                        <span className="welcome-user">
                            Hi, {user?.name}
                        </span>

                        {user?.role ===
                            "student" && (
                            <button
                                className="login-btn"
                                onClick={() => {
                                    setSelectedReport(
                                        null
                                    );

                                    setPage(
                                        "verification-reports"
                                    );

                                    fetchVerificationReports();
                                }}
                            >
                                📋 My Reports
                            </button>
                        )}

                        <button
                            className="login-btn"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </nav>

                <main className="content">
                    <div className="section-header">
                        <div>
                            <h2>
                                💾 Saved Opportunities
                            </h2>

                            <p>
                                Opportunities you
                                saved for later.
                            </p>
                        </div>

                        <button
                            className="login-btn"
                            onClick={() =>
                                setPage("dashboard")
                            }
                        >
                            ← Back
                        </button>
                    </div>

                    {savedLoading ? (
                        <div className="loading">
                            Loading saved
                            opportunities...
                        </div>
                    ) : savedOpportunities.length ===
                      0 ? (
                        <div className="empty">
                            <h3>
                                No saved opportunities
                                yet.
                            </h3>

                            <p>
                                Go to Opportunities
                                and save something
                                for later.
                            </p>
                        </div>
                    ) : (
                        <div className="opportunity-grid">
                            {savedOpportunities.map(
                                (opportunity) => (
                                    <div
                                        className="opportunity-card"
                                        key={
                                            opportunity._id
                                        }
                                    >
                                        <div className="card-top">
                                            <span className="type-badge">
                                                {
                                                    opportunity.type
                                                }
                                            </span>

                                            <span
                                                className={`risk-badge ${getRiskClass(
                                                    opportunity.riskLevel
                                                )}`}
                                            >
                                                {
                                                    opportunity.riskLevel
                                                }
                                            </span>
                                        </div>

                                        <h3>
                                            {
                                                opportunity.title
                                            }
                                        </h3>

                                        <p className="organization">
                                            {
                                                opportunity.organization
                                            }
                                        </p>

                                        <p className="description">
                                            {
                                                opportunity.description ||
                                                "Opportunity details available on the application page."
                                            }
                                        </p>

                                        <div className="score-section">
                                            <div>
                                                <small>
                                                    Trust Score
                                                </small>

                                                <strong>
                                                    {
                                                        opportunity.trustScore
                                                    }/100
                                                </strong>
                                            </div>

                                            <div>
                                                <small>
                                                    Risk Level
                                                </small>

                                                <strong>
                                                    {
                                                        opportunity.riskLevel
                                                    }
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="deadline-status">
                                            📅 Deadline:{" "}
                                            {
                                                getDeadlineStatus(
                                                    opportunity.deadline
                                                )
                                            }
                                        </div>

                                        <div className="card-actions">
                                            {getDeadlineStatus(
                                                opportunity.deadline
                                            ) ===
                                            "Expired" ? (
                                                <button
                                                    className="apply-btn"
                                                    disabled
                                                >
                                                    🔴 Application Closed
                                                </button>
                                            ) : (
                                                <a
                                                    className="apply-btn"
                                                    href={
                                                        opportunity.applicationLink
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Apply →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </main>
            </div>
        );
    }

    /* =========================
       ADMIN
    ========================= */

    if (page === "admin") {
        return (
            <AdminDashboard
                user={user}
                onBack={() =>
                    setPage("dashboard")
                }
            />
        );
    }

    /* =========================
       MAIN DASHBOARD
    ========================= */

    return (
        <div className="app">
            <nav className="navbar">
                <div className="logo">
                    🛡️ StudentShield
                </div>

                <div className="nav-links">
                    <span
                        onClick={() =>
                            setPage("dashboard")
                        }
                    >
                        Home
                    </span>

                    <span
                        onClick={() => {
                            setPage("dashboard");

                            setTimeout(() => {
                                window.scrollTo({
                                    top: 0,
                                    behavior: "smooth"
                                });
                            }, 100);
                        }}
                    >
                        Opportunities
                    </span>

                    <span
                        onClick={() => {
                            if (!user) {
                                setPage("login");
                                return;
                            }

                            setPage("saved");
                        }}
                    >
                        Saved
                    </span>

                    <span>
                        About
                    </span>

                    {user ? (
                        <>
                            <span className="welcome-user">
                                Hi, {user.name}
                            </span>

                            {user.role ===
                                "student" && (
                                <button
                                    className="login-btn"
                                    onClick={() => {
                                        setSelectedReport(
                                            null
                                        );

                                        setPage(
                                            "verification-reports"
                                        );

                                        fetchVerificationReports();
                                    }}
                                >
                                    📋 My Reports
                                </button>
                            )}

                            {user.role ===
                                "admin" && (
                                <button
                                    className="login-btn"
                                    onClick={
                                        handleAdminDashboard
                                    }
                                >
                                    Admin Dashboard
                                </button>
                            )}

                            <button
                                className="login-btn"
                                onClick={
                                    handleLogout
                                }
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <button
                            className="login-btn"
                            onClick={() =>
                                setPage("login")
                            }
                        >
                            Login
                        </button>
                    )}
                </div>
            </nav>

            {user &&
                user.role === "student" && (
                    <div className="verify-banner">
                        <div>
                            <h2>
                                🛡️ Got an opportunity?
                            </h2>

                            <p>
                                Check its risk before
                                you apply.
                            </p>
                        </div>

                        <button
                            className="verify-btn"
                            onClick={() => {
                                setVerificationResult(
                                    null
                                );

                                setVerifyForm({
                                    title: "",
                                    organization: "",
                                    officialWebsite: "",
                                    applicationLink: "",
                                    email: "",
                                    description: "",
                                    registrationFee: 0
                                });

                                setPage("verify");
                            }}
                        >
                            🔍 Verify Opportunity
                        </button>
                    </div>
                )}

            <section className="hero">
                <div className="hero-content">
                    <h1>
                        Find Opportunities.
                        <br />

                        <span>
                            Stay Protected.
                        </span>
                    </h1>

                    <p>
                        Discover internships, jobs,
                        scholarships and hackathons
                        with transparent risk
                        information.
                    </p>

                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search opportunities or organizations..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />

                        <button>
                            🔎 Search
                        </button>
                    </div>
                </div>
            </section>

            <main className="content">
                <div className="section-header">
                    <div>
                        <h2>
                            Latest Opportunities
                        </h2>

                        <p>
                            Explore opportunities
                            with community-powered
                            risk awareness.
                        </p>
                    </div>

                    <select
                        value={typeFilter}
                        onChange={(e) =>
                            setTypeFilter(
                                e.target.value
                            )
                        }
                    >
                        <option value="All">
                            All Types
                        </option>

                        <option value="Internship">
                            Internship
                        </option>

                        <option value="Job">
                            Job
                        </option>

                        <option value="Scholarship">
                            Scholarship
                        </option>

                        <option value="Hackathon">
                            Hackathon
                        </option>

                        <option value="Course">
                            Course
                        </option>
                    </select>
                </div>

                {loading ? (
                    <div className="loading">
                        Loading opportunities...
                    </div>
                ) : filteredOpportunities.length ===
                  0 ? (
                    <div className="empty">
                        No opportunities found.
                    </div>
                ) : (
                    <div className="opportunity-grid">
                        {filteredOpportunities.map(
                            (opportunity) => (
                                <div
                                    className="opportunity-card"
                                    key={
                                        opportunity._id
                                    }
                                >
                                    <div className="card-top">
                                        <span className="type-badge">
                                            {
                                                opportunity.type
                                            }
                                        </span>

                                        <span
                                            className={`risk-badge ${getRiskClass(
                                                opportunity.riskLevel
                                            )}`}
                                        >
                                            {
                                                opportunity.riskLevel
                                            }
                                        </span>
                                    </div>

                                    <h3>
                                        {
                                            opportunity.title
                                        }
                                    </h3>

                                    <p className="organization">
                                        {
                                            opportunity.organization
                                        }
                                    </p>

                                    <p className="description">
                                        {
                                            opportunity.description ||
                                            "Opportunity details available on the application page."
                                        }
                                    </p>

                                    <div className="score-section">
                                        <div>
                                            <small>
                                                Trust Score
                                            </small>

                                            <strong>
                                                {
                                                    opportunity.trustScore
                                                }/100
                                            </strong>
                                        </div>

                                        <div>
                                            <small>
                                                Community Reports
                                            </small>

                                            <strong>
                                                👥{" "}
                                                {
                                                    opportunity.reportCount ||
                                                    0
                                                }
                                            </strong>
                                        </div>
                                    </div>

                                    {opportunity
                                        .riskIndicators &&
                                    opportunity
                                        .riskIndicators
                                        .length > 0 && (
                                        <div className="risk-indicators">
                                            <h4>
                                                ⚠ Risk Indicators
                                            </h4>

                                            <ul>
                                                {opportunity
                                                    .riskIndicators
                                                    .map(
                                                        (
                                                            indicator,
                                                            index
                                                        ) => (
                                                            <li
                                                                key={
                                                                    index
                                                                }
                                                            >
                                                                {
                                                                    indicator
                                                                }
                                                            </li>
                                                        )
                                                    )}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="deadline-status">
                                        📅 Deadline:{" "}
                                        {
                                            getDeadlineStatus(
                                                opportunity.deadline
                                            )
                                        }
                                    </div>

                                    <div className="card-actions">
                                        <button
                                            className="details-btn"
                                            onClick={() =>
                                                handleViewDetails(
                                                    opportunity
                                                )
                                            }
                                        >
                                            👁 View Details
                                        </button>

                                        <button
                                            className="save-btn"
                                            onClick={() =>
                                                handleSave(
                                                    opportunity._id
                                                )
                                            }
                                        >
                                            💾 Save
                                        </button>

                                        <button
                                            className="report-btn"
                                            onClick={() =>
                                                handleReport(
                                                    opportunity._id
                                                )
                                            }
                                        >
                                            🚩 Report
                                        </button>

                                        {getDeadlineStatus(
                                            opportunity.deadline
                                        ) ===
                                        "Expired" ? (
                                            <button
                                                className="apply-btn"
                                                disabled
                                            >
                                                🔴 Application Closed
                                            </button>
                                        ) : (
                                            <a
                                                className="apply-btn"
                                                href={
                                                    opportunity.applicationLink
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Apply →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </main>

            <footer>
                <p>
                    🛡️ StudentShield — Helping
                    students make informed
                    opportunity decisions.
                </p>
            </footer>
        </div>
    );
}

export default App;
