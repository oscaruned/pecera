// fish.js - controla la animación y estado del pez
export default class Fish{
  constructor(group, bubbles, water){
    this.g = group
    this.bubbles = bubbles
    this.water = water
    this.pos = {x:400,y:280}
    this.vx = 80*(Math.random()>0.5?1:-1)
    this.vy = 0
    this.mass = 1
    this.damping = 0.93
    this.tailPhase = Math.random()*Math.PI*2
    this.state = 'feliz'
    this._bubbleTimer = 0.2
    this.alive = true
    this.turnPhase = Math.random()*Math.PI*2
    this.lookPhase = Math.random()*Math.PI*2
    this.deathTimer = 0
    this.deathDuration = 3.2
  }

  _applyTransform(){
    const angle = this.vy * 0.12 + Math.sin(this.turnPhase) * 2.5
    const direction = this.vx < 0 ? -1 : 1
    this.g.setAttribute('transform', `translate(${this.pos.x},${this.pos.y}) rotate(${angle}) scale(${direction},1)`)
  }

  update(dt){
    if(!this.alive) return

    const lvl = this.water.level
    if(lvl <= 0){
      this._handleExhaustion(dt)
      return
    }

    const speedFactor = this._speedFactor()
    const sinkProgress = Math.max(0, Math.min(1, (5 - lvl) / 5))

    if(lvl <= 5){
      this.vx *= 0.985
      this.pos.x += this.vx * dt * 0.18
      this.pos.y += (412 - this.pos.y) * Math.min(1, dt * (1.7 + sinkProgress * 2.8))
      this.vy = 0
    } else {
      this.pos.x += this.vx * dt * speedFactor

      const buoyancy = (this.water.level/100) * 72
      const swimForce = Math.sin(this.turnPhase + this.pos.x/90) * 22
      const driftLift = Math.cos(this.turnPhase * 0.8 + this.pos.y/110) * 8
      const fy = swimForce + driftLift - (54 - buoyancy)
      this.vy += (fy/this.mass) * dt
      this.vy *= Math.pow(this.damping, dt*60)
      this.pos.y += this.vy * dt * 60
    }

    if(this.pos.x < 110){ this.pos.x = 110; this.vx = Math.abs(this.vx) }
    if(this.pos.x > 690){ this.pos.x = 690; this.vx = -Math.abs(this.vx) }

    const waterTop = this.water.surfaceY + 18
    const waterBottom = 480
    const minY = lvl <= 5 ? 350 : Math.max(190, waterTop + 16)
    const maxY = lvl <= 5 ? 412 : Math.min(waterBottom - 28, waterTop + 180)
    if(this.pos.y < minY){ this.pos.y = minY; this.vy = Math.abs(this.vy) * 0.35 }
    if(this.pos.y > maxY){ this.pos.y = maxY; this.vy = -Math.abs(this.vy) * 0.45 }

    this.tailPhase += dt * (10 + Math.abs(this.vx) * 0.03) * speedFactor
    this.turnPhase += dt * (1.2 + speedFactor * 0.3)
    this.lookPhase += dt * 1.4

    const tail = this.g.querySelector('#tail')
    const tail2 = this.g.querySelector('#tail2')
    const body = this.g.querySelector('#body')
    const belly = this.g.querySelector('#belly')
    const dorsal = this.g.querySelector('#dorsal')
    const fin = this.g.querySelector('#fin')
    const eye = this.g.querySelector('#eye')
    const pupil = this.g.querySelector('#pupil')
    const mouth = this.g.querySelector('#mouth')
    const shadow = this.g.querySelector('#bodyShadow')

    const tailSwing = Math.sin(this.tailPhase) * (18 + Math.max(0, 10 * (1 - speedFactor)))
    const stretch = 1 + Math.min(0.2, Math.abs(this.vx)/400)
    const bodyScaleY = 1.02 + Math.sin(this.tailPhase*0.9) * 0.035

    const collapse = lvl <= 5 ? sinkProgress : 0
    const bodyTransform = collapse > 0
      ? `translate(${collapse * 8},${collapse * 26}) scale(${1.0 - collapse * 0.18},${0.78 - collapse * 0.25}) rotate(${collapse * 16})`
      : `scale(${stretch},${bodyScaleY})`
    const bellyTransform = collapse > 0
      ? `translate(${collapse * 4},${collapse * 12}) scale(${0.82 - collapse * 0.12},${0.66 - collapse * 0.16})`
      : `translate(${Math.sin(this.tailPhase)*2},${Math.cos(this.turnPhase)*1.5}) scale(${stretch*0.92},${bodyScaleY*0.96})`

    if(body) body.setAttribute('transform', bodyTransform)
    if(belly) belly.setAttribute('transform', bellyTransform)
    if(tail) tail.setAttribute('transform', `rotate(${tailSwing * (1 - collapse * 0.65)} -56 0)`)
    if(tail2) tail2.setAttribute('transform', `rotate(${tailSwing * 0.6 * (1 - collapse * 0.55)} -56 0)`)
    if(dorsal) dorsal.setAttribute('transform', `rotate(${Math.sin(this.tailPhase*1.2)*5 + collapse * -10} 0 -24)`)
    if(fin) fin.setAttribute('transform', `rotate(${Math.sin(this.tailPhase)*5 + collapse * -12} 14 18)`)
    if(shadow) shadow.setAttribute('transform', `translate(${Math.sin(this.turnPhase)*2},0) scale(${0.96 + Math.abs(this.vx)/900}, ${Math.max(0.55, 1 - collapse * 0.32)})`)

    const eyeX = Math.sin(this.lookPhase) * (collapse > 0 ? 0.7 : 1.4)
    const eyeY = Math.cos(this.lookPhase * 0.9) * 0.8
    if(eye) eye.setAttribute('transform', `translate(${eyeX},${eyeY})`)
    if(pupil) pupil.setAttribute('transform', `translate(${eyeX * 0.65},${eyeY * 0.65})`)

    const mouthOpen = lvl <= 5 ? 10 + collapse * 7 : this.state === 'boquea' ? 7 : this.state === 'asustado' ? 4 : this.state === 'preocupado' ? 2 : this.state === 'feliz' ? 1.8 : 0.8
    if(mouth) mouth.setAttribute('d', `M29,6 C34,${8 + mouthOpen} 40,${8 + mouthOpen} 43,6`)

    if(lvl <= 20){
      if(eye) eye.setAttribute('r', '8.4')
      if(pupil) pupil.setAttribute('r', '3.2')
    } else {
      if(eye) eye.setAttribute('r', '7')
      if(pupil) pupil.setAttribute('r', '2.8')
    }

    this._applyTransform()

    this._bubbleTimer -= dt
    if(this._bubbleTimer <= 0){
      this._bubbleTimer = lvl <= 5 ? (1.1 + Math.random()*0.7) : (0.55 + Math.random()*0.65) / Math.max(0.45, speedFactor)
      if(lvl > 0){ this._spawnBubble() }
    }

    this._updateState()
  }

