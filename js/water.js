// water.js - controla el nivel del agua y las ondas
export class Water{
  constructor(waterEl, waterRect, wavesEl, surfaceEl, audio){
    this.el = waterEl
    this.rect = waterRect
    this.wavesEl = wavesEl
    this.surfaceEl = surfaceEl
    this.audio = audio
    this.level = 65
    this.target = 65
    this.wavePhase = 0
    this.surfaceY = 150
  }

  setLevel(v){ this.target = Math.max(0, Math.min(100, v)) }

  update(dt){
    // smooth approach
    this.level += (this.target - this.level) * Math.min(1, dt*1.5)

    const minY = 150
    const maxY = 430
    this.surfaceY = minY + (1 - this.level/100) * (maxY - minY)
    const waterHeight = Math.max(70, 500 - this.surfaceY)

    this.rect.setAttribute('y', String(this.surfaceY))
    this.rect.setAttribute('height', String(waterHeight))
    this.el.setAttribute('y', String(this.surfaceY))
    this.el.setAttribute('height', String(waterHeight))

    this.surfaceEl.setAttribute('d', this._surfacePath())

    this.wavePhase += dt*2
    this._drawWaves()
  }

  _surfacePath(){
    const crest = 6 + Math.sin(this.wavePhase) * 2.4
    return `M 50 ${this.surfaceY} C 180 ${this.surfaceY - crest} 320 ${this.surfaceY + crest} 410 ${this.surfaceY - crest} S 620 ${this.surfaceY + crest} 750 ${this.surfaceY}`
  }

  _drawWaves(){
    const points = []
    for(let i=0;i<=10;i++){
      const x = 50 + (i/10)*700
      const y = this.surfaceY + Math.sin(this.wavePhase + i*0.65) * (4 + Math.sin(this.level/12))
      points.push(`${x},${y}`)
    }
    const d = 'M' + points.join(' L ') + ` L 750 500 L 50 500 Z`
    this.wavesEl.innerHTML = `<path d="${d}" fill="#ffffff" opacity="0.06"></path>`
  }
}
