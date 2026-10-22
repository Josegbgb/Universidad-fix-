// migrate.js
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "db", "school.db");
const db = new Database(dbPath);

// helper
function columnExists(table, column) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some((r) => r.name === column);
}

// agregar columnas si no existen
if (!columnExists("estudiantes", "correo")) {
  db.exec(`ALTER TABLE estudiantes ADD COLUMN correo TEXT;`);
  console.log("agregada columna estudiantes.correo");
}
if (!columnExists("estudiantes", "telefono")) {
  db.exec(`ALTER TABLE estudiantes ADD COLUMN telefono TEXT;`);
  console.log("agregada columna estudiantes.telefono");
}
if (!columnExists("estudiantes", "id_usuario")) {
  db.exec(`ALTER TABLE estudiantes ADD COLUMN id_usuario INTEGER;`);
  console.log("agregada columna estudiantes.id_usuario");
}
if (!columnExists("estudiantes", "lugar_nacimiento")) {
  // Cambio: guarda el lugar de nacimiento para reportes oficiales.
  db.exec(`ALTER TABLE estudiantes ADD COLUMN lugar_nacimiento TEXT;`);
  console.log("agregada columna estudiantes.lugar_nacimiento");
}
if (!columnExists("estudiantes", "entidad_federal")) {
  // Cambio: guarda la entidad federal usada como EF en planillas.
  db.exec(`ALTER TABLE estudiantes ADD COLUMN entidad_federal TEXT;`);
  console.log("agregada columna estudiantes.entidad_federal");
}

if (!columnExists("profesores", "correo")) {
  db.exec(`ALTER TABLE profesores ADD COLUMN correo TEXT;`);
  console.log("agregada columna profesores.correo");
}
if (!columnExists("profesores", "telefono")) {
  db.exec(`ALTER TABLE profesores ADD COLUMN telefono TEXT;`);
  console.log("agregada columna profesores.telefono");
}
if (!columnExists("profesores", "id_usuario")) {
  db.exec(`ALTER TABLE profesores ADD COLUMN id_usuario INTEGER;`);
  console.log("agregada columna profesores.id_usuario");
}

console.log("Migración completada.");
db.close();
