// fish.js - peces del marcador: nado con giro en U, expresiones y estados
// Base: clase Fish. Todos los peces comparten el mismo rig (scene.js) y la
// misma máquina de movimiento; los acompañantes van simplificados.
import { buildFishNode, SVGNS } from './scene.js'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const rand = (a, b) => a + Math.random() * (b - a)

export class Fish{
  constructor(group, bubbles, water, audio, opts = {}){
    this.g = group
    this.bubbles = bubbles
    this.water = water
    this.audio = audio
    this.opts = opts
    this.simple = !!opts.simple
    this.scaleFactor = opts.scale || 1              // tamaño propio del pez (acompañantes)

    // estado físico
    this.pos = { x: rand(240, 560), y: 330 }
    this.vx = 0
    this.vy = 0
    this.facing = Math.random() > 0.5 ? 1 : -1
    this.cruise = opts.cruise || 92                  // px/s de velocidad base

    // giro en U
    this.turnT = 1                                  // 1 = no hay giro activo
    this.turnDur = 0.55
    this.turnFrom = 1
    this.turnTo = 1
    this.turnSpeed = 0

    // animación facial/corporal
    this.tailPhase = Math.random() * Math.PI * 2
    this.lookPhase = Math.random() * Math.PI * 2
    this.blinkT = rand(1.5, 4.5)
    this.blinkActive = 0
    this.gaspPhase = 0
    this.hopT = 0                                   // saltito de celebración

    // punto de interés del vagabundeo
    this.dp = this._pickPoint()
    this.dpT = rand(2, 5)

    // estado / vida
    this.state = 'feliz'
    this.alive = true
    this.dying = false
    this.deathT = 0
    this.deathDone = false
    this.scaredT = 0
    this.tier = 0

    this._cacheParts()
    this._applySwimTransform()
  }

  // cachear referencias una sola vez (antes se hacía querySelector por frame)
  _cacheParts(){
    const q = s => this.g.querySelector(s)
    this.parts = {
      tail: q('*[id^=tail]'),
      dorsal: q('*[id^=dorsal]'),
      pelvic: q('*[id^=pelvic]'),
      torso: q('*[id^=torso]'),
      belly: q('*[id^=belly]'),
      fin: q('*[id^=fin]'),
      eye: q('*[id^=look]') || q('*[id^=eye]'),
      pupil: q('*[id^=pupil]'),
      lid: q('*[id^=lid]'),
      mouthArc: q('*[id^=mouthArc]'),
      mouthO: q('*[id^=mouthO]'),
      deadEyes: q('*[id^=deadEyes]'),
      crown: q('*[id^=crown]'),
      shadow: q('*[id^=shadow]')
    }
  }

  // ------------------------------------------------------------- movimiento
  _pickPoint(){
    const s = this.water.surfaceY
    const top = s + 50, bot = Math.max(top + 30, 366)
    return { x: rand(150, 650), y: rand(top, bot) }
  }

