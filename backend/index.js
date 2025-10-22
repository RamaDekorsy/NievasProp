//-------------------------------------------------------------------Inicio parte general de Mongo--------------------------------------------------------------------------------------------------
require('dotenv').config();

const express = require('express'); // Importar Express
const mongoose = require('mongoose'); // Importar Mongoose
const bodyParser = require('body-parser'); // Importar Body-Parser para manejar solicitudes
const cors = require('cors'); // Importar CORS para manejar solicitudes de diferentes orígenes
const path = require('path'); // Importar Path para manejar rutas de archivos
const bcrypt = require('bcrypt'); // Importar Bcrypt para encriptar contraseñas
const cookieParser = require('cookie-parser'); // Importar Cookie-Parser para manejar cookies
const session = require('express-session'); // Importar Express-Session para manejo de sesiones
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto'); // Asegúrate de importar crypto
const nodemailer = require('nodemailer'); // Asegúrate de tener nodemailer instalado
const router = express.Router(); // Crea una instancia de router

// Crear el servidor
const app = express();
const port = 3000;
const ADMIN_EMAIL = 'axelnievitas122@gmail.com'; // Cambia esto al correo real del administrador
// const MONGODB_URI = 'mongodb://127.0.0.1:27017/inmobiliaria'; // Eliminado para evitar duplicidad

// Middleware
app.use(cors()); // Habilitar CORS
app.use(bodyParser.json()); // Parsear cuerpos de solicitud JSON
app.use(bodyParser.urlencoded({ extended: true })); // Parsear cuerpos de solicitud URL-encoded
app.use(cookieParser()); // Parsear cookies
app.use(session({
    secret: 'mi_secreto_super_seguro', // Clave secreta para la sesión, cambiar por una clave más segura
    resave: false, // No guardar la sesión si no ha sido modificada
    saveUninitialized: false, // No guardar una sesión nueva sin inicializar
    cookie: { secure: false } // En producción, establecer secure: true y usar HTTPS
}));


// Servir archivos estáticos desde las carpetas correspondientes
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/template', express.static(path.join(__dirname, 'template')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Servir frontend público
app.use(express.static(path.join(__dirname, '../frontend/public')));
// Servir panel de administración
app.use('/admin', express.static(path.join(__dirname, '../admin front/cliente')));
//-------------------------------------------------------------------Fin parte general de Mongo--------------------------------------------------------------------------------------------------


//-------------------------------------------------------------------Inicio Conexion a mongoDB--------------------------------------------------------------------------------------------------

const { MONGODB_URI, MONGODB_DB, APP_NAME, PORT } = process.env;
const ATLAS_URI = MONGODB_DB
  ? `${MONGODB_URI}/${MONGODB_DB}?retryWrites=true&w=majority&appName=${APP_NAME || 'app'}`
  : `${MONGODB_URI}?retryWrites=true&w=majority&appName=${APP_NAME || 'app'}`;

mongoose.connect(ATLAS_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000
}).then(() => console.log(' Conectado a MongoDB Atlas'))
  .catch(err => { console.error('❌ Error conectando a MongoDB:', err.message); process.exit(1); });


  app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
  });
//-------------------------------------------------------------------Fin Conexion a mongoDB--------------------------------------------------------------------------------------------------


//-------------------------------------------------------------------Inicio Usuario a mongoDB--------------------------------------------------------------------------------------------------

// Definir el esquema y modelo para el usuario
const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  telefono: String,
  contraseña: { type: String, required: true },
  fotoPerfil: String, // Cambié el campo a fotoPerfil por consistencia
  rol: { type: String, default: '0' }, // Valor por defecto del rol es '0'
  alertas: { type: Boolean, default: false } 
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// Ruta para manejar los datos del formulario de registro
app.post('/registro', async (req, res) => {
  const { nombre, email, telefono, contraseña } = req.body;

  try {
    // Verificar si el nombre de usuario o el email ya existen
    const usuarioExistente = await Usuario.findOne({ $or: [{ nombre }, { email }] });

    if (usuarioExistente) {
      if (usuarioExistente.email === email) {
        return res.status(400).send('El correo electrónico ya está en uso');
      }
      if (usuarioExistente.nombre === nombre) {
        return res.status(400).send('El nombre de usuario ya está en uso');
      }
    }

    // Encriptar la contraseña antes de guardar
    const contraseñaEncriptada = await bcrypt.hash(contraseña, 10);

    // Crear un nuevo usuario con rol por defecto '0'
    const nuevoUsuario = new Usuario({ nombre, email, telefono, contraseña: contraseñaEncriptada });
    await nuevoUsuario.save();

    res.status(201).send('Usuario registrado exitosamente');
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).send('Error al registrar el usuario');
  }
});


// Ruta para manejar el inicio de sesión
app.post('/login', async (req, res) => {
  const { email, contraseña } = req.body;

  try {
    // Buscar el usuario por email
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(401).send({ mensaje: 'Email o contraseña incorrectos' });
    }

    // Verificar si la contraseña coincide
    const esContraseñaCorrecta = await bcrypt.compare(contraseña, usuario.contraseña);

    if (esContraseñaCorrecta) {
      // Guardar el ID y rol del usuario en la sesión
      req.session.usuarioId = usuario._id;
      req.session.rol = usuario.rol;

      res.json({
        mensaje: 'Inicio de sesión exitoso', // Incluye la URL de la foto de perfil
        rol: usuario.rol // Incluye el rol del usuario
      });
    } else {
      res.status(401).send({ mensaje: 'Email o contraseña incorrectos' });
    }
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).send({ mensaje: 'Error al iniciar sesión' });
  }
});


// Ruta para verificar el estado de autenticación del usuario
app.get('/api/check-auth', (req, res) => {
  if (req.session.usuarioId) {
    res.json({ authenticated: true, rol: req.session.rol });
  } else {
    res.json({ authenticated: false });
  }
});

// Ruta para cerrar sesión
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      return res.status(500).json({ mensaje: 'Error al cerrar sesión.' });
    }
    res.clearCookie('connect.sid'); // Limpia la cookie de sesión
   // res.json({ mensaje: 'Cierre de sesión exitoso.' }); 
    res.redirect('/');// Envia una respuesta JSON
  });
});

// Ruta para servir el archivo HTML principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

//-----------Obtiene los datos del usuario para la lista del administrador------------------------------

// Ruta para obtener la lista de usuarios
app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find({}, 'nombre email telefono rol'); // Puedes modificar los campos que quieres obtener
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).send('Error al obtener los usuarios');
  }
});
//--------------------------Funcion del CRUD de la lista de usuarios----------------------------
// Ruta para eliminar un usuario.
app.delete('/usuarios/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const usuarioEliminado = await Usuario.findByIdAndDelete(id);
    if (!usuarioEliminado) {
      return res.status(404).send('Usuario no encontrado');
    }

    res.status(200).send('Usuario eliminado exitosamente');
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).send('Error al eliminar el usuario');
  }
});

