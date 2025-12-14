# TODO: Add Offers Section to Carrito.html

## Task Overview
Add a section in carrito.html to display offer products dynamically loaded from Firestore, similar to oferta.html.

## Steps
- [ ] Modify carrito-ofertas.js to load and display offers in the aside
- [ ] Update carrito.html to remove hardcoded offers and ensure dynamic loading
- [ ] Test the integration

## Information Gathered
- oferta.html loads products from Firestore collection "oferta" using ofertas.js
- carrito.html has an aside with id="ofertasGrid" currently with hardcoded products
- carrito-ofertas.js is empty and needs to be populated with loading logic

## Plan
1. Populate carrito-ofertas.js with logic to fetch offers from Firestore and render them in #ofertasGrid
2. Remove hardcoded products from carrito.html aside
3. Ensure Firebase scripts are included in carrito.html (they are)
4. Test that offers load correctly in the carrito page
