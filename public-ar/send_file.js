import mysql from "mysql2";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "bazy_danych_app",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

const files = [
    { filename: "gr-niemet.glb", category: "gr-niemet" },
    { filename: "pu-szlach.glb", category: "pu-szlach" },
    { filename: "re-alkmet.glb", category: "re-alkmet" },
    { filename: "or-alkziem.glb", category: "or-alkziem" },
    { filename: "gr-halogen.glb", category: "gr-halogen" },
    { filename: "aq-metal.glb", category: "aq-metal" },
    { filename: "ye-transmetal.glb", category: "ye-transmetal" },
];

async function convertAndStore() {
    try {
        const promisePool = pool.promise(); // <- użyj wrappera tylko tu

        for (const file of files) {
            const filePath = path.join(__dirname, "models", file.filename);

            if (!fs.existsSync(filePath)) {
                console.warn(`Plik ${file.filename} nie istnieje – pomijam.`);
                continue;
            }

            const buffer = fs.readFileSync(filePath);
            console.log(`${file.filename} skonwertowany (${buffer.length} bajtów)`);
            console.log(`Buffer?`, Buffer.isBuffer(buffer));

            const [result] = await promisePool.query(
                "UPDATE elements SET model_blob = ? WHERE category = ?",
                [buffer, file.category]
            );

            console.log(`Wgrano ${file.filename} ➝ ${file.category}`);
        }

    } catch (err) {
        console.error("❌ Błąd:", err);
    } finally {
        pool.end();
    }
}

convertAndStore();
