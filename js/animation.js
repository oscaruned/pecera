// animation.js - orquestador de la pecera/marcador
// Modelo de puntuación acordado:
//   -20 pts  -> 0% de agua   (muerte del pez: fin del juego)
//       0 pts -> 40% de agua (partida sanab)
//     +80 pts -> 100% de agua (el agua satura, el pez evoluciona y llegan peces)
// Los hitos por encima de +60 dan vida extra: cardumen, crecimiento y corona.
import { Fish, CompanionFish } from './fish.js'
import { Water } from './water.js'
import { Bubbles } from './bubbles.js'
import { AudioManager } from './audio.js'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

export const THRESHOLDS = {
  death: -20,        // puntuación que apaga el agua del todo
  start: 0,          // 40% de agua al empezar
  satTop: 80,        // se llega al 100% de agua aquí
  firstCompanion: 60,
  companionEvery: 60,
  maxCompanions: 4,
  tiers: [120, 200, 280]   // puntos necesarios para cada nivel de evolución
}

// puntos -> nivel de agua (0..100); piecewisa: el tramo negativo amplifica el drama
export function scoreToLevel(score){
  if(score <= THRESHOLDS.death) return 0
  if(score < 0) return clamp((score - THRESHOLDS.death) * (40 / (0 - THRESHOLDS.death)), 0, 40)
  return clamp(40 + (score / THRESHOLDS.satTop) * 60, 0, 100)
}

export class Aquarium{
  constructor(svgRoot, els){
    this.svg = svgRoot
    this.els = els

    this.audio = new AudioManager()
    this.bubbles = new Bubbles(els.bubbles, null, this.audio, els.splashes)
    this.water = new Water(els.water, els.waterRect, els, this.audio)
    this.bubbles.water = this.water
    this.fish = new Fish(els.fish, this.bubbles, this.water, this.audio)

    this.companions = []
    this.score = 0
    this._lastScore = 0
    this._lastCrossBand = 40

    // reloj de inactividad: punto sin responder nuevos (resetea a cero con cada
    // palabra nueva y se para al terminar la partida)
    this.idleMax = 60            // segundos de gracia
    this.idle = 0                // segundos transcurridos desde la última palabra
    this.idleRunning = true
    this.idlePenalty = 0         // puntos que el widget resta en el minuto (0 = solo evento)
    this.idleFired = false
    this._idleSec = 0

    // animación de ambiente (rayos, caústicas, plantas)
    this._envT = 0
    this._plPhase = Math.random() * 6
    this._cacheEnv()

    this.last = null
    this._running = false
    this._listeners = {}
  }

  _cacheEnv(){
    const q = s => this.svg.querySelector(s)
    this.env = {
      godrays: q('#godrays'),
      causticA: q('#causticA'),
      causticB: q('#causticB'),
      plants: [...this.svg.querySelectorAll('.plant')]
    }
  }

  start(){
    this._running = true
    this._goEmitted = false
    this.water.setLevel(scoreToLevel(this.score)) // arranca en 40%
    requestAnimationFrame(this._tick.bind(this))
  }

  stop(){ this._running = false }

  on(ev, fn){ (this._listeners[ev] = this._listeners[ev] || []).push(fn) }
  _emit(ev, p){ (this._listeners[ev] || []).forEach(f => f(p)) }

  _tick(ts){
    if(!this.last) this.last = ts
    const dt = clamp((ts - this.last) / 1000, 0, 0.1)
    this.last = ts
    this.water.update(dt)
    this.fish.update(dt)
    this.bubbles.update(dt)
    this._updateCompanions(dt)
    this._updateEnv(dt)
    this._updateIdle(dt)
    this._emit('level', this.water.level)
    this.audio.ambientLevel?.(this.water.level)   // el murmullo sigue al agua
    this._emit('fishstate', this.fish.state)
    if(this.fish.deathDone && !this._goEmitted){
      this._goEmitted = true
      this._emit('gameover', this.score)
    }
    if(this._running) requestAnimationFrame(this._tick.bind(this))
  }

  // ------------------------------------------------------------- ambiente
  _updateEnv(dt){
    this._envT += dt
    const e = this.env
    if(e.godrays){
      const a = 0.28 + Math.sin(this._envT * 0.5) * 0.1
      e.godrays.setAttribute('opacity', a.toFixed(3))
    }
    if(e.causticA){
      e.causticA.setAttribute('transform', `translate(${Math.sin(this._envT * 0.6) * 26},0)`)
      e.causticB.setAttribute('transform', `translate(${Math.sin(this._envT * 0.42 + 2) * -34},0)`)
    }
    e.plants.forEach((pl, i) => {
      const sway = Math.sin(this._envT * 0.9 + i * 1.7) * 2.2
      pl.setAttribute('transform', `rotate(${sway} 0 0)`)
    })
  }

  // ----------------------------------------------------------------- reloj de inactividad
  // El juego lo alimenta con word() en cada palabra nueva; llega al minuto
  // sin palabras -> evento 'idle' (+ penalización opcional) y se queda parado
  // hasta la siguiente palabra o reset. Al morir el pez queda detenido y ya
  // no vuelve a andar salvo con reset().
  _updateIdle(dt){
    if(!this.idleRunning || this.fish.dying || this.score <= THRESHOLDS.death) return
    this.idle += dt
    if(this.idle >= this.idleMax && !this.idleFired){
      this.idleFired = true
      this.idleRunning = false
      this.audio.scoreDown()
      this._emit('idle', { max: this.idleMax })
      if(this.idlePenalty > 0) this.setScore(this.score - this.idlePenalty)
      return
    }
    const s = Math.floor(this.idle)
    if(s !== this._idleSec){
      this._idleSec = s
      this._emit('idleTick', { elapsed: s, max: this.idleMax })
    }
  }

