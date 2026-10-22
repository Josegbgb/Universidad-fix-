import { all, run } from "./src/db.js";

async function debug() {
  try {
    console.log("🚀 Insertando lapsos si no existen...");

    // Insertar lapsos (evita duplicados)
    await run(`
      INSERT OR IGNORE INTO lapsos (numero) VALUES 
      (1), (2), (3)
    `);

    console.log("✅ Lapsos insertados (o ya existían)\n");

    // 🔍 1. Ver rel_estudiante_grado
    console.log("📌 rel_estudiante_grado:");
    const reg = await all(`SELECT * FROM rel_estudiante_grado`);
    console.log(reg, "\n");

    // 🔍 2. Ver rel_grado_asignatura
    console.log("📌 rel_grado_asignatura:");
    const rga = await all(`SELECT * FROM rel_grado_asignatura`);
    console.log(rga, "\n");

    // 🔍 3. Ver lapsos
    console.log("📌 lapsos:");
    const lapsos = await all(`SELECT * FROM lapsos`);
    console.log(lapsos, "\n");

    console.log("🔥 Debug terminado");
  } catch (error) {
    console.error("❌ Error en debug:", error);
  }
}

debug();