// Ruta para obtener un usuario por su ID
app.get('/usuarios/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).send('Usuario no encontrado');
    }

    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).send('Error al obtener el usuario');
  }
});

// Ruta para actualizar un usuario
app.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params; // Tomar el userId de los parámetros de la URL
  const { nombre, email, telefono, rol, nuevoEmail, confirmarEmail, password, nuevaContra } = req.body;

  try {
    // Actualizar el usuario por su ID
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      id, // Usar el id de los parámetros
      { nombre, email, telefono, rol }, // Actualizar los campos
      { new: true } // Retorna el documento actualizado
    );

    if (!usuarioActualizado) {
      return res.status(404).send('Usuario no encontrado');
    }

    res.status(200).send('Usuario actualizado exitosamente');
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).send('Error al actualizar el usuario');
  }
});

//------------------------------Fin de CRUD de la lista de usuarios-----------------------------------

//------------------------------Fin de obtiene datos-----------------------------------

//-------------------------------------------------------------------Fin Usuario a mongoDB--------------------------------------------------------------------------------------------------
app.get('/api/user-details', async (req, res) => {
  try {
    const usuarioId = req.session.usuarioId;
    if (!usuarioId) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({ nombre: usuario.nombre });
  } catch (error) {
    console.error('Error al obtener los detalles del usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});


//-------------------------------------------------------------------Inicio Bandeja de entrada a mongoDB--------------------------------------------------------------------------------------------------

// Definir el esquema y modelo para la base de datos de contacto
const contactSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  email: String,
  telefono:String,
  asunto: String,
  mensaje: String,
  estado: { type: Number, default: 0 }
}, { collection: 'bandejaentrada' });

const Contact = mongoose.model('Contact', contactSchema);

// Ruta para servir el archivo HTML de contacto
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'template', 'contactanos.html')); // Asegúrate de que la ruta sea correcta
});

// Ruta para manejar los datos del formulario de contacto
app.post('/contact', async (req, res) => {
  const { nombre, apellido, email, asunto, mensaje } = req.body;
  const userRole = req.session.rol; // Obtener el rol del usuario de la sesión

  try {
    const nuevoContacto = new Contact({
      nombre,
      apellido,
      email,
      asunto,
      mensaje,
      estado: 0
    });

    await nuevoContacto.save();

    // Redirigir basado en el rol del usuario
    if (userRole === '1') { // Admin
      res.redirect('/RolAdmin/inicioAdmin.html');
    } else if (userRole === '0') { // Usuario normal
      res.redirect('/Usuario/inicioUsuario.html');
    } else {
      res.redirect('/'); // Página de inicio si no hay rol definido
    }
  } catch (error) {
    console.error('Error al enviar el mensaje:', error);
    res.status(500).send('Error al enviar el mensaje');
  }
});

// Ruta para recuperar todos los mensajes
// Ruta para recuperar todos los mensajes con estado "0"
app.get('/api/mensajes', async (req, res) => {
  try {
    const mensajes = await Contact.find({ estado: 0 });
    res.json({ mensajes });
  } catch (error) {
    console.error('Error al recuperar los mensajes:', error);
    res.status(500).send('Error al recuperar los mensajes');
  }
});




// Ruta para eliminar un mensaje por ID
app.delete('/api/mensajes/:_id', async (req, res) => {
  const { _id } = req.params; // Asegúrate de usar _id aquí
  console.log(`Solicitud para eliminar el mensaje con ID: ${_id}`); // Log del ID que se está intentando eliminar

  try {
      const resultado = await Contact.findByIdAndDelete(_id);
      console.log(`Resultado de la eliminación: ${resultado}`); // Log del resultado de la eliminación

      if (!resultado) {
          console.log('Mensaje no encontrado'); // Log cuando no se encuentra el mensaje
          return res.status(404).send('Mensaje no encontrado');
      }

      console.log('Mensaje eliminado correctamente'); // Log de éxito
      res.send('Mensaje eliminado correctamente');
  } catch (error) {
      console.error('Error al eliminar el mensaje:', error); // Log del error
      res.status(500).send('Error al eliminar el mensaje');
  }
});

// Ruta para actualizar el estado de un mensaje por ID
app.patch('/api/mensajes/:id', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body; // Obtener el nuevo estado del cuerpo de la solicitud

  try {
      const resultado = await Contact.findByIdAndUpdate(id, { estado }, { new: true });

      if (!resultado) {
          return res.status(404).send('Mensaje no encontrado');
      }

      res.send('Estado del mensaje actualizado correctamente');
  } catch (error) {
      console.error('Error al actualizar el estado del mensaje:', error);
      res.status(500).send('Error al actualizar el estado del mensaje');
  }
});


// Ruta para obtener solo los mensajes respondidos
app.get('/api/mensajes/respondidos', async (req, res) => {
  try {
      const mensajesRespondidos = await Contact.find({ estado: 1 }); // Filtrar mensajes con estado 1
      res.json({ mensajes: mensajesRespondidos });
  } catch (error) {
      console.error('Error al obtener mensajes respondidos:', error);
      res.status(500).send('Error al obtener mensajes respondidos');
  }
});

// Ruta para obtener un mensaje por ID
app.get('/api/mensajes/:id', async (req, res) => {
  const { id } = req.params; // Obtener el ID del mensaje de los parámetros

  try {
      const mensaje = await Contact.findById(id); // Buscar el mensaje por ID
      if (!mensaje) {
          return res.status(404).send('Mensaje no encontrado');
      }
      res.json({ mensaje }); // Devolver el mensaje en formato JSON
  } catch (error) {
      console.error('Error al obtener el mensaje:', error);
      res.status(500).send('Error al obtener el mensaje');
  }
});


//-------------------------------------------------------------------Fin Bandeja de entrada a mongoDB----------------------------------------------------------------------------------------
// =====================
// ADAPTER PARA /api/contacto (compat con tu front actual)
// =====================

// 1) Listar mensajes como array para contacto.html
app.get('/api/contacto', async (req, res) => {
  try {
    const rows = await Contact.find().sort({ _id: -1 }); // o createdAt si lo tuvieras
    const out = rows.map(r => ({
      _id: r._id,
      nombre: [r.nombre, r.apellido].filter(Boolean).join(' ') || '(Sin nombre)',
      email: r.email || '',
      telefono: r.telefono || '',     // por si no existe en tu schema actual
      mensaje: r.mensaje || r.asunto || '',
      respondido: Number(r.estado) === 1, // estado: 1 => respondido
    }));
    res.json(out);
  } catch (err) {
    console.error('GET /api/contacto error:', err);
    res.status(500).send('Error al cargar los contactos');
  }
});