  _updateWander(dt){
    this.dpT -= dt
    if(this.dpT <= 0 || this._near(this.dp, 26)){
      this.dp = this._pickPoint()
      this.dpT = rand(2.4, 6)
    }
    // en estados de agonía prefiere subir a boquear a la superficie
    if(this.state === 'boquea' || this.state === 'cae'){
      this.dp.y = this.water.surfaceY + 34
      this.dp.x += (this.pos.x < this.dp.x ? 1 : -1) * 30 * dt
    }

    // dirección deseada
    const dx = this.dp.x - this.pos.x
    let desired = clamp(dx * 1.4, -this.cruise, this.cruise)
    // evitar pegarse a los muros: girar antes del borde
    if(this.pos.x < 150 && this.facing === -1 && desired < 0) desired = Math.abs(desired) * 0.4
    if(this.pos.x > 650 && this.facing === 1 && desired > 0) desired = -Math.abs(desired) * 0.4

    if(!this._turnActive() && Math.sign(desired) !== 0 && Math.sign(desired) !== this.facing && Math.abs(desired) > 24){
      this._beginTurn(Math.sign(desired))
    }

    // avance horizontal según fase de giro
    if(this._turnActive()){
      const p = clamp(this.turnT / this.turnDur, 0, 1)
      const eased = p * p * (3 - 2 * p)                      // easeInOut suave
      this.turnT += dt
      if(this.turnT >= this.turnDur){
        this.turnT = 1
        this.facing = this.turnTo
      } else {
        // arco: sigue avanzando desacelerando, hunde el morro y traza la curva
        const forward = Math.cos(eased * Math.PI) * this.turnSpeed
        this.pos.x += forward * dt * this.turnFrom
        const mid = Math.sin(eased * Math.PI)
        const waterMid = (this.water.surfaceY + 468) / 2
        const dipDir = this.pos.y > waterMid ? -1 : 1
        this.pos.y += dipDir * mid * 55 * dt
        this._steerVertical(dt)
        this._applyTurnTransform(eased)
        return
      }
    }

    // nado normal
    this.pos.x += (this.facing * Math.max(18, Math.abs(desired))) * dt
    if(this.state === 'cae') this.pos.x += this.facing * 8 * dt
    this._steerVertical(dt)
    this._applySwimTransform()
    if(this._turnActive()) return
    this._animateParts(Math.abs(this.vx / this.cruise), 1, 1)
  }

  // muelle vertical hacia el punto de interés
  _steerVertical(dt){
    const toY = this.dp.y - this.pos.y
    this.vy += toY * 3.4 * dt
    this.vy -= this.vy * Math.min(1, dt * 2.4)
    this.vy += Math.sin(performance.now() / 900 + this.lookPhase) * 3 * dt
    this.pos.y += this.vy * dt

    const s = this.water.surfaceY
    // el vientre no debe tocar la arena (la arena empieza ~y 376)
    const minY = s + 46
    const maxY = Math.max(minY + 10, 372)
    if(this.pos.y < minY){ this.pos.y = minY; this.vy = Math.abs(this.vy) * 0.3 }
    if(this.pos.y > maxY){ this.pos.y = maxY; this.vy = -Math.abs(this.vy) * 0.3 }
  }

  _near(p, eps){ return Math.hypot(p.x - this.pos.x, p.y - this.pos.y) < eps }

  // ------------------------------------------------------------- giro en U
  _turnActive(){ return this.turnT < 1 }

  _beginTurn(newFacing){
    if(this._turnActive()) return
    this.turnT = 0
    this.turnDur = this.scaredT > 0 ? 0.38 : 0.55
    this.turnFrom = this.facing
    this.turnTo = newFacing
    this.turnSpeed = Math.max(40, Math.abs(this.vx) || this.cruise)
    // el nuevo destino conviene que quede "delante" tras el giro (evita rebotes)
    this.dp.x = newFacing > 0 ? rand(330, 650) : rand(150, 470)
    this.dp.y = rand(this.water.surfaceY + 50, 366)
    this.dpT = rand(3, 6)
  }

  _applyTurnTransform(eased){
    // p 0..1: espejo por coseno + barrido rotacional (morro describe la U)
    const mirror = Math.cos(eased * Math.PI) * this.turnFrom
    const sweep = Math.sin(eased * Math.PI) * 66 * (this.turnTo > 0 ? -1 : 1)
    const dip = 1 + Math.sin(eased * Math.PI) * 0.14         // estiramiento en el arco
    const pitch = this.vy * 0.14 * (this.facing > 0 ? 1 : -1)
    this._setTransform(mirror, pitch + sweep, dip)
    // cola el rabo más fuerte en plena curva
    this._animateParts(1, Math.sin(eased * Math.PI) * 1.6 + 0.4, 0)
  }

  // ------------------------------------------------------------- vida/estado
  _speedFactor(){
    const lvl = this.water.level
    if(lvl > 40) return 1
    if(lvl > 20) return 0.75
    if(lvl > 5) return 0.5
    if(lvl > 0) return 0.3
    return 0.12
  }

