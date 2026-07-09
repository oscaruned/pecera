// fish.js - controla la animación y estado del pez
export default class Fish{
  constructor(group, bubbles, water){
    this.g = group
    this.bubbles = bubbles
    this.water = water
    this.pos = {x:400,y:300}
    this.vx = 80*(Math.random()>0.5?1:-1)
    this.vy = 0
    this.mass = 1
    this.damping = 0.9
    this.tailPhase = 0
    this.state = 'feliz'
    this._bubbleTimer = 0
    this.alive = true
  }

  _applyTransform(){
    this.g.setAttribute('transform', `translate(${this.pos.x},${this.pos.y}) scale(${this.vx<0?-1:1},1)`)
  }

  update(dt){
    if(!this.alive) return
    // horizontal movement
    const speedFactor = this._speedFactor()
    this.pos.x += this.vx * dt * speedFactor

    // vertical physics: buoyancy + sine swim + damping
    const buoyancy = (this.water.level/100) * 60 // upward force
    // slight swim oscillation
    const swimForce = Math.sin((Date.now()/300)+this.pos.x/80) * 12
    const fy = swimForce - (50 - buoyancy)
    this.vy += (fy/this.mass) * dt
    this.vy *= Math.pow(this.damping, dt*60)
    this.pos.y += this.vy * dt * 60

    // bounce on sides
    if(this.pos.x < 100){ this.pos.x = 100; this.vx = Math.abs(this.vx) }
    if(this.pos.x > 700){ this.pos.x = 700; this.vx = -Math.abs(this.vx) }

    // stay within water bounds
    const minY = 170; const maxY = 430 - (100 - this.water.level)*2
    if(this.pos.y < minY) this.pos.y = minY
    if(this.pos.y > maxY) this.pos.y = maxY

    // tail animation (más visible con más velocidad)
    this.tailPhase += dt*12*speedFactor
    const tail = this.g.querySelector('#tail')
    const tailAngle = Math.sin(this.tailPhase) * (16 + 16*(1-speedFactor))
    if(tail) tail.setAttribute('transform', `rotate(${tailAngle})`)

    // body squash/stretch según velocidad
    const body = this.g.querySelector('#body')
    const stretch = 1 + Math.min(0.25, Math.abs(this.vx)/300)
    if(body) body.setAttribute('transform', `scale(${stretch},${1/stretch})`)

    // eye deformation for low water
    const eye = this.g.querySelector('#eye')
    const pupil = this.g.querySelector('#pupil')
    if(this.water.level <= 20){ if(eye) eye.setAttribute('r', '12'); if(pupil) pupil.setAttribute('r','5') }
    else { if(eye) eye.setAttribute('r','8'); if(pupil) pupil.setAttribute('r','3') }

    this._applyTransform()

    // bubbles
    this._bubbleTimer -= dt
    if(this._bubbleTimer <= 0){ this._bubbleTimer = 0.8 / speedFactor; this._spawnBubble() }

    // update state based on water
    this._updateState()
  }

  _speedFactor(){
    if(this.water.level>40) return 1
    if(this.water.level>20) return 0.7
    if(this.water.level>5) return 0.4
    if(this.water.level>0) return 0.25
    return 0.05
  }

  _spawnBubble(){
    const mouth = {x:this.pos.x+28, y:this.pos.y+4}
    this.bubbles.spawn(mouth.x, mouth.y, Math.random()*10+4)
  }

  _updateState(){
    const lvl = this.water.level
    if(lvl>40){ this.state='feliz' }
    else if(lvl>20){ this.state='preocupado' }
    else if(lvl>5){ this.state='boquea' }
    else if(lvl>0){ this.state='cae' }
    else { this.state='inmóvil'; this.alive=false }
  }

  // API methods
  feed(){ this.vx *= 1.2 }
  die(){ this.alive=false }
  happy(){ this.state='feliz'; this.vx = Math.abs(this.vx) }
  scared(){ this.state='asustado'; this.vx = -this.vx*1.5 }
}
