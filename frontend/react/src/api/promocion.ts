export const promoverTodos = async () => {
  const res = await fetch(
    "http://localhost:1234/promociones/promocion/promover-todos",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    },
  );

  const data = await res.json();
  return data;
};
