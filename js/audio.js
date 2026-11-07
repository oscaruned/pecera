// audio.js - sonidos del marcador (Web Audio, perezoso y silenciable)
// El contexto se crea en el primer gesto del usuario para respetar las
// políticas de autoplay y no bloquear la carga de la página.
export class AudioManager{
  constructor(){
    this.ctx = null
    this.master = null
    this.muted = false
    this.volume = 1          // 0..1 (API: setVolume)
    this._ambient = null
    this._bound = this._ensure.bind(this)
    this._listen()
  }

  _listen(){
    const once = () => { this._ensure(); window.removeEventListener('pointerdown', once); window.removeEventListener('keydown', once) }
    window.addEventListener('pointerdown', once)
    window.addEventListener('keydown', once)
  }

  _ensure(){
    if(this.ctx) { if(this.ctx.state === 'suspended') this.ctx.resume(); return }
    const AC = window.AudioContext || window.webkitAudioContext
    if(!AC) return
    this.ctx = new AC()
    // compresor: permite suber los niveles sin sature cuando se solapan sonidos
    const comp = this.ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.knee.value = 18
    comp.ratio.value = 5
    comp.connect(this.ctx.destination)
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : this.volume * 0.75
    this.master.connect(comp)
    this._ambientOn()
  }

  _ambientOn(){
    if(!this.ctx || this._ambient) return
    const AC = this.ctx

    // ruido rosado (energía baja en agudos: mucho más natural que el blanco)
    const len = AC.sampleRate * 3
    const buf = AC.createBuffer(1, len, AC.sampleRate)
    const d = buf.getChannelData(0)
    let b0 = 0, b1 = 0, b2 = 0
    for(let i = 0; i < len; i++){
      const w = Math.random() * 2 - 1
      b0 = 0.997 * b0 + w * 0.029
      b1 = 0.985 * b1 + w * 0.042
      b2 = 0.950 * b2 + w * 0.099
      d[i] = b0 + b1 + b2
    }

    // capa de ruido loopeado con filtro ondulante y deriva estéreo
    const layer = (type, freq, q, gain, pan0) => {
      const src = AC.createBufferSource()
      src.buffer = buf; src.loop = true
      const f = AC.createBiquadFilter()
      f.type = type; f.frequency.value = freq; f.Q.value = q
      // "corriente": el centro del filtro flota lentamente
      const fLfo = AC.createOscillator(); fLfo.frequency.value = 0.05 + Math.random() * 0.07
      const fAmt = AC.createGain(); fAmt.gain.value = freq * 0.35
      fLfo.connect(fAmt); fAmt.connect(f.frequency)
      const g = AC.createGain(); g.gain.value = gain
      const pan = AC.createStereoPanner(); pan.pan.value = pan0
      // deriva suave de izquierda a derecha
      const pLfo = AC.createOscillator(); pLfo.frequency.value = 0.03 + Math.random() * 0.04
      const pAmt = AC.createGain(); pAmt.gain.value = 0.3
      pLfo.connect(pAmt); pAmt.connect(pan.pan)
      src.connect(f); f.connect(g); g.connect(pan); pan.connect(this.master)
      src.start(); fLfo.start(); pLfo.start()
      return { g, gain }
    }

    // tres capas: motor del filtro, lavado medio y brillo de superficie
    const rumble  = layer('lowpass',  170, 0.5, 0.045, 0)
    const wash    = layer('bandpass', 620, 0.9, 0.030, -0.5)
    const shimmer = layer('bandpass', 1500, 1.4, 0.013, 0.5)
    this._ambient = [rumble, wash, shimmer]
    this._ambientBand = Math.round((this._levelHint ?? 40) / 10)
    // nacen ya con la intensidad que toca al nivel actual del agua
    const k0 = 0.55 + this._ambientBand / 14
    this._ambient.forEach(l => { l.g.gain.value = l.gain * k0 })

    this._scheduleBubble()
  }