// 2) Recibir mensajes desde formulario.html (POST /api/contacto)
app.post('/api/contacto', async (req, res) => {
  try {
    const { nombre, email, telefono, mensaje } = req.body;
    const nuevo = new Contact({
      nombre,
      apellido: '',               // opcional
      email,
      asunto: 'Contacto web',     // opcional
      mensaje,
      estado: 0,
      telefono                    // si tu schema no lo tiene, no pasa nada
    });
    await nuevo.save();
    return res.json({ ok: true, id: nuevo._id });
  } catch (err) {
    console.error('POST /api/contacto error:', err);
    res.status(500).json({ ok: false, message: 'Error al guardar el contacto' });
  }
});

// 3) Responder (POST /api/contacto/:id/responder)
app.post('/api/contacto/:id/responder', async (req, res) => {
  try {
    const { id } = req.params;
    const { respuesta } = req.body;

    const doc = await Contact.findByIdAndUpdate(id, { estado: 1 }, { new: true });
    if (!doc) return res.status(404).json({ ok: false, message: 'Mensaje no encontrado' });

    // Enviar email al contacto
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'propiedadesnievas@gmail.com',
        pass: 'qqug tpxh qfbq rzxb', // nueva contraseña de aplicación
      },
    });

    await transporter.sendMail({
      from: '"Inmobiliaria" <propiedadesnievas@gmail.com>',
      to: doc.email,
      subject: 'Respuesta a tu consulta',
      text: respuesta || 'Gracias por contactarte.',
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/contacto/:id/responder error:', err);
    res.status(500).json({ ok: false, message: 'No se pudo enviar la respuesta' });
  }
});




//------------------------------------------------Inicio Agregar Propiedades Tipo Casa--------------------------------------------

// Definir el esquema para la base de datos de propiedades
const casaSchema = new mongoose.Schema({
  titulo: { type: String, required: [true, 'El título es obligatorio'] },
  precio: { type: Number, min: [0, 'El precio debe ser un número positivo'] },
  tipoPropiedad: { type: String, enum: ['Casas', 'Departamentos', 'Campos', 'Cocheras','Chalets'] },
  tipoCambio: { type: String, enum: ['USD', 'ARS', 'Euros'] },

  // ✅ Nuevo campo agregado
  tipoOperacion: { 
    type: String, 
    enum: ['venta', 'alquiler', 'venta_alquiler'], 
    required: [true, 'El tipo de operación es obligatorio'] 
  },

  supcubierta: { type: Number },
  suptotal: { type: Number },
  supterreno: { type: Number },
  orientacion: { type: String },
  tipocochera: { type: String },
  cochera: { type: Number },
  dormitorios: { type: Number },
  ambientes: { type: Number },
  bano: { type: Number },
  aconstruccion: { type: Number },
  estado: { type: String, enum: ['venta', 'alquiler'] },
  descripcion: { type: String },
  caracteristicas: { type: String },
  direccion: { type: String },
  ciudad: { type: String },
  provincia: { type: String },
  localidad: { type: String },
  imagenPrincipal: {
    data: Buffer,
    contentType: String,
  },
  galeria: [
    {
      data: Buffer,
      contentType: String,
    }
  ]
}, { collection: 'Casas', timestamps: true });

const Casa = mongoose.model('Casa', casaSchema);

// Configuración de Multer para almacenar imágenes en memoria
const storage = multer.memoryStorage();
const upload = multer({storage: storage}).fields([
    { name: 'imagenPrincipal', maxCount: 1 },
    { name: 'galeria', maxCount: 15 }
]);

// ================================================
// ✅ POST: Cargar Casa con tipoOperacion incluido
// ================================================
app.post('/CargarCasa', upload, async (req, res) => {
  try {
      console.log('Archivos recibidos:', req.files);

      const imagenPrincipal = req.files['imagenPrincipal'] ? {
          data: req.files['imagenPrincipal'][0].buffer,
          contentType: req.files['imagenPrincipal'][0].mimetype,
      } : null;

      const galeria = req.files['galeria'] ? req.files['galeria'].map(file => ({
          data: file.buffer,
          contentType: file.mimetype,
      })) : [];

      console.log('Imagen Principal:', imagenPrincipal);
      console.log('Galería:', galeria);
      console.log('Datos recibidos en req.body:', req.body);

      const newCasa = new Casa({
          titulo: req.body.titulo,
          precio: req.body.precio,
          tipoCambio: req.body.tipoCambio,
          tipoPropiedad: req.body.tipoPropiedad,

          // ✅ Nuevo campo
          tipoOperacion: req.body.tipoOperacion,

          supcubierta: req.body.supcubierta,
          suptotal: req.body.suptotal,
          supterreno: req.body.supterreno,
          orientacion: req.body.orientacion,
          tipocochera: req.body.tipocochera,
          cochera: req.body.cochera,
          dormitorios: req.body.dormitorios,
          ambientes: req.body.ambientes,
          bano: req.body.bano,
          aconstruccion: req.body.aconstruccion,
          estado: req.body.estado,
          caracteristicas: req.body.caracteristicas,
          descripcion: req.body.descripcion,
          direccion: req.body.direccion,
          ciudad: req.body.ciudad,
          provincia: req.body.provincia,
          localidad: req.body.localidad,
          imagenPrincipal: imagenPrincipal,
          galeria: galeria,
      });

      await newCasa.save();
      res.send('Propiedad con imágenes y tipo de operación guardada correctamente');
  } catch (error) {
      console.error('Error al guardar la propiedad:', error);
      res.status(500).send('Error al guardar la propiedad');
  }
});

// ================================================
// ✅ GET: obtener todas las casas (incluye tipoOperacion)
// ================================================
app.get('/api/Casas', async (req, res) => {
  try {
    const filtro = {};

    // Si el frontend manda ?tipoOperacion=venta o alquiler, se filtra
    if (req.query.tipoOperacion) {
      filtro.tipoOperacion = req.query.tipoOperacion;
    }

    const propiedades = await Casa.find(filtro);
    res.json(propiedades);
  } catch (error) {
    console.error('Error al obtener las propiedades:', error);
    res.status(500).send('Error al obtener las propiedades');
  }
});

// ================================================
// Imagen principal o galería
// ================================================
app.get('/imagen/Casas/:id', async (req, res) => {
  try {
    const propiedad = await Casa.findById(req.params.id);
    if (!propiedad) {
      return res.status(404).send('Propiedad no encontrada');
    }

    if (req.query.index === undefined) {
      if (propiedad.imagenPrincipal && propiedad.imagenPrincipal.data) {
        res.set('Content-Type', propiedad.imagenPrincipal.contentType);
        res.send(propiedad.imagenPrincipal.data);
      } else {
        res.status(404).send('Imagen principal no encontrada');
      }
      return;
    }

    const index = parseInt(req.query.index, 10);
    if (index >= 0 && index < propiedad.galeria.length) {
      const imagen = propiedad.galeria[index];
      res.set('Content-Type', imagen.contentType);
      res.send(imagen.data);
    } else {
      res.status(404).send('Imagen de galería no encontrada');
    }
  } catch (error) {
    console.error('Error al servir la imagen:', error);
    res.status(500).send('Error al servir la imagen');
  }
});

