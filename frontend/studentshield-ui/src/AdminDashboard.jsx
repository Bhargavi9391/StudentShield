    import { useEffect,useState } from "react";
    import axios from "axios";

    function AdminDashboard({ user, onBack }) {
        const [form, setForm] = useState({
            title: "",
            organization: "",
            type: "Internship",
            officialWebsite: "",
            email: "",
            registrationFee: 0,
            applicationLink: "",
            deadline: "",
            description: ""
        });

        const [loading, setLoading] = useState(false);
        const [result, setResult] = useState(null);
        const [reports, setReports] = useState([]);
        const [reportsLoading, setReportsLoading] = useState(false);

        const [opportunities, setOpportunities] = useState([]);
    const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
    const [editingOpportunity, setEditingOpportunity] = useState(null);

    const fetchOpportunities = async () => {
        try {
            setOpportunitiesLoading(true);

            const response = await axios.get(
                "http://localhost:5000/api/opportunities"
            );

            setOpportunities(response.data);
        } catch (error) {
            console.error(
                "Failed to fetch opportunities:",
                error
            );
        } finally {
            setOpportunitiesLoading(false);
        }
    };
        const fetchReports = async () => {
        try {
            setReportsLoading(true);

            const token = localStorage.getItem("token");

            const response = await axios.get(
                "http://localhost:5000/api/reports/admin/all",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setReports(response.data);
        } catch (error) {
            console.error(
                "Failed to fetch reports:",
                error
            );
        } finally {
            setReportsLoading(false);
        }
    };
    const handleDeleteOpportunity = async (opportunityId) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this opportunity?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const token = localStorage.getItem("token");

            const response = await axios.delete(
                `http://localhost:5000/api/opportunities/${opportunityId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert(response.data.message);

            fetchOpportunities();
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Failed to delete opportunity"
            );
        }
    };
    const handleEditOpportunity = (opportunity) => {
    setEditingOpportunity(opportunity);

    setForm({
        title: opportunity.title || "",
        organization: opportunity.organization || "",
        type: opportunity.type || "Internship",
        officialWebsite: opportunity.officialWebsite || "",
        email: opportunity.email || "",
        registrationFee: opportunity.registrationFee || 0,
        applicationLink: opportunity.applicationLink || "",
        deadline: opportunity.deadline
            ? opportunity.deadline.split("T")[0]
            : "",
        description: opportunity.description || ""
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
};
    const updateReportStatus = async (reportId, status) => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.patch(
                `http://localhost:5000/api/reports/admin/${reportId}/status`,
                {
                    status
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert(response.data.message);

            fetchReports();
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Failed to update report"
            );
        }
    };


    useEffect(() => {
        if (user?.role === "admin") {
            fetchReports();
            fetchOpportunities();
        }
    }, [user]);

        const handleChange = (e) => {
            const { name, value } = e.target;

            setForm({
                ...form,
                [name]: value
            });
        };

        const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        setLoading(true);
        setResult(null);

        const token = localStorage.getItem("token");

        if (!token) {
            alert("Please login first");
            return;
        }

        let response;

        if (editingOpportunity) {
            response = await axios.put(
                `http://localhost:5000/api/opportunities/${editingOpportunity._id}`,
                {
                    ...form,
                    registrationFee:
                        Number(form.registrationFee)
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("Opportunity updated successfully");

            setEditingOpportunity(null);
        } else {
            response = await axios.post(
                "http://localhost:5000/api/opportunities",
                {
                    ...form,
                    registrationFee:
                        Number(form.registrationFee)
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("Opportunity added successfully");

            setResult(response.data.opportunity);
        }

        setForm({
            title: "",
            organization: "",
            type: "Internship",
            officialWebsite: "",
            email: "",
            registrationFee: 0,
            applicationLink: "",
            deadline: "",
            description: ""
        });

        fetchOpportunities();

    } catch (error) {
        alert(
            error.response?.data?.message ||
            "Failed to save opportunity"
        );
    } finally {
        setLoading(false);
    }
};
        

        return (
            <div className="admin-page">
                <div className="admin-header">
                    <div>
                        <h1>🛡️ StudentShield Admin</h1>
                        <p>
                            Add and verify student opportunities
                        </p>
                    </div>

                    <button
                        className="login-btn"
                        onClick={onBack}
                    >
                        Back to Dashboard
                    </button>
                </div>

                <div className="admin-container">
                    <div className="admin-card">
                        {editingOpportunity
        ? "Edit Opportunity"
        : "Add Opportunity"}

                        <p className="admin-description">
                            The opportunity will be automatically
                            checked by the Java verification service.
                        </p>

                        <form 
                        className="opportunity-form"
                        onSubmit={handleSubmit}>
                            <label>Opportunity Title</label>

                            <input
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="Example: Java Full Stack Internship"
                                required
                            />

                            <label>Organization</label>

                            <input
                                name="organization"
                                value={form.organization}
                                onChange={handleChange}
                                placeholder="Example: ABC Technologies"
                                required
                            />

                            <label>Opportunity Type</label>

                            <select
                                name="type"
                                value={form.type}
                                onChange={handleChange}
                            >
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

                            <label>Official Website</label>

                            <input
                                name="officialWebsite"
                                value={form.officialWebsite}
                                onChange={handleChange}
                                placeholder="https://example.com"
                            />

                            <label>Organization Email</label>

                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="hr@example.com"
                            />

                            <label>Registration Fee</label>

                            <input
                                type="number"
                                name="registrationFee"
                                value={form.registrationFee}
                                onChange={handleChange}
                                min="0"
                            />

                            <label>Application Link</label>

                            <input
                                name="applicationLink"
                                value={form.applicationLink}
                                onChange={handleChange}
                                placeholder="https://example.com/apply"
                                required
                            />

                            <label>Application Deadline</label>

                            <input
                                type="date"
                                name="deadline"
                                value={form.deadline}
                                onChange={handleChange}
                            />

                            <label>Description</label>

                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Describe the opportunity..."
                                rows="5"
                            />

                            <button
                                type="submit"
                                className="admin-submit"
                                disabled={loading}
                            >
                                {loading
                                ? editingOpportunity
        ? "Updating..."
        : "Verifying..."
    : editingOpportunity
        ? "Update Opportunity"
        : "Add & Verify Opportunity"}
    
                            </button>
                        </form>
                    </div>

                    {result && (
                        <div className="verification-result">
                            <h2>Verification Result</h2>

                            <div className="result-score">
                                {result.trustScore}/100
                            </div>

                            <div
                                className={`risk-badge ${
                                    result.riskLevel === "LOW"
                                        ? "risk-low"
                                        : result.riskLevel ===
                                        "MEDIUM"
                                        ? "risk-medium"
                                        : "risk-high"
                                }`}
                            >
                                {result.riskLevel} RISK
                            </div>

                            <h3>Risk Indicators</h3>

                            {result.riskIndicators.length === 0 ? (
                                <p>
                                    No risk indicators detected.
                                </p>
                            ) : (
                                <ul>
                                    {result.riskIndicators.map(
                                        (indicator, index) => (
                                            <li key={index}>
                                                {indicator}
                                            </li>
                                        )
                                    )}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
                <div className="reports-section">
        <div className="reports-header">
            <div>
                <h2>📋 Manage Opportunities</h2>
                <p>
                    View and manage opportunities added by admin.
                </p>
            </div>

            <button
                className="refresh-btn"
                onClick={fetchOpportunities}
            >
                🔄 Refresh
            </button>
        </div>

        {opportunitiesLoading ? (
            <p className="loading">
                Loading opportunities...
            </p>
        ) : opportunities.length === 0 ? (
            <div className="no-reports">
                <p>No opportunities available.</p>
            </div>
        ) : (
            <div className="reports-list">
                {opportunities.map((opportunity) => (
                    <div
                        className="report-card"
                        key={opportunity._id}
                    >
                        <div className="report-card-top">
                            <div>
                                <h3>{opportunity.title}</h3>

                                <p>
                                    {opportunity.organization}
                                </p>
                            </div>

                            <span className="report-status">
                                {opportunity.type}
                            </span>
                        </div>

                        <div className="report-details">
                            <p>
                                <strong>Trust Score:</strong>{" "}
                                {opportunity.trustScore}/100
                            </p>

                            <p>
                                <strong>Risk Level:</strong>{" "}
                                {opportunity.riskLevel}
                            </p>

                            <p>
                                <strong>Registration Fee:</strong>{" "}
                                ₹{opportunity.registrationFee}
                            </p>

                            <p>
                                <strong>Deadline:</strong>{" "}
                                {opportunity.deadline
                                    ? new Date(
                                        opportunity.deadline
                                    ).toLocaleDateString()
                                    : "No deadline"}
                            </p>
                        </div>

                        <div className="report-actions">
    <button
        className="edit-btn"
        onClick={() =>
            handleEditOpportunity(opportunity)
        }
    >
        ✏️ Edit
    </button>

    <button
        className="dismiss-btn"
        onClick={() =>
            handleDeleteOpportunity(
                opportunity._id
            )
        }
    >
        🗑 Delete
    </button>
</div>
                    </div>
                ))}
            </div>
        )}
    </div>
    {/* Student Reports */}
                <div className="reports-section">
                    <div className="reports-header">
                        <div>
                            <h2>🚩 Student Reports</h2>
                            <p>
                                Review reports submitted by students.
                            </p>
                        </div>

                        <button
                            className="refresh-btn"
                            onClick={fetchReports}
                        >
                            🔄 Refresh
                        </button>
                    </div>

                    {reportsLoading ? (
                        <p className="loading">
                            Loading reports...
                        </p>
                    ) : reports.length === 0 ? (
                        <div className="no-reports">
                            <p>No reports submitted yet.</p>
                        </div>
                    ) : (
                        <div className="reports-list">
                            {reports.map((report) => (
                                <div
                                    className="report-card"
                                    key={report._id}
                                >
                                    <div className="report-card-top">
                                        <div>
                                            <h3>
                                                {report.opportunity?.title ||
                                                    "Opportunity"}
                                            </h3>

                                            <p>
                                                {report.opportunity?.organization ||
                                                    "Unknown organization"}
                                            </p>
                                        </div>

                                        <span className="report-status">
                                            {report.status}
                                        </span>
                                    </div>

                                    <div className="report-details">
                                        <p>
                                            <strong>Student:</strong>{" "}
                                            {report.reportedBy?.name ||
                                                "Unknown"}
                                        </p>

                                        <p>
                                            <strong>Email:</strong>{" "}
                                            {report.reportedBy?.email ||
                                                "Unknown"}
                                        </p>

                                        <p>
                                            <strong>Reason:</strong>{" "}
                                            {report.reason}
                                        </p>

                                        <p>
                                            <strong>Description:</strong>{" "}
                                            {report.description ||
                                                "No description"}
                                        </p>

                                        <p>
                                            <strong>Reported On:</strong>{" "}
                                            {new Date(
                                                report.createdAt
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="report-actions">
                                        {report.status === "pending" && (
                                            <>
                                                <button
                                                    className="edit-btn"
                                                    onClick={() =>
                                                        updateReportStatus(
                                                            report._id,
                                                            "reviewed"
                                                        )
                                                    }
                                                >
                                                    ✅ Mark Reviewed
                                                </button>

                                                <button
                                                    className="dismiss-btn"
                                                    onClick={() =>
                                                        updateReportStatus(
                                                            report._id,
                                                            "dismissed"
                                                        )
                                                    }
                                                >
                                                    ❌ Dismiss
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

        
            </div>
        );
    }

    export default AdminDashboard;