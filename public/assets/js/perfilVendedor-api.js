document.addEventListener('DOMContentLoaded', () => {
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

  // Fetch products from Firestore
  async function loadProducts() {
    const tbody = document.getElementById('productos-tbody');
    try {
      const snapshot = await window.getDocs(window.collection(window.firebaseDb, 'producto'));
      const productos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  // Fetch orders from Firestore
  async function loadOrders() {
    const tbody = document.getElementById('ordenes-tbody');
    try {
      const q = window.query(window.collection(window.firebaseDb, 'compras'), window.where('fecha', '!=', null));
      const snapshot = await window.getDocs(q);
      const ordenes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => {
        if (a.fecha && b.fecha) {
          return b.fecha.seconds - a.fecha.seconds;
        }
        return 0;
      });
      tbody.innerHTML = '';
      ordenes.forEach(o => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${o.id || ''}</td>
          <td>${o.clienteNombre || o.nombreCliente || ''}</td>
          <td>${o.total != null ? o.total : ''}</td>
          <td>${o.estado || 'Pendiente'}</td>
          <td>${o.fecha ? new Date(o.fecha.seconds * 1000).toLocaleDateString('es-ES') : ''}</td>
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
      // fetch product details from Firestore
      try {
        const docRef = window.doc(window.firebaseDb, 'producto', id);
        const docSnap = await window.getDoc(docRef);
        if (!docSnap.exists()) throw new Error('Producto no encontrado');
        const p = docSnap.data();
        alert(`Producto: ${p.nombre}\nPrecio: ${p.precio}\nStock: ${p.stock}\nCategoria: ${p.categoria}`);
      } catch (err) {
        alert('No se pudo obtener el producto: ' + err.message);
      }
    }
    if (action === 'view-order') {
      try {
        const docRef = window.doc(window.firebaseDb, 'compras', id);
        const docSnap = await window.getDoc(docRef);
        if (!docSnap.exists()) throw new Error('Orden no encontrada');
        const o = docSnap.data();
        const lines = o.productos && o.productos.length ? o.productos.map(x=>`${x.cantidad} x ${x.nombre} ($${x.precio})`).join('\n') : '';
        alert(`Orden: ${id}\nCliente: ${o.clienteNombre || o.nombreCliente}\nTotal: ${o.total}\nEstado: ${o.estado}\nProductos:\n${lines}`);
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
      const user = window.firebaseAuth.currentUser;
      if (user) {
        // try Firestore users collection
        const docRef = window.doc(window.firebaseDb, 'users', user.uid);
        const docSnap = await window.getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          nombreInput.value = data.nombre || '';
          return;
        }
        // fallback: try vendedor collection
        const q = window.query(window.collection(window.firebaseDb, 'vendedor'), window.where('correo', '==', user.email));
        const querySnapshot = await window.getDocs(q);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          nombreInput.value = data.nombre || '';
          return;
        }
      }
    } catch (e) {
      console.warn('No se pudo cargar perfil desde Firestore:', e);
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
      const user = window.firebaseAuth.currentUser;
      if (user) {
        // Update Firestore users collection
        const userDocRef = window.doc(window.firebaseDb, 'users', user.uid);
        await window.updateDoc(userDocRef, { nombre: newName });
        // Also update vendedor collection if exists
        const q = window.query(window.collection(window.firebaseDb, 'vendedor'), window.where('correo', '==', user.email));
        const querySnapshot = await window.getDocs(q);
        if (!querySnapshot.empty) {
          const vendedorDocRef = window.doc(window.firebaseDb, 'vendedor', querySnapshot.docs[0].id);
          await window.updateDoc(vendedorDocRef, { nombre: newName });
        }
        status.textContent = 'Nombre actualizado correctamente';
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
