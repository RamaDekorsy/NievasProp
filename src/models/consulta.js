import mongoose from 'mongoose';

const consultaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  telefono: { type: String, trim: true },
  asunto: { type: String, trim: true },
  mensaje: { type: String, required: true, trim: true },
  respondido: { type: Boolean, default: false },
  respuesta: { type: String, trim: true },
  fecha: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Consulta', consultaSchema);

// fetch('/api/inquiries').then(r=>r.json()).then(console.log)
