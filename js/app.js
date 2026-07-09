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
        </defs>
        <rect x="50" y="40" width="700" height="420" rx="18" ry="18" fill="#0b3b66" opacity="0.12"/>
        <rect x="40" y="30" width="720" height="440" rx="22" ry="22" fill="#aee6ff" opacity="0.06"/>
        <rect x="30" y="20" width="740" height="460" rx="24" ry="24" fill="#cfeefc" stroke="#8fc3e6" stroke-width="6" filter="url(#glass)"/>
        <g id="sand" transform="translate(0,360)">
          <rect x="50" y="0" width="700" height="140" fill="#D9B184"/>
          <ellipse cx="200" cy="0" rx="120" ry="24" fill="#c79a6a" opacity="0.6"/>
          <ellipse cx="520" cy="20" rx="220" ry="36" fill="#c79a6a" opacity="0.6"/>
        </g>
        <g id="decor" clip-path="url(#waterClip)">
          <g id="rocks">
            <ellipse cx="120" cy="390" rx="40" ry="22" fill="#6b6b6b"/>
            <ellipse cx="160" cy="400" rx="30" ry="16" fill="#7a7a7a"/>
            <ellipse cx="640" cy="400" rx="48" ry="24" fill="#5e5e5e"/>
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
        <g id="waterGroup" clip-path="url(#waterClip)">
          <rect id="water" x="50" y="150" width="700" height="350" fill="#7bd3ff" opacity="0.85"/>
          <g id="waves" opacity="0.25"></g>
          <g id="particles"></g>
          <g id="fish" transform="translate(400,300) scale(1)">
            <g id="fishBody">
              <ellipse id="body" cx="0" cy="0" rx="50" ry="28" fill="#ff9f6b" stroke="#c7663d" stroke-width="3"/>
              <path id="tail" d="M-50,0 C-80,-18 -80,18 -50,0" fill="#ff7b47" stroke="#c7663d" stroke-width="2"/>
              <path id="dorsal" d="M-8,-24 C4,-38 20,-28 28,-22" fill="#ff7b47" stroke="#c7663d" stroke-width="2"/>
              <path id="fin" d="M10,18 C24,26 28,22 36,18 C28,10 18,12 10,18" fill="#ff7b47" stroke="#c7663d" stroke-width="1"/>
              <circle id="eye" cx="18" cy="-6" r="8" fill="#fff"/>
              <circle id="pupil" cx="20" cy="-6" r="3" fill="#111"/>
              <path id="mouth" d="M28,4 C26,6 22,6 20,4" stroke="#b24a34" stroke-width="2" fill="none" stroke-linecap="round"/>
            </g>
          </g>
          <g id="bubbles"></g>
        </g>
        <path id="surface" d="M50,150 C200,130 400,170 750,150 L750,150 L50,150 Z" fill="#ffffff" opacity="0.05"/>
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
