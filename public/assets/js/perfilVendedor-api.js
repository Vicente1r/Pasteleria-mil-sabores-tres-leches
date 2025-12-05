document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = '/api';

  // Navigation: show/hide sections when menu links clicked
  document.querySelectorAll('.menu-link').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const href = a.getAttribute('href') || '#dashboard';
      const id = href.replace('#', '') || 'dashboard';
      document.querySelectorAll('main.admin-main section').forEach(s => s.style.display = 'none');
      const target = document.getElementById(id);
      if (target) target.style.display = '';
      // update title if present
      const titleEl = document.getElementById('bienvenidoPrincipal');
      if (titleEl) {
        if (id === 'dashboard') titleEl.textContent = 'Bienvenido al Panel de Vendedor';
        else titleEl.textContent = 'Sección: ' + id;
      }
    });
  });

  // Fetch products
  async function loadProducts() {
    const tbody = document.getElementById('productos-tbody');
    try {
      const res = await fetch(API_BASE + '/productos');
      if (!res.ok) throw new Error('Error cargando productos');
      const productos = await res.json();
      tbody.innerHTML = '';
      productos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${p.id || ''}</td>
          <td>${p.nombre || ''}</td>
          <td>${p.precio != null ? p.precio : ''}</td>
          <td>${p.stock != null ? p.stock : ''}</td>
          <td>${p.categoria || ''}</td>
          <td><button class="btn btn-secondary" data-id="${p.id}" data-action="view-product">Ver</button></td>
        `;
        tbody.appendChild(tr);
      });
    } catch (e) {
      console.error(e);
      tbody.innerHTML = '<tr><td colspan="6" class="no-data">No se pudieron cargar los productos</td></tr>';
    }
  }

  // Fetch orders
  async function loadOrders() {
    const tbody = document.getElementById('ordenes-tbody');
    try {
      const res = await fetch(API_BASE + '/ordenes');
      if (!res.ok) throw new Error('Error cargando ordenes');
      const ordenes = await res.json();
      tbody.innerHTML = '';
      ordenes.forEach(o => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${o.id || ''}</td>
          <td>${o.clienteNombre || ''}</td>
          <td>${o.total != null ? o.total : ''}</td>
          <td>${o.estado || ''}</td>
          <td>${o.fecha || ''}</td>
          <td><button class="btn btn-secondary" data-id="${o.id}" data-action="view-order">Ver</button></td>
        `;
        tbody.appendChild(tr);
      });
    } catch (e) {
      console.error(e);
      tbody.innerHTML = '<tr><td colspan="6" class="no-data">No se pudieron cargar las órdenes</td></tr>';
    }
  }

  // Delegated click handler for view buttons
  document.body.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    if (action === 'view-product') {
      // fetch product details and show modal (simple alert for now)
      try {
        const res = await fetch(API_BASE + '/productos/' + encodeURIComponent(id));
        if (!res.ok) throw new Error('Producto no encontrado');
        const p = await res.json();
        alert(`Producto: ${p.nombre}\nPrecio: ${p.precio}\nStock: ${p.stock}\nCategoria: ${p.categoria}`);
      } catch (err) {
        alert('No se pudo obtener el producto: ' + err.message);
      }
    }
    if (action === 'view-order') {
      try {
        const res = await fetch(API_BASE + '/ordenes/' + encodeURIComponent(id));
        if (!res.ok) throw new Error('Orden no encontrada');
        const o = await res.json();
        const lines = o.productos && o.productos.length ? o.productos.map(x=>`${x.cantidad} x ${x.nombre} ($${x.precio})`).join('\n') : '';
        alert(`Orden: ${o.id}\nCliente: ${o.clienteNombre}\nTotal: ${o.total}\nEstado: ${o.estado}\nProductos:\n${lines}`);
      } catch (err) {
        alert('No se pudo obtener la orden: ' + err.message);
      }
    }
  });

  // Perfil: load current name and handle update
  async function loadProfile() {
    const nombreInput = document.getElementById('vendedorNombre');
    const status = document.getElementById('perfilStatus');
    // try Firebase Auth user
    try {
      const user = firebase.auth().currentUser;
      if (user) {
        // try GET /api/usuarios/{uid}
        const res = await fetch(API_BASE + '/usuarios/' + encodeURIComponent(user.uid));
        if (res.ok) {
          const u = await res.json();
          nombreInput.value = u.nombre || '';
          return;
        }
        // fallback: try Firestore users collection
        const doc = await firebase.firestore().collection('users').doc(user.uid).get();
        if (doc.exists) {
          const data = doc.data();
          nombreInput.value = data.nombre || '';
          return;
        }
      }
    } catch (e) {
      console.warn('No se pudo cargar perfil desde API/Auth:', e);
    }
    // fallback to localStorage
    try {
      const raw = localStorage.getItem('usuario');
      if (raw) {
        const u = JSON.parse(raw);
        nombreInput.value = u.nombre || '';
      }
    } catch (e) {}
  }

  async function saveProfile(e) {
    e.preventDefault();
    const nombreInput = document.getElementById('vendedorNombre');
    const status = document.getElementById('perfilStatus');
    status.textContent = '';
    const newName = nombreInput.value.trim();
    if (!newName) { status.textContent = 'Ingresa un nombre'; return; }

    try {
      const user = firebase.auth().currentUser;
      if (user) {
        // Try PUT to API (include Firebase ID token if available)
        try {
          const headers = { 'Content-Type': 'application/json' };
          try {
            const idToken = await user.getIdToken();
            if (idToken) headers['Authorization'] = 'Bearer ' + idToken;
          } catch (tErr) {
            console.warn('No se pudo obtener idToken:', tErr);
          }

          const res = await fetch(API_BASE + '/usuarios/' + encodeURIComponent(user.uid), {
            method: 'PUT',
            headers,
            body: JSON.stringify({ nombre: newName })
          });

          if (res.ok) {
            status.textContent = 'Nombre actualizado (API)';
            // update local users collection too
            await firebase.firestore().collection('users').doc(user.uid).set({ nombre: newName }, { merge: true });
            return;
          }

          // If API returned an error, try to extract message for diagnostics
          let errMsg = `API error ${res.status}`;
          try {
            const body = await res.json();
            if (body && body.message) errMsg = body.message;
            else if (body && body.error) errMsg = body.error;
          } catch (parseErr) {
            try { const text = await res.text(); if (text) errMsg = text; } catch(_){}
          }
          console.warn('PUT /usuarios error:', res.status, errMsg);

          // fallback to Firestore update
          await firebase.firestore().collection('users').doc(user.uid).set({ nombre: newName }, { merge: true });
          status.textContent = 'Nombre actualizado (Firestore) — nota: ' + errMsg;
          // update localStorage
          try { const raw = localStorage.getItem('usuario'); if (raw) { const u = JSON.parse(raw); u.nombre = newName; localStorage.setItem('usuario', JSON.stringify(u)); } } catch(e){}
          return;
        } catch (apiErr) {
          console.error('Error en PUT /usuarios:', apiErr);
          // Attempt Firestore fallback
          try {
            await firebase.firestore().collection('users').doc(user.uid).set({ nombre: newName }, { merge: true });
            status.textContent = 'Nombre actualizado (Firestore)';
            try { const raw = localStorage.getItem('usuario'); if (raw) { const u = JSON.parse(raw); u.nombre = newName; localStorage.setItem('usuario', JSON.stringify(u)); } } catch(e){}
            return;
          } catch (fsErr) {
            console.error('Firestore fallback failed:', fsErr);
            throw fsErr; // will be caught by outer catch
          }
        }
        // update localStorage
        try { const raw = localStorage.getItem('usuario'); if (raw) { const u = JSON.parse(raw); u.nombre = newName; localStorage.setItem('usuario', JSON.stringify(u)); } } catch(e){}
        return;
      }
      // if no firebase user, update localStorage only
      const raw = localStorage.getItem('usuario');
      if (raw) { const u = JSON.parse(raw); u.nombre = newName; localStorage.setItem('usuario', JSON.stringify(u)); status.textContent = 'Nombre guardado localmente'; return; }
      status.textContent = 'No se pudo actualizar nombre: no autenticado';
    } catch (err) {
      console.error(err);
      status.textContent = 'Error al actualizar nombre';
    }
  }

  document.getElementById('perfilForm')?.addEventListener('submit', saveProfile);

  // Initial loads
  loadProducts();
  loadOrders();
  loadProfile();

});
