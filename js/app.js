// app.js - bootstrap del marcador de acuario + demo de controles
import { Aquarium } from './animation.js'
import { buildScene } from './scene.js'

function initAquarium(container = document.getElementById('aquarium-root') || document.body){
  const { svgRoot, waterClipRect, waterRect } = (() => {
    const built = buildScene(container)
    // waterRect viene de waterClip dentro de defs: recogerlo del árbol
    const wr = built.svgRoot.querySelector('#waterRect')
    return { svgRoot: built.svgRoot, waterClipRect: built.waterClipRect, waterRect: wr }
  })()

  const els = {
    water: svgRoot.querySelector('#water'),
    waterRect,
    waveA: svgRoot.querySelector('#waveA'),
    waveB: svgRoot.querySelector('#waveB'),
    foam: svgRoot.querySelector('#foamA'),
    splashes: svgRoot.querySelector('#splashes'),
    bubbles: svgRoot.querySelector('#bubbles'),
    fish: svgRoot.querySelector('#fish'),
    companions: svgRoot.querySelector('#companions')
  }

  const aq = new Aquarium(svgRoot, els)
  aq.start()

  // ---- wiring de la demo ----
  const scoreText = document.getElementById('score')
  const stateText = document.getElementById('fishState')
  const levelPct = document.getElementById('level')
  const muteBtn = document.getElementById('mute')
  const overPanel = document.getElementById('gameover')
  const overScore = document.getElementById('finalScore')

  aq.on('level', v => { if(levelPct) levelPct.textContent = Math.round(v) + '%' })
  aq.on('fishstate', s => {
    if(stateText){
      const map = { feliz: '😊 feliz', preocupado: '😕 preocupado', boquea: '😮‍💨 boquea', cae: '🥵 agotándose', asustado: '😨 asustado', muerto: '😵 muerto' }
      stateText.textContent = map[s] || s
    }
  })
  aq.on('milestone', m => {
    const flash = document.getElementById('milestoneFlash')
    if(!flash) return
    flash.textContent = m.kind === 'tier' ? `¡El pez evoluciona (nivel ${m.value})!` : '¡Nuevo pez en el cardumen!'
    flash.classList.remove('show')
    clearTimeout(flash._t)
    void flash.offsetWidth
    flash.classList.add('show')
    flash._t = setTimeout(() => flash.classList.remove('show'), 2800)
  })
  aq.on('gameover', score => {
    if(overPanel){ overPanel.style.display = 'grid'; if(overScore) overScore.textContent = score }
  })

  // contador de "minuto sin responder": vuelve a cero con cada palabra nueva
  // y se detiene al terminar la partida
  const clockBox = document.getElementById('idleClock')
  const clockTime = document.getElementById('idleTime')
  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  aq.on('idleTick', ({ elapsed, max }) => {
    if(!clockBox || !clockTime) return
    if(elapsed < 0){                       // partida terminada
      clockBox.classList.add('stopped')
      clockTime.textContent = '■'
      return
    }
    clockBox.classList.remove('stopped')
    clockTime.textContent = fmt(elapsed)
    clockBox.classList.toggle('urgent', max - elapsed <= 10)
  })
  aq.on('idle', () => {
    if(clockBox) clockBox.classList.add('stopped')
    const flash = document.getElementById('milestoneFlash')
    if(!flash) return
    flash.textContent = '⏱ ¡Un minuto sin responder!'
    flash.classList.remove('show')
    clearTimeout(flash._t)
    void flash.offsetWidth
    flash.classList.add('show')
    flash._t = setTimeout(() => flash.classList.remove('show'), 2800)
    updateScoreText()
  })

  document.getElementById('newWord')?.addEventListener('click', () => aq.word())

  const updateScoreText = () => { if(scoreText) scoreText.textContent = String(aq.score) }
  aq.on('level', updateScoreText)
  updateScoreText()

  document.querySelectorAll('[data-delta]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(overPanel) overPanel.style.display = 'none'
      aq.setScore(aq.score + Number(btn.dataset.delta))
      updateScoreText()
      if(levelPct) levelPct.textContent = Math.round(aq.water.level) + '%'
    })
  })

  const restartBtn = document.getElementById('restart')
  restartBtn?.addEventListener('click', () => {
    if(overPanel) overPanel.style.display = 'none'
    aq.reset()
    updateScoreText()
  })

  muteBtn?.addEventListener('click', () => {
    const m = !aq.audio.muted
    aq.audio.setMuted(m)
    muteBtn.textContent = m ? '🔇' : '🔊'
  })

  // API pública del widget (las instrucciones documentan estos métodos)
  window.aquarium = {
    setScore: (score) => aq.setScore(score),
    changeScore: (d) => aq.setScore(aq.score + d),
    reset: () => aq.reset(),
    setVolume: v => aq.audio.setVolume(v),
    setMuted: m => aq.audio.setMuted(m),
    // reloj de inactividad (minuto sin responder)
    word: () => aq.word(),                      // cada palabra nueva: contador a 0
    setIdleClock: (opts) => aq.setIdleClock(opts),
    // compatibilidad con versiones previas
    setWaterLevel: v => aq.setWaterLevel(v),
    changeWater: d => aq.changeWater(d),
    fish: {
      feed: () => aq.fish.happy(),
      happy: () => aq.fish.happy(),
      scared: () => aq.fish.scared()
    }
  }
  window.aquariumInstance = aq
  return aq
}

document.addEventListener('DOMContentLoaded', () => initAquarium())
