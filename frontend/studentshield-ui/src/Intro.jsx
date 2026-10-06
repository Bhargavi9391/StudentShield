
import { useEffect } from "react";
import "./Intro.css";

function Intro({ onComplete }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 4000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="intro-screen">
            <div className="intro-content">
                <div className="intro-shield">🛡️</div>

                <h1>StudentShield</h1>

                <p>Verify before you trust.</p>
            </div>
        </div>
    );
}

export default Intro;