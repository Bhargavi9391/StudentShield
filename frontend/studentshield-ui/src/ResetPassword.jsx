import { useState } from "react";
import axios from "axios";

function ResetPassword({ token, onLogin }) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            alert("Please enter both passwords");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {
            setLoading(true);

            await axios.post(
                `http://localhost:5000/api/auth/reset-password/${token}`,
                {
                    password
                }
            );

            alert("Password reset successful");

            onLogin();

        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Password reset failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">

                <div className="auth-logo">
                    🛡️ StudentShield
                </div>

                <h1>Reset Password</h1>

                <p className="auth-subtitle">
                    Enter your new password below.
                </p>

                <form onSubmit={handleSubmit}>

                    <label>New Password</label>

                    <input
                        type="password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />

                    <label>Confirm Password</label>

                    <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) =>
                            setConfirmPassword(e.target.value)
                        }
                    />

                    <button
                        type="submit"
                        className="auth-btn"
                        disabled={loading}
                    >
                        {loading
                            ? "Resetting..."
                            : "Reset Password"}
                    </button>

                </form>

            </div>
        </div>
    );
}

export default ResetPassword;