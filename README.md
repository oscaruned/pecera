# Pecera animada

Proyecto de demostración: una pecera SVG animada en una sola página.

Archivos principales:
- `index.html` — página única con SVG y controles
- `style.css` — estilos
- `js/` — módulos (app, fish, water, bubbles, audio, animation)

API pública disponible en `window.aquarium`:

```javascript
setWaterLevel(65);
changeWater(-10);
fish.feed();
fish.die();
fish.happy();
fish.scared();
```

Abrir `index.html` en un navegador moderno para probar.
