import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import './Log.css';
const APP_URL = import.meta.env.VITE_API_URL;

const Log = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
   const response = await fetch(`${APP_URL}/login`, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({ email, password }),
});




      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem("jwtToken", data.token); // ⛓️ bezpiecznie zapisany token
        onLogin(); // 🔁 aktualizacja App.jsx (ustawi loggedIn + role)
        navigate("/");
      } else {
        setError(data.error || "Wystąpił błąd logowania");
      }
    } catch (err) {
      console.error("Błąd połączenia z backendem: ", err);
      setError("Wystąpił błąd połączenia z serwerem");
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>Logowanie</h1>
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
            <small
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: "pointer" }}
            >
              {showPassword ? "Ukryj" : "Pokaż"} hasło
            </small>
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="button-group">
            <button type="submit">Zaloguj się</button>
          </div>
        </form>

        <div className="additional-options">
          <Link to="/reset-password">Zapomniałeś hasła?</Link>
          <p>
            Nie masz konta? <Link to="/register">Zarejestruj się</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Log;