  update(dt){
    this.tailPhase += dt * (6.5 + Math.abs(this.vx) * 0.045) * this._speedFactor()
    this.lookPhase += dt * 1.5
    this.gaspPhase += dt * 5.2
    if(this.scaredT > 0) this.scaredT -= dt
    if(this.hopT > 0) this.hopT -= dt

    // parpadeo
    this.blinkT -= dt
    if(this.blinkT <= 0){ this.blinkT = rand(2, 5.5); this.blinkActive = 0.12 }
    if(this.blinkActive > 0) this.blinkActive -= dt

    if(this.dying){ this._updateDeath(dt); return }
    if(!this.alive) return

    this.state = this._stateFromWater()
    this._updateWander(dt)
    // el transform de nado lo aplica _updateWander; durante el giro ese transform manda
    if(!this._turnActive()) this._animateParts(Math.abs(this.vx / this.cruise), 1, 1)
    this._animateFace(dt)

    // burbujeo del morro
    this._bubbleT = (this._bubbleT ?? rand(0.4, 1.4)) - dt
    if(this._bubbleT <= 0){
      this._bubbleT = rand(0.7, 1.8) / Math.max(0.4, this._speedFactor())
      const dir = this.facing > 0 ? 1 : -1
      this.bubbles.spawn(this.pos.x + dir * 52 * this.scaleFactor, this.pos.y + 6, rand(3, 7))
    }
  }

  _stateFromWater(){
    const lvl = this.water.level
    if(this.scaredT > 0) return 'asustado'
    if(lvl >= 36) return 'feliz'
    if(lvl > 18) return 'preocupado'
    if(lvl > 4) return 'boquea'
    if(lvl > 0) return 'cae'
    return 'muerto'
  }

  // ------------------------------------------------------------- transformes
  _applySwimTransform(){
    const speed = Math.abs(this.vx) || Math.abs(this.facing) * this.cruise
    const stretch = 1 + Math.min(0.09, speed / 900)
    const bob = 1 + Math.sin(this.tailPhase * 0.85) * 0.035
    const pitch = clamp(this.vy * 0.22, -24, 24) * (this.facing > 0 ? 1 : -1)
    this._setTransform(this.facing * stretch, pitch, bob)
  }

  _setTransform(faceScale, rotDeg, sy){
    const s = this.scaleFactor * (1 + this.tier * 0.07)
    const rot = rotDeg * (faceScale < 0 ? -1 : 1)   // compensar el espejo
    const sx = Math.abs(faceScale) * s * (faceScale < 0 ? -1 : 1)
    this.g.setAttribute('transform', `translate(${this.pos.x},${this.pos.y}) rotate(${rot}) scale(${sx},${s * sy})`)
  }

  _animateParts(speedK, extraTail, animateFaceFlag){
    const p = this.parts
    if(!p.tail) return
    const swing = Math.sin(this.tailPhase) * (11 + extraTail * 9)
    p.tail.setAttribute('transform', `rotate(${swing} -44 0)`)
    if(p.dorsal) p.dorsal.setAttribute('transform', `rotate(${Math.sin(this.tailPhase * 1.15) * 6} -4 -36)`)
    if(p.pelvic) p.pelvic.setAttribute('transform', `rotate(${Math.sin(this.tailPhase * 0.9 + 1) * -7} 8 26)`)
    if(p.fin) p.fin.setAttribute('transform', `rotate(${Math.sin(this.tailPhase + 0.6) * 9} 6 12)`)
    if(p.torso){
      const sq = 1 + Math.sin(this.tailPhase * 0.8) * 0.03
      p.torso.setAttribute('transform', `scale(${2 - sq},${sq})`)
    }
    if(p.shadow){
      const depth = clamp((this.pos.y - (this.water.surfaceY + 40)) / 200, 0, 1)
      p.shadow.setAttribute('opacity', String(0.18 * depth * this.water.level / 100))
    }
  }