// ================================================
// GET: obtener una propiedad por id
// ================================================
app.get('/api/Casas/:id', async (req, res) => {
  try {
    const propiedad = await Casa.findById(req.params.id);
    if (!propiedad) {
      return res.status(404).send('Propiedad no encontrada');
    }
    res.json(propiedad);
  } catch (error) {
    console.error('Error al obtener los detalles de la propiedad:', error);
    res.status(500).send('Error al obtener los detalles de la propiedad');
  }
});


//------------------------------------------------Fin Agregar Propiedades Tipo Casa--------------------------------------------



//------------------------------------------------Inicio Agregar Propiedades Tipo Departamento--------------------------------------------

// ======================================================
// ✅ Esquema de DEPARTAMENTOS con tipoOperacion agregado
// ======================================================
const departamentoSchema = new mongoose.Schema({
  titulo: { type: String, required: [true, 'El título es obligatorio'] },
  precio: { type: Number, min: [0, 'El precio debe ser un número positivo'] },
  expensas: { type: Number, min: [0, 'El precio debe ser un número positivo'] },
  tipoPropiedad: { type: String, enum: ['Casas', 'Departamentos', 'Campos', 'Cocheras', 'Chalets'] },
  tipoCambio: { type: String, enum: ['USD', 'ARS', 'Euros'] },

  // ✅ Nuevo campo
  tipoOperacion: { 
    type: String, 
    enum: ['venta', 'alquiler', 'venta_alquiler'], 
    required: [true, 'El tipo de operación es obligatorio']
  },

  supcubierta: { type: Number },
  suptotal: { type: Number },
  disposicion: { type: String },
  tipocochera: { type: String },
  cochera: { type: Number },
  dormitorios: { type: Number },
  ambientes: { type: Number },
  bano: { type: Number },
  aconstruccion: { type: Number },
  estado: { type: String, enum: ['venta', 'alquiler'] },
  descripcion: { type: String },
  caracteristicas: { type: String },
  direccion: { type: String },
  piso: { type: Number },
  ciudad: { type: String },
  provincia: { type: String },
  localidad: { type: String },
  imagenPrincipal: {
    data: Buffer,
    contentType: String,
  },
  galeria: [
    {
      data: Buffer,
      contentType: String,
    }
  ]
}, { collection: 'Departamentos', timestamps: true });

const Departamento = mongoose.model('Departamento', departamentoSchema);

// ======================================================
// Configuración de Multer
// ======================================================
const storageDpto = multer.memoryStorage();
const uploadDpto = multer({ storage: storageDpto }).fields([
  { name: 'imagenPrincipal', maxCount: 1 },
  { name: 'galeria', maxCount: 15 }
]);

// ======================================================
// ✅ POST: Cargar Departamento con tipoOperacion
// ======================================================
app.post('/CargarDpto', uploadDpto, async (req, res) => {
  try {
    console.log('Archivos recibidos:', req.files);

    const imagenPrincipal = req.files['imagenPrincipal'] ? {
      data: req.files['imagenPrincipal'][0].buffer,
      contentType: req.files['imagenPrincipal'][0].mimetype,
    } : null;

    const galeria = req.files['galeria'] ? req.files['galeria'].map(file => ({
      data: file.buffer,
      contentType: file.mimetype,
    })) : [];

    console.log('Imagen Principal:', imagenPrincipal);
    console.log('Galería:', galeria);
    console.log('Datos recibidos en req.body:', req.body);

    const newDepartamento = new Departamento({
      titulo: req.body.titulo,
      precio: req.body.precio,
      expensas: req.body.expensas,
      tipoPropiedad: req.body.tipoPropiedad,
      tipoCambio: req.body.tipoCambio,

      // ✅ Nuevo campo
      tipoOperacion: req.body.tipoOperacion,

      supcubierta: req.body.supcubierta,
      suptotal: req.body.suptotal,
      disposicion: req.body.orientacion,
      tipocochera: req.body.tipocochera,
      cochera: req.body.cochera,
      dormitorios: req.body.dormitorios,
      ambientes: req.body.ambientes,
      bano: req.body.bano,
      aconstruccion: req.body.aconstruccion,
      estado: req.body.estado,
      caracteristicas: req.body.caracteristicas,
      descripcion: req.body.descripcion,
      direccion: req.body.direccion,
      piso: req.body.piso,
      ciudad: req.body.ciudad,
      provincia: req.body.provincia,
      localidad: req.body.localidad,
      imagenPrincipal: imagenPrincipal,
      galeria: galeria,
    });

    await newDepartamento.save();
    res.send('Departamento con imágenes y tipo de operación guardado correctamente');
  } catch (error) {
    console.error('Error al guardar el departamento:', error);
    res.status(500).send('Error al guardar el departamento');
  }
});

// ======================================================
// ✅ GET: Obtener todos los departamentos (con filtro por tipoOperacion opcional)
// ======================================================
app.get('/api/Departamentos', async (req, res) => {
  try {
    const filtro = {};

    if (req.query.tipoOperacion) {
      filtro.tipoOperacion = req.query.tipoOperacion;
    }

    const propiedades = await Departamento.find(filtro);
    res.json(propiedades);
  } catch (error) {
    console.error('Error al obtener las propiedades:', error);
    res.status(500).send('Error al obtener las propiedades');
  }
});

// ======================================================
// Obtener imágenes (principal o galería)
// ======================================================
app.get('/imagen/Departamentos/:id', async (req, res) => {
  try {
    const propiedad = await Departamento.findById(req.params.id);
    if (!propiedad) {
      return res.status(404).send('Propiedad no encontrada');
    }

    if (req.query.index === undefined) {
      if (propiedad.imagenPrincipal && propiedad.imagenPrincipal.data) {
        res.set('Content-Type', propiedad.imagenPrincipal.contentType);
        res.send(propiedad.imagenPrincipal.data);
      } else {
        res.status(404).send('Imagen principal no encontrada');
      }
      return;
    }

    const index = parseInt(req.query.index, 10);
    if (index >= 0 && index < propiedad.galeria.length) {
      const imagen = propiedad.galeria[index];
      res.set('Content-Type', imagen.contentType);
      res.send(imagen.data);
    } else {
      res.status(404).send('Imagen de galería no encontrada');
    }
  } catch (error) {
    console.error('Error al servir la imagen:', error);
    res.status(500).send('Error al servir la imagen');
  }
});

