
const select = document.getElementById('filtro');
const items = document.querySelectorAll('#productos .item');

function aplicarFiltro() {
  const categoria = select.value;
  items.forEach(el => {
    const coincide = categoria === 'all' || el.dataset.category === categoria;
    el.hidden = !coincide;
  });
}



aplicarFiltro();