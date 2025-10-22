// ========================
// AUTENTICACIÓN
// ========================

// Login
document.getElementById('form-login').onsubmit = async function (e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const contraseña = document.getElementById('login-pass').value;

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, contraseña }),
    });

    const data = await res.json();
    if (res.ok) {
      document.getElementById('auth-message').textContent = '¡Bienvenido!';
      document.getElementById('auth-message').className =
        'mt-4 text-center font-semibold text-[#14b8a6]';
      setTimeout(() => {
        document.getElementById('modal-auth').classList.add('hidden');
        document.getElementById('auth-message').textContent = '';
      }, 1200);
    } else {
      document.getElementById('auth-message').textContent = data.mensaje;
      document.getElementById('auth-message').className =
        'mt-4 text-center font-semibold text-red-500';
    }
  } catch (err) {
    console.error(err);
    alert('Error al iniciar sesión');
  }
};

// Registro
document.getElementById('form-register').onsubmit = async function (e) {
  e.preventDefault();
  const nombre = document.getElementById('reg-nombre').value;
  const email = document.getElementById('reg-email').value;
  const contraseña = document.getElementById('reg-pass').value;

  try {
    const res = await fetch('/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, contraseña }),
    });

    const data = await res.text();
    if (res.ok) {
      document.getElementById('auth-message').textContent = '¡Registro exitoso!';
      document.getElementById('auth-message').className =
        'mt-4 text-center font-semibold text-[#14b8a6]';
      setTimeout(() => {
        document.getElementById('modal-auth').classList.add('hidden');
        document.getElementById('auth-message').textContent = '';
      }, 1200);
    } else {
      document.getElementById('auth-message').textContent = data;
      document.getElementById('auth-message').className =
        'mt-4 text-center font-semibold text-red-500';
    }
  } catch (err) {
    console.error(err);
    alert('Error al registrar usuario');
  }
};

// Logout
async function logout() {
  try {
    const res = await fetch('/logout', { method: 'POST' });
    if (res.ok) {
      window.location.href = '/';
    }
  } catch (err) {
    console.error(err);
  }
}

// ========================
// PROPIEDADES
// ========================

async function cargarPropiedades() {
  try {
    const res = await fetch('/api/Casas'); // podés cambiar a Departamentos, etc.
    if (!res.ok) throw new Error('Error al obtener propiedades');
    const data = await res.json();

    const contenedor = document.getElementById('lista-propiedades');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    data.forEach((p) => {
      const card = document.createElement('div');
      card.className =
        'bg-black border border-[#0f766e] rounded-lg p-4 flex flex-col';
      card.innerHTML = `
        <h3 class="text-xl font-bold text-[#14b8a6] mb-2">${p.titulo}</h3>
        <p class="text-[#0f766e]">Precio: $${p.precio}</p>
        <p class="text-[#0f766e]">Ciudad: ${p.ciudad || ''}</p>
      `;
      contenedor.appendChild(card);
    });
  } catch (err) {
    console.error(err);
  }
}

// ========================
// CONTACTO
// ========================

async function enviarContacto() {
  const nombre = document.getElementById('contact-nombre').value;
  const apellido = document.getElementById('contact-apellido').value;
  const email = document.getElementById('contact-email').value;
  const asunto = document.getElementById('contact-asunto').value;
  const mensaje = document.getElementById('contact-mensaje').value;

  try {
    const res = await fetch('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, apellido, email, asunto, mensaje }),
    });

    if (res.ok) {
      alert('Mensaje enviado ✅');
    } else {
      alert('Error al enviar mensaje');
    }
  } catch (err) {
    console.error(err);
  }
}

// ========================
// INICIO
// ========================

window.onload = () => {
  if (document.getElementById('lista-propiedades')) {
    cargarPropiedades();
  }
};
