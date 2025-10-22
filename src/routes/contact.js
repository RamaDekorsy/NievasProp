import express from "express";
import { createContact, getContacts, responderContacto } from "../controllers/contactController.js";

const router = express.Router();

router.post("/", createContact);             // POST /api/contact
router.get("/", getContacts);               // GET /api/contact
router.post("/:id/responder", responderContacto); // POST /api/contact/:id/responder

export default router;

