import React, { useState } from "react";
import './ResetPassword.css';
import axios from "axios";

const EnterResetCode = () => {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            const res = await axios.post("http://localhost:8000/reset-password", {
                email,
                code,
                new_password: newPassword
            });
            setMessage(res.data.msg);
            setEmail("");
            setCode("");
            setNewPassword("");
        } catch (err) {
            console.error(err);
            setError("❌ Kod nieprawidłowy lub wygasł.");
        }
    };

    return (
        <div className="reset-password-container">
            <div className="reset-password-form">
                <h1>Wprowadź kod weryfikacyjny</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Kod weryfikacyjny</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Nowe hasło</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="button-group">
                        <button type="submit">Zmień hasło</button>
                    </div>
                </form>

                {message && <p style={{ color: "green" }}>{message}</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
        </div>
    );
};

export default EnterResetCode;
