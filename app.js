const DB_NAME = "expense_tracker_db";
const STORE_NAME = "records";
const DB_VERSION = 3;


const form = document.getElementById("expenseForm");
const recordIdInput = document.getElementById("recordId");
const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const placeInput = document.getElementById("place");
const itemsInput = document.getElementById("items");
const dateInput = document.getElementById("dateInput");


const csvFileInput = document.getElementById("csvFileInput");
const importCsvBtn = document.getElementById("importCsvBtn");
const csvStatusText = document.getElementById("csvStatusText");
const statusText = document.getElementById("statusText");
const liveDateTime = document.getElementById("liveDateTime");


const pdfFileInput = document.getElementById("pdfFileInput");
const readPdfBtn = document.getElementById("readPdfBtn");
const pdfStatusText = document.getElementById("pdfStatusText");


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


let deferredInstallPrompt = null;
const installBtn = document.getElementById("installBtn");


window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installBtn.classList.remove("hidden");
});


installBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;


  await deferredInstallPrompt.prompt();
  deferredInstallPrompt = null;
  installBtn.classList.add("hidden");
});


window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installBtn.classList.add("hidden");
});


window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installBtn.classList.add("hidden");
});


const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isInStandaloneMode = window.navigator.standalone === true;


if (isIos && !isInStandaloneMode) {
  installBtn.classList.remove("hidden");
  installBtn.textContent = "App installieren (Anleitung)";


  installBtn.addEventListener("click", () => {
    alert(
      'So installierst du CashTrack auf iOS:\n\n' +
      '1. Tippe auf das Teilen-Symbol (□↑) unten in Safari\n' +
      '2. Scrolle nach unten\n' +
      '3. Tippe auf „Zum Home-Bildschirm"\n' +
      '4. Tippe oben rechts auf „Hinzufügen"'
    );
  });
}



if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://unpkg.com/pdfjs-dist@2.6.347/build/pdf.worker.min.js";
} else {
  console.error("pdf.js not loaded");
}


function setStatus(text = "") {
  statusText.textContent = text;
}


function setPdfStatus(text = "") {
  pdfStatusText.textContent = text;
}
function setCsvStatus(text = "") {
  csvStatusText.textContent = text;
}


function updateLiveDateTime() {
  const now = new Date();
  liveDateTime.textContent = new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(now);
}


function formatDateOnly(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}


function formatTimeOnly(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
function splitCsvLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;


  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];


    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }


  result.push(current);
  return result.map(value => value.trim());
}


function parseCsvText(csvText) {
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let insideQuotes = false;

  const text = csvText
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
      continue;
    }

    if (char === "\n" && !insideQuotes) {
      currentRow.push(currentField.trim());

      if (currentRow.some(value => value !== "")) {
        rows.push(currentRow);
      }

      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += char;
  }

  currentRow.push(currentField.trim());
  if (currentRow.some(value => value !== "")) {
    rows.push(currentRow);
  }

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0];

  return rows.slice(1).map(rowValues => {
    const row = {};

    headers.forEach((header, index) => {
      row[header] = rowValues[index] ?? "";
    });

    return row;
  });
}


function buildCreatedAtFromCsv(dateText, timeText) {
  let isoDate = "";


  const dateMatch = (dateText || "").match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dateMatch) {
    const [, dd, mm, yyyy] = dateMatch;
    isoDate = `${yyyy}-${mm}-${dd}`;
  } else {
    isoDate = new Date().toISOString().slice(0, 10);
  }


  const safeTime = (timeText && /^\d{2}:\d{2}/.test(timeText)) ? `${timeText}:00` : "12:00:00";
  return `${isoDate}T${safeTime}`;
}


function normalizeType(typeText) {
  const value = (typeText || "").trim().toLowerCase();


  if (value === "einnahme" || value === "income") return "Einnahme";
  return "Ausgabe";
}