// ======================================================
// GET: Obtener un departamento por ID
// ======================================================
app.get('/api/Departamentos/:id', async (req, res) => {
  try {
    const propiedad = await Departamento.findById(req.params.id);
    if (!propiedad) {
      return res.status(404).send('Propiedad no encontrada');
    }
    res.json(propiedad);
  } catch (error) {
    console.error('Error al obtener los detalles del departamento:', error);
    res.status(500).send('Error al obtener los detalles del departamento');
  }
});


//------------------------------------------------Fin Agregar Propiedades Tipo Departamento--------------------------------------------

//------------------------------------------------Inicio Agregar Propiedades Tipo Campo--------------------------------------------


// ======================================================
// ✅ Esquema de CAMPOS con tipoOperacion agregado
// ======================================================
const campoSchema = new mongoose.Schema({
  titulo: { type: String, required: [true, 'El título es obligatorio'] },
  precio: { type: Number, min: [0, 'El precio debe ser un número positivo'] },
  tipoPropiedad: { type: String, enum: ['Casas', 'Departamentos', 'Campos', 'Cocheras', 'Chalets'] },
  tipoCambio: { type: String, enum: ['USD', 'ARS', 'Euros'] },

  // ✅ Nuevo campo
  tipoOperacion: {
    type: String,
    enum: ['venta', 'alquiler', 'venta_alquiler'],
    required: [true, 'El tipo de operación es obligatorio']
  },

  supcubierta: { type: Number },
  suptotal: { type: Number },
  supterreno: { type: Number },
  tipoTerreno: { type: String, enum: ['Terreno', 'Lote'] },
  estado: { type: String, enum: ['venta', 'alquiler'] },
  descripcion: { type: String },
  caracteristicas: { type: String },
  direccion: { type: String },
  ciudad: { type: String },
  provincia: { type: String },
  localidad: { type: String },
  imagenPrincipal: {
    data: Buffer,
    contentType: String,
  },
  galeria: [
    {
      data: Buffer,
      contentType: String,
    }
  ]
}, { collection: 'Campos', timestamps: true });

const Campo = mongoose.model('Campo', campoSchema);

// ======================================================
// Configuración de Multer
// ======================================================
const storageCampo = multer.memoryStorage();
const uploadCampo = multer({ storage: storageCampo }).fields([
  { name: 'imagenPrincipal', maxCount: 1 },
  { name: 'galeria', maxCount: 15 }
]);

// ======================================================
// ✅ POST: Cargar Campo con tipoOperacion incluido
// ======================================================
app.post('/CargarCampo', uploadCampo, async (req, res) => {
  try {
    console.log('Archivos recibidos:', req.files);

    const imagenPrincipal = req.files['imagenPrincipal'] ? {
      data: req.files['imagenPrincipal'][0].buffer,
      contentType: req.files['imagenPrincipal'][0].mimetype,
    } : null;

    const galeria = req.files['galeria'] ? req.files['galeria'].map(file => ({
      data: file.buffer,
      contentType: file.mimetype,
    })) : [];

    console.log('Imagen Principal:', imagenPrincipal);
    console.log('Galería:', galeria);
    console.log('Datos recibidos en req.body:', req.body);

    const newCampo = new Campo({
      titulo: req.body.titulo,
      precio: req.body.precio,
      tipoPropiedad: req.body.tipoPropiedad,
      tipoCambio: req.body.tipoCambio,

      // ✅ Nuevo campo
      tipoOperacion: req.body.tipoOperacion,

      supcubierta: req.body.supcubierta,
      suptotal: req.body.suptotal,
      supterreno: req.body.supterreno,
      estado: req.body.estado,
      caracteristicas: req.body.caracteristicas,
      descripcion: req.body.descripcion,
      direccion: req.body.direccion,
      tipoTerreno: req.body.tipoTerreno,
      ciudad: req.body.ciudad,
      provincia: req.body.provincia,
      localidad: req.body.localidad,
      imagenPrincipal: imagenPrincipal,
      galeria: galeria,
    });

    await newCampo.save();
    res.send('Campo con imágenes y tipo de operación guardado correctamente');
  } catch (error) {
    console.error('Error al guardar el campo:', error);
    res.status(500).send('Error al guardar el campo');
  }
});

// ======================================================
// ✅ GET: Obtener Campos (con filtro opcional tipoOperacion)
// ======================================================
app.get('/api/Campos', async (req, res) => {
  try {
    const filtro = {};

    if (req.query.tipoOperacion) {
      filtro.tipoOperacion = req.query.tipoOperacion;
    }

    const propiedades = await Campo.find(filtro);
    res.json(propiedades);
  } catch (error) {
    console.error('Error al obtener los campos:', error);
    res.status(500).send('Error al obtener los campos');
  }
});

// ======================================================
// Obtener imagen principal o de galería
// ======================================================
app.get('/imagen/Campos/:id', async (req, res) => {
  try {
    const propiedad = await Campo.findById(req.params.id);
    if (!propiedad) {
      return res.status(404).send('Propiedad no encontrada');
    }

    if (req.query.index === undefined) {
      if (propiedad.imagenPrincipal && propiedad.imagenPrincipal.data) {
        res.set('Content-Type', propiedad.imagenPrincipal.contentType);
        res.send(propiedad.imagenPrincipal.data);
      } else {
        res.status(404).send('Imagen principal no encontrada');
      }
      return;
    }

    const index = parseInt(req.query.index, 10);
    if (index >= 0 && index < propiedad.galeria.length) {
      const imagen = propiedad.galeria[index];
      res.set('Content-Type', imagen.contentType);
      res.send(imagen.data);
    } else {
      res.status(404).send('Imagen de galería no encontrada');
    }
  } catch (error) {
    console.error('Error al servir la imagen:', error);
    res.status(500).send('Error al servir la imagen');
  }
});

// ======================================================
// GET: Obtener un campo por ID
// ======================================================
app.get('/api/Campos/:id', async (req, res) => {
  try {
    const propiedad = await Campo.findById(req.params.id);
    if (!propiedad) {
      return res.status(404).send('Propiedad no encontrada');
    }
    res.json(propiedad);
  } catch (error) {
    console.error('Error al obtener los detalles del campo:', error);
    res.status(500).send('Error al obtener los detalles del campo');
  }
});


//------------------------------------------------Fin Agregar Propiedades Tipo Campo--------------------------------------------

//---------------------------------------------Inicio Agregar Propiedades tipo Cochera---------------------------------------------

