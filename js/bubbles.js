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
    c.setAttribute('cx',x); c.setAttribute('cy',y); c.setAttribute('r',r)
    c.setAttribute('fill','rgba(255,255,255,0.7)')
    c.setAttribute('stroke','rgba(200,240,255,0.8)')
    c.setAttribute('stroke-width','1')
    this.group.appendChild(c)
    this.items.push({el:c,x,y,r,vy: - (30 + Math.random()*30), life:0})
  }

  update(dt){
    for(let i=this.items.length-1;i>=0;i--){
      const b = this.items[i]
      b.y += b.vy * dt
      b.el.setAttribute('cy', b.y)
      b.life += dt
      if(b.y < 160){
        // pop
        this._pop(b)
        b.el.remove()
        this.items.splice(i,1)
      }
    }
  }

  _pop(b){
    if(this.audio) this.audio.playBubble(b.r)
    // small popup effect could be added
  }
}
