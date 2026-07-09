// water.js - controla el nivel del agua y las ondas
export class Water{
  constructor(waterEl, waterRect, wavesEl, audio){
    this.el = waterEl
    this.rect = waterRect
    this.wavesEl = wavesEl
    this.audio = audio
    this.level = 65
    this.target = 65
    this.wavePhase = 0
  }

  setLevel(v){ this.target = Math.max(0, Math.min(100, v)) }

  update(dt){
    // smooth approach
    this.level += (this.target - this.level) * Math.min(1, dt*1.5)

    // update rect position (y increases downwards)
    const minY = 150; const maxY = 430
    const y = minY + (1 - this.level/100) * (maxY - minY)
    this.rect.setAttribute('y', String(y - 150))
    this.el.setAttribute('y', String(y))

    // waves
    this.wavePhase += dt*2
    this._drawWaves()
  }

  _drawWaves(){
    const w = 700; const h = 16
    const points = []
    for(let i=0;i<=8;i++){
      const x = 50 + (i/8)*w
      const y = 150 + Math.sin(this.wavePhase + i*0.6) * (3 + Math.sin(this.level/14))
      points.push(`${x},${y}`)
    }
    const d = 'M' + points.join(' L ') + ` L 750 170 L 50 170 Z`
    this.wavesEl.innerHTML = `<path d="${d}" fill="#ffffff" opacity="0.06"></path>`
  }
}