// ======================================================
// ✅ Esquema de COCHERAS con tipoOperacion agregado
// ======================================================
const cocheraSchema = new mongoose.Schema({
  titulo: { type: String, required: [true, 'El título es obligatorio'] },
  precio: { type: Number, min: [0, 'El precio debe ser un número positivo'] },
  tipoPropiedad: { type: String, enum: ['Casas', 'Departamentos', 'Campos', 'Cocheras', 'Chalets'] },
  tipoCambio: { type: String, enum: ['USD', 'ARS', 'Euros'] },

  // ✅ Nuevo campo
  tipoOperacion: {
    type: String,
    enum: ['venta', 'alquiler', 'venta_alquiler'],
    required: [true, 'El tipo de operación es obligatorio']
  },

  supcubierta: { type: Number },
  suptotal: { type: Number },
  tipocochera: { type: String },
  tipoAcceso: { type: String },
  aconstruccion: { type: Number },
  estado: { type: String, enum: ['venta', 'alquiler'] },
  descripcion: { type: String },
  caracteristicas: { type: String },
  direccion: { type: String },
  ciudad: { type: String },
  provincia: { type: String },
  localidad: { type: String },
  imagenPrincipal: {
    data: Buffer,
    contentType: String,
  },
  galeria: [
    {
      data: Buffer,
      contentType: String,
    }
  ]
}, { collection: 'Cocheras', timestamps: true });

const Cochera = mongoose.model('Cochera', cocheraSchema);

// ======================================================
// Configuración de Multer
// ======================================================
const storageCochera = multer.memoryStorage();
const uploadCochera = multer({ storage: storageCochera }).fields([
  { name: 'imagenPrincipal', maxCount: 1 },
  { name: 'galeria', maxCount: 15 }
]);

// ======================================================
// ✅ POST: Cargar Cochera con tipoOperacion incluido
// ======================================================
app.post('/CargarCochera', uploadCochera, async (req, res) => {
  try {
    console.log('Archivos recibidos:', req.files);

    const imagenPrincipal = req.files['imagenPrincipal'] ? {
      data: req.files['imagenPrincipal'][0].buffer,
      contentType: req.files['imagenPrincipal'][0].mimetype,
    } : null;

    const galeria = req.files['galeria'] ? req.files['galeria'].map(file => ({
      data: file.buffer,
      contentType: file.mimetype,
    })) : [];

    console.log('Imagen Principal:', imagenPrincipal);
    console.log('Galería:', galeria);
    console.log('Datos recibidos en req.body:', req.body);

    const newCochera = new Cochera({
      titulo: req.body.titulo,
      precio: req.body.precio,
      tipoPropiedad: req.body.tipoPropiedad,
      tipoCambio: req.body.tipoCambio,

      // ✅ Nuevo campo
      tipoOperacion: req.body.tipoOperacion,

      supcubierta: req.body.supcubierta,
      suptotal: req.body.suptotal,
      tipocochera: req.body.tipocochera,
      tipoAcceso: req.body.tipoAcceso,
      aconstruccion: req.body.aconstruccion,
      estado: req.body.estado,
      caracteristicas: req.body.caracteristicas,
      descripcion: req.body.descripcion,
      direccion: req.body.direccion,
      ciudad: req.body.ciudad,
      provincia: req.body.provincia,
      localidad: req.body.localidad,
      imagenPrincipal: imagenPrincipal,
      galeria: galeria,
    });

    await newCochera.save();
    res.send('Cochera con imágenes y tipo de operación guardada correctamente');
  } catch (error) {
    console.error('Error al guardar la cochera:', error);
    res.status(500).send('Error al guardar la cochera');
  }
});

// ======================================================
// ✅ GET: Obtener Cocheras (con filtro opcional tipoOperacion)
// ======================================================
app.get('/api/Cocheras', async (req, res) => {
  try {
    const filtro = {};

    if (req.query.tipoOperacion) {
      filtro.tipoOperacion = req.query.tipoOperacion;
    }

    const propiedades = await Cochera.find(filtro);
    res.json(propiedades);
  } catch (error) {
    console.error('Error al obtener las cocheras:', error);
    res.status(500).send('Error al obtener las cocheras');
  }
});

// ======================================================
// Obtener imagen principal o de galería
// ======================================================
app.get('/imagen/Cocheras/:id', async (req, res) => {
  try {
    const propiedad = await Cochera.findById(req.params.id);
    if (!propiedad) {
      return res.status(404).send('Propiedad no encontrada');
    }

    if (req.query.index === undefined) {
      if (propiedad.imagenPrincipal && propiedad.imagenPrincipal.data) {
        res.set('Content-Type', propiedad.imagenPrincipal.contentType);
        res.send(propiedad.imagenPrincipal.data);
      } else {
        res.status(404).send('Imagen principal no encontrada');
      }
      return;
    }

    const index = parseInt(req.query.index, 10);
    if (index >= 0 && index < propiedad.galeria.length) {
      const imagen = propiedad.galeria[index];
      res.set('Content-Type', imagen.contentType);
      res.send(imagen.data);
    } else {
      res.status(404).send('Imagen de galería no encontrada');
    }
  } catch (error) {
    console.error('Error al servir la imagen:', error);
    res.status(500).send('Error al servir la imagen');
  }
});

// ======================================================
// GET: Obtener una cochera por ID
// ======================================================
app.get('/api/Cocheras/:id', async (req, res) => {
  try {
    const propiedad = await Cochera.findById(req.params.id);
    if (!propiedad) {
      return res.status(404).send('Propiedad no encontrada');
    }
    res.json(propiedad);
  } catch (error) {
    console.error('Error al obtener los detalles de la cochera:', error);
    res.status(500).send('Error al obtener los detalles de la cochera');
  }
});


//---------------------------------------------Fin Agregar Propiedades tipo Cochera---------------------------------------------


//---------------------------------------------Inicio Agregar Propiedades tipo Chalet---------------------------------------------

// ======================================================
// ✅ Esquema de CHALETS con tipoOperacion agregado
// ======================================================
const chaletSchema = new mongoose.Schema({
  titulo: { type: String, required: [true, 'El título es obligatorio'] },
  precio: { type: Number, min: [0, 'El precio debe ser un número positivo'] },
  tipoPropiedad: { type: String, enum: ['Casas', 'Departamentos', 'Campos', 'Cocheras', 'Chalets'] },
  tipoCambio: { type: String, enum: ['USD', 'ARS', 'Euros'] },

  // ✅ Nuevo campo
  tipoOperacion: {
    type: String,
    enum: ['venta', 'alquiler', 'venta_alquiler'],
    required: [true, 'El tipo de operación es obligatorio']
  },

  supcubierta: { type: Number },
  suptotal: { type: Number },
  supterreno: { type: Number },
  tipocochera: { type: String },
  cochera: { type: Number },
  dormitorios: { type: Number },
  ambientes: { type: Number },
  bano: { type: Number },
  aconstruccion: { type: Number },
  estado: { type: String, enum: ['venta', 'alquiler'] },
  descripcion: { type: String },
  caracteristicas: { type: String },
  direccion: { type: String },
  ciudad: { type: String },
  provincia: { type: String },
  localidad: { type: String },
  imagenPrincipal: {
    data: Buffer,
    contentType: String,
  },
  galeria: [
    {
      data: Buffer,
      contentType: String,
    }
  ]
}, { collection: 'Chalets', timestamps: true });

