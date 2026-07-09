import Fish from './fish.js'
import { Water } from './water.js'
import { Bubbles } from './bubbles.js'
import { AudioManager } from './audio.js'

export class Aquarium{
  constructor(svg){
    this.svg = svg
    this.el = svg
    this.fishG = svg.querySelector('#fish')
    this.waterEl = svg.querySelector('#water')
    this.waterRect = svg.querySelector('#waterRect')
    this.bubblesGroup = svg.querySelector('#bubbles')
    this.waves = svg.querySelector('#waves')

    this.audio = new AudioManager()
    this.bubbles = new Bubbles(this.bubblesGroup, this.audio)
    this.water = new Water(this.waterEl, this.waterRect, this.waves, this.audio)
    this.fish = new Fish(this.fishG, this.bubbles, this.water)

    this.last = null
    this._running = false
    this._listeners = {}
  }

  start(){
    this.audio.start()
    this._running = true
    requestAnimationFrame(this._tick.bind(this))
  }

  _tick(ts){
    if(!this.last) this.last = ts
    const dt = (ts - this.last)/1000
    this.last = ts
    this.water.update(dt)
    this.fish.update(dt)
    this.bubbles.update(dt)
    this._emit('level', this.water.level)
    this._emit('fishstate', this.fish.state)
    if(this._running) requestAnimationFrame(this._tick.bind(this))
  }

  stop(){ this._running = false }

  on(ev,fn){ (this._listeners[ev] = this._listeners[ev]||[]).push(fn) }
  _emit(ev,p){ (this._listeners[ev]||[]).forEach(f=>f(p)) }

  setWaterLevel(v){ this.water.setLevel(v); this.audio.playWaterMove() }
  changeWater(d){ this.water.setLevel(this.water.level + d); this.audio.playWaterMove() }
}
