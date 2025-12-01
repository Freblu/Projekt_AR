import { useEffect, useState } from "react";
import axios from "axios";
import ReactQRCode from "react-qr-code";

const AdminPanel = () => {
  const [elements, setElements] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    atomic_number: "",
    category: "",
    model_url: ""
  });
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("atomic_number");
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const itemsPerPage = 10;
  const token = localStorage.getItem("jwtToken");
  const headers = { Authorization: `Bearer ${token}` };
  const [previewModel, setPreviewModel] = useState(null);

  useEffect(() => {
    fetchElements();
    fetchUsers();
    fetchCategories();
  }, []);

const fetchElements = async () => {
  try {
    const res = await axios.get("http://localhost:8000/elements", { headers });
    setElements(res.data);
  } catch (err) {
    console.error("Błąd pobierania pierwiastków:", err);
  }
};

const fetchUsers = async () => {
  try {
        const res = await axios.get("http://localhost:8000/users/", { headers });
    console.log("Dane użytkowników z backendu:", res.data);
    setUsers(res.data);
  } catch (err) {
    console.error("Błąd pobierania użytkowników:", err);
  }
};

const fetchCategories = async () => {
  try {
    const res = await axios.get("http://localhost:8000/categories", { headers });
    setCategories(res.data);
  } catch (err) {
    console.error("Błąd pobierania kategorii:", err);
  }
};

const handleAddElement = async (e) => {
  e.preventDefault();
  const dataToSend = { ...formData };
  if (!editId) delete dataToSend.id;

  const endpoint = editId
    ? `http://localhost:8000/elements/${editId}`
    : "http://localhost:8000/elements";
  const method = editId ? "put" : "post";

  try {
    const res = await axios[method](endpoint, dataToSend, { headers });
    if (res.status === 200 || res.status === 201) {
      setSuccessMsg(editId ? "✅ Edytowano!" : "✅ Pierwiastek dodany!");
      setErrorMsg("");
      setFormData({ symbol: "", name: "", atomic_number: "", category: "", model_url: "" });
      setEditId(null);
      fetchElements();
    } else {
      setErrorMsg("❌ Błąd dodawania lub edycji");
    }
  } catch (err) {
    setErrorMsg("❌ Błąd dodawania lub edycji");
    console.error(err);
  }
};

const handleEdit = (el) => {
  setEditId(el.id);
  setFormData({
    symbol: el.symbol,
    name: el.name,
    atomic_number: el.atomic_number,
    category: el.category,
    model_url: el.model_url || "",
  });
};
const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};

const handleDelete = async (id) => {
  if (!window.confirm("Czy na pewno chcesz usunąć ten pierwiastek?")) return;
  try {
    await axios.delete(`http://localhost:8000/elements/${id}`, { headers });
    fetchElements();
  } catch (err) {
    console.error("Błąd usuwania:", err);
  }
};

const handleUserRoleChange = async (id, role) => {
  try {
    await axios.put(
      `http://localhost:8000/users/${id}/role`,
      { new_role: role }, 
      { headers }
    );
    fetchUsers();
  } catch (err) {
    console.error("Błąd zmiany roli:", err);
  }
};


const toggleUserActive = async (id, currentStatus) => {
  try {
    await axios.put(`http://localhost:8000/users/${id}/active?is_active=${currentStatus ? 0 : 1}`, {}, { headers });
    fetchUsers();
  } catch (err) {
    console.error("Błąd aktywacji/dezaktywacji konta:", err);
  }
};

const handleDeleteUser = async (id) => {
  if (!window.confirm("Czy na pewno chcesz usunąć to konto?")) return;
  try {
    await axios.delete(`http://localhost:8000/users/${id}`, { headers });
    fetchUsers();
  } catch (err) {
    console.error("Błąd usuwania konta:", err);
  }
};