const Chalet = mongoose.model('Chalet', chaletSchema);

// ======================================================
// Configuración de Multer
// ======================================================
const storageChalet = multer.memoryStorage();
const uploadChalet = multer({ storage: storageChalet }).fields([
  { name: 'imagenPrincipal', maxCount: 1 },
  { name: 'galeria', maxCount: 15 }
]);

// ======================================================
// ✅ POST: Cargar Chalet con tipoOperacion incluido
// ======================================================
app.post('/CargarChalet', uploadChalet, async (req, res) => {
  try {
    console.log('Archivos recibidos:', req.files);

    const imagenPrincipal = req.files['imagenPrincipal'] ? {
      data: req.files['imagenPrincipal'][0].buffer,
      contentType: req.files['imagenPrincipal'][0].mimetype,
    } : null;

    const galeria = req.files['galeria'] ? req.files['galeria'].map(file => ({
      data: file.buffer,
      contentType: file.mimetype,
    })) : [];

    console.log('Imagen Principal:', imagenPrincipal);
    console.log('Galería:', galeria);
    console.log('Datos recibidos en req.body:', req.body);

    const newChalet = new Chalet({
      titulo: req.body.titulo,
      precio: req.body.precio,
      expensas: req.body.expensas,
      tipoPropiedad: req.body.tipoPropiedad,
      tipoCambio: req.body.tipoCambio,

      // ✅ Nuevo campo
      tipoOperacion: req.body.tipoOperacion,

      supcubierta: req.body.supcubierta,
      suptotal: req.body.suptotal,
      supterreno: req.body.supterreno,
      disposicion: req.body.orientacion,
      tipocochera: req.body.tipocochera,
      cochera: req.body.cochera,
      dormitorios: req.body.dormitorios,
      ambientes: req.body.ambientes,
      bano: req.body.bano,
      aconstruccion: req.body.aconstruccion,
      estado: req.body.estado,
      caracteristicas: req.body.caracteristicas,
      descripcion: req.body.descripcion,
      direccion: req.body.direccion,
      piso: req.body.piso,
      ciudad: req.body.ciudad,
      provincia: req.body.provincia,
      localidad: req.body.localidad,
      imagenPrincipal: imagenPrincipal,
      galeria: galeria,
    });

    await newChalet.save();
    res.send('Chalet con imágenes y tipo de operación guardado correctamente');
  } catch (error) {
    console.error('Error al guardar el chalet:', error);
    res.status(500).send('Error al guardar el chalet');
  }
});

// ======================================================
// ✅ GET: Obtener Chalets (con filtro opcional tipoOperacion)
// ======================================================
app.get('/api/Chalets', async (req, res) => {
  try {
    const filtro = {};

    if (req.query.tipoOperacion) {
      filtro.tipoOperacion = req.query.tipoOperacion;
    }

    const propiedades = await Chalet.find(filtro);
    res.json(propiedades);
  } catch (error) {
    console.error('Error al obtener los chalets:', error);
    res.status(500).send('Error al obtener los chalets');
  }
});

// ======================================================
// Obtener imagen principal o de galería
// ======================================================
app.get('/imagen/Chalets/:id', async (req, res) => {
  try {
    const propiedad = await Chalet.findById(req.params.id);
    if (!propiedad) {
      return res.status(404).send('Propiedad no encontrada');
    }

    if (req.query.index === undefined) {
      if (propiedad.imagenPrincipal && propiedad.imagenPrincipal.data) {
        res.set('Content-Type', propiedad.imagenPrincipal.contentType);
        res.send(propiedad.imagenPrincipal.data);
      } else {
        res.status(404).send('Imagen principal no encontrada');
      }
      return;
    }

    const index = parseInt(req.query.index, 10);
    if (index >= 0 && index < propiedad.galeria.length) {
      const imagen = propiedad.galeria[index];
      res.set('Content-Type', imagen.contentType);
      res.send(imagen.data);
    } else {
      res.status(404).send('Imagen de galería no encontrada');
    }
  } catch (error) {
    console.error('Error al servir la imagen:', error);
    res.status(500).send('Error al servir la imagen');
  }
});

// ======================================================
// GET: Obtener un Chalet por ID
// ======================================================
app.get('/api/Chalets/:id', async (req, res) => {
  try {
    const propiedad = await Chalet.findById(req.params.id);
    if (!propiedad) {
      return res.status(404).send('Propiedad no encontrada');
    }
    res.json(propiedad);
  } catch (error) {
    console.error('Error al obtener los detalles del chalet:', error);
    res.status(500).send('Error al obtener los detalles del chalet');
  }
});




//---------------------------------------------Fin Agregar Propiedades tipo Chalet---------------------------------------------

//----------------------------------------------Inicio Rutas de funcionalidades modificar props-----------------------------------------------


//Eliminar propiedad