  _animateFace(dt){
    const p = this.parts
    if(this.simple) return
    const st = this.state
    // mirada
    const ex = Math.sin(this.lookPhase) * 1.6, ey = Math.cos(this.lookPhase * 0.8) * 1.1
    if(p.eye) p.eye.setAttribute('transform', `translate(${ex},${ey})`)
    if(p.pupil) p.pupil.setAttribute('transform', `translate(${ex * 0.5},${ey * 0.5})`)
    // parpadeo (también en 'cae', no en muerto)
    if(p.lid) p.lid.setAttribute('opacity', (this.blinkActive > 0 && st !== 'muerto') ? '0.92' : '0')
    // boca
    if(p.mouthArc && p.mouthO){
      if(st === 'boquea' || st === 'cae' || st === 'asustado'){
        const open = st === 'asustado' ? 6 : 3.4 + Math.sin(this.gaspPhase) * 2.6
        p.mouthArc.setAttribute('d', 'M 0,0 L 0,0')
        p.mouthArc.setAttribute('opacity', '0')
        p.mouthO.setAttribute('rx', String(4 + open * 0.6))
        p.mouthO.setAttribute('ry', String(3 + open))
        p.mouthO.setAttribute('opacity', '1')
      } else if(st === 'muerto'){
        p.mouthArc.setAttribute('d', 'M 0,0 L 0,0')
        p.mouthArc.setAttribute('opacity', '0')
        p.mouthO.setAttribute('rx', '5'); p.mouthO.setAttribute('ry', '7'); p.mouthO.setAttribute('opacity', '1')
      } else {
        p.mouthO.setAttribute('opacity', '0')
        p.mouthArc.setAttribute('opacity', '1')
        p.mouthArc.setAttribute('d', st === 'preocupado' ? 'M 44,12 Q 52,10 60,12' : 'M 44,10 Q 52,18 60,9')
      }
    }
    // mejilla sube al ascender
    // (dejamos la mejilla fija: el recorrido del blink ya da vida)
  }

  // ------------------------------------------------------------------ muerte
  die(){
    if(!this.alive) return
    this.dying = true
    this.alive = false
    this.state = 'muerto'
    this.deathT = 0
    const p = this.parts
    if(p.deadEyes) p.deadEyes.setAttribute('opacity', '1')
    if(p.crown) p.crown.setAttribute('opacity', '0')
    this.dp = { x: this.pos.x, y: 424 }    // caer hasta la arena
  }

  _updateDeath(dt){
    this.deathT += dt
    const p = this.parts
    // caída con balanceo hasta quedar sobre la arena
    this.pos.y += 70 * dt
    this.pos.y = Math.min(this.pos.y, 424)
    this.vx = 0; this.vy = 0
    // se pone panza arriba y se apaga al asentarse
    const settle = clamp((this.pos.y - 320) / 104, 0, 1)
    const fade = 1 - Math.max(0, (this.deathT - 1.8) / 1.8)
    this.g.setAttribute('opacity', String(Math.max(0, fade)))
    this.g.style.filter = 'saturate(0.3) brightness(0.94)'
    const rot = 150 * settle
    this._setTransform(this.facing * (1 - settle * 0.06), rot * (this.facing > 0 ? -1 : 1), 1 - settle * 0.08)
    if(p.mouthO){ p.mouthO.setAttribute('rx', '5'); p.mouthO.setAttribute('ry', '7'); p.mouthO.setAttribute('opacity', '1') }
    if(p.mouthArc){ p.mouthArc.setAttribute('opacity', '0'); p.mouthArc.setAttribute('d', 'M 0,0 L 0,-0.01') }
    if(p.tail) p.tail.setAttribute('transform', 'rotate(-12 -44 0)')
    if(p.fin) p.fin.setAttribute('transform', 'rotate(-16 6 12)')
    if(this.deathT > 3.4 || (fade <= 0)){
      this.g.style.display = 'none'
      this.deathDone = true
    }
  }

