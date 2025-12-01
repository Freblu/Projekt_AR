import React, { useState } from "react";
import './ResetPassword.css';
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            const res = await axios.post("http://localhost:8000/forgot-password", { email });
            setMessage(res.data.msg);
            setEmail("");
            // Automatyczne przekierowanie do wpisania kodu
            setTimeout(() => navigate("/enter-reset-code"), 1500);
        } catch (err) {
            console.error(err);
            setError("❌ Nie udało się wysłać kodu. Sprawdź adres e-mail.");
        }
    };

    return (
        <div className="reset-password-container">
            <div className="reset-password-form">
                <h1>Resetowanie hasła</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Adres e-mail</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="button-group">
                        <button type="submit">Wyślij kod weryfikacyjny</button>
                    </div>
                </form>

                {message && <p style={{ color: "green" }}>{message}</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
        </div>
    );
};

export default ResetPassword;
