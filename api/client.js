const API_URL = "https://cashtrack-eo68.onrender.com";

function getToken() {
  return localStorage.getItem("access_token");
}

export async function apiFetch(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "API Error");
  }

  if (response.status === 204) return null;
  return response.json();
}