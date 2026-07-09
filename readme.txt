
Quiero que me prepares una animacion, tipo dibujo animado, en un proyecto con html y javascript. Debe ser una pecera, en la que hay un pez y otras cosas que verás ahora. Debe tener también sonido.
	El proyecto debe onstar de una sola página html, que cargue la animación y tenga dos o tres controles para manejarla.
	Dime si estos pasos que te pongo te parecen adecuados y suficientes.


### Especificación que voy a implementar

#### 🐠 Pecera

* SVG 100% vectorial.
* Cristal con reflejos.
* Arena.
* Rocas.
* Plantas que se balancean.
* Ondas en la superficie.
* Partículas suspendidas.

#### 🐟 Pez

No será una imagen.

Estará construido por piezas SVG:

* cuerpo
* cola
* aleta dorsal
* aletas inferiores
* ojo
* pupila
* boca

Las piezas se deformarán para dar sensación de dibujo animado.

#### Movimiento del pez

* Nada continuamente.
* Cambia de dirección.
* Rebota en los cristales.
* Sigue una trayectoria senoidal.
* Baja automáticamente cuando baja el agua.

#### Estados del pez

**100–40 % agua**

* feliz
* burbujas
* velocidad normal

**40–20 %**

* preocupado
* menos burbujas
* cola más lenta

**20–5 %**

* boquea
* ojos grandes
* respiración rápida
* nada muy poco

**5–1 %**

* cae
* intenta moverse

**0 %**

* cae al fondo
* ojos en X
* inmóvil

#### comportamiento del Agua

* Baja suavemente.
* Sube suavemente.
* Ondas animadas.
* Reflejos.

#### Burbujas

* Aleatorias, saliendo de la boca del pez
* Distintos tamaños.
* Suben.
* Explotan en la superficie.

#### Audio

Generado con Web Audio API.

Habrá:

* murmullo del agua
* burbujas
* sonido al subir agua
* sonido al bajar agua

Sin depender de MP3.

#### Controles

* Botón +
* Botón -
* Slider
* Indicador de porcentaje
* Indicador de estado del pez

#### Arquitectura

```text
index.html
style.css

js/
    app.js
    fish.js
    water.js
    bubbles.js
    audio.js
    animation.js

svg/
    fish.svg
    aquarium.svg
```

Todo comentado para que pueda modificarlo.

---

## Una mejora que quiero añadir

Como soy programador, quiero que la pecera pueda controlarse desde código, y que pueda insertarla en cualquier proyecto php o javascript, sinviéndome como un indicador, por ejemplo, de una puntuacion en un juego.


Por ejemplo:

```javascript
setWaterLevel(65);

changeWater(-10);

fish.feed();

fish.die();

fish.happy();

fish.scared();
```
