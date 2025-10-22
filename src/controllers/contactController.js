import Contact from "../models/contact.js";

// Crea un contacto y lo guarda en  el MongoDB
export const createContact = async (req, res) => {
  try {
    const contact = new Contact({
      nombre: req.body.nombre,
      email: req.body.email,
      asunto: req.body.asunto || "-",
      telefono: req.body.telefono || "-",     
      mensaje: req.body.mensaje,
      respondido: false,
      respuesta: ""
    });

    await contact.save();
    res.status(201).json({ ok: true, contacto: contact });
  } catch (err) {
    console.error("Error al guardar contacto:", err);
    res.status(500).json({ ok: false, msg: "Error al guardar contacto" });
  }
};

// Obtiene todos los contactos guardados
export const getContacts = async (req, res) => {
  try {
    const contactos = await Contact.find().sort({ createdAt: -1 });
    res.json(contactos);
  } catch (err) {
    console.error("Error al obtener contactos:", err);
    res.status(500).json({ ok: false, msg: "Error al obtener contactos" });
  }
};

// Marcar un contacto como respondido
export const responderContacto = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ ok: false, msg: "Contacto no encontrado" });

    contact.respondido = true;
    contact.respuesta = req.body.respuesta;
    await contact.save();

    res.json({ ok: true, contacto: contact });
  } catch (err) {
    console.error("Error al responder contacto:", err);
    res.status(500).json({ ok: false, msg: "Error al responder contacto" });
  }
};

