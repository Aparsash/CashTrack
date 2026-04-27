# 💸 Ausgaben Tracker (Expense & Income App)

Ein moderner, responsiver Web-App (PWA) zur Verwaltung von Ausgaben und Einnahmen – direkt im Browser oder installierbar auf dem Smartphone.

---

## ✨ Features

- 📱 Responsive Design (Desktop & Mobile)
- 💾 Lokale Speicherung mit IndexedDB (keine Cloud nötig)
- ➕ Einträge erstellen (Ausgabe & Einnahme)
- ✏️ Einträge bearbeiten (Edit-Funktion)
- ❌ Einträge löschen (einzeln oder komplett)
- 📊 Automatische Zusammenfassung:
  - Gesamtausgaben
  - Gesamteinnahmen
  - Saldo (Balance)
- 📅 Automatische Speicherung von Datum & Uhrzeit
- 📄 Export als CSV (Excel-kompatibel)
- 🌍 Unterstützung für gemischte Eingaben:
  - Deutsch
  - Persisch (RTL/LTR korrekt behandelt)
- 📲 Installierbar als App (PWA)
- ⚡ Offline nutzbar (Service Worker)

---

## 🧠 Technologien

- HTML5
- CSS3 (Modern UI + Animationen)
- Vanilla JavaScript
- IndexedDB (lokale Datenbank im Browser)
- Service Worker (Offline Support)
- Web App Manifest (Installierbarkeit)

---

## 🚀 Live Demo

👉 https://USERNAME.github.io/expense-app/

---

## 📦 Installation (lokal)

```bash
git clone https://github.com/USERNAME/expense-app.git
cd expense-app
Dann:

👉 Öffne index.html im Browser
```

📲 Installation als App (Android)
Öffne die App im Browser (Chrome empfohlen)
Menü (⋮ oben rechts)
Klick auf:
"App installieren"
oder "Zum Startbildschirm hinzufügen"
Fertig → App erscheint wie eine native Anwendung

---

📁 Projektstruktur
expense-app/
│
├── index.html # UI Struktur
├── style.css # Styling & Animationen
├── app.js # Logik & Datenverwaltung
├── manifest.json # PWA Konfiguration
├── sw.js # Service Worker (Offline)
└── icons/
├── icon-192.png
└── icon-512.png

---

🧾 Datenstruktur

Jeder Eintrag wird so gespeichert:
{
"type": "Ausgabe oder Einnahme",
"amount": 12.50,
"place": "Rewe ",
"items": "Milch, Brot",
"createdAt": "2026-04-03T12:00:00.000Z"
}

---

## 📊 Funktionsweise

### ➕ Eintrag erstellen

- Typ wählen (**Ausgabe / Einnahme**)
- Betrag eingeben
- Ort und Beschreibung hinzufügen
- Datum und Uhrzeit werden automatisch gespeichert

### ✏️ Eintrag bearbeiten

- Klick auf **"Bearbeiten"**
- Daten erscheinen im Formular
- Änderungen speichern

### ❌ Eintrag löschen

- Einzelne Einträge löschen möglich
- Oder alle Daten auf einmal löschen

---

## 📤 CSV Export (Excel)

- Exportiert alle Daten als `.csv`
- Öffnet direkt in Excel
- UTF-8 + BOM → unterstützt Persisch korrekt

### Enthält folgende Felder:

- Typ
- Betrag
- Ort
- Beschreibung
- Datum
- Uhrzeit

---

## ⚠️ Hinweise

- Alle Daten werden **nur lokal im Browser gespeichert**
- Kein Server / keine Cloud
- Wenn Browserdaten gelöscht werden → Daten gehen verloren
- 100% offline nutzbar

---

## 🛠️ Zukünftige Erweiterungen

- 🔍 Suche & Filter (nach Datum, Typ, etc.)
- 📊 Diagramme (Charts für Ausgaben/Einnahmen)
- 📅 Monatsübersicht
- 🏷️ Kategorien (Food, Rent, etc.)
- ☁️ Cloud Sync (optional)
- 🔐 Login-System

---

## 👨‍💻 Autor

Erstellt von **Aparsash.dev**
