import express from "express";

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// added: log when the router file is loaded
console.log("[emergency router] initialized");

const contacts = [];

// added: simple health check
router.get("/health", (req, res) => {
  res.json({ ok: true, service: "emergency" });
});

router.post("/contacts", (req, res, next) => {
  try {
    const { name, phone, relationship } = req.body || {};
    if (!name || !phone || !relationship) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const trimmedName = String(name).trim();
    const normalizedPhone = String(phone).replace(/\D/g, "");
    const rel = String(relationship).trim();

    if (normalizedPhone.length < 7) {
      return res.status(400).json({ error: "Phone number is invalid" });
    }

    if (contacts.some(c => c.phone === normalizedPhone)) {
      return res.status(409).json({ error: "Contact with this phone already exists" });
    }

    const contact = { id: Date.now().toString(), name: trimmedName, phone: normalizedPhone, relationship: rel };
    contacts.push(contact);
    res.status(201).json({ message: "Contact saved", contact });
  } catch (err) {
    next(err);
  }
});

router.get("/contacts", (req, res, next) => {
  try {
    res.json(contacts);
  } catch (err) {
    next(err);
  }
});

// added: router-level error handler to return JSON errors
router.use((err, req, res, next) => {
  console.error("[emergency router] error:", err && err.stack ? err.stack : err);
  res.status(500).json({ error: "Internal server error" });
});

export default router;