// backend/api/index.js
const express = require('express');
const router = express.Router();

let mongoose = null;
try { mongoose = require('mongoose'); } catch {}

// --- Model (Contact) ---
let Contact = null;
if (mongoose) {
  const ContactSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    message: String,
    propertyId: String,
    createdAt: { type: Date, default: Date.now }
  }, { versionKey: false });
  Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
}

// API health
router.get('/health', (req, res) => {
  res.json({ api: true, ts: Date.now() });
});

// Receive contact form
router.post('/contact', async (req, res) => {
  try {
    const payload = {
      name: req.body?.name || '',
      email: req.body?.email || '',
      phone: req.body?.phone || '',
      message: req.body?.message || '',
      propertyId: req.body?.propertyId || ''
    };

    // Save to Mongo if connected
    if (Contact && mongoose?.connection?.readyState === 1) {
      await Contact.create(payload);
    }

    // Send email via Gmail if env available
    let nodemailer = null;
    try { nodemailer = require('nodemailer'); } catch {}
    if (nodemailer && process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
      });

      const to = process.env.MAIL_TO || process.env.GMAIL_USER;
      await transporter.sendMail({
        from: `"Propiedades Nievas" <${process.env.GMAIL_USER}>`,
        to,
        subject: `Consulta web ${payload.propertyId ? `- Propiedad ${payload.propertyId}` : ''}`,
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif">
            <h3>Nueva consulta desde la web</h3>
            <p><b>Nombre:</b> ${payload.name || '-'}</p>
            <p><b>Email:</b> ${payload.email || '-'}</p>
            <p><b>Teléfono:</b> ${payload.phone || '-'}</p>
            <p><b>Propiedad:</b> ${payload.propertyId || '-'}</p>
            <p><b>Mensaje:</b><br>${(payload.message || '').replace(/\n/g,'<br>')}</p>
            <hr><small>Enviado automáticamente</small>
          </div>
        `
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/contact error:', err);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

module.exports = router;
