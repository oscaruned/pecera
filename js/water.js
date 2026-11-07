// water.js - nivel del agua, ondas de superficie y superficie espumosa
// El nivel se interpola con muelle crítico hacia el objetivo y las ondas
// solo se recalculan cuando cambia el nivel (nada de innerHTML por frame).
export class Water{
  constructor(el, waterRect, els, audio){
    this.el = el                    // rect de agua
    this.rect = waterRect           // rect del clip
    this.waveA = els.waveA
    this.waveB = els.waveB
    this.foam = els.foam
    this.audio = audio
    this.level = 40                 // nivel lógico 0..100
    this.target = 40
    this.wavePhase = 0
    this.surfaceY = 318             // y del nivel 40%
    this.lastSeenLevel = -1
    this._surge = 0                 // amplitud extra temporal (olas al cambiar)
  }

  setLevel(v){ this.target = Math.max(0, Math.min(100, v)); this._surge = 1 }

  get surfaceYat(){ return 150 + (1 - this.level/100) * 280 }

  update(dt){
    // muelle con ligera gravedad: el agua "cae" más rápido de lo que sube
    const upRate = this.target > this.level ? 2.1 : 3.4
    this.level += (this.target - this.level) * Math.min(1, dt * upRate)
    if(Math.abs(this.target - this.level) < 0.05) this.level = this.target
    this._surge = Math.max(0, this._surge - dt * 1.2)

    this.surfaceY = 150 + (1 - this.level/100) * 280
    const waterHeight = Math.max(0, 500 - this.surfaceY)

    this.rect.setAttribute('y', String(this.surfaceY))
    this.rect.setAttribute('height', String(Math.max(0.01, waterHeight)))
    this.el.setAttribute('y', String(this.surfaceY))
    this.el.setAttribute('height', String(Math.max(0.01, waterHeight)))

    // repintar la superficie sólo si el nivel visible cambió
    if(Math.abs(this.level - this.lastSeenLevel) > 0.15 || this.lastSeenLevel < 0){
      this.lastSeenLevel = this.level
      this._drawSurface()
    }
    // deriva sutil de las ondas ya dibujadas (barato: sólo transform)
    this.wavePhase += dt * 1.6
    const tx = Math.sin(this.wavePhase * 0.5) * 7
    const ty = Math.sin(this.wavePhase) * 1.6
    this.waveA.setAttribute('transform', `translate(${tx},${ty})`)
    this.waveB.setAttribute('transform', `translate(${-tx * 0.6},${ty * 0.5})`)
    if(this.foam) this.foam.setAttribute('transform', `translate(${tx * 2},${ty})`)
  }

  _surfacePath(amplitude){
    const s = this.surfaceY, amp = amplitude
    return `M 40 ${s}`
      + ` C 110 ${s-amp}, 180 ${s+amp}, 250 ${s}`
      + ` C 320 ${s-amp*0.9}, 390 ${s+amp*0.9}, 460 ${s}`
      + ` C 530 ${s-amp}, 600 ${s+amp}, 670 ${s}`
      + ` C 700 ${s-amp*0.7}, 744 ${s+amp*0.7}, 760 ${s}`
  }

  _drawSurface(){
    const amp = 5 + this._surge * 6
    const d = this._surfacePath(amp)
    this.waveA.setAttribute('d', d)
    this.waveB.setAttribute('d', this._surfacePath(amp * 1.7))
    // espuma: lista sombreada bajo la superficie
    if(this.foam){
      this.foam.setAttribute('d', d + ` L 760 ${this.surfaceY + 10} L 40 ${this.surfaceY + 10} Z`)
    }
  }

  // amplitud actual de olas, para efectos (salpicaduras, miedo del pez...)
  surge(v){ this._surge = Math.max(this._surge, v) }
}