function mapCsvRowToRecord(row) {
  const type = normalizeType(row["Typ"] || row["type"]);
  const amountText = row["Betrag"] || row["amount"] || "0";
  const place = row["Ort / Geschäft"] || row["Ort"] || row["place"] || "";
  const items = row["Beschreibung"] || row["Gekaufte Sache(n)"] || row["items"] || "";
  const dateText = row["Datum"] || row["date"] || "";
  const timeText = row["Uhrzeit"] || row["time"] || "";


  const amount = parseGermanAmount(String(amountText).replace(".", ",").replace(/[^\d,.-]/g, ""));


  return {
    type,
    amount: amount ?? 0,
    place: place.trim(),
    items: items.trim(),
    createdAt: buildCreatedAtFromCsv(dateText, timeText)
  };
}
function formatAmount(amount) {
  return `${Number(amount).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} EUR`;
}
async function importCsvFile() {
  const file = csvFileInput.files[0];


  if (!file) {
    setCsvStatus("Bitte zuerst eine CSV-Datei auswählen.");
    return;
  }


  try {
    setCsvStatus("CSV wird importiert ...");


    const text = await file.text();
    const rows = parseCsvText(text);


    if (!rows.length) {
      setCsvStatus("Die CSV-Datei enthält keine importierbaren Daten.");
      return;
    }


    let importedCount = 0;


    for (const row of rows) {
      const record = mapCsvRowToRecord(row);


      if (!record.amount || !record.place || !record.items) {
        continue;
      }


      await addRecord(record);
      importedCount++;
    }


    await refreshUI();


    if (importedCount > 0) {
      setCsvStatus(`${importedCount} Einträge erfolgreich importiert.`);
      setStatus("CSV-Import erfolgreich abgeschlossen.");
    } else {
      setCsvStatus("Keine gültigen Einträge in der CSV gefunden.");
    }
  } catch (error) {
    console.error(error);
    setCsvStatus("CSV konnte nicht verarbeitet werden.");
  }
}


function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);


    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);


    request.onupgradeneeded = (event) => {
      const db = event.target.result;


      if (db.objectStoreNames.contains("expenses") && !db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore("expenses");
      }


      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true
        });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("type", "type", { unique: false });
      }
    };
  });
}


async function addRecord(record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(record);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}


async function updateRecord(record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}


async function deleteRecord(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}


async function getRecordById(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}


async function getAllRecords() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();


    request.onsuccess = () => {
      const data = request.result.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      resolve(data);
    };


    request.onerror = () => reject(request.error);
  });
}


async function clearAllRecords() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}


function createCell(text, className = "", dirAuto = false, preserveLines = false) {
  const td = document.createElement("td");


  if (preserveLines) {
    td.textContent = text;
  } else {
    td.textContent = text;
  }


  if (className) td.className = className;
  if (dirAuto) td.setAttribute("dir", "auto");


  return td;
}


function createTypeBadge(type) {
  const span = document.createElement("span");
  span.className = `type-badge ${type === "Einnahme" ? "type-income" : "type-expense"}`;
  span.textContent = type;
  return span;
}


function updateToggleButtonText() {
  const isHidden = tableSection.classList.contains("hidden");
  toggleTableBtn.textContent = isHidden ? "Tabelle anzeigen" : "Tabelle ausblenden";
}


