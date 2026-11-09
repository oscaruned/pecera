# Marcador de acuario 🐠

Widget de puntuación para juegos: una pecera SVG animada donde un pez cartoon
molde el estado de la partida con el nivel del agua.

## Archivos

- `index.html` — demo con controles (±1/±10 puntos, reinicio, silencio)
- `style.css` — estilos del marcador
- `js/scene.js` — construcción SVG de la pecera y de los peces
- `js/animation.js` — orquestador: bucle de animación y **modelo de puntuación**
- `js/fish.js` — nado, giro en U, expresiones, muerte, evolución y cardumen
- `js/water.js` — nivel del agua y ondas de superficie
- `js/bubbles.js` — burbujas y salpicaduras
- `js/audio.js` — sonido Web Audio (perezoso, silenciable)
- `js/app.js` — bootstrap + API pública

## Modelo de puntuación

```
-20 pts  →  0% de agua   (muerte del pez: fin del juego)
  0 pts  → 40% de agua   (partida limpia)
+80 pts  →100% de agua   (satura: el pez evoluciona y llegan peces)
```

- De −20 a 0 el agua sube 2%/punto (el peligro se ve de cerca).
- De 0 a +80 sube 0,75%/punto.
- Al llegar a −20 el pez muere y el marcador queda congelado hasta `reset()`
  (una partida terminada no reacciona a más puntuaciones).
- Por encima de +80 el agua ya no sube; cada hito pbis da vida: peces
  acompañantes (cada +60, máx. 4), crecimiento dorado (+120/+200) y corona (+280).
- Los hitos son reversibles: si la puntuación cae, el cardumen y la evolución
  se pierden.

## API pública (`window.aquarium`)

```javascript
setScore(30);       // puntos absolutos (aplica el modelo completo)
changeScore(-10);   // ajuste relativo
reset();            // nueva partida (pez vivo de nuevo, agua al 40%)

setVolume(0.8);     // volumen general 0..1 (admite hasta 1.5)
setMuted(true);     // silencio (equivale al botón 🔊)

word();             // ← llamar con CADA palabra nueva: el contador de
                    //   "minuto sin responder" vuelve a cero
setIdleClock({ seconds: 60, penalty: 0 });  // duración y penalización opcional

// compatibilidad con la versión anterior
setWaterLevel(65);  // % de agua directo (0..100)
changeWater(-10);   // gama relativa sobre el agua
fish.happy(); fish.scared(); fish.feed(); // reacciones manuales
```

Eventos del orquestador (`window.aquariumInstance.on('evento', fn)`):
`level`, `fishstate`, `milestone`, `gameover`, `idle` (minuto sin responder),
`idleTick` (cada segundo: `{elapsed, max}`).

## Rendimiento

Referencias de nodos cacheadas (cero `querySelector` por frame), ondas
recalculadas sólo al cambiar el nivel y un único `requestAnimationFrame`.
Verificado con performance trace: sin tareas > 50 ms.
