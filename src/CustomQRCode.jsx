import React, { useEffect, useState, useRef } from "react";
import ReactQRCode from "react-qr-code";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import axios from "axios";

const APP_URL = import.meta.env.VITE_API_URL;

const CustomQRCode = () => {
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [label, setLabel] = useState("");
  const qrRef = useRef(null);

  useEffect(() => {
    axios
      .get(`${APP_URL}/elements`)
      .then((res) => setElements(res.data))
      .catch((err) => console.error("Błąd pobierania pierwiastków", err));
  }, []);

  const url = selectedId
    ? `https://keksiktusik.github.io/BazyDanych/ar-view.html?id=${selectedId}`
    : "";

  const handleDownloadPNG = async () => {
    if (!qrRef.current) return;
    const canvas = await html2canvas(qrRef.current);
    const link = document.createElement("a");
    link.download = `${label || "qr-code"}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleDownloadPDF = async () => {
    if (!qrRef.current) return;
    const canvas = await html2canvas(qrRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 15, 40, 180, 180);
    pdf.save(`${label || "qr-code"}.pdf`);
  };

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>📤 Eksport kodu QR pierwiastka</h1>

      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Etykieta pod kodem QR (np. H2O)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          style={styles.input}
        />
        <p style={styles.hint}>Etykieta będzie widoczna pod kodem QR</p>

        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={styles.select}
        >
          <option value="">🔽 Wybierz pierwiastek</option>
          {elements.map((el) => (
            <option key={el.id} value={el.atomic_number}>
              {el.name} ({el.symbol}) — {el.atomic_number}
            </option>
          ))}
        </select>
      </div>

      {url && (
        <div style={styles.qrSection}>
          <div ref={qrRef} style={styles.qrBox}>
            <h3>{label}</h3>
            <ReactQRCode value={url} size={200} />
          </div>
          {selectedId && (
    <model-viewer
      src={`/public-ar/models/${selectedId}.glb`}
      alt={`Model 3D pierwiastka ${label}`}
      auto-rotate
      camera-controls
      style={{ width: "300px", height: "300px", marginTop: "2rem" }}
    />
  )}
          <div style={styles.buttonGroup}>
            <button style={styles.button} onClick={handleDownloadPNG}>
              📥 Pobierz jako PNG
            </button>
            <button style={styles.buttonPDF} onClick={handleDownloadPDF}>
              📄 Pobierz jako PDF
            </button>
          </div>

          <p style={styles.link}>{url}</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: {
    padding: "2rem",
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    textAlign: "center",
    maxWidth: "650px",
    margin: "auto",
    backgroundColor: "#f9f9f9",
    borderRadius: "12px",
    boxShadow: "0 0 20px rgba(0,0,0,0.1)",
  },
  title: {
    marginBottom: "1rem",
    color: "#222",
  },
  controls: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    alignItems: "center",
  },
  input: {
    padding: "0.5rem",
    width: "300px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  select: {
    padding: "0.5rem",
    width: "300px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  hint: {
    margin: 0,
    fontSize: "13px",
    color: "#777",
  },
  qrSection: {
    marginTop: "2rem",
  },
  qrBox: {
    backgroundColor: "#fff",
    padding: "1rem",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    display: "inline-block",
  },
  buttonGroup: {
    marginTop: "1rem",
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "#fff",
    fontWeight: "bold",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  buttonPDF: {
    padding: "10px 20px",
    backgroundColor: "#28a745",
    color: "#fff",
    fontWeight: "bold",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  link: {
    marginTop: "1rem",
    fontSize: "14px",
    color: "#555",
    wordBreak: "break-all",
  },
};

export default CustomQRCode;