function escapeCSV(value) {
  const safe = String(value ?? "").replace(/"/g, '""');
  return `"${safe}"`;
}


async function exportCSV() {
  const data = await getAllRecords();


  if (!data.length) {
    setStatus("Es gibt noch keine Daten für den Export.");
    return;
  }


  const headers = [
    "Typ",
    "Betrag",
    "Ort / Geschäft",
    "Beschreibung",
    "Datum",
    "Uhrzeit"
  ];


  const rows = data.map((item) => [
    item.type,
    Number(item.amount).toFixed(2),
    item.place,
    item.items,
    formatDateOnly(item.createdAt),
    formatTimeOnly(item.createdAt)
  ]);


  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(","))
  ].join("\n");


  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], {
    type: "text/csv;charset=utf-8;"
  });


  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `buchungen-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);


  setStatus("Export erfolgreich erstellt.");
}


function updateSummary(data) {
  const expenses = data
    .filter((item) => item.type === "Ausgabe")
    .reduce((sum, item) => sum + Number(item.amount), 0);


  const incomes = data
    .filter((item) => item.type === "Einnahme")
    .reduce((sum, item) => sum + Number(item.amount), 0);


  const balance = incomes - expenses;


  entryCount.textContent = data.length.toLocaleString("de-DE");
  expenseTotal.textContent = formatAmount(expenses);
  incomeTotal.textContent = formatAmount(incomes);
  balanceTotal.textContent = formatAmount(balance);
}


async function renderTable() {
  const data = await getAllRecords();
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
  } else {
    data.forEach((item, index) => {
      const row = document.createElement("tr");
      if (index === 0) row.classList.add("row-pop");


      const typeTd = document.createElement("td");
      typeTd.appendChild(createTypeBadge(item.type));


      const amountTd = document.createElement("td");
      amountTd.textContent = formatAmount(item.amount);
      amountTd.className = `amount-cell ${item.type === "Einnahme" ? "amount-income" : "amount-expense"}`;


      row.appendChild(typeTd);
      row.appendChild(amountTd);
      row.appendChild(createCell(item.place, "mixed-text", true));
      row.appendChild(createCell(item.items, "mixed-text multiline-text", true, true));
      row.appendChild(createCell(formatDateOnly(item.createdAt), "date-cell"));
      row.appendChild(createCell(formatTimeOnly(item.createdAt), "time-cell"));


      const actionsTd = document.createElement("td");
      const actionsWrap = document.createElement("div");
      actionsWrap.className = "action-buttons";


      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "small-btn";
      editBtn.textContent = "Bearbeiten";
      editBtn.addEventListener("click", () => startEdit(item.id));


      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "small-danger-btn";
      deleteBtn.textContent = "Löschen";
      deleteBtn.addEventListener("click", async () => {
        const ok = window.confirm("Diesen Eintrag wirklich löschen?");
        if (!ok) return;
        await deleteRecord(item.id);
        setStatus("Eintrag gelöscht.");
        await refreshUI();
      });


      actionsWrap.appendChild(editBtn);
      actionsWrap.appendChild(deleteBtn);
      actionsTd.appendChild(actionsWrap);
      row.appendChild(actionsTd);


      tableBody.appendChild(row);
    });
  }


  updateSummary(data);
}


async function refreshUI() {
  await renderTable();
  updateToggleButtonText();
}


function resetFormToCreateMode() {
  form.reset();
  recordIdInput.value = "";
  typeInput.value = "Ausgabe";
  dateInput.value = "";
  formHeadline.textContent = "Neuen Eintrag erfassen";
  saveBtn.textContent = "Eintrag speichern";
  cancelEditBtn.classList.add("hidden");
}


async function startEdit(id) {
  const record = await getRecordById(id);
  if (!record) return;


  recordIdInput.value = record.id;
  typeInput.value = record.type;
  amountInput.value = record.amount;
  placeInput.value = record.place;
  itemsInput.value = record.items;
  dateInput.value = record.createdAt ? record.createdAt.slice(0, 10) : "";


  formHeadline.textContent = "Eintrag bearbeiten";
  saveBtn.textContent = "Änderungen speichern";
  cancelEditBtn.classList.remove("hidden");


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  setStatus("Bearbeitungsmodus aktiv.");
}


function buildRecordFromForm() {
  return {
    id: recordIdInput.value ? Number(recordIdInput.value) : undefined,
    type: typeInput.value,
    amount: Number(amountInput.value),
    place: placeInput.value.trim(),
    items: itemsInput.value.trim(),
    dateOnly: dateInput.value
  };
}


function validateRecord(record) {
  if (!record.type) {
    setStatus("Bitte einen Typ auswählen.");
    return false;
  }


  if (!record.amount || record.amount <= 0) {
    setStatus("Bitte einen gültigen Betrag eingeben.");
    return false;
  }


  if (!record.place) {
    setStatus("Bitte einen Ort oder ein Geschäft eingeben.");
    return false;
  }


  if (!record.items) {
    setStatus("Bitte eine Beschreibung eingeben.");
    return false;
  }


  return true;
}


function normalizeSpaces(text) {
  return text.replace(/\s+/g, " ").trim();
}


function linesFromPdfText(text) {
  return text
    .split(/\r?\n/)
    .map((line) => normalizeSpaces(line))
    .filter(Boolean);
}


function findStoreName(lines) {
  for (const line of lines) {
    if (
      /markt|rewe|lidl|aldi|dm|rossmann|edeka|penny|netto|kaufland|ikea|saturn|mediamarkt|apotheke|restaurant|cafe|bäckerei/i.test(line)
    ) {
      return line;
    }
  }


  return lines[0] || "";
}


function parseGermanAmount(amountText) {
  if (!amountText) return null;
  const cleaned = amountText.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}


function findTotalAmount(lines) {
  const totalPriorityPatterns = [
    /summe(?:\s+eur)?[:\s]*([\d.,]+)/i,
    /gesamtbetrag[:\s]*([\d.,]+)/i,
    /betrag(?:\s+eur)?[:\s]*([\d.,]+)/i,
    /zu zahlen[:\s]*([\d.,]+)/i,
    /total[:\s]*([\d.,]+)/i
  ];


  for (const pattern of totalPriorityPatterns) {
    for (const line of lines) {
      const match = line.match(pattern);
      if (match) {
        const value = parseGermanAmount(match[1]);
        if (value !== null) return value;
      }
    }
  }


  for (let i = lines.length - 1; i >= 0; i--) {
    const matches = [...lines[i].matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/g)];
    if (matches.length) {
      const last = matches[matches.length - 1][1];
      const value = parseGermanAmount(last);
      if (value !== null) return value;
    }
  }


  return null;
}


function findDateInLines(lines) {
  for (const line of lines) {
    const match = line.match(/(\d{2}\.\d{2}\.\d{4})/);
    if (match) return match[1];
  }
  return "";
}


function germanDateToInputValue(dateText) {
  if (!dateText) return "";
  const match = dateText.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return "";
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}


function isItemLine(line) {
  const cleaned = line.trim();


  if (!cleaned) return false;


  if (
    /summe|gesamtbetrag|betrag|bezahlung|approved|mastercard|debit|steuer|brutto|netto|trace|beleg|uhrzeit|datum|terminal|kontakt|contactless|kund(en)?beleg|tse-|bonus|guthaben|rabatte|markt:|kasse:|bed\.|telefon|www\.|uid|nr\.|start|stop|signatur|aktion|coupon|vorteile|zahlung|gezahl|approved|mit diesem einkauf|aktuelles bonus-guthaben|sammle noch mehr|keine rabatte|deine rewe bonus-vorteile/i.test(cleaned)
  ) {
    return false;
  }


  if (/^[A-Z]=\s*\d+,\d+%/i.test(cleaned)) {
    return false;
  }


  if (!/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/.test(cleaned)) {
    return false;
  }


  if (cleaned.length < 4) {
    return false;
  }


  return true;
}


function extractItems(lines) {
  const itemLines = [];


  for (const line of lines) {
    if (!isItemLine(line)) continue;


    let cleaned = line
      .replace(/\s+[A-Z]$/, "")
      .replace(/\s{2,}/g, " ")
      .trim();


    if (/^[A-Z]=\s*\d+,\d+%/i.test(cleaned)) continue;
    if (/mit diesem einkauf/i.test(cleaned)) continue;
    if (/bonus/i.test(cleaned)) continue;


    if (cleaned) itemLines.push(cleaned);
  }


  const unique = [];
  for (const item of itemLines) {
    if (!unique.includes(item)) unique.push(item);
  }


  return unique;
}


function buildDescriptionFromItems(items) {
  if (!items.length) return "";
  return items.map(item => `• ${item}`).join("\n");
}



async function extractTextFromPdf(file) {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;


  let fullText = "";


  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const strings = textContent.items.map((item) => item.str);
    fullText += strings.join("\n") + "\n";
  }


  return fullText;
}


function fillFormFromPdfData(data) {
  typeInput.value = "Ausgabe";


  if (data.amount !== null) {
    amountInput.value = data.amount;
  }


  if (data.store) {
    placeInput.value = data.store;
  }


  if (data.dateInputValue) {
    dateInput.value = data.dateInputValue;
  }


  if (data.description) {
    itemsInput.value = data.description;
  }
}


async function readPdfAndFillForm() {
  const file = pdfFileInput.files[0];


  if (!file) {
    setPdfStatus("Bitte zuerst eine PDF-Datei auswählen.");
    return;
  }


  if (!window.pdfjsLib) {
    setPdfStatus("PDF-Bibliothek konnte nicht geladen werden.");
    return;
  }


  try {
    setPdfStatus("PDF wird gelesen ...");


    const rawText = await extractTextFromPdf(file);
    const lines = linesFromPdfText(rawText);


    if (!lines.length) {
      setPdfStatus("Kein lesbarer Text in der PDF gefunden.");
      return;
    }


    const store = findStoreName(lines);
    const amount = findTotalAmount(lines);
    const dateText = findDateInLines(lines);
    const dateInputValue = germanDateToInputValue(dateText);
    const items = extractItems(lines);
    const description = buildDescriptionFromItems(items);


    fillFormFromPdfData({
      store,
      amount,
      dateInputValue,
      description
    });


    const extractedSummary = [
      store ? `Ort erkannt: ${store}` : "Ort nicht sicher erkannt",
      amount !== null ? `Betrag erkannt: ${formatAmount(amount)}` : "Betrag nicht sicher erkannt",
      dateText ? `Datum erkannt: ${dateText}` : "Datum nicht erkannt",
      items.length ? `${items.length} Artikel erkannt` : "Keine Artikel erkannt"
    ].join(" | ");


    setPdfStatus(extractedSummary);
    setStatus("PDF erfolgreich eingelesen. Bitte Daten kurz prüfen und dann speichern.");
  } catch (error) {
    console.error(error);
    setPdfStatus("PDF konnte nicht verarbeitet werden.");
  }
}


form.addEventListener("submit", async (event) => {
  event.preventDefault();


  const formData = buildRecordFromForm();


  if (!validateRecord(formData)) {
    return;
  }


  if (formData.id) {
    const oldRecord = await getRecordById(formData.id);
    if (!oldRecord) {
      setStatus("Der Eintrag wurde nicht gefunden.");
      return;
    }


    let createdAt = oldRecord.createdAt;


    if (formData.dateOnly) {
      const oldTime = oldRecord.createdAt.slice(11, 19) || "12:00:00";
      createdAt = `${formData.dateOnly}T${oldTime}`;
    }


    const updatedRecord = {
      ...oldRecord,
      type: formData.type,
      amount: formData.amount,
      place: formData.place,
      items: formData.items,
      createdAt
    };


    await updateRecord(updatedRecord);
    setStatus("Eintrag erfolgreich bearbeitet.");
  } else {
    const now = new Date();
    let createdAt = now.toISOString();


    if (formData.dateOnly) {
      createdAt = `${formData.dateOnly}T${now.toTimeString().slice(0, 8)}`;
    }


    const newRecord = {
      type: formData.type,
      amount: formData.amount,
      place: formData.place,
      items: formData.items,
      createdAt
    };


    await addRecord(newRecord);
    setStatus("Eintrag erfolgreich gespeichert.");
  }


  resetFormToCreateMode();
  setPdfStatus("");
  updateLiveDateTime();
  await refreshUI();
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
    tableSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
});


exportBtn.addEventListener("click", async () => {
  await exportCSV();
});


clearBtn.addEventListener("click", async () => {
  const ok = window.confirm("Möchtest du wirklich alle Einträge löschen?");
  if (!ok) return;


  await clearAllRecords();
  resetFormToCreateMode();
  setPdfStatus("");
  setStatus("Alle Einträge wurden gelöscht.");
  await refreshUI();
});


readPdfBtn.addEventListener("click", async () => {
  await readPdfAndFillForm();
});


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
importCsvBtn.addEventListener("click", async () => {
  await importCsvFile();
});


window.addEventListener("load", async () => {
  resetFormToCreateMode();
  updateLiveDateTime();
  setInterval(updateLiveDateTime, 30000);
  await refreshUI();
});