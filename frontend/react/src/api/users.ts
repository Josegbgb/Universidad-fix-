export const getMyProfile = async () => {
  try {
    const email = localStorage.getItem("email");

    console.log("📩 EMAIL ENVIADO:", email);

    const res = await fetch(
      `http://localhost:1234/api/users/me?email=${email}`,
    );

    console.log("📡 STATUS:", res.status);

    const text = await res.text();
    console.log("📦 RESPUESTA RAW:", text);

    const data = JSON.parse(text);

    if (!res.ok) throw new Error(data.data?.error || "Error");

    console.log("✅ DATA FINAL:", data);

    return data.body;
  } catch (err: any) {
    console.error("❌ ERROR FRONT:", err);
    throw new Error(err.message);
  }
};

export const updateMyProfile = async (body: any) => {
  try {
    const email = localStorage.getItem("email");

    const res = await fetch(
      `http://localhost:1234/api/users/me?email=${email}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json();

    if (!res.ok) {
      const errorMsg =
        data.data?.error || // { data: { error: "..." } }
        data.body?.error || // { body: { error: "..." } }
        data.error || // { error: "..." }
        "Error";
      throw new Error(errorMsg);
    }

    return data.body;
  } catch (err: any) {
    throw new Error(err.message);
  }
};
