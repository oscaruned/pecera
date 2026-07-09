// audio.js - gestiona sonidos con Web Audio API
export class AudioManager{
  constructor(){
    this.ctx = null
    this.ambientGain = null
  }

  start(){
    if(this.ctx) return
    this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    // ambient murmullo: two detuned oscillators through lowpass
    const o1 = this.ctx.createOscillator()
    const o2 = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    const lp = this.ctx.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = 600
    o1.type='sine'; o2.type='sine'
    o1.frequency.value = 120; o2.frequency.value = 125
    g.gain.value = 0.02
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.ctx.destination)
    o1.start(); o2.start()
    this.ambientGain = g
  }

  playBubble(size=6){
    if(!this.ctx) return
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate*0.06, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for(let i=0;i<data.length;i++) data[i] = (Math.random()*2-1) * Math.exp(-i/data.length*4)
    const src = this.ctx.createBufferSource(); src.buffer = buffer
    const g = this.ctx.createGain(); g.gain.value = Math.min(0.6, size/30)
    src.connect(g); g.connect(this.ctx.destination)
    src.start()
  }

  playWaterMove(){
    if(!this.ctx) return
    const o = this.ctx.createOscillator(); o.type='sine'; o.frequency.value = 400
    const g = this.ctx.createGain(); g.gain.value = 0.04
    o.connect(g); g.connect(this.ctx.destination)
    o.start(); o.stop(this.ctx.currentTime + 0.12)
  }
}
