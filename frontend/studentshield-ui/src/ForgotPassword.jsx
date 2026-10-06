import { useState } from "react";
import axios from "axios";


function ForgotPassword({ onBack, onReset  }) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            alert("Please enter your email");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                "http://localhost:5000/api/auth/forgot-password",
                {
                    email
                }
            );

            const token = response.data.resetToken;

            localStorage.setItem(
                "resetToken",
                token
            );

            alert(
                "Reset token generated successfully"
            );

          onReset(token);

        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Failed to generate reset token"
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

                <h1>Forgot Password?</h1>

                <p className="auth-subtitle">
                    Enter your registered email to reset
                    your password.
                </p>

                <form onSubmit={handleSubmit}>

                    <label>Email</label>

                    <input
                        type="email"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                    />

                    <button
                        type="submit"
                        className="auth-btn"
                        disabled={loading}
                    >
                        {loading
                            ? "Generating..."
                            : "Generate Reset Link"}
                    </button>

                </form>

                <p className="auth-switch">
                    Remember your password?{" "}

                    <button
                        type="button"
                        onClick={onBack}
                    >
                        Back to Login
                    </button>
                </p>

            </div>
        </div>
    );
}

export default ForgotPassword;