  // con cada palabra nueva el contador vuelve a cero
  word(){
    this.idle = 0
    this._idleSec = 0
    this.idleFired = false
    if(!this.fish.dying && this.score > THRESHOLDS.death) this.idleRunning = true
    this._emit('idleTick', { elapsed: 0, max: this.idleMax })
  }

  setIdleClock(opts = {}){
    if(opts.seconds != null) this.idleMax = Math.max(5, Number(opts.seconds))
    if(opts.penalty != null) this.idlePenalty = Math.max(0, Number(opts.penalty))
  }

  // ------------------------------------------------------------- puntuación
  setScore(score){
    // partida terminada: el marcador queda congelado hasta reset()
    if(this.fish.dying || this.score <= THRESHOLDS.death) return

    const prev = this.score
    this.score = Math.round(score)
    const bandPrev = scoreToLevel(prev)
    const level = scoreToLevel(this.score)
    this.water.setLevel(level)

    // muerte por ahogamiento
    if(this.score <= THRESHOLDS.death){
      this.fish.die()
      this.audio.dead()
      this.idleRunning = false               // partida terminada: contador parado
      this._emit('idleTick', { elapsed: -1, max: this.idleMax })  // aviso de "detenido"
      return
    }

    const delta = this.score - this._lastScore
    this._lastScore = this.score

    // reacciones al cambio
    if(delta >= 5){
      this.fish.happy()
      this.audio.scoreUp()
    } else if(delta <= -5){
      this.fish.scared()
      this.audio.scoreDown()
    }

    // salpicadura al cruzar franjas hacia abajo
    const bands = [0, 10, 20, 30, 40, 50, 60, 70, 80, 100]
    const cross = b => bandPrev >= b - 0.01 && level < b - 0.01
    if(bands.some(cross) && level < bandPrev){
      const x = clamp(this.fish.pos.x, 80, 720)
      this.bubbles.splashAt(x, this.water.surfaceY - 2, 9, 1)
      this.water.surge(1.4)
      this.fish.dp = this.fish._pickPoint()
    }

    // hitos: evolución + cardumen
    this._updateMilestones()
  }

  _updateMilestones(){
    const s = this.score
    // evolución del pez (reversible: baja si la puntuación cae)
    let tier = 0
    THRESHOLDS.tiers.forEach((t, i) => { if(s >= t) tier = i + 1 })
    if(tier !== this.fish.tier){
      const grew = tier > this.fish.tier
      this.fish.setTier(tier)
      if(grew){
        this.audio.milestone()
        this.bubbles.burst(this.fish.pos.x, this.fish.pos.y, 16, 95)
        this._emit('milestone', { kind: 'tier', value: tier })
      }
    }
    // cardumen
    const want = clamp(Math.floor((s - THRESHOLDS.firstCompanion) / THRESHOLDS.companionEvery) + (s >= THRESHOLDS.firstCompanion ? 1 : 0), 0, THRESHOLDS.maxCompanions)
    while(this.companions.length < want && !this.fish.dying){
      const pals = [
        { bodyTop: '#9be7f5', bodyMid: '#5cc3dd', bodyBot: '#2f96bd', tail: '#8fd9ec', tailDark: '#4aa8cc', fin: '#6cc6de', outline: '#1e6f90', belly: '#d9f6ff', cheek: '#63c4de', pupil: '#1d2733', mouth: '#145574', stripe: '#4aa8cc' },
        { bodyTop: '#ffe29a', bodyMid: '#ffc75b', bodyBot: '#f0a93a', tail: '#ffd97e', tailDark: '#eda045', fin: '#ffc75b', outline: '#a4681c', belly: '#fff1cf', cheek: '#ffbb70', pupil: '#33281a', mouth: '#8a5c14', stripe: '#eda045' }
      ]
      const pal = pals[this.companions.length % pals.length]
      this.companions.push(new CompanionFish(this.els.companions, this.bubbles, this.water, this.audio, pal, { main: this.fish }))
      this.audio.milestone()
      this._emit('milestone', { kind: 'companion', value: this.companions.length })
    }
    while(this.companions.length > want){
      const c = this.companions.pop()
      c.destroy()
    }
  }

  _updateCompanions(dt){
    for(const c of this.companions) c.update(dt)
  }

  // partida terminada: apagar ambiente
  _gameOverlay(show){
    if(show){
      for(const c of this.companions) c.destroy()
      this.companions.length = 0
    }
  }

  // ------------------------------------------------------------------ APIs
  // Mantener compatibilidad con las instrucciones antiguas
  setWaterLevel(v){ this.water.setLevel(clamp(v, 0, 100)); this.audio.playWaterMove?.() }
  changeWater(d){ this.setWaterLevel(this.water.level + d) }

  reset(){
    this.score = 0
    this._lastScore = 0
    this._goEmitted = false
    this.fish.reset()
    for(const c of this.companions) c.destroy()
    this.companions.length = 0
    this.water.setLevel(scoreToLevel(0))
    this.audio.restart()
    // reloj a cero y andando de nuevo
    this.idle = 0
    this._idleSec = 0
    this.idleFired = false
    this.idleRunning = true
    this._emit('idleTick', { elapsed: 0, max: this.idleMax })
    this._emit('level', this.water.level)
  }
}
