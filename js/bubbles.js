// bubbles.js - genera y anima burbujas SVG
export class Bubbles{
  constructor(group, audio){
    this.group = group
    this.audio = audio
    this.items = []
  }

  spawn(x,y,r=6){
    const svgns = 'http://www.w3.org/2000/svg'
    const c = document.createElementNS(svgns,'circle')
    const bubbleR = Math.max(3, r)
    const alpha = 0.35 + Math.random() * 0.4
    const drift = (Math.random()-0.5) * 20
    c.setAttribute('cx',x)
    c.setAttribute('cy',y)
    c.setAttribute('r',String(bubbleR))
    c.setAttribute('fill',`rgba(255,255,255,${alpha})`)
    c.setAttribute('stroke',`rgba(205,243,255,${alpha + 0.15})`)
    c.setAttribute('stroke-width','1.1')
    this.group.appendChild(c)
    this.items.push({
      el:c,
      x,
      y,
      r:bubbleR,
      vx:drift,
      vy: -(20 + Math.random() * 26),
      life:0,
      wobble:Math.random()*Math.PI*2
    })
  }

  update(dt){
    for(let i=this.items.length-1;i>=0;i--){
      const b = this.items[i]
      b.life += dt
      b.x += b.vx * dt
      b.y += b.vy * dt
      b.vy += Math.sin(b.wobble + b.life * 4) * 0.05
      b.el.setAttribute('cx', b.x)
      b.el.setAttribute('cy', b.y)
      b.el.setAttribute('r', String(Math.max(1.5, b.r + Math.sin(b.life * 6) * 0.2)))
      if(b.y < 150 || b.life > 4.5){
        this._pop(b)
        b.el.remove()
        this.items.splice(i,1)
      }
    }
  }

  _pop(b){
    if(this.audio) this.audio.playBubble(b.r)
  }
}
