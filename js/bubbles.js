// bubbles.js - burbujas que suben, burbujas de celebración y salpicaduras
// Burbujas normales: nacen en un punto y suben ondulando hasta la superficie.
// Burbujas de celebración: ráfaga radial que muere a mitad de camino.
export class Bubbles{
  constructor(group, water, audio, splashGroup){
    this.group = group
    this.splashGroup = splashGroup
    this.water = water
    this.audio = audio
    this.items = []
    this.droplets = []
  }

  spawn(x, y, r = 6, opts = {}){
    const c = document.createElementNS(SVGNS, 'circle')
    const rr = Math.max(2.2, r)
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', rr)
    c.setAttribute('fill', 'rgba(255,255,255,0.28)')
    c.setAttribute('stroke', 'rgba(230,250,255,0.75)')
    c.setAttribute('stroke-width', '1.2')
    this.group.appendChild(c)
    this.items.push({
      el: c, x, y, r: rr,
      vx: opts.burst ? opts.vx : (Math.random() - 0.5) * 16,
      vy: opts.burst ? opts.vy : -(26 + Math.random() * 28),
      life: 0, wobble: Math.random() * Math.PI * 2,
      burst: !!opts.burst
    })
  }

  // ráfaga radial de celebración
  burst(x, y, n = 10, speed = 80){
    for(let i = 0; i < n; i++){
      const a = (i / n) * Math.PI - Math.PI, mag = speed * (0.6 + Math.random() * 0.5)
      this.spawn(x, y, 3 + Math.random() * 4, { burst: true, vx: Math.cos(a) * mag, vy: Math.sin(a) * mag * 1.2 - 40 })
    }
  }

  // gotas de salpicadura reales (caen por gravedad desde la superficie)
  splashAt(x, y, n = 8, force = 1){
    if(!this.splashGroup) return
    for(let i = 0; i < n; i++){
      const c = document.createElementNS(SVGNS, 'circle')
      const r = 2 + Math.random() * 3
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', r)
      c.setAttribute('fill', 'rgba(255,255,255,0.85)')
      this.splashGroup.appendChild(c)
      this.droplets.push({
        el: c, x: x + (Math.random() - 0.5) * 14, y,
        vx: (Math.random() - 0.5) * 130 * force,
        vy: -(60 + Math.random() * 130) * force,
        life: 0
      })
    }
    if(this.audio) this.audio.splash()
  }

  update(dt){
    const surf = this.water.surfaceY
    for(let i = this.items.length - 1; i >= 0; i--){
      const b = this.items[i]
      b.life += dt
      b.wobble += dt * 3
      if(!b.burst) b.vy -= 20 * dt                     // aceleración de flotación
      b.x += b.vx * dt + Math.sin(b.life * 5 + b.wobble) * 12 * dt
      b.y += b.vy * dt
      if(b.burst){ b.vy += 60 * dt; b.vx *= 0.985 }    // curva hacia arriba
      b.el.setAttribute('cx', b.x)
      b.el.setAttribute('cy', b.y)
      b.el.setAttribute('r', String(Math.max(1.2, b.r + Math.sin(b.life * 7) * 0.3)))
      const dead = b.burst ? b.life > 1.1 : b.y < surf + 4
      if(dead){
        if(!b.burst && this.audio && Math.random() < 0.25) this.audio.bubble(b.r)
        b.el.remove(); this.items.splice(i, 1)
      }
    }

    for(let i = this.droplets.length - 1; i >= 0; i--){
      const d = this.droplets[i]
      d.life += dt
      d.vy += 620 * dt                                  // gravedad
      d.x += d.vx * dt
      d.y += d.vy * dt
      d.el.setAttribute('cx', d.x)
      d.el.setAttribute('cy', d.y)
      if(d.y > surf - 1 || d.life > 1.4){
        d.el.remove(); this.droplets.splice(i, 1)
      }
    }
  }
}

const SVGNS = 'http://www.w3.org/2000/svg'
