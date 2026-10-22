import { run } from "./src/db.js";
import bcrypt from "bcryptjs";

const hashed = bcrypt.hashSync("123456", 10);
run("INSERT INTO usuarios (email, password, role) VALUES (?, ?, ?)", [
  "admin@example.com",
  hashed,
  "admin",
]);
console.log("Admin creado");
