import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "school.db");

const db = new Database(dbPath);

const alterTableSQL = `
  ALTER TABLE grados ADD COLUMN activo INTEGER NOT NULL DEFAULT 1;
`;

try {
  db.exec(alterTableSQL);
  console.log("✅ Columna 'activo' agregada a la tabla 'grados'.");
} catch (error) {
  if (error.message.includes("duplicate column name")) {
    console.log("⚠️ La columna 'activo' ya existía en la tabla 'grados'. No se hizo ningún cambio.");
  } else {
    console.error("❌ Error al agregar la columna:", error.message);
  }
} finally {
  db.close();
}