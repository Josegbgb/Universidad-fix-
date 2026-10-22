import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

// 📁 Establecer la ruta actual del archivo en lugar de process.cwd()
const __dirname = path.resolve();

// Como setup.js está dentro de db/, buscamos los archivos directamente allí
const dbPath = path.join(__dirname, "school.db");
const schemaPath = path.join(__dirname, "schema.sql");

if (!fs.existsSync(schemaPath)) {
  console.error("No existe schema.sql en esta carpeta");
  process.exit(1);
}

const db = new Database(dbPath);
const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

console.log("✅ Base de datos creada o actualizada correctamente.");
db.close();
