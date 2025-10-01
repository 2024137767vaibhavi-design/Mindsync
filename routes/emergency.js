import express from "express";

const router = express.Router();
const contacts = [];

router.post("/contacts", (req, res) => {
  const { name, phone, relationship } = req.body;
  if (!name || !phone || !relationship) {
    return res.status(400).json({ error: "All fields are required" });
  }

  contacts.push({ name, phone, relationship });
  res.json({ message: "Contact saved", contact: { name, phone, relationship } });
});

router.get("/contacts", (req, res) => {
  res.json(contacts);
});

export default router;