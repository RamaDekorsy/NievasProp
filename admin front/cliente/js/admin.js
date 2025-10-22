document.addEventListener('DOMContentLoaded', async () => {
  // Consultas recientes
  try {
    const res = await fetch('/api/inquiries');
    const consultas = await res.json();
    const tbody = document.querySelector('.min-w-full tbody');
    tbody.innerHTML = '';
    consultas.forEach(c => {
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50';
      tr.innerHTML = `
        <td class="py-2 px-4">${c.nombre}</td>
        <td class="py-2 px-4">${c.email}</td>
        <td class="py-2 px-4">${new Date(c.fecha).toLocaleDateString()}</td>
      `;
      tbody.appendChild(tr);
    });
    // Actualiza el contador de consultas
    document.getElementById('dashboard-consultas').textContent = consultas.length;
  } catch (err) {
    console.error('Error cargando consultas:', err);
  }

  // Si tienes endpoints para propiedades, citas y usuarios, puedes agregarlos aquí
  // Ejemplo para propiedades:
  // const resProp = await fetch('/api/properties');
  // const propiedades = await resProp.json();
  // document.getElementById('dashboard-propiedades').textContent = propiedades.length;
});