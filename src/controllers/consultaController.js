import Consulta from '../models/consulta.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
});

export const crearConsulta = async (req, res, next) => {
  try {
    const consulta = new Consulta(req.body);
    await consulta.save();

    await transporter.sendMail({
      from: `"Inmobiliaria" <${req.body.email}>`,
      to: process.env.MAIL_USER,
      subject: `Nueva consulta: ${req.body.asunto || 'Sin asunto'}`,
      text: `
Nombre: ${req.body.nombre}
Email: ${req.body.email}
Teléfono: ${req.body.telefono}
Mensaje: ${req.body.mensaje}`
    });

    res.status(201).json({ ok: true, msg: 'Consulta enviada' });
  } catch (err) { next(err); }
};

export const obtenerConsultas = async (req, res, next) => {
  try {
    const consultas = await Consulta.find().sort({ fecha: -1 });
    res.json(consultas);
  } catch (err) { next(err); }
};

export const responderConsulta = async (req, res, next) => {
  try {
    const consulta = await Consulta.findById(req.params.id);
    if (!consulta) return res.status(404).json({ ok: false, msg: 'No encontrada' });

    consulta.respondido = true;
    consulta.respuesta = req.body.respuesta;
    await consulta.save();

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: consulta.email,
      subject: 'Respuesta a tu consulta - Inmobiliaria',
      text: req.body.respuesta
    });

    res.json({ ok: true, msg: 'Respuesta enviada' });
  } catch (err) { next(err); }
};

// fetch('/api/inquiries').then(r=>r.json()).then(console.log)
