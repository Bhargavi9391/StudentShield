import { useState } from "react";
import axios from "axios";
import API_URL from "./api";
import "./index.css";


function Login({ onLogin, onRegister,onForgotPassword }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            alert("Please enter email and password");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                `${API_URL}/api/auth/login`,
                {
                    email,
                    password
                }
            );

            localStorage.setItem(
                "token",
                response.data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(response.data.user)
            );

            alert("Login successful");

            onLogin(response.data.user);
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Login failed"
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

                <h1>Welcome Back</h1>

                <p className="auth-subtitle">
                    Login to continue protecting your
                    opportunity journey.
                </p>

                <form onSubmit={handleLogin}>
                    <label>Email</label>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                    />

                    <label>Password</label>

                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />
                    <button
    type="button"
    className="forgot-password"
    onClick={onForgotPassword}
>
    Forgot Password?
</button>

                    <button
                        type="submit"
                        className="auth-btn"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="auth-switch">
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={onRegister}
                    >
                        Register
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Login;