// scene.js - construção del marcado SVG de la pecera (marcador de juego)
// Crea toda la escena: cristal, fondo, agua, arena, decoración, medidor y peces.
// El nivel del clip de agua y la superficie se actualizan desde water.js.

const SVGNS = 'http://www.w3.org/2000/svg'
const svg = (tag, attrs = {}, parent = null) => {
  const el = document.createElementNS(SVGNS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v))
  if (parent) parent.appendChild(el)
  return el
}

// Gradientes de los peces: uno por paleta
function fishGradients(defs, id, pal){
  const g = svg('linearGradient', { id, x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, defs)
  svg('stop', { offset: '0%',  'stop-color': pal.bodyTop }, g)
  svg('stop', { offset: '55%', 'stop-color': pal.bodyMid }, g)
  svg('stop', { offset: '100%','stop-color': pal.bodyBot }, g)
  const t = svg('linearGradient', { id: id + 'Tail', x1: '0%', y1: '0%', x2: '100%', y2: '0%' }, defs)
  svg('stop', { offset: '0%', 'stop-color': pal.tail }, t)
  svg('stop', { offset: '100%', 'stop-color': pal.tailDark }, t)
}

// Construye un pez (Facing right, origen en el centro del cuerpo).
// Las partes tienen pivotes propios para animar cola, aletas y cuerpo por separado.
// opts.simple: versión reducida para peces acompañantes (misma estructura, sin extra-retazos).
function buildFishNode(parent, pal, id, opts = {}){
  const g = svg('g', { id: `fish-${id}` }, parent)
  const defs = svg('defs', {}, g)
  const gid = `-${id}`
  fishGradients(defs, gid + 'Body', pal)

  // sombra suave bajo el cuerpo (solo visible cerca del fondo)
  svg('ellipse', { id: `shadow${id}`, cx: 0, cy: 34, rx: 46, ry: 12, fill: 'rgba(10,45,70,0.18)' }, g)

  const body = svg('g', { id: `fishRoot${id}` }, g)

  // --- cola (pivote -44,0) : dos lóbulos sueltos, marco de pez rojo ---
  const tail = svg('g', { id: `tail${id}` }, body)
  svg('path', {
    d: 'M -40,2 C -66,-10 -86,-24 -98,-40 C -104,-30 -100,-14 -88,-2 Z',
    fill: `url(#${gid}BodyTail)`, stroke: pal.outline, 'stroke-width': 3, 'stroke-linejoin': 'round'
  }, tail)
  svg('path', {
    d: 'M -40,-2 C -66,10 -86,24 -98,40 C -104,30 -100,14 -88,2 Z',
    fill: `url(#${gid}BodyTail)`, stroke: pal.outline, 'stroke-width': 3, 'stroke-linejoin': 'round'
  }, tail)
  svg('path', { d: 'M -74,-16 Q -84,0 -74,16', fill: 'none', stroke: pal.fin, 'stroke-width': 2, opacity: 0.45 }, tail)

  // --- aleta dorsal generosa sobre el lomo (pivote -4,-36) ---
  const dorsal = svg('g', { id: `dorsal${id}` }, body)
  svg('path', {
    d: 'M -30,-40 C -18,-72 16,-74 38,-44 C 14,-56 -12,-54 -26,-38 Z',
    fill: pal.tail, stroke: pal.outline, 'stroke-width': 2.5, 'stroke-linejoin': 'round'
  }, dorsal)

  // --- aleta ventral pequeña (pivote 8,26) ---
  const pelvic = svg('g', { id: `pelvic${id}` }, body)
  svg('path', { d: 'M 4,26 C 10,38 22,40 28,32 C 20,28 12,26 4,26 Z', fill: pal.tail, stroke: pal.outline, 'stroke-width': 2 }, pelvic)

  // --- cuerpo regordete con contexto cartoon ---
  const torso = svg('g', { id: `torso${id}` }, body)
  // bandas (tipo pez de agua dulce); solo pez principal
  if (!opts.simple){
    svg('path', { d: 'M -2,-45 C 6,-22 6,22 -1,44 Z', fill: pal.stripe, opacity: 0.18 }, torso)
    svg('path', { d: 'M -24,-40 C -18,-20 -18,18 -23,42 Z', fill: pal.stripe, opacity: 0.14 }, torso)
  }
  svg('path', {
    id: `bodyShape${id}`,
    d: 'M -58,0 C -60,-30 -36,-47 2,-46 C 40,-45 62,-26 62,2 C 62,28 40,46 2,45 C -36,44 -56,30 -58,0 Z',
    fill: `url(#${gid}Body)`, stroke: pal.outline, 'stroke-width': 3.5, 'stroke-linejoin': 'round'
  }, torso)
  // panza clara
  svg('ellipse', { id: `belly${id}`, cx: -2, cy: 20, rx: 44, ry: 18, fill: pal.belly, opacity: 0.85 }, torso)
  // brillo superior (sutil)
  svg('ellipse', { cx: 10, cy: -26, rx: 30, ry: 9, fill: '#ffffff', opacity: 0.12 }, torso)

  // --- aleta pectoral (delante del cuerpo, pivote 6,12) ---
  const fin = svg('g', { id: `fin${id}` }, body)
  svg('path', { d: 'M 2,10 C 20,12 26,26 12,36 C -2,32 -6,20 2,10 Z', fill: pal.fin, stroke: pal.outline, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, fin)

  // --- mejilla sonrojada ---
  if (!opts.simple) svg('ellipse', { id: `cheek${id}`, cx: 40, cy: 6, rx: 6, ry: 4, fill: pal.cheek, opacity: 0.4 }, body)

  // --- ojo grande estilo cartoon (pivote 30,-14) ---
  // --- ojo cuarto estilo cartoon: base fija + subgrupo de mirada animada ---
  const eyeBase = svg('g', { id: `eye${id}`, transform: 'translate(30,-14)' }, body)
  const eyeG = svg('g', { id: `look${id}` }, eyeBase)
  svg('circle', { cx: 0, cy: 0, r: 10.2, fill: pal.eyeWhite, stroke: pal.outline, 'stroke-width': 2 }, eyeG)
  svg('circle', { id: `pupil${id}`, cx: 3, cy: 0.5, r: 4.1, fill: pal.pupil }, eyeG)
  svg('circle', { id: `glint${id}`, cx: -3, cy: -3.5, r: 2, fill: '#ffffff' }, eyeG)
  // párpado para el parpadeo
  svg('ellipse', { id: `lid${id}`, cx: 0, cy: 0, rx: 11.2, ry: 10.8, fill: pal.bodyMid, stroke: pal.outline, 'stroke-width': 2, opacity: 0 }, eyeG)

  // --- ojos muertos (X) al ahogarse; oculto por defecto ---
  if (!opts.simple){
    const dead = svg('g', { id: `deadEyes${id}`, opacity: 0 }, body)
    svg('path', { d: 'M 24,-20 L 38,-6 M 38,-20 L 24,-6', stroke: pal.outline, 'stroke-width': 3.4, 'stroke-linecap': 'round' }, dead)
    eyeG.setAttribute('opacity', '1')
  }

  // --- boca ---
  const mouth = svg('g', { id: `mouth${id}` }, body)
  svg('path', { id: `mouthArc${id}`, d: 'M 45,9 Q 51,15 57,9', fill: 'none', stroke: pal.mouth, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, mouth)
  svg('ellipse', { id: `mouthO${id}`, cx: 51, cy: 12, rx: 0, ry: 0, fill: 'rgba(90,30,15,0.6)', stroke: pal.mouth, 'stroke-width': 2, 'stroke-linecap': 'round' }, mouth)

  // --- corona (premio de evolución) ---
  if (!opts.simple){
    const crown = svg('g', { id: `crown${id}`, opacity: 0 }, body)
    svg('path', { d: 'M 10,-56 L 14,-70 L 22,-60 L 27,-74 L 33,-60 L 42,-70 L 45,-54 C 33,-58 22,-57 10,-56 Z', fill: '#ffd54a', stroke: '#b8860b', 'stroke-width': 2, 'stroke-linejoin': 'round' }, crown)
    svg('circle', { cx: 27, cy: -62, r: 2.4, fill: '#e14b6b' }, crown)
  }
  return g
}

// --------------------------------------------------------------- scene ----
export function buildScene(root){
  const wrap = document.createElement('div')
  wrap.className = 'aquarium-widget'
  wrap.innerHTML = `
    <div class="scene">
      <svg id="aquarium" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Marcador de acuario"></svg>
    </div>`
  root.appendChild(wrap)
  const svgRoot = wrap.querySelector('#aquarium')

  const defs = svg('defs', {}, svgRoot)

  // fondo del interior
  const sea = svg('linearGradient', { id: 'seaGradient', x1: '0', y1: '0', x2: '0', y2: '1' }, defs)
  svg('stop', { offset: '0', 'stop-color': '#eafaff' }, sea)
  svg('stop', { offset: '0.55', 'stop-color': '#c6ecfb' }, sea)
  svg('stop', { offset: '1', 'stop-color': '#a9ddf2' }, sea)

  const water = svg('linearGradient', { id: 'waterGradient', x1: '0', y1: '0', x2: '0', y2: '1' }, defs)
  svg('stop', { offset: '0', 'stop-color': '#7cd6f2', 'stop-opacity': '0.55' }, water)
  svg('stop', { offset: '0.5', 'stop-color': '#2a9cd0', 'stop-opacity': '0.62' }, water)
  svg('stop', { offset: '1', 'stop-color': '#0c5d92', 'stop-opacity': '0.72' }, water)

  const sandG = svg('linearGradient', { id: 'sandGradient', x1: '0', y1: '0', x2: '0', y2: '1' }, defs)
  svg('stop', { offset: '0', 'stop-color': '#f3d3a0' }, sandG)
  svg('stop', { offset: '1', 'stop-color': '#d3a068' }, sandG)

  const glow = svg('linearGradient', { id: 'glassSheen', x1: '0', y1: '0', x2: '0', y2: '1' }, defs)
  svg('stop', { offset: '0', 'stop-color': '#ffffff', 'stop-opacity': '0.5' }, glow)
  svg('stop', { offset: '0.4', 'stop-color': '#ffffff', 'stop-opacity': '0.06' }, glow)
  svg('stop', { offset: '1', 'stop-color': '#ffffff', 'stop-opacity': '0.25' }, glow)

  const vin = svg('radialGradient', { id: 'vignette', cx: '50%', cy: '46%', r: '75%' }, defs)
  svg('stop', { offset: '0.6', 'stop-color': '#063a5c', 'stop-opacity': '0' }, vin)
  svg('stop', { offset: '1', 'stop-color': '#063a5c', 'stop-opacity': '0.28' }, vin)

  const clip = svg('clipPath', { id: 'tankClip' }, defs)
  svg('rect', { x: 44, y: 34, width: 712, height: 432, rx: 16, ry: 16 }, clip)

  const waterClip = svg('clipPath', { id: 'waterClip' }, defs)
  const waterClipRect = svg('rect', { id: 'waterRect', x: 44, y: 214, width: 712, height: 252 }, waterClip)

  // ============ interior recortado al cristal ============
  const world = svg('g', { 'clip-path': 'url(#tankClip)' }, svgRoot)

  svg('rect', { x: 44, y: 34, width: 712, height: 432, fill: 'url(#seaGradient)' }, world)

  // rayos de luz (aparecen con puntuación alta)
  const godrays = svg('g', { id: 'godrays', opacity: 0.35 }, world)
  svg('polygon', { points: '180,34 260,34 320,300 210,300', fill: '#ffffff', opacity: 0.16 }, godrays)
  svg('polygon', { points: '360,34 410,34 470,320 370,320', fill: '#ffffff', opacity: 0.12 }, godrays)
  svg('polygon', { points: '580,34 640,34 590,340 480,340', fill: '#ffffff', opacity: 0.1 }, godrays)

  // ============ fondo decorativo (detrás del agua: la arena en pecera se ve teñida) ============
  const sand = svg('g', { id: 'sand' }, world)
  svg('path', {
    d: 'M 44,404 C 140,372 250,398 360,384 C 480,368 590,396 756,376 L 756,466 L 44,466 Z',
    fill: 'url(#sandGradient)'
  }, sand)
  svg('path', { d: 'M 300,386 C 360,374 430,376 500,388 C 430,382 360,382 300,386 Z', fill: '#f0c98f', opacity: 0.5 }, sand)
  svg('ellipse', { cx: 130, cy: 414, rx: 30, ry: 7, fill: '#c1915f', opacity: 0.5 }, sand)
  svg('ellipse', { cx: 640, cy: 410, rx: 38, ry: 8, fill: '#c1915f', opacity: 0.45 }, sand)

  const rocks = svg('g', { id: 'rocks' }, world)
  svg('path', { d: 'M 96,400 C 98,382 120,372 140,378 C 156,382 160,396 152,404 Z', fill: '#7d8894' }, rocks)
  svg('path', { d: 'M 118,404 C 118,390 132,384 146,390 C 156,395 156,402 148,404 Z', fill: '#95a2ae' }, rocks)
  svg('path', { d: 'M 596,402 C 600,380 628,372 648,382 C 664,390 664,402 654,404 Z', fill: '#7d8894' }, rocks)
  svg('path', { d: 'M 640,404 C 642,392 656,386 668,394 C 674,398 672,404 664,404 Z', fill: '#95a2ae' }, rocks)
  // manchas de luz (caústicas) sobre la arena
  const caustics = svg('g', { id: 'caustics', opacity: 0.35 }, world)
  svg('ellipse', { id: 'causticA', cx: 220, cy: 396, rx: 60, ry: 12, fill: '#ffffff', opacity: 0.3 }, caustics)
  svg('ellipse', { id: 'causticB', cx: 520, cy: 400, rx: 84, ry: 14, fill: '#ffffff', opacity: 0.22 }, caustics)

  // plantas ancladas a la arena
  const plants = svg('g', { id: 'plants' }, world)
  const plant = (x, scale, leaves) => {
    const pl = svg('g', { class: 'plant', transform: `translate(${x},392) scale(${scale})` }, plants)
    // tallo
    svg('path', { d: 'M 0,0 C -4,-30 4,-56 0,-84', stroke: '#188a4e', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round', opacity: 0.9 }, pl)
    for (let i = 0; i < leaves; i++){
      const hy = -14 - i * 22
      const dx = i % 2 === 0 ? 1 : -1
      svg('path', {
        d: `M 0,${hy} C ${dx * 22},${hy - 8} ${dx * 34},${hy - 22} ${dx * 38},${hy - 40} C ${dx * 20},${hy - 34} ${dx * 8},${hy - 20} 0,${hy + 4} Z`,
        fill: i % 2 === 0 ? '#2bb46a' : '#1b9a58', opacity: 0.92
      }, pl)
    }
  }
  plant(250, 1.05, 4)
  plant(300, 0.8, 3)
  plant(545, 1.15, 5)
  plant(595, 0.75, 3)
  plant(455, 0.6, 2)
  // coral
  svg('path', { d: 'M 388,398 C 384,378 376,368 380,352 M 392,398 C 394,380 402,370 398,356 M 396,400 C 398,382 410,376 412,362', stroke: '#e8698a', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round', opacity: 0.85 }, plants)

  // alga baja a la izquierda
  svg('path', { d: 'M 690,398 C 682,382 688,366 684,352', stroke: '#1fa058', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round', opacity: 0.85 }, plants)

  // ============ agua ENCIMA del decorado (lo tiñe como en una pecera real) ============
  svg('rect', { id: 'water', x: 44, y: 214, width: 712, height: 252, fill: 'url(#waterGradient)' }, world)
  // onda de superficie
  const wavesG = svg('g', { id: 'waves', 'clip-path': 'url(#waterClip)', opacity: 0.5 }, world)
  svg('path', { id: 'waveA', fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-opacity': 0.55, 'stroke-linecap': 'round' }, wavesG)
  svg('path', { id: 'waveB', fill: 'none', stroke: '#ffffff', 'stroke-width': 2, 'stroke-opacity': 0.28, 'stroke-linecap': 'round' }, wavesG)
  // salpicaduras (sobre el agua, sin clip) y burbujas (dentro del agua)
  svg('g', { id: 'splashes' }, world)
  svg('g', { id: 'bubbles', 'clip-path': 'url(#waterClip)' }, world)
  const ticks = svg('g', { id: 'ticks' }, world)
  svg('line', { x1: 738, y1: 150, x2: 738, y2: 430, stroke: '#ffffff', 'stroke-opacity': 0.35, 'stroke-width': 2 }, ticks)
  svg('rect', { x: 734, y: 386, width: 8, height: 44, rx: 4, fill: '#e0455a', opacity: 0.4 }, ticks)
  svg('rect', { x: 734, y: 330, width: 8, height: 56, rx: 4, fill: '#ffb340', opacity: 0.4 }, ticks)
  for (let l = 0; l <= 100; l += 20){
    const y = 150 + (1 - l / 100) * 280
    svg('line', { x1: 738, y1: y, x2: l % 40 === 0 ? 716 : 724, y2: y, stroke: '#ffffff', 'stroke-opacity': 0.5, 'stroke-width': 2 }, ticks)
  }

  // ============ peces (fuera del clip de agua, recortados al cristal) ============
  const compClip = svg('g', { 'clip-path': 'url(#tankClip)' }, svgRoot)
  const companions = svg('g', { id: 'companions' }, compClip)

  // ============ pez principal ============
  const mainPal = {
    bodyTop: '#ffc37e', bodyMid: '#ff9046', bodyBot: '#ef6a35',
    tail: '#ffab6e', tailDark: '#e2663b', fin: '#ff8a55',
    outline: '#a3431c', belly: '#ffddb0', cheek: '#ff9d7e',
    pupil: '#23282e', mouth: '#8f3a1a', stripe: '#e0703a'
  }
  const fishClip = svg('g', { 'clip-path': 'url(#tankClip)' }, svgRoot)
  const fishG = svg('g', { id: 'fish' }, fishClip)
  buildFishNode(fishG, mainPal, 'main')
  fishG.setAttribute('transform', 'translate(260,300)')

  // espuma de la superficie (encima de todo el agua)
  const foam = svg('g', { id: 'foam', 'clip-path': 'url(#tankClip)', opacity: 0.8 }, svgRoot)
  svg('path', { id: 'foamA', fill: '#eafaff', 'fill-opacity': 0.25, stroke: 'none' }, foam)

  // ============ cristal delantero ============
  svg('g', { id: 'glassFront' }, svgRoot)
  const front = svgRoot.querySelector('#glassFront')
  svg('rect', { x: 44, y: 34, width: 712, height: 432, rx: 16, ry:16, fill: 'none', stroke: '#9fcbe8', 'stroke-width': 6 }, front)
  svg('rect', { x: 38, y: 28, width: 724, height: 444, rx: 20, ry: 20, fill: 'none', stroke: '#7db4d6', 'stroke-width': 3, opacity: 0.8 }, front)
  // reflejos del vidrio
  svg('path', { d: 'M 70,40 C 120,90 130,200 92,300', transform: 'translate(0,0)', fill: 'none', stroke: 'url(#glassSheen)', 'stroke-width': 16, 'stroke-linecap': 'round', opacity: 0.5 }, front)
  svg('path', { d: 'M 740,60 C 716,150 720,260 746,330', fill: 'none', stroke: '#ffffff', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.18 }, front)
  // viñeta
  svg('rect', { x: 44, y: 34, width: 712, height: 432, rx: 16, ry: 16, fill: 'url(#vignette)' }, front)

  return { svgRoot, waterClipRect, mainPal }
}

export { buildFishNode, SVGNS, svg }
