const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB Atlas connection ---
mongoose.connect(
  "mongodb+srv://Cyfuture:cyfuture_mongodb%4012@cyfuturecluster.wknbw2a.mongodb.net/docdb?retryWrites=true&w=majority&appName=CyfutureCluster"
)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Mongoose Schemas & Models ---
// Contract Analyzer Collection
const ContractSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  uploadedAt: { type: Date, default: Date.now },
});
const Contract = mongoose.model("Contract", ContractSchema, "contracts");

// Case Predictor Collection
const CaseSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  uploadedAt: { type: Date, default: Date.now },
});
const Case = mongoose.model("Case", CaseSchema, "cases");

// If you want another collection later (example: "summaries")
// just add another schema here.
const SummarySchema = new mongoose.Schema({
  text: String,
  createdAt: { type: Date, default: Date.now },
});
const Summary = mongoose.model("Summary", SummarySchema, "summaries");

// --- Multer setup (memory storage) ---
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ================= Routes =================

// ---------- Contract Analyzer ----------
app.post("/upload-contract", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");

    const doc = new Contract({
      filename: req.file.buffer.toString("base64"),
      originalName: req.file.originalname,
    });

    await doc.save();
    res.json({ success: true, message: "Contract uploaded successfully", doc });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error (contract upload)");
  }
});

app.get("/contracts", async (req, res) => {
  try {
    const docs = await Contract.find();
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching contracts");
  }
});

// ---------- Case Predictor ----------
app.post("/upload-case", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");

    const doc = new Case({
      filename: req.file.buffer.toString("base64"),
      originalName: req.file.originalname,
    });

    await doc.save();
    res.json({ success: true, message: "Case uploaded successfully", doc });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error (case upload)");
  }
});

app.get("/cases", async (req, res) => {
  try {
    const docs = await Case.find();
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching cases");
  }
});

// ---------- Example: Summaries ----------
app.post("/add-summary", async (req, res) => {
  try {
    const { text } = req.body;
    const summary = new Summary({ text });
    await summary.save();
    res.json({ success: true, summary });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving summary");
  }
});

app.get("/summaries", async (req, res) => {
  try {
    const summaries = await Summary.find();
    res.json(summaries);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching summaries");
  }
});

// --- Start Server ---
app.listen(5000, () =>
  console.log("🚀 Server running on http://localhost:5000")
);