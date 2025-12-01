const jwt = require("jsonwebtoken");
require("dotenv").config(); // też potrzebne jeśli middleware ładowany osobno

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Brak tokena JWT" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("Błąd JWT:", err);  // log błędu
      return res.status(403).json({ error: "Nieprawidłowy token" });
    }
    console.log("Zweryfikowany użytkownik:", user); // log sukcesu
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
