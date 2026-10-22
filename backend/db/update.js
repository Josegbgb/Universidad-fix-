import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

// Obtener directorio actual (para compatibilidad con ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta a tu base de datos school.db (ajústala si es necesario)
const dbPath = path.join(__dirname, "school.db");

// Conectar a la base de datos existente
const db = new Database(dbPath);

// Definir la sentencia CREATE TABLE con IF NOT EXISTS para no alterar nada existente
const createTableSQL = `
  CREATE TABLE IF NOT EXISTS estudiante_asignatura_pendiente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_estudiante INTEGER NOT NULL,
    id_asignatura INTEGER NOT NULL,
    id_grado_origen INTEGER NOT NULL,
    aprobada INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id),
    FOREIGN KEY (id_asignatura) REFERENCES asignaturas(id),
    FOREIGN KEY (id_grado_origen) REFERENCES grados(id)
  );
`;

// Ejecutar la creación de la tabla
try {
  db.exec(createTableSQL);
  console.log(
    "✅ Tabla 'estudiante_asignatura_pendiente' creada (o ya existía).",
  );
} catch (error) {
  console.error("❌ Error al crear la tabla:", error.message);
} finally {
  db.close();
}
