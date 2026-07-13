import { Aquarium } from './animation.js'

function injectAquariumStyles(){
  if(document.getElementById('aquarium-autocss')) return
  const style = document.createElement('style')
  style.id = 'aquarium-autocss'
  style.textContent = `
    .aquarium-widget{width:100%;height:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:12px}
    .aquarium-widget .container{flex:1;display:flex;flex-direction:column;min-height:0}
    .aquarium-widget .scene{flex:1;background:transparent;border-radius:8px;overflow:hidden;min-height:0}
    .aquarium-widget .controls{display:flex;justify-content:space-between;align-items:center;margin-top:0;flex-shrink:0}
    .aquarium-widget .controls .left{display:flex;gap:8px;align-items:center}
    .aquarium-widget button{padding:6px 10px;font-size:16px;border-radius:6px;border:1px solid #999;background:#fff;cursor:pointer}
    .aquarium-widget input[type=range]{width:240px;max-width:100%}
    .aquarium-widget .right{font-size:14px}
    .aquarium-widget svg{width:100%;height:100%;display:block}
    .aquarium-widget .plantLeaf{transform-origin:0 0}
    .aquarium-widget #debug{margin-top:12px;background:#f3f8ff;padding:8px;border-radius:6px;max-height:120px;overflow:auto;font-size:13px}
    @media(max-width:600px){.aquarium-widget input[type=range]{width:160px}}
  `
  document.head.appendChild(style)
}

function createAquariumMarkup(parent=document.getElementById('aquarium-root') || document.body){
  const wrapper = document.createElement('div')
  wrapper.className = 'aquarium-widget'
  wrapper.style.width = '100%'
  wrapper.style.height = '100%'
  wrapper.innerHTML = `
    <div class="scene">
      <svg id="aquarium" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
        <defs>
          <clipPath id="waterClip"><rect id="waterRect" x="0" y="150" width="800" height="350"/></clipPath>
          <filter id="glass" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="b"/>
            <feMerge>
              <feMergeNode in="b"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="tankGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#e9fdff" stop-opacity="0.85"/>
            <stop offset="100%" stop-color="#6eb7dd" stop-opacity="0.25"/>
          </linearGradient>
          <radialGradient id="waterGradient" cx="55%" cy="12%" r="80%">
            <stop offset="0%" stop-color="#bdf6ff" stop-opacity="0.95"/>
            <stop offset="55%" stop-color="#78d7ff" stop-opacity="0.96"/>
            <stop offset="100%" stop-color="#2e9ad2" stop-opacity="0.8"/>
          </radialGradient>
          <linearGradient id="sandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#e2bf94"/>
            <stop offset="100%" stop-color="#c18d5f"/>
          </linearGradient>
          <linearGradient id="fishBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffbe8b"/>
            <stop offset="60%" stop-color="#ff8d53"/>
            <stop offset="100%" stop-color="#d95f39"/>
          </linearGradient>
          <linearGradient id="fishTailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff9f6f"/>
            <stop offset="100%" stop-color="#db663a"/>
          </linearGradient>
        </defs>
        <rect x="50" y="40" width="700" height="420" rx="18" ry="18" fill="#0b3b66" opacity="0.12"/>
        <rect x="40" y="30" width="720" height="440" rx="22" ry="22" fill="url(#tankGlow)" opacity="0.3"/>
        <rect x="30" y="20" width="740" height="460" rx="24" ry="24" fill="#cfeefc" opacity="0.4" stroke="#8fc3e6" stroke-width="6" filter="url(#glass)"/>
        <g id="sand" transform="translate(0,374)">
          <ellipse cx="110" cy="82" rx="180" ry="38" fill="#b58b5e" opacity="0.5"/>
          <path d="M50,14 C116,0 190,4 250,18 C322,34 424,40 520,18 C592,2 660,4 720,18 L720,120 L50,120 Z" fill="url(#sandGradient)"/>
          <ellipse cx="220" cy="14" rx="95" ry="22" fill="#c99867" opacity="0.56"/>
          <ellipse cx="410" cy="24" rx="170" ry="28" fill="#c99867" opacity="0.46"/>
          <ellipse cx="620" cy="16" rx="150" ry="26" fill="#e0b78c" opacity="0.38"/>
        </g>
        <g id="decor" clip-path="url(#waterClip)">
          <g id="rocks">
            <ellipse cx="120" cy="390" rx="40" ry="22" fill="#6b6b6b" opacity="0.9"/>
            <ellipse cx="160" cy="400" rx="30" ry="16" fill="#7a7a7a" opacity="0.9"/>
            <ellipse cx="640" cy="400" rx="48" ry="24" fill="#5e5e5e" opacity="0.95"/>
          </g>
          <g id="plants">
            <g class="plant" transform="translate(220,360)">
              <path class="plantLeaf" d="M0,0 C-10,-40 -10,-80 0,-120" stroke="#176b3e" stroke-width="8" fill="none" stroke-linecap="round"/>
              <path class="plantLeaf" d="M6,0 C16,-30 10,-60 6,-90" stroke="#1fa55b" stroke-width="6" fill="none" stroke-linecap="round"/>
            </g>
            <g class="plant" transform="translate(580,360)">
              <path class="plantLeaf" d="M0,0 C-8,-30 -8,-60 0,-90" stroke="#176b3e" stroke-width="7" fill="none" stroke-linecap="round"/>
            </g>
          </g>
        </g>
        <g id="waterGroup">
          <g id="waterFill" clip-path="url(#waterClip)">
            <rect id="water" x="50" y="150" width="700" height="350" fill="url(#waterGradient)" opacity="0.9"/>
            <g id="waves" opacity="0.25"></g>
            <g id="particles"></g>
          </g>
          <g id="bubbles"></g>
        </g>
        <g id="fish" transform="translate(400,300) scale(1)">
          <ellipse id="bodyShadow" cx="2" cy="30" rx="42" ry="16" fill="rgba(0,0,0,0.14)"/>
          <g id="fishBody">
            <path id="body" d="M-36,-4 C-42,-24 -21,-42 13,-40 C48,-37 68,-18 68,0 C68,20 48,35 16,37 C-10,39 -34,24 -36,-4 Z" fill="url(#fishBodyGradient)" stroke="#c7663d" stroke-width="3"/>
            <path id="belly" d="M0,-8 C20,-4 36,10 34,18 C28,26 12,28 -4,22 C-8,10 -4,0 0,-8 Z" fill="rgba(255,255,255,0.26)" opacity="0.55"/>
            <path id="dorsal" d="M-4,-22 C10,-36 26,-28 32,-20" fill="none" stroke="#ff8d54" stroke-width="3" stroke-linecap="round"/>
            <path id="fin" d="M14,18 C26,26 34,22 42,12 C30,8 20,10 14,18 Z" fill="#ff925c" stroke="#c7663d" stroke-width="1.5"/>
            <path id="tail" d="M-56,0 C-88,-24 -88,24 -56,0 Z" fill="url(#fishTailGradient)" stroke="#c7663d" stroke-width="2.4"/>
            <path id="tail2" d="M-58,-8 C-92,-26 -92,-6 -64,-2" fill="none" stroke="#ff9a6b" stroke-width="2"/>
            <circle id="eye" cx="21" cy="-8" r="7" fill="#ffffff"/>
            <circle id="pupil" cx="22" cy="-8" r="2.8" fill="#111111"/>
            <path id="mouth" d="M29,6 C33,8 40,8 43,6" stroke="#b34c39" stroke-width="2" fill="none" stroke-linecap="round"/>
          </g>
        </g>
        <path id="surface" d="M50,150 C180,140 320,156 410,148 S620,160 750,150" fill="none" stroke="#ffffff" stroke-opacity="0.34" stroke-width="2"/>
      </svg>
    </div>
  `
  parent.appendChild(wrapper)
}

