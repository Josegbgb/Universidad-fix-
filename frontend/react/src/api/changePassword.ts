export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string
) {
  const res = await fetch("http://localhost:1234/api/users/password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, currentPassword, newPassword }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.body?.error || "Error al cambiar la contraseña");
  }
  return data;
}
