// ===== Galería =====
const mainImg = document.getElementById('img-principal');
document.querySelectorAll('.thumbs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.thumbs button').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const src = btn.querySelector('img').dataset.src;
    if (src) mainImg.src = src;
  });
});

// ===== Carrito (demo) =====
document.getElementById('agregar-carrito')?.addEventListener('click', () => {
  const qty = Number(document.getElementById('cantidad').value || 1);
  alert(`Añadido al carrito: ${qty} × Torta Cuadrada de Chocolate`);
});