function clamp(value, min, max){
  return Math.max(min, Math.min(max, value))
}

function initAquarium(container=document.getElementById('aquarium-root') || document.body){
  injectAquariumStyles()
  if(!document.getElementById('aquarium')){
    createAquariumMarkup(container)
  }
  const svg = document.getElementById('aquarium')
  const aq = new Aquarium(svg)
  aq.start()

  const plus = document.getElementById('plus')
  const minus = document.getElementById('minus')
  const range = document.getElementById('levelRange')
  const levelText = document.getElementById('level')
  const fishState = document.getElementById('fishState')

  plus?.addEventListener('click', ()=> aq.changeWater(5))
  minus?.addEventListener('click', ()=> aq.changeWater(-5))
  range?.addEventListener('input', e=> aq.setWaterLevel(Number(e.target.value)))

  aq.on('level', v=>{
    if(levelText){ levelText.textContent = Math.round(v)+'%'; range.value = Math.round(v) }
  })
  aq.on('fishstate', s=>{ if(fishState) fishState.textContent = s })

  window.aquarium = {
    setWaterLevel: v=>aq.setWaterLevel(clamp(v,0,100)),
    changeWater: d=>aq.changeWater(d),
    setScore: (score, max=100)=> aq.setWaterLevel(clamp((score/max)*100,0,100)),
    fish: {
      feed: ()=>aq.fish.feed(),
      die: ()=>aq.fish.die(),
      happy: ()=>aq.fish.happy(),
      scared: ()=>aq.fish.scared()
    }
  }

  window.aquariumInstance = aq
  return aq
}

document.addEventListener('DOMContentLoaded', ()=> initAquarium())
