import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database(path.join(__dirname, "school.db"));

function agregarColumna(tabla, columna, definicion) {
  const existe = db
    .prepare(`PRAGMA table_info(${tabla})`)
    .all()
    .some((c) => c.name === columna);
  if (existe) {
    console.log(`ℹ️ ${tabla}.${columna} ya existía`);
    return;
  }
  db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
  console.log(`✅ ${tabla}.${columna} agregada`);
}

try {
  // IN (inasistente)
  agregarColumna("notas", "inasistente", "INTEGER NOT NULL DEFAULT 0");
  agregarColumna("estudiante_asignatura_pendiente", "inasistente", "INTEGER NOT NULL DEFAULT 0");
  // Nota original de revision, se guarda al usar la revision especial
  agregarColumna("estudiante_asignatura_pendiente", "nota_revision_inicial", "REAL DEFAULT NULL");

  // Revision especial: hay que reconstruir fases_periodo para ampliar el CHECK
  const sqlFases = db
    .prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='fases_periodo'`)
    .get().sql;

  if (!sqlFases.includes("revision_especial")) {
    db.transaction(() => {
      db.exec(`
        DROP INDEX IF EXISTS idx_fases_periodo;
        CREATE TABLE fases_periodo_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          id_periodo INTEGER NOT NULL,
          fase TEXT NOT NULL CHECK(fase IN ('finalizacion','revision','revision_especial','pendiente_oct','pendiente_dic','pendiente_ene','pendiente_jun')),
          abierta INTEGER DEFAULT 1,
          cerrada_at DATETIME DEFAULT NULL,
          UNIQUE(id_periodo, fase),
          FOREIGN KEY (id_periodo) REFERENCES periodos_escolares(id)
        );
        INSERT INTO fases_periodo_new (id, id_periodo, fase, abierta, cerrada_at)
          SELECT id, id_periodo, fase, abierta, cerrada_at FROM fases_periodo;
        DROP TABLE fases_periodo;
        ALTER TABLE fases_periodo_new RENAME TO fases_periodo;
        CREATE INDEX idx_fases_periodo ON fases_periodo(id_periodo, fase, abierta);
      `);
    })();
    console.log("✅ fases_periodo reconstruida con 'revision_especial'");
  } else {
    console.log("ℹ️ fases_periodo ya tenía 'revision_especial'");
  }

  // Fila de revision_especial (cerrada) para los periodos que ya existen
  db.exec(`
    INSERT OR IGNORE INTO fases_periodo (id_periodo, fase, abierta)
    SELECT id, 'revision_especial', 0 FROM periodos_escolares;
  `);
  console.log("✅ Fases 'revision_especial' creadas para los periodos existentes");
} catch (error) {
  console.error("❌ Error en la migración:", error.message);
} finally {
  db.close();
}