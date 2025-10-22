import express from 'express'; //framework para crear el servidor
import dotenv from 'dotenv'; //Para manejar variables de entorno (.env)
import path from "path";   //Para manejar rutas de archivos
import cors from 'cors';   // Permite peticiones desde otros dominios (cors)
import connectDB from './config/db.js'; // Con esta funcion se conecta con la bdd en mongodb
import propertyRoutes from './routes/index.js'; // Ruta de propiedades
import contactRoutes from './routes/contact.js'; //ruta de 
import consultasRouter from './routes/consulta.js';
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// Necesario para __dirname en ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir carpeta "public" (HTML, CSS, JS frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api/index', propertyRoutes);
app.use('/api/contacto', contactRoutes); // ya guarda mensajes de formulario
app.use('/api/consulta', consultasRouter);

// 🔹 Panel Admin y formulario de contacto
// Ruta directa a contacto.html
app.get('/contacto', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contacto.html'));
});

// Ruta directa al panel admin (admin.html)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Middleware 404
app.use((req, res, next) => {
  res.status(404).json({ ok: false, message: 'Ruta no encontrada' });
});

// Middleware global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ ok: false, message: 'Error interno del servidor' });
});

// Conectar DB y levantar servidor
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Servidor iniciado en http://localhost:${PORT}`);
      console.log(`Panel de contacto: http://localhost:${PORT}/contacto`);
      console.log(`Panel admin: http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
  }
};

startServer();

export default app;


// fetch('/api/inquiries').then(r=>r.json()).then(console.log)
