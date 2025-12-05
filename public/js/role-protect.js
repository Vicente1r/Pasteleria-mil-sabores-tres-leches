// role-protect.js
// Utility to apply a read-only view for 'vendedor' users.
window.enableReadOnlyView = function enableReadOnlyView() {
  // Disable form controls, buttons, editable elements and hide edit actions
  const disableSelectors = [
    'button', 'input', 'select', 'textarea', '[contenteditable="true"]',
    '.btn-primary', '.btn-register', '.btn-imprimir', '.page-btn', '.edit', '.delete', '.save', '.form-actions button'
  ];

  disableSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      try { el.setAttribute('disabled','disabled'); } catch(e) {}
      el.style.pointerEvents = 'none';
      el.style.opacity = el.style.opacity || '0.85';
    });
  });

  // Prevent links/buttons that navigate or modify data
  document.querySelectorAll('a').forEach(a => {
    // keep navigation to profile/admin allowed visually, but prevent actions that change data
    const href = a.getAttribute('href') || '';
    // allow simple navigation links (starting with / or .html) but block javascript: and # actions
    if (!href || href.startsWith('javascript:') || href === '#') {
      a.addEventListener('click', e => e.preventDefault());
      a.style.pointerEvents = 'none';
      a.style.opacity = '0.85';
    }
  });

  // Block click handlers on elements with data-action attributes
  document.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', e => e.preventDefault());
    el.style.pointerEvents = 'none';
    el.style.opacity = '0.85';
  });

  // Add a small banner indicating read-only mode
  const banner = document.createElement('div');
  banner.textContent = 'Modo Vendedor (solo lectura) — puede ver información, pero no editar.';
  banner.style.cssText = 'position:fixed;top:8px;left:50%;transform:translateX(-50%);background:#fff7cc;border:1px solid #f0c36d;padding:8px 12px;border-radius:8px;z-index:99999;color:#6b3b00;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.08);';
  document.body.appendChild(banner);

  // Make nav items inert (visual only)
  // Keep nav items usable for switching views, but make clear they're read-only
  document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    // do not prevent clicks here so the view navigation still works
    item.style.cursor = 'pointer';
    item.style.opacity = '0.98';
  });
};

// Export a convenience function to check role and apply read-only automatically
window.applyRoleProtection = async function applyRoleProtection(firebaseAuth, firestoreDb) {
  if (!firebaseAuth || !firestoreDb) return;
  const user = firebaseAuth.currentUser;
  if (!user) return;
  try {
    const doc = await firestoreDb.collection('users').doc(user.uid).get();
    if (!doc.exists) return;
    const data = doc.data();
    if (data && (data.role === 'vendedor' || data.rol === 'vendedor')) {
      enableReadOnlyView();
    }
  } catch (e) {
    console.warn('applyRoleProtection error', e);
  }
};