app.delete('/api/propiedades/:tipo/:id', async (req, res) => {
  const { tipo, id } = req.params;
  let Model;

  // Seleccionar el modelo basado en el tipo de propiedad
  switch (tipo) {
      case 'Casas':
          Model = Casa;
          break;
      case 'Departamentos':
          Model = Departamento;
          break;
      case 'Campos':
          Model = Campo;
          break;
      case 'Cocheras':
          Model = Cochera;
          break;
      case 'Chalets':
          Model = Chalet;
          break;
      default:
          return res.status(400).json({ message: 'Tipo de propiedad no válido' });
  }

  try {
      // Eliminar la propiedad por su id
      const result = await Model.findByIdAndDelete(id);

      if (!result) {
          return res.status(404).json({ message: 'Propiedad no encontrada' });
      }

      res.status(200).json({ message: 'Propiedad eliminada exitosamente' });
  } catch (error) {
      console.error('Error al eliminar la propiedad:', error);
      res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Backend en Node.js - ejemplo con Mongoose
app.get('/api/:tipoPropiedad/:_id', async (req, res) => {
  const { tipoPropiedad, _id } = req.params;
  console.log(`Buscando propiedad: Tipo: ${tipoPropiedad}, ID: ${_id}`);
  
  try {
      let property;
      
      // Selección de modelo según el tipo de propiedad
      if (tipoPropiedad === 'Casas') {
          property = await Casa.findById(_id);
      } else if (tipoPropiedad === 'Departamentos') {
          property = await Departamento.findById(_id);
      } else if (tipoPropiedad === 'Campos') {
          property = await Campo.findById(_id);
      } else if (tipoPropiedad === 'Cocheras') {
          property = await Cochera.findById(_id);
      } else if (tipoPropiedad === 'Chalets') {
          property = await Chalet.findById(_id);
      }
      
      // Comprobación de existencia de la propiedad
      if (property) {
          res.json(property);
      } else {
          res.status(404).send('Propiedad no encontrada');
      }
  } catch (error) {
      console.error(error);
      res.status(500).send('Error en el servidor');
  }
});

//modificar datos de propiedades

app.put('/api/:tipoPropiedad/:_id', async (req, res) => {
  const { tipoPropiedad, _id } = req.params;
  const datosActualizados = req.body;  // Datos a actualizar enviados en el cuerpo de la solicitud

  console.log(`Actualizando propiedad: Tipo: ${tipoPropiedad}, ID: ${_id}`);

  try {
      let Modelo;
      
      // Seleccionar el modelo según el tipo de propiedad
      if (tipoPropiedad === 'Casas') {
          Modelo = Casa;
      } else if (tipoPropiedad === 'Departamentos') {
          Modelo = Departamento;
      } else if (tipoPropiedad === 'Campos') {
          Modelo = Campo;
      } else if (tipoPropiedad === 'Cocheras') {
          Modelo = Cochera;
      } else if (tipoPropiedad === 'Chalets') {
          Modelo = Chalet;
      }

      // Si el tipo de propiedad no es válido
      if (!Modelo) {
          return res.status(400).send('Tipo de propiedad no válido');
      }

      // Actualizar la propiedad en la base de datos
      const propiedadActualizada = await Modelo.findByIdAndUpdate(_id, datosActualizados, { new: true });

      if (propiedadActualizada) {
          res.json(propiedadActualizada);
      } else {
          res.status(404).send('Propiedad no encontrada');
      }
  } catch (error) {
      console.error('Error al actualizar la propiedad:', error);
      res.status(500).send('Error en el servidor');
  }
});












//----------------------------------------------Fin Rutas de funcionalidades modificar props-----------------------------------------------

// ==============================
// MODELO UNIFICADO DE PROPIEDADES
// ==============================
const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  address: { type: String, required: true },
  type: { type: String, enum: ["Casa", "Departamento", "Terreno", "Local Comercial"], required: true },
  bedrooms: { type: Number, default: 0 },
  bathrooms: { type: Number, default: 0 },
  description: { type: String, required: true },
  features: { type: [String], default: [] },
  imageUrl: { type: String, default: "" }
}, { timestamps: true });

const Property = mongoose.model("Property", propertySchema);

// ==============================
// RUTAS RESTFUL DE PROPIEDADES
// ==============================

// GET todas
app.get("/api/properties", async (req, res) => {
  try {
    const properties = await Property.find();
    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener propiedades" });
  }
});

// GET una por ID
app.get("/api/properties/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: "Propiedad no encontrada" });
    res.json(property);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener propiedad" });
  }
});

// POST nueva
app.post("/api/properties", async (req, res) => {
  try {
    const newProperty = new Property(req.body);
    await newProperty.save();
    res.json({ message: "Propiedad creada correctamente", property: newProperty });
  } catch (err) {
    res.status(400).json({ error: "Error al crear propiedad", detalle: err.message });
  }
});

// PUT actualizar
app.put("/api/properties/:id", async (req, res) => {
  try {
    const updated = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Propiedad no encontrada" });
    res.json({ message: "Propiedad actualizada correctamente", property: updated });
  } catch (err) {
    res.status(400).json({ error: "Error al actualizar propiedad", detalle: err.message });
  }
});

// DELETE eliminar
app.delete("/api/properties/:id", async (req, res) => {
  try {
    const deleted = await Property.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Propiedad no encontrada" });
    res.json({ message: "Propiedad eliminada correctamente" });
  } catch (err) {
    res.status(400).json({ error: "Error al eliminar propiedad", detalle: err.message });
  }
});
// ===============================================================================

// Middleware para verificar la sesión
function verificarSesion(req, res, next) {
  if (!req.session.usuarioId) {
      return res.redirect('/login'); // Redirige a la página de inicio de sesión
  }
  next();
}

// Rutas protegidas
app.get('/ruta-protegida', verificarSesion, (req, res) => {
  res.sendFile(path.join(__dirname, 'rutaProtegida.html'));
});


//OTRAS CONEXIONES

// Configuraciones


// Definición del esquema y modelo para los tokens de acceso
const AccessTokenSchema = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '1h' },
}, { collection: 'AccesosToken' });

const AccessToken = mongoose.model('AccessToken', AccessTokenSchema);

// Función para generar un token único
function generateUniqueToken() {
  return crypto.randomBytes(20).toString('hex');
}

// Función para guardar el token en la base de datos
async function saveTokenToDatabase(email, token) {
  const accessToken = new AccessToken({ email, token });
  await accessToken.save();
}

// Función para validar el token en la base de datos
async function validateTokenInDatabase(token) {
  const accessToken = await AccessToken.findOne({ token });
  return accessToken !== null;
}

// Función para enviar el correo electrónico con el enlace de acceso
function sendAccessEmail(email, token) {
  const accessLink = `http://localhost:${port}/administracion?token=${token}`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: 'propiedadesnievas@gmail.com',
        pass: 'qqug tpxh qfbq rzxb',
    },
    logger: true,
    debug: true,
});


  const mailOptions = {
      from: 'propiedadesnievas@gmail.com',
      to: email,
      subject: 'Solicitud de acceso a la administración',
      text: `Haz clic en el siguiente enlace para acceder a la administración: ${accessLink}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log('Error al enviar el correo:', error);
      }
      console.log('Correo enviado:', info.response);
  });
}

// Ruta para solicitar acceso
app.post('/solicitar-acceso', async (req, res) => {
  try {
      const email = req.body.email;

      if (email === ADMIN_EMAIL) {
          const token = generateUniqueToken();
          await saveTokenToDatabase(email, token);
          sendAccessEmail(email, token);
          res.status(200).send('Correo de acceso enviado.');
      } else {
          res.status(403).send('Acceso denegado.');
      }
  } catch (error) {
      console.error('Error en la ruta /solicitar-acceso:', error);
      res.status(500).send('Error interno del servidor.');
  }
});

// Ruta para la administración
app.get('/administracion', async (req, res) => {
  const token = req.query.token;
  const validToken = await validateTokenInDatabase(token);

  if (validToken) {
      res.redirect('/template/RolAdmin/InicioAdmin.html');
  } else {
      res.status(403).send('Token inválido o expirado.');
  }
});


/** Healthcheck */
app.get('/health', (req,res)=>{
  const ready = mongoose.connection.readyState === 1;
  res.json({
    mongo: ready ? 'Conectado' : 'Desconectado',
    db: process.env.MONGODB_DB,
    app: process.env.APP_NAME
  });
});

// fetch('/api/inquiries').then(r=>r.json()).then(console.log)