  _speedFactor(){
    if(this.water.level>40) return 1
    if(this.water.level>20) return 0.72
    if(this.water.level>5) return 0.42
    if(this.water.level>0) return 0.25
    return 0.1
  }

  _spawnBubble(){
    const mouth = {x:this.pos.x + 28, y:this.pos.y + 4}
    const spread = Math.random()*10 - 5
    this.bubbles.spawn(mouth.x + spread, mouth.y + Math.random()*3, 4 + Math.random()*7)
  }

  _handleExhaustion(dt){
    this.state = 'agotado'
    this.vx = 0
    this.vy = 0
    this.pos.y = Math.min(this.pos.y + 120 * dt, 412)
    this.deathTimer += dt

    const tail = this.g.querySelector('#tail')
    const tail2 = this.g.querySelector('#tail2')
    const body = this.g.querySelector('#body')
    const belly = this.g.querySelector('#belly')
    const dorsal = this.g.querySelector('#dorsal')
    const fin = this.g.querySelector('#fin')
    const eye = this.g.querySelector('#eye')
    const pupil = this.g.querySelector('#pupil')
    const mouth = this.g.querySelector('#mouth')
    const shadow = this.g.querySelector('#bodyShadow')
    const fade = Math.max(0, 1 - this.deathTimer / this.deathDuration)

    if(body) body.setAttribute('transform', `translate(8,22) scale(0.72,0.52) rotate(-12)`)
    if(belly) belly.setAttribute('transform', `translate(0,8) scale(0.72,0.5)`)
    if(tail) tail.setAttribute('transform', `rotate(-8 -56 0)`)
    if(tail2) tail2.setAttribute('transform', `rotate(-4 -56 0)`)
    if(dorsal) dorsal.setAttribute('transform', `rotate(-14 0 -24)`)
    if(fin) fin.setAttribute('transform', `rotate(-14 14 18)`)
    if(eye) eye.setAttribute('r', '6.5')
    if(pupil) pupil.setAttribute('r', '2.4')
    if(mouth) mouth.setAttribute('d', `M29,6 C34,12 40,12 43,6`)
    if(shadow) shadow.setAttribute('opacity', '0.06')

    this.g.setAttribute('opacity', String(fade))
    this._applyTransform()

    if(this.deathTimer >= this.deathDuration){
      this.g.style.display = 'none'
      this.alive = false
    }
  }

  _updateState(){
    const lvl = this.water.level
    if(lvl > 40){ this.state = 'feliz' }
    else if(lvl > 20){ this.state = 'preocupado' }
    else if(lvl > 5){ this.state = 'boquea' }
    else if(lvl > 0){ this.state = 'cae' }
    else { this.state = 'agotado' }
  }

  // API methods
  feed(){ this.vx *= 1.18; this.state = 'feliz' }
  die(){ this.alive = false }
  happy(){ this.state = 'feliz'; this.vx = Math.abs(this.vx) }
  scared(){ this.state = 'asustado'; this.vx = -this.vx * 1.4 }
}