  // ------------------------------------------------------------------- reset
  reset(){
    this.alive = true
    this.dying = false
    this.deathDone = false
    this.deathT = 0
    this.tier = 0
    this.pos = { x: rand(240, 560), y: 320 }
    this.facing = 1
    this.vx = 0; this.vy = 0
    this.g.style.display = ''
    this.g.style.filter = ''
    this.g.setAttribute('opacity', '1')
    const p = this.parts
    if(p.deadEyes) p.deadEyes.setAttribute('opacity', '0')
    if(p.crown) p.crown.setAttribute('opacity', '0')
    // restaurar boca y aletas (restos de la muerte)
    if(p.mouthO){ p.mouthO.setAttribute('rx', '0'); p.mouthO.setAttribute('ry', '0'); p.mouthO.setAttribute('opacity', '0') }
    if(p.mouthArc){ p.mouthArc.setAttribute('opacity', '1'); p.mouthArc.setAttribute('d', 'M 45,9 Q 51,15 57,9') }
    if(p.tail) p.tail.setAttribute('transform', 'rotate(0 -44 0)')
    if(p.fin) p.fin.setAttribute('transform', 'rotate(0 6 12)')
    this.state = 'feliz'
    this.dp = this._pickPoint()
    this._applySwimTransform()
  }

  // ------------------------------------------------------------------ API
  happy(){
    if(!this.alive || this.dying) return
    this.state = 'feliz'
    this.hopT = 0.5
    this.vy = -95
    this.dp.y = Math.max(this.water.surfaceY + 60, this.pos.y - 90)
    this.bubbles.burst(this.pos.x, this.pos.y, 12, 70)
  }

  scared(){
    if(!this.alive || this.dying) return
    this.scaredT = 0.8
    if(this.facing === 1) this._beginTurn(-1)
    else this.vx = this.cruise * -0.2
    this.bubbles.burst(this.pos.x, this.pos.y, 7, 50)
  }

  setTier(t){
    this.tier = clamp(t, 0, 3)
    const p = this.parts
    if(this.g.style.filter !== undefined){
      this.g.style.filter = this.tier >= 2 ? 'hue-rotate(24deg) saturate(1.3) brightness(1.08)' : ''
    }
    if(p.crown) p.crown.setAttribute('opacity', this.tier >= 3 ? '1' : '0')
  }
}

// ------------------------------------------------------- pez acompañante ----
export class CompanionFish extends Fish{
  constructor(group, bubbles, water, audio, palette, opts = {}){
    const node = buildFishNode(group, palette, 'c' + Math.floor(Math.random() * 1e6), { simple: true })
    super(node, bubbles, water, audio, { simple: true, scale: opts.scale || 0.42, cruise: opts.cruise || 62 })
    this.host = group
    this.main = opts.main || null
  }

  // los acompañantes mantienen distancia con el pez principal
  _pickPoint(){
    let p = super._pickPoint()
    if(this.main){
      for(let i = 0; i < 4; i++){
        if(Math.hypot(p.x - this.main.pos.x, p.y - this.main.pos.y) > 110) break
        p = super._pickPoint()
      }
    }
    return p
  }

  _steerVertical(dt){
    // repulsión suave del pez grande
    if(this.main){
      const dx = this.pos.x - this.main.pos.x, dy = this.pos.y - this.main.pos.y
      const d = Math.hypot(dx, dy)
      if(d < 100 && d > 0.01){
        this.vx += (dx / d) * 60 * dt * this.facing
      }
    }
    super._steerVertical(dt)
  }

  destroy(){
    // salida con gracia: escapa nadando del encuadre mientras se desvanece
    if(this._exiting) return
    this._exiting = true
    const t0 = performance.now(), dur = 800
    const x0 = this.pos.x, y0 = this.pos.y
    const dir = -(this.facing || 1)          // se marcha en sentido contrario a su rumbo
    const step = now => {
      const t = clamp((now - t0) / dur, 0, 1)
      this.pos.x = x0 + dir * 130 * t
      this.pos.y = y0 - 26 * t                // asciende un poco al irse
      this.g.style.opacity = String(1 - t)
      this._setTransform(this.facing, Math.sin(t * Math.PI) * -14, 1)
      if(t < 1 && this.g.isConnected) requestAnimationFrame(step)
      else this.g.remove()
    }
    requestAnimationFrame(step)
  }
}
