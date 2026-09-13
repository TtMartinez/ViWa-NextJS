# ViWa — versión Next.js (React)

Migración de la versión estática (HTML + JS vanilla) a Next.js 14 (App Router).
Mismo sitio, misma lógica, mismo diseño — reorganizado en componentes.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrí http://localhost:3000

## Qué cambió respecto al proyecto original

| Antes (vanilla) | Ahora (Next.js) |
|---|---|
| 8 archivos `.html` en `pages/` | 8 carpetas con `page.js` en `app/productos/` |
| `js/productos.js` (todo mezclado) | `lib/sanity.js` + `components/ProductGrid.jsx` + `components/BalsamosGrid.jsx` + `components/ProductModal.jsx` |
| `js/script.js` (carrito con variable global + localStorage a mano) | `context/CartContext.jsx` (mismo localStorage, pero manejado por React) |
| `<nav>` y `toggleDropdown()` repetidos en cada `.html` | `components/Header.jsx` (uno solo, reutilizado) |
| Footer repetido (a veces completo, a veces no) | `components/Footer.jsx` (uno solo, en todas las páginas) |
| Modal de pago inyectado con `insertAdjacentHTML` | `components/PaymentModal.jsx` |

## Lo que NO cambió (a propósito)

- El diseño visual: `styles.css` se copió tal cual a `app/globals.css`.
- La lógica de negocio: mismos cálculos de precio, mismo armado del mensaje de WhatsApp,
  mismo número, misma consulta a Sanity (GROQ).
- El envío de pedidos sigue siendo por WhatsApp — Mercado Pago, transferencia con
  confirmación automática y envío de libros por email quedan para la próxima etapa
  (van a necesitar backend propio, no solo este cambio de frontend).

## Estructura

```
app/
  layout.js              → Header + Footer + Carrito + Modal + Toast (envuelven todo)
  page.js                → Home
  productos/<slug>/      → una carpeta por categoría
  politica-de-privacidad/
components/               → piezas de UI reutilizables
context/
  CartContext.jsx         → estado global del carrito (reemplaza la variable "carrito")
  ModalContext.jsx        → estado global del modal de producto abierto
lib/
  sanity.js                → fetch de productos + armado de URLs de imagen
  categorias.js            → configuración de cada categoría (antes duplicada en cada HTML)
```

## Próximo paso sugerido

Cuando quieras sumar Mercado Pago / transferencias con estado / envío de libros por mail,
se agrega una carpeta `app/api/` con los endpoints correspondientes — no hace falta
otro hosting ni otro framework, Next.js ya lo soporta.
