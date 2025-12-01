import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Log from "./Log";
import Register from "./Register";
import Scene from "./Scene";
import ResetPassword from "./ResetPassword";
import AdminPanel from "./AdminPanel";
import ElementDetails from "./ElementDetails";
import CustomQRCode from "./CustomQRCode";
import Katalog from "./Katalog";
import EnterResetCode from "./EnterResetCode";
const APP_URL = import.meta.env.VITE_API_URL;

import "./App.css";

// testowe dane pierwiastków
const exampleElements = [
  { name: "Wodór", symbol: "H", category: ".gr-niemet" },
  { name: "Hel", symbol: "He", category: ".pu-szlach" },
  { name: "Lit", symbol: "Li", category: ".re-alkmet" },
  { name: "Beryl", symbol: "Be", category: ".or-alkziem" },
  { name: "Bor", symbol: "B", category: ".gr-niemet" },
  { name: "Węgiel", symbol: "C", category: ".gr-niemet" },
  { name: "Azot", symbol: "N", category: ".gr-niemet" },
  { name: "Tlen", symbol: "O", category: ".gr-niemet" },
  { name: "Fluor", symbol: "F", category: ".gr-halogen" },
  { name: "Neon", symbol: "Ne", category: ".pu-szlach" },
  { name: "Sód", symbol: "Na", category: ".re-alkmet" },
  { name: "Magnez", symbol: "Mg", category: ".or-alkziem" },
  { name: "Glin", symbol: "Al", category: ".aq-metal" },
  { name: "Krzem", symbol: "Si", category: ".gr-niemet" },
  { name: "Fosfor", symbol: "P", category: ".gr-niemet" },
  { name: "Siarka", symbol: "S", category: ".gr-niemet" },
  { name: "Chlor", symbol: "Cl", category: ".gr-halogen" },
  { name: "Argon", symbol: "Ar", category: ".pu-szlach" },
  { name: "Potas", symbol: "K", category: ".re-alkmet" },
  { name: "Wapń", symbol: "Ca", category: ".or-alkziem" },
  { name: "Skand", symbol: "Sc", category: ".ye-transmetal" },
  { name: "Tytan", symbol: "Ti", category: ".ye-transmetal" },
  { name: "Wanad", symbol: "V", category: ".ye-transmetal" },
  { name: "Chrom", symbol: "Cr", category: ".ye-transmetal" },
  { name: "Mangan", symbol: "Mn", category: ".ye-transmetal" },
  { name: "Żelazo", symbol: "Fe", category: ".ye-transmetal" },
  { name: "Kobalt", symbol: "Co", category: ".ye-transmetal" },
  { name: "Nikiel", symbol: "Ni", category: ".ye-transmetal" },
  { name: "Miedź", symbol: "Cu", category: ".ye-transmetal" },
  { name: "Cynk", symbol: "Zn", category: ".ye-transmetal" },
  { name: "Gal", symbol: "Ga", category: ".aq-metal" },
  { name: "German", symbol: "Ge", category: ".aq-metal" },
  { name: "Arsen", symbol: "As", category: ".gr-niemet" },
  { name: "Selen", symbol: "Se", category: ".gr-niemet" },
  { name: "Brom", symbol: "Br", category: ".gr-halogen" },
  { name: "Krypton", symbol: "Kr", category: ".pu-szlach" },
  { name: "Rubid", symbol: "Rb", category: ".re-alkmet" },
  { name: "Stront", symbol: "Sr", category: ".or-alkziem" },
  { name: "Itr", symbol: "Y", category: ".ye-transmetal" },
  { name: "Cyrkon", symbol: "Zr", category: ".ye-transmetal" },
  { name: "Niob", symbol: "Nb", category: ".ye-transmetal" },
  { name: "Molibden", symbol: "Mo", category: ".ye-transmetal" },
  { name: "Technet", symbol: "Tc", category: ".ye-transmetal" },
  { name: "Ruten", symbol: "Ru", category: ".ye-transmetal" },
  { name: "Rod", symbol: "Rh", category: ".ye-transmetal" },
  { name: "Pallad", symbol: "Pd", category: ".ye-transmetal" },
  { name: "Srebro", symbol: "Ag", category: ".ye-transmetal" },
  { name: "Kadm", symbol: "Cd", category: ".ye-transmetal" },
  { name: "Ind", symbol: "In", category: ".aq-metal" },
  { name: "Cyna", symbol: "Sn", category: ".aq-metal" },
  { name: "Antymon", symbol: "Sb", category: ".aq-metal" },
  { name: "Tellur", symbol: "Te", category: ".gr-niemet" },
  { name: "Jod", symbol: "I", category: ".gr-halogen" }
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");

  const checkAuth = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setIsLoggedIn(false);
      setUserRole("");
      return;
    }

    try {
      const res = await fetch(`${APP_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setIsLoggedIn(true);
        setUserRole(data.user.role);
      } else {
        setIsLoggedIn(false);
        setUserRole("");
      }
    } catch (err) {
      console.error("Błąd sprawdzania sesji:", err);
      setIsLoggedIn(false);
      setUserRole("");
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    checkAuth();
  };

  const logout = () => {
    localStorage.removeItem("jwtToken");
    setIsLoggedIn(false);
    setUserRole("");
  };

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div>
        <a href="#">
          <img src="src/atom-molecule.png" className="logo react spin" alt="React logo" />
        </a>
      </div>
      <h1>Interaktywna edukacja 3D</h1>
      <nav style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <Link to="/">Start</Link>
        {!isLoggedIn && <Link to="/login">Logowanie</Link>}
        {userRole === "admin" && <Link to="/admin">Panel Admina</Link>}
        <Link to="/qr-maker">QR - export</Link>
        <Link to="/katalog">Katalog</Link>
        {isLoggedIn && (
          <button
            onClick={logout}
            style={{
              background: "#f44336",
              color: "#fff",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Wyloguj
          </button>
        )}
      </nav>

      <Routes>
        <Route path="/login" element={<Log onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/enter-reset-code" element={<EnterResetCode />} />
        <Route path="/" element={isLoggedIn ? <Scene /> : <Log onLogin={handleLogin} />} />
        <Route path="/admin" element={isLoggedIn && userRole === "admin" ? <AdminPanel /> : <p style={{ color: "red" }}>Brak dostępu</p>} />
        <Route path="/element/:symbol" element={<ElementDetails />} />
        <Route path="/qr-maker" element={<CustomQRCode />} />
        <Route path="/scene" element={<Scene />} />
        <Route path="/katalog" element={<Katalog />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;