import React, { useEffect, useState } from "react";
import './Scene.css';
import { useNavigate } from "react-router-dom";
const APP_URL = import.meta.env.VITE_API_URL;

const Katalog = () => {
    const [allConfigurations, setAllConfigurations] = useState([]);
    const navigate = useNavigate();

    const loadAllConfigurations = async () => {
        try {
            const res = await fetch(`${APP_URL}/configurations/all`);
            if (!res.ok) throw new Error("Nie udało się pobrać konfiguracji.");
            const data = await res.json();
            setAllConfigurations(data);
        } catch (err) {
            console.error(err);
            alert("Błąd podczas ładowania konfiguracji.");
        }
    };

    useEffect(() => {
        loadAllConfigurations();
    }, []);

    const handleShowScene = (configuration) => {
        localStorage.setItem("selectedConfiguration", JSON.stringify(configuration));
        navigate("/scene");  // Upewnij się, że taki route istnieje
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>🌍 Konfiguracje użytkowników</h2>
            {Object.entries(
                allConfigurations.reduce((acc, conf) => {
                    if (!acc[conf.user.email]) acc[conf.user.email] = [];
                    acc[conf.user.email].push(conf);
                    return acc;
                }, {})
            ).map(([email, configs]) => (
                <div key={email} style={{ marginBottom: 30 }}>
                    <h3>👤 {email}</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {configs.map(conf => (
                            <div key={conf.id} style={{
                                border: "1px solid #ccc",
                                borderRadius: 8,
                                padding: 10,
                                width: 200,
                                background: "#000000",
                                color: "#fff"
                            }}>
                                <strong>{conf.name}</strong><br />
                                <small>{new Date(conf.created_at).toLocaleString()}</small><br />
                                <small>{conf.atoms.length} atomów</small><br />
                                <button style={{ marginTop: 10 }} onClick={() => handleShowScene(conf)}>
                                    🔍 Zobacz w 3D
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Katalog;
