import express from "express";
import { createEntry, getEntries, deleteEntry } from "../controllers/journalController.js";

const router = express.Router();

router.get("/", getEntries);
router.post("/", createEntry);
router.delete("/:id", deleteEntry);

export default router;
