import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ElementDetails = () => {
  const { symbol } = useParams();
  const [element, setElement] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:3001/elements/${symbol}`)
      .then((res) => res.json())
      .then((data) => setElement(data))
      .catch((err) => console.error("Błąd pobierania danych:", err));
  }, [symbol]);

  if (!element) return <div>Ładowanie...</div>;

  const handleGenerateQR = () => {
    navigate(`/custom-qr?atomic_number=${element.atomic_number}&name=${encodeURIComponent(element.name)}`);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>{element.name} ({element.symbol})</h1>
      <p>Liczba atomowa: {element.atomic_number}</p>
      <p>Kategoria: {element.category}</p>
      <p>Opis: Tutaj możesz dodać szczegóły opisujące pierwiastek.</p>

      <button onClick={handleGenerateQR} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
        Wygeneruj kod QR do AR
      </button>
    </div>
  );
};

export default ElementDetails;
