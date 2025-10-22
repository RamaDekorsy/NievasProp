DEPLOY EN RENDER — Propiedades Nievas
====================================

1) Subí este repo/zip a GitHub o conectalo directo en Render:
   - New → Web Service
   - Build Command: npm install
   - Start Command: npm start
   - Runtime: Node 18

2) Variables de entorno en Render (Dashboard → Environment):
   - MONGODB_URI=... (Atlas)
   - MONGODB_DB=NIEVAS-DB
   - GMAIL_USER=propiedadesnievas@gmail.com
   - GMAIL_PASS=<contraseña_de_aplicación>
   - MAIL_TO=propiedadesnievas@gmail.com

3) Estructura:
   - public/        (tus HTML, CSS, JS, imágenes)
   - backend/api/   (API Express)
   - server.js      (sirve public y /api)

4) Endpoints de prueba:
   - GET   /health
   - GET   /api/health
   - POST  /api/contact  (JSON: name, email, phone, message, propertyId)

5) Notas:
   - Render expone PORT via env, el server escucha 0.0.0.0:PORT
   - Si faltan assets, asegurate de que estén bajo /public
