# Plan para Arreglar Firebase en Carrito y Catálogo

## Problemas Identificados
- Configuración de Firebase inconsistente entre archivos
- Productos hardcodeados en HTML en lugar de cargarse desde Firebase
- Inicialización de Firebase duplicada
- Colecciones de Firebase no coinciden con el código

## Tareas a Realizar

### 1. Actualizar Configuración de Firebase
- [ ] Actualizar `public/js/catalogo.js` para usar configuración correcta de `src/config/firebase.js`
- [ ] Actualizar `public/assets/js/carrito.js` para usar configuración correcta
- [ ] Eliminar inicializaciones duplicadas de Firebase

### 2. Corregir Carga de Productos
- [ ] Modificar `catalogo.html` para cargar productos dinámicamente desde Firebase
- [ ] Asegurar que la colección "producto" en Firebase tenga datos
- [ ] Verificar que los productos se muestren correctamente

### 3. Arreglar Funcionalidad del Carrito
- [ ] Verificar que los botones "Agregar al Carrito" funcionen
- [ ] Asegurar sincronización entre catálogo y carrito
- [ ] Probar funcionalidades de aumentar/disminuir/eliminar productos

### 4. Verificar Colecciones de Firebase
- [ ] Confirmar existencia de colección "producto"
- [ ] Confirmar existencia de colección "oferta" (si se usa)
- [ ] Asegurar estructura de datos correcta en Firestore

### 5. Testing Final
- [ ] Probar carga de catálogo
- [ ] Probar agregar productos al carrito
- [ ] Probar funcionalidades del carrito
- [ ] Verificar que no haya errores en consola
