import { login, logout, isLoggedIn } from "./api/auth.js";
import {
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  deleteAllRecords,
} from "./api/records.js";

// ── DOM Elements ──────────────────────────────────────────────
const loginScreen = document.getElementById("loginScreen");
const appShell = document.querySelector(".app-shell");
const loginBtn = document.getElementById("loginBtn");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginStatus = document.getElementById("loginStatus");
const logoutBtn = document.getElementById("logoutBtn");

const form = document.getElementById("expenseForm");
const recordIdInput = document.getElementById("recordId");
const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const placeInput = document.getElementById("place");
const itemsInput = document.getElementById("items");
const dateInput = document.getElementById("dateInput");

const statusText = document.getElementById("statusText");
const liveDateTime = document.getElementById("liveDateTime");
const pdfFileInput = document.getElementById("pdfFileInput");
const readPdfBtn = document.getElementById("readPdfBtn");
const pdfStatusText = document.getElementById("pdfStatusText");
const csvFileInput = document.getElementById("csvFileInput");
const importCsvBtn = document.getElementById("importCsvBtn");
const csvStatusText = document.getElementById("csvStatusText");

const tableSection = document.getElementById("tableSection");
const tableBody = document.getElementById("expenseTableBody");
const toggleTableBtn = document.getElementById("toggleTableBtn");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveBtn = document.getElementById("saveBtn");
const formHeadline = document.getElementById("formHeadline");

const entryCount = document.getElementById("entryCount");
const expenseTotal = document.getElementById("expenseTotal");
const incomeTotal = document.getElementById("incomeTotal");
const balanceTotal = document.getElementById("balanceTotal");

// ── Auth UI ───────────────────────────────────────────────────
function showApp() {
  loginScreen.classList.add("hidden");
  appShell.classList.remove("hidden");
}

function showLogin() {
  loginScreen.classList.remove("hidden");
  appShell.classList.add("hidden");
}

loginBtn.addEventListener("click", async () => {
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  if (!email || !password) {
    loginStatus.textContent = "Bitte E-Mail und Passwort eingeben.";
    return;
  }

  try {
    loginStatus.textContent = "Anmelden...";
    await login(email, password);
    showApp();
    await refreshUI();
  } catch (e) {
    loginStatus.textContent = "Ungültige E-Mail oder Passwort.";
  }
});

logoutBtn.addEventListener("click", () => {
  logout();
  showLogin();
});

// ── Helpers ───────────────────────────────────────────────────
function setStatus(text = "") { statusText.textContent = text; }
function setPdfStatus(text = "") { pdfStatusText.textContent = text; }
function setCsvStatus(text = "") { csvStatusText.textContent = text; }

function updateLiveDateTime() {
  const now = new Date();
  liveDateTime.textContent = new Intl.DateTimeFormat("de-DE", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  }).format(now);
}

function formatDateOnly(dateString) {
  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date(dateString));
}

function formatTimeOnly(dateString) {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit", minute: "2-digit"
  }).format(new Date(dateString));
}

function formatAmount(amount) {
  return `${Number(amount).toLocaleString("de-DE", {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  })} EUR`;
}

// ── Summary ───────────────────────────────────────────────────
function updateSummary(data) {
  const expenses = data
    .filter(i => i.type === "Ausgabe")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const incomes = data
    .filter(i => i.type === "Einnahme")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const balance = incomes - expenses;

  entryCount.textContent = data.length.toLocaleString("de-DE");
  expenseTotal.textContent = formatAmount(expenses);
  incomeTotal.textContent = formatAmount(incomes);
  balanceTotal.textContent = formatAmount(balance);
}

// ── Table ─────────────────────────────────────────────────────
function updateToggleButtonText() {
  toggleTableBtn.textContent = tableSection.classList.contains("hidden")
    ? "Tabelle anzeigen" : "Tabelle ausblenden";
}

async function renderTable() {
  const data = await getRecords();
  tableBody.innerHTML = "";

  if (!data.length) {
    const row = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.textContent = "Noch keine Einträge vorhanden.";
    td.style.textAlign = "center";
    td.style.color = "#9fb0cf";
    row.appendChild(td);
    tableBody.appendChild(row);
    return;
  }

  for (const item of data) {
    const row = document.createElement("tr");
    row.className = "row-pop";

    const typeBadge = document.createElement("span");
    typeBadge.className = `type-badge ${item.type === "Einnahme" ? "type-income" : "type-expense"}`;
    typeBadge.textContent = item.type;
    const typeTd = document.createElement("td");
    typeTd.appendChild(typeBadge);

    const amountTd = document.createElement("td");
    amountTd.className = `amount-cell ${item.type === "Einnahme" ? "amount-income" : "amount-expense"}`;
    amountTd.textContent = formatAmount(item.amount);

    const placeTd = document.createElement("td");
    placeTd.setAttribute("dir", "auto");
    placeTd.textContent = item.place;

    const itemsTd = document.createElement("td");
    itemsTd.className = "mixed-text";
    itemsTd.textContent = item.items;

    const dateTd = document.createElement("td");
    dateTd.className = "date-cell";
    dateTd.textContent = formatDateOnly(item.created_at);

    const timeTd = document.createElement("td");
    timeTd.className = "time-cell";
    timeTd.textContent = formatTimeOnly(item.created_at);

    const actionsTd = document.createElement("td");
    actionsTd.className = "action-buttons";

    const editBtn = document.createElement("button");
    editBtn.className = "small-btn";
    editBtn.textContent = "Bearbeiten";
    editBtn.addEventListener("click", () => startEdit(item));

    const delBtn = document.createElement("button");
    delBtn.className = "small-danger-btn";
    delBtn.textContent = "Löschen";
    delBtn.addEventListener("click", async () => {
      await deleteRecord(item.id);
      await refreshUI();
    });

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(delBtn);

    row.append(typeTd, amountTd, placeTd, itemsTd, dateTd, timeTd, actionsTd);
    tableBody.appendChild(row);
  }
}

async function refreshUI() {
  const data = await getRecords();
  updateSummary(data);
  if (!tableSection.classList.contains("hidden")) {
    await renderTable();
  }
}

// ── Form ──────────────────────────────────────────────────────
function resetFormToCreateMode() {
  form.reset();
  recordIdInput.value = "";
  formHeadline.textContent = "Neuen Eintrag erfassen";
  saveBtn.textContent = "Eintrag speichern";
  cancelEditBtn.classList.add("hidden");
}

function startEdit(item) {
  recordIdInput.value = item.id;
  typeInput.value = item.type;
  amountInput.value = item.amount;
  placeInput.value = item.place;
  itemsInput.value = item.items;
  dateInput.value = item.created_at.slice(0, 10);
  formHeadline.textContent = "Eintrag bearbeiten";
  saveBtn.textContent = "Änderungen speichern";
  cancelEditBtn.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = recordIdInput.value;
  const payload = {
    type: typeInput.value,
    amount: parseFloat(amountInput.value),
    place: placeInput.value.trim(),
    items: itemsInput.value.trim(),
    created_at: dateInput.value
      ? `${dateInput.value}T12:00:00`
      : new Date().toISOString(),
  };

  try {
    if (id) {
      await updateRecord(id, payload);
      setStatus("Eintrag erfolgreich bearbeitet.");
    } else {
      await createRecord(payload);
      setStatus("Eintrag erfolgreich gespeichert.");
    }
    resetFormToCreateMode();
    await refreshUI();
  } catch (e) {
    setStatus("Fehler: " + e.message);
  }
});

cancelEditBtn.addEventListener("click", () => {
  resetFormToCreateMode();
  setStatus("Bearbeitung abgebrochen.");
});

toggleTableBtn.addEventListener("click", async () => {
  tableSection.classList.toggle("hidden");
  updateToggleButtonText();
  if (!tableSection.classList.contains("hidden")) {
    await renderTable();
    tableSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

clearBtn.addEventListener("click", async () => {
  if (!confirm("Möchtest du wirklich alle Einträge löschen?")) return;
  await deleteAllRecords();
  resetFormToCreateMode();
  setStatus("Alle Einträge wurden gelöscht.");
  await refreshUI();
});

// ── CSV Export ────────────────────────────────────────────────
function escapeCSV(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

exportBtn.addEventListener("click", async () => {
  const data = await getRecords();
  if (!data.length) { setStatus("Keine Daten für den Export."); return; }

  const headers = ["Typ", "Betrag", "Ort / Geschäft", "Beschreibung", "Datum", "Uhrzeit"];
  const rows = data.map(i => [
    i.type, Number(i.amount).toFixed(2), i.place, i.items,
    formatDateOnly(i.created_at), formatTimeOnly(i.created_at)
  ]);

  const csv = [headers, ...rows].map(r => r.map(escapeCSV).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `buchungen-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setStatus("Export erfolgreich erstellt.");
});

// ── PDF ───────────────────────────────────────────────────────
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://unpkg.com/pdfjs-dist@2.6.347/build/pdf.worker.min.js";
}

readPdfBtn.addEventListener("click", async () => {
  const file = pdfFileInput.files[0];
  if (!file) { setPdfStatus("Bitte zuerst eine PDF-Datei auswählen."); return; }
  setPdfStatus("PDF wird gelesen ...");
  try {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(x => x.str).join("\n") + "\n";
    }
    setPdfStatus("PDF erfolgreich gelesen. Bitte Daten prüfen.");
  } catch {
    setPdfStatus("PDF konnte nicht verarbeitet werden.");
  }
});

// ── Init ──────────────────────────────────────────────────────
window.addEventListener("load", async () => {
  updateLiveDateTime();
  setInterval(updateLiveDateTime, 30000);

  if (isLoggedIn()) {
    showApp();
    await refreshUI();
  } else {
    showLogin();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}