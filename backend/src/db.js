import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "db", "school.db");
const db = new Database(dbPath);

// exporta funciones helpers que usas en tus modelos (all, get, run)
export function all(sql, params = []) {
  return db.prepare(sql).all(params);
}

export function get(sql, params = []) {
  return db.prepare(sql).get(params);
}

export function run(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.run(params);
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      // 🔥 NO HAGAS THROW - devuelve un objeto con el error
      if (
        error.message.includes("profesores.telefono") ||
        error.message.includes("estudiantes.telefono") ||
        error.message.includes("administradores.telefono")
      ) {
        return { error: "TELEFONO_DUPLICADO_GLOBAL" };
      }

      if (
        error.message.includes("profesores.cedula") ||
        error.message.includes("estudiantes.cedula") ||
        error.message.includes("administradores.cedula")
      ) {
        return { error: "CEDULA_DUPLICADA_GLOBAL" };
      }

      if (error.message.includes("usuarios.email")) {
        return { error: "USER_EMAIL_DUPLICADO" };
      }

      if (error.message.includes("telefono")) {
        return { error: "TELEFONO_DUPLICADO_EN_TABLA" };
      }
      if (error.message.includes("correo")) {
        return { error: "CORREO_DUPLICADO_EN_TABLA" };
      }
      if (error.message.includes("cedula")) {
        return { error: "CEDULA_DUPLICADA_EN_TABLA" };
      }
    }
    console.log("🔥 ERROR CRUDO:", error.message); // 👈 AGREGAR ESTO

    // Para errores de triggers globales
    if (
      error.message.includes("CEDULA_DUPLICADA_GLOBAL") ||
      error.message.includes("CORREO_DUPLICADO_GLOBAL") ||
      error.message.includes("TELEFONO_DUPLICADO_GLOBAL")
    ) {
      return { error: error.message };
    }

    // cualquier otro error sí lo lanzas
    throw error;
  }
}
export default db;

export const transaction = (fn) => db.transaction(fn);
