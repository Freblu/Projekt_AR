import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './Register.css';
const APP_URL = import.meta.env.VITE_API_URL;

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Hasła muszą się zgadzać");
      return;
    }

    try {
      const response = await fetch(`${APP_URL}/register`, {


        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/login");
      } else {
        setError(data.error || "Wystąpił błąd");
      }
    } catch (err) {
      console.error("Błąd połączenia z backendem: ", err);
      setError("Wystąpił błąd połączenia z serwerem");
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>Rejestracja</h1>
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
          <div className="input-group">
            <label htmlFor="password">Hasło</label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <small onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>
              {showPassword ? "Ukryj" : "Pokaż"} hasło
            </small>
          </div>
          <div className="input-group">
            <label htmlFor="confirmPassword">Potwierdź hasło</label>
            <input
              type={showConfirm ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <small onClick={() => setShowConfirm(!showConfirm)} style={{ cursor: 'pointer' }}>
              {showConfirm ? "Ukryj" : "Pokaż"} hasło
            </small>
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="button-group">
            <button type="submit">Zarejestruj się</button>
          </div>
        </form>

        <div className="additional-options">
          <p>Masz już konto? <a href="/login">Zaloguj się</a></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
