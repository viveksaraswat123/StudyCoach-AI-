const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/kanban";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchBoards() {
  const res = await fetch(`${apiBase}/boards`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function createBoard(name) {
  const res = await fetch(`${apiBase}/boards`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function createColumn(title, board_id) {
  const res = await fetch(`${apiBase}/columns`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ title, board_id }),
  });
  return res.json();
}

export async function createCard(card) {
  const res = await fetch(`${apiBase}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(card),
  });
  return res.json();
}

export async function updateCard(id, payload) {
  const res = await fetch(`${apiBase}/cards/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function suggestCard(payload) {
  const res = await fetch(`${apiBase}/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteCard(id) {
  const res = await fetch(`${apiBase}/cards/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return res.json();
}

export default { fetchBoards, createBoard, createColumn, createCard, updateCard, suggestCard, deleteCard };
