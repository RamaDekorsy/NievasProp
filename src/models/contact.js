import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true },
  asunto: { type: String, default: "-" },
  telefono: { type: String, default: "-" },   
  mensaje: { type: String, required: true },
  respondido: { type: Boolean, default: false },
  respuesta: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Contact", contactSchema);
