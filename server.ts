import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("nursing.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT,
    age INTEGER,
    gender TEXT,
    room TEXT,
    diagnosis TEXT,
    allergies TEXT,
    risk_flags TEXT -- JSON array
  );

  CREATE TABLE IF NOT EXISTS vitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT,
    temp REAL,
    hr INTEGER,
    rr INTEGER,
    bp_sys INTEGER,
    bp_dia INTEGER,
    spo2 INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_auto INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT,
    priority TEXT,
    reason TEXT,
    suggestions TEXT, -- JSON array
    status TEXT DEFAULT 'pending', -- pending, acknowledged
    is_ai INTEGER DEFAULT 1,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT,
    content TEXT,
    original_ai_content TEXT,
    nurse_id TEXT,
    status TEXT DEFAULT 'draft', -- draft, approved
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS intake_output (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT,
    type TEXT, -- intake, output
    source TEXT, -- oral, iv, urine, etc.
    volume REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    action TEXT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)").run("nurse1", "password", "Nurse", "Jane Doe, RN");
  db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)").run("charge1", "password", "Charge Nurse", "Sarah Smith, RN");
  db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)").run("admin1", "password", "Admin", "Admin User");

  db.prepare(`INSERT INTO patients (id, name, age, gender, room, diagnosis, allergies, risk_flags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    "P001", "John Miller", 65, "Male", "402-A", "Post-op Hip Replacement", "Penicillin", JSON.stringify(["Fall Risk"])
  );
  db.prepare(`INSERT INTO patients (id, name, age, gender, room, diagnosis, allergies, risk_flags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    "P002", "Alice Thompson", 72, "Female", "405-B", "Pneumonia", "N/A", JSON.stringify(["Sepsis Watch", "O2 Dependent"])
  );
  db.prepare(`INSERT INTO patients (id, name, age, gender, room, diagnosis, allergies, risk_flags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    "P003", "Robert Chen", 45, "Male", "408-C", "Acute Abdominal Pain", "Lactose", JSON.stringify(["NPO"])
  );
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.post("/api/login", (req, res) => {
    // Auth disabled: return a default user without checking credentials
    const user = db.prepare("SELECT * FROM users LIMIT 1").get() as any;
    if (user) {
      res.json({ id: user.id, username: user.username, role: user.role, name: user.name });
    } else {
      res.json({ id: 1, username: "demo", role: "Charge Nurse", name: "Demo User" });
    }
  });

  app.get("/api/patients", (req, res) => {
    const patients = db.prepare("SELECT * FROM patients").all();
    res.json(patients.map((p: any) => ({ ...p, risk_flags: JSON.parse(p.risk_flags) })));
  });

  app.get("/api/patients/:id", (req, res) => {
    const patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(req.params.id) as any;
    if (patient) {
      res.json({ ...patient, risk_flags: JSON.parse(patient.risk_flags) });
    } else {
      res.status(404).json({ error: "Patient not found" });
    }
  });

  app.get("/api/vitals/:patientId", (req, res) => {
    const vitals = db.prepare("SELECT * FROM vitals WHERE patient_id = ? ORDER BY timestamp DESC LIMIT 50").all(req.params.patientId);
    res.json(vitals);
  });

  app.post("/api/vitals", (req, res) => {
    const { patient_id, temp, hr, rr, bp_sys, bp_dia, spo2, is_auto } = req.body;
    db.prepare(`INSERT INTO vitals (patient_id, temp, hr, rr, bp_sys, bp_dia, spo2, is_auto) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      patient_id, temp, hr, rr, bp_sys, bp_dia, spo2, is_auto ? 1 : 0
    );
    res.json({ success: true });
  });

  app.get("/api/alerts/:patientId", (req, res) => {
    const alerts = db.prepare("SELECT * FROM alerts WHERE patient_id = ? ORDER BY timestamp DESC").all(req.params.patientId);
    res.json(alerts.map((a: any) => ({ ...a, suggestions: JSON.parse(a.suggestions) })));
  });

  app.post("/api/alerts", (req, res) => {
    const { patient_id, priority, reason, suggestions, is_ai } = req.body;
    db.prepare(`INSERT INTO alerts (patient_id, priority, reason, suggestions, is_ai) VALUES (?, ?, ?, ?, ?)`).run(
      patient_id, priority, reason, JSON.stringify(suggestions), is_ai ? 1 : 0
    );
    res.json({ success: true });
  });

  app.patch("/api/alerts/:id", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE alerts SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/notes/:patientId", (req, res) => {
    const notes = db.prepare("SELECT * FROM notes WHERE patient_id = ? ORDER BY timestamp DESC").all(req.params.patientId);
    res.json(notes);
  });

  app.post("/api/notes", (req, res) => {
    const { patient_id, content, original_ai_content, nurse_id, status } = req.body;
    db.prepare(`INSERT INTO notes (patient_id, content, original_ai_content, nurse_id, status) VALUES (?, ?, ?, ?, ?)`).run(
      patient_id, content, original_ai_content, nurse_id, status
    );
    res.json({ success: true });
  });

  app.get("/api/io/:patientId", (req, res) => {
    const data = db.prepare("SELECT * FROM intake_output WHERE patient_id = ? ORDER BY timestamp DESC").all(req.params.patientId);
    res.json(data);
  });

  app.post("/api/io", (req, res) => {
    const { patient_id, type, source, volume } = req.body;
    db.prepare(`INSERT INTO intake_output (patient_id, type, source, volume) VALUES (?, ?, ?, ?)`).run(
      patient_id, type, source, volume
    );
    res.json({ success: true });
  });

  app.get("/api/audit", (req, res) => {
    const logs = db.prepare("SELECT * FROM audit_log ORDER BY timestamp DESC").all();
    res.json(logs);
  });

  app.post("/api/audit", (req, res) => {
    const { user_id, action, details } = req.body;
    db.prepare(`INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)`).run(
      user_id, action, details
    );
    res.json({ success: true });
  });

  // Vite/Static Setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on http://localhost:3000");
  });
}

startServer();
