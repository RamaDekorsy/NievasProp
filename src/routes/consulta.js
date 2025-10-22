import express from 'express';
import { crearConsulta, obtenerConsultas, responderConsulta } from '../controllers/consultaController.js';

const router = express.Router();

// 🔹 Mantener todo en /api/consulta
router.post('/', crearConsulta);
router.get('/', obtenerConsultas);
router.post('/:id/responder', responderConsulta);

export default router;

// fetch('/api/inquiries').then(r=>r.json()).then(console.log)