  // actividad esporádica de burbujeo, como en un acuario de verdad
  _scheduleBubble(){
    if(this._bubbleTimer) clearTimeout(this._bubbleTimer)
    this._bubbleTimer = setTimeout(() => {
      if(!this.ctx){ return }
      // racimo de 1 a 3 burbujas seguidas
      const n = 1 + Math.floor(Math.random() * 3)
      for(let i = 0; i < n; i++) this.bubble(4 + Math.random() * 10, i * 0.12)
      this._scheduleBubble()
    }, 2200 + Math.random() * 5200)
  }

  // da vida al murmullo según el nivel del agua (más lleno = más corriente)
  ambientLevel(level){
    this._levelHint = level
    if(!this._ambient) return
    const band = Math.round(level / 10)
    if(this._ambientBand === band) return
    this._ambientBand = band
    const k = 0.55 + band / 14                    // agua alta suena más viva
    this._ambient.forEach((l, i) => {
      l.g.gain.setTargetAtTime(l.gain * k, this.ctx.currentTime, 1.2)
    })
  }

  setMuted(m){
    this.muted = m
    if(this.master) this.master.gain.setTargetAtTime(m ? 0 : this.volume * 0.75, this.ctx.currentTime, 0.05)
  }

  // volumen general 0..1 (se puede pasar más alto si hace falta)
  setVolume(v){
    this.volume = Math.max(0, Math.min(1.5, v))
    if(this.master && !this.muted) this.master.gain.setTargetAtTime(this.volume * 0.75, this.ctx.currentTime, 0.05)
  }

  // --- helpers -------------------------------------------------------------
  _tone(freq, dur, { type='sine', vol=0.2, delay=0, slide=0 } = {}){
    if(!this.ctx) return
    const t0 = this.ctx.currentTime + delay
    const o = this.ctx.createOscillator()
    o.type = type
    o.frequency.setValueAtTime(freq, t0)
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    o.connect(g); g.connect(this.master)
    o.start(t0); o.stop(t0 + dur + 0.05)
  }

  _noise(dur, { freq=1200, vol=0.25, delay=0, q=1 } = {}){
    if(!this.ctx) return
    const t0 = this.ctx.currentTime + delay
    const len = Math.max(1, this.ctx.sampleRate * dur)
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    for(let i=0;i<len;i++) data[i] = (Math.random()*2-1) * Math.pow(1 - i/len, 1.6)
    const src = this.ctx.createBufferSource(); src.buffer = buf
    const bp = this.ctx.createBiquadFilter()
    bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q
    const g = this.ctx.createGain(); g.gain.value = vol
    src.connect(bp); bp.connect(g); g.connect(this.master)
    src.start(t0)
  }

  // --- eventos del juego ----------------------------------------------------
  bubble(size=6, delay=0){
    if(!this.ctx) return
    const p = Math.min(1, 8/size)          // burbujas pequeñas = tono más agudo
    this._tone(500 + p*700, 0.08, { type: 'sine', vol: 0.12 + p*0.10, slide: 260, delay })
  }

  splash(){
    this._noise(0.3, { freq: 900, vol: 0.55, q: 0.8 })
    this._tone(300, 0.16, { type: 'triangle', vol: 0.2, slide: -180 })
  }

  scoreUp(){
    this._tone(660, 0.09, { type: 'triangle', vol: 0.18 })
    this._tone(880, 0.12, { type: 'triangle', vol: 0.18, delay: 0.07 })
  }

  scoreDown(){
    this._tone(330, 0.1, { type: 'triangle', vol: 0.18 })
    this._tone(220, 0.14, { type: 'triangle', vol: 0.18, delay: 0.07 })
  }

  milestone(){
    ;[523, 659, 784, 1047].forEach((f, i)=> this._tone(f, 0.14, { type: 'triangle', vol: 0.24, delay: i*0.09 }))
  }

  dead(){
    ;[392, 311, 233, 175].forEach((f, i)=> this._tone(f, 0.28, { type: 'sine', vol: 0.3, delay: i*0.16, slide: -60 }))
    this._noise(0.5, { freq: 220, vol: 0.42, q: 0.6, delay: 0.5 })
  }

  restart(){
    ;[262, 392, 523].forEach((f, i)=> this._tone(f, 0.12, { type: 'triangle', vol: 0.2, delay: i*0.07 }))
  }
}