const handlePasswordChange = async () => {
  try {
    await axios.put(
      `http://localhost:8000/users/${selectedUserId}/password`,
      { new_password: newPassword },
      { headers }
    );
    setSuccessMsg("Hasło zmienione!");
    setShowPasswordModal(false);
    setNewPassword("");
  } catch (err) {
    console.error("Błąd zmiany hasła:", err);
  }
};


  const handleExportCSV = () => {
    const csv = [
      ["ID", "Symbol", "Nazwa", "Liczba atomowa", "Kategoria", "Model URL"],
      ...elements.map((el) => [el.id, el.symbol, el.name, el.atomic_number, el.category, el.model_url]),
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pierwiastki.csv";
    a.click();
  };

  const handleExportUsers = () => {
  const csv = [
    ["ID", "Email", "Rola", "Aktywny", "Ostatnie logowanie"],
    ...users.map((u) => [
      u.id,
      u.email,
      u.role,
      u.is_active === 1 ? "TAK" : "NIE",
      u.last_login ? new Date(u.last_login).toLocaleString() : "brak"
    ])
  ]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "uzytkownicy.csv";
  a.click();
};

  const filtered = elements.filter((el) => el.name.toLowerCase().includes(search.toLowerCase()) || el.symbol.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (sortAsc ? (a[sortField] > b[sortField] ? 1 : -1) : (a[sortField] < b[sortField] ? 1 : -1)));

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <div style={{ padding: "20px" }}>
      <h2>🧪 Panel Administratora – Dodaj / Edytuj pierwiastek</h2>
      <form onSubmit={handleAddElement}>
        <input name="symbol" placeholder="Symbol" value={formData.symbol} onChange={handleChange} required />
        <input name="name" placeholder="Nazwa" value={formData.name} onChange={handleChange} required />
        <input name="atomic_number" type="number" placeholder="Liczba atomowa" value={formData.atomic_number} onChange={handleChange} required />
        <select name="category" value={formData.category} onChange={handleChange} required>
          <option value="">-- wybierz kategorię --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
        <input name="model_url" placeholder="Link do modelu 3D (.glb)" value={formData.model_url} onChange={handleChange} />
        <button type="submit">{editId ? "Zapisz edycję" : "Dodaj pierwiastek"}</button>
      </form>

      {successMsg && <p style={{ color: "green" }}>{successMsg}</p>}
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

      <div style={{ marginTop: "1rem" }}>
        <input type="text" placeholder="Szukaj symbol / nazwa" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button onClick={handleExportCSV}>📤 Eksport do CSV</button>
      </div>

      <h3>📋 Lista pierwiastków:</h3>
      <table border="1" cellPadding="5" style={{ marginTop: "10px" }}>
  <thead>
    <tr>
      <th>ID</th>
      <th>Symbol</th>
      <th>Nazwa</th>
      <th>Atomowa</th>
      <th>Kategoria</th>
      <th>Model</th>
      <th>QR</th>
      <th>✏️</th>
      <th>🗑️</th>
    </tr>
  </thead>
  <tbody>
    {paginated.map((el, index) => (
      <tr key={el.id || index}>
        <td>{el.id}</td>
        <td>{el.symbol}</td>
        <td>{el.name}</td>
        <td>{el.atomic_number}</td>
        <td>{el.category}</td>
        <td>
          <model-viewer
            src={`http://localhost:3001/public-ar/models/${el.atomic_number}.glb`}
            camera-controls
            ar
            style={{ width: "100px", height: "100px" }}
          ></model-viewer>
        </td>
        <td>
  <ReactQRCode value={`https://keksiktusik.github.io/BazyDanych/ar-view.html?id=${el.id}`} size={40} />
  <br />
  <button onClick={() => setPreviewModel(el.atomic_number)}>🔍</button>
</td>
        <td><button onClick={() => handleEdit(el)}>✏️</button></td>
        <td><button onClick={() => handleDelete(el.id)}>🗑️</button></td>
      </tr>
    ))}
  </tbody>
</table>
      <div style={{ marginTop: "1rem" }}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>⬅️</button>
        <span style={{ margin: "0 10px" }}>Strona {currentPage} z {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>➡️</button>
      </div>

           <hr />

      <h2>👥 Zarządzanie użytkownikami</h2>
      <button onClick={handleExportUsers} style={{ marginBottom: "10px" }}>
  📤 Eksport użytkowników do CSV
</button>

      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Rola</th>
            <th>Zmiana roli</th>
            <th>Aktywne</th>
            <th>Ostatnie logowanie</th>
            <th>Hasło</th>
            <th>🗑️</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <select value={u.role} onChange={(e) => handleUserRoleChange(u.id, e.target.value)}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={u.is_active === 1}
                  onChange={() => toggleUserActive(u.id, u.is_active)}
                />
              </td>
              <td>{u.last_login ? new Date(u.last_login).toLocaleString() : "brak"}</td>
              <td>
                <button onClick={() => { setSelectedUserId(u.id); setShowPasswordModal(true); }}>
                  Zmień
                </button>
              </td>
              <td>
                <button onClick={() => handleDeleteUser(u.id)}>Usuń</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    
    {previewModel && (
  <div style={{
    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
    backgroundColor: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex",
    alignItems: "center", justifyContent: "center", flexDirection: "column"
  }}>
    <model-viewer
      src={`http://localhost:3001/public-ar/models/${previewModel}.glb`}
      ar auto-rotate camera-controls
      style={{ width: "80vw", height: "80vh", background: "#fff", borderRadius: "8px" }}
    />
    <button
      style={{ marginTop: "1rem", padding: "0.5rem 1rem", fontSize: "1rem" }}
      onClick={() => setPreviewModel(null)}
    >
      ❌ Zamknij podgląd
    </button>
  </div>
)}


      {showPasswordModal && (
        <div style={{ marginTop: "1rem", border: "1px solid gray", padding: "10px" }}>
          <h4>🔑 Zmień hasło użytkownika ID: {selectedUserId}</h4>
          <input
            type="password"
            placeholder="Nowe hasło (min. 6 znaków)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button onClick={handlePasswordChange}>Zapisz</button>
          <button onClick={() => setShowPasswordModal(false)}>Anuluj</button>
        </div>
      )}

      <div style={{ marginTop: "2rem" }}>
        <button
          style={{ backgroundColor: "crimson", color: "white", padding: "10px" }}
          onClick={async () => {
            if (window.confirm("Czy na pewno chcesz usunąć błędne/puste konfiguracje?")) {
              try {
                await axios.delete("http://localhost:3001/configurations/cleanup", { headers });
                alert("Usunięto błędne konfiguracje.");
              } catch (err) {
                console.error("Błąd czyszczenia konfiguracji:", err);
                alert("Nie udało się usunąć konfiguracji.");
              }
            }
          }}
        >
          🧹 Usuń błędne konfiguracje
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;