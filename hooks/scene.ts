import { parade } from './characters'

// The backdrop: a pixel night (dark mode) or day (light mode) over a castle,
// a city skyline and stepped hills, with a parade of characters (characters.ts).
// Every moving part has a resting place in the plain markup, so reduced motion
// still looks finished.

const P = 4 // one art pixel, in scene units

let seed = 11
const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
const ri = (a: number, b: number) => Math.floor(a + rand() * (b - a + 1))

const box = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h-${w}z`

/** Pixel art from rows of characters; `pal` maps a character to a CSS class. */
const sprite = (rows: string[], pal: Record<string, string>, ox = 0, oy = 0, s = P) => {
  const by: Record<string, string> = {}
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const c = row[x]!
      let n = 1
      while (row[x + n] === c) n++
      const cls = pal[c]
      if (cls) by[cls] = (by[cls] ?? '') + box(ox + x * s, oy + y * s, n * s, s)
      x += n
    }
  })
  return Object.entries(by).map(([cls, d]) => `<path class="${cls}" d="${d}"/>`).join('')
}

// ---- sky ----------------------------------------------------------------

const BANDS = [0, 150, 280, 390, 480, 560, 900]
const sky =
  BANDS.slice(0, -1).map((y, i) => `<rect class="b${i}" y="${y}" width="1600" height="${BANDS[i + 1]! - y}"/>`).join('') +
  // a checker row of the next band's color where two bands meet
  BANDS.slice(1, -1).map((y, i) => {
    let d = ''
    for (let x = 0; x < 1600; x += 2 * P) d += box(x, y - P, P, P) + box(x + P, y - 2 * P, P, P)
    return `<path class="b${i + 1}" d="${d}"/>`
  }).join('')

const stars = (() => {
  let small = ''
  let out = ''
  for (let i = 0; i < 90; i++) {
    const x = ri(0, 399) * P
    const y = ri(0, 130) * P
    if (rand() > 0.88) {
      // a four-point sparkle that twinkles
      const d = box(x, y - P, P, 3 * P) + box(x - P, y, 3 * P, P)
      out += `<path class="star tw" style="animation-delay:-${(rand() * 6).toFixed(1)}s" d="${d}"/>`
    } else {
      small += box(x, y, P, P)
    }
  }
  return `<path class="star dim" d="${small}"/>` + out
})()

const moon = (() => {
  const rows: string[] = []
  const R = 14
  const craters = [[-5, -4, 3], [4, 3, 2.5], [-2, 6, 2], [6, -6, 1.5]]
  for (let y = -R; y < R; y++) {
    let row = ''
    for (let x = -R; x < R; x++) {
      const cx = x + 0.5
      const cy = y + 0.5
      if (cx * cx + cy * cy > R * R) { row += '.'; continue }
      const crater = craters.some(([a, b, r]) => (cx - a!) ** 2 + (cy - b!) ** 2 <= r! * r!)
      const rim = cx + cy > R * 0.9
      row += crater ? 'c' : rim ? 's' : 'm'
    }
    rows.push(row)
  }
  return `<g transform="translate(1340 70)">${sprite(rows, { m: 'disc', c: 'crater', s: 'discsh' })}</g>`
})()

const shootingStar = `<g class="shoot"><path class="star" d="${box(0, 0, P * 2, P) + box(-P * 3, -P, P * 3, P) + box(-P * 7, -P * 2, P * 4, P)}" opacity=".9"/></g>`

const cloud = (w: number, h: number) => {
  const blobs = Array.from({ length: 5 }, (_, i) => ({
    x: (w / 6) * (i + 1) + ri(-3, 3),
    y: h * 0.6 + ri(-2, 1),
    r: i === 2 ? h * 0.6 : h * (0.32 + rand() * 0.2),
  }))
  const rows: string[] = []
  for (let y = 0; y < h; y++) {
    let row = ''
    for (let x = 0; x < w; x++) {
      const inside = blobs.some(b => (x - b.x) ** 2 + (y - b.y) ** 2 <= b.r * b.r) && y < h
      row += !inside ? '.' : y > h * 0.72 ? 's' : y < h * 0.3 ? 'h' : 'c'
    }
    rows.push(row)
  }
  return sprite(rows, { c: 'cloud', s: 'cloudsh', h: 'cloudhi' })
}

// ---- land ---------------------------------------------------------------

/** A stepped ridge across the width: tops from `heightAt`, 8 units a column. */
const ridge = (base: number, heightAt: (x: number) => number, cls: string, hiCls: string) => {
  let d = `M0 ${base}`
  let hi = ''
  for (let x = 0; x <= 1600; x += 2 * P) {
    const top = base - Math.round(heightAt(x) / P) * P
    d += `V${top}H${x + 2 * P}`
    hi += box(x, top, 2 * P, P)
  }
  return `<path class="${cls}" d="${d}V${base}Z"/><path class="${hiCls}" d="${hi}"/>`
}

const wave = (x: number, a: number, f: number, p: number) => a * Math.sin(x * f + p)
const mountains = ridge(
  760,
  x => 150 + wave(x, 70, 0.006, 1) + wave(x, 35, 0.017, 2) + wave(x, 12, 0.05, 0),
  'mtn',
  'mtnhi',
)

const castle = (() => {
  const base = 790
  let stone = ''
  let dark = ''
  let lit = ''
  let unlit = ''
  const block = (x: number, top: number, w: number) => {
    stone += box(x, top, w, base - top)
    for (let bx = x; bx < x + w; bx += 4 * P) stone += box(bx, top - 2 * P, 2 * P, 2 * P)
  }
  block(130, 712, 360) // curtain wall
  block(180, 640, 56) // left tower
  block(384, 640, 56) // right tower
  block(262, 590, 96) // keep
  // brick texture
  for (let i = 0; i < 110; i++) {
    const x = ri(33, 121) * P
    const y = ri(150, 196) * P
    const inKeep = x >= 262 && x < 358 && y >= 590
    const inTower = (x >= 180 && x < 236) || (x >= 384 && x < 440) ? y >= 640 : false
    if (inKeep || inTower || y >= 712) dark += box(x, y, 2 * P, P)
  }
  // windows: arched slits
  const win = (x: number, y: number, on: boolean) => {
    const d = box(x, y + P, 2 * P, 3 * P) + box(x + P / 2, y, P, P)
    if (on) lit += d; else unlit += d
  }
  win(200, 660, true); win(200, 700, false); win(404, 660, false); win(404, 700, true)
  win(282, 612, true); win(304, 612, true); win(326, 612, false); win(304, 660, true)
  win(150, 736, false); win(460, 736, true)
  // gate
  unlit += box(290, 750, 40, 40) + box(294, 746, 32, 4) + box(302, 742, 16, 4)
  const flag =
    `<path class="pole" d="${box(308, 548, P, 42)}"/>` +
    `<path class="flag fa" d="${box(312, 550, 24, 4) + box(312, 554, 20, 4) + box(312, 558, 12, 4)}"/>` +
    `<path class="flag fb" d="${box(312, 552, 20, 4) + box(312, 556, 24, 4) + box(312, 560, 10, 4)}"/>`
  return `<path class="stone" d="${stone}"/><path class="stonedk" d="${dark}"/><path class="windk" d="${unlit}"/><path class="winlit" d="${lit}"/>${flag}`
})()

const city = (() => {
  const base = 800
  let a = ''
  let b = ''
  let lit = ''
  let blink = ''
  let unlit = ''
  let roof = ''
  let x = 1030
  let i = 0
  while (x < 1600) {
    const w = ri(10, 22) * P
    const h = ri(30, 75) * P
    const top = base - h
    if (i % 2) a += box(x, top, w, h); else b += box(x, top, w, h)
    if (rand() > 0.6) roof += box(x + w / 2 - P / 2 - ((w / 2) % P), top - 6 * P, P, 6 * P)
    else if (rand() > 0.5) roof += box(x + P, top - 2 * P, w - 2 * P, 2 * P)
    for (let wy = top + 3 * P; wy < base - 3 * P; wy += 4 * P) {
      for (let wx = x + 2 * P; wx < x + w - 2 * P; wx += 3 * P) {
        const d = box(wx, wy, P, 2 * P)
        const r = rand()
        if (r > 0.97) blink += d
        else if (r > 0.62) lit += d
        else unlit += d
      }
    }
    x += w + (rand() > 0.7 ? 2 * P : 0)
    i++
  }
  return `<path class="bldg" d="${a}"/><path class="bldg2" d="${b}"/><path class="bldg" d="${roof}"/><path class="windk" d="${unlit}"/><path class="winlit" d="${lit}"/><path class="winlit blink" d="${blink}"/>`
})()

const hills = ridge(
  822,
  x => {
    const edge = Math.abs(x - 800) / 800
    return 14 + edge * edge * 70 + wave(x, 10, 0.011, 0.5) + wave(x, 5, 0.04, 1.5)
  },
  'hill',
  'hillhi',
)

const PINE = ['...g...', '..ggg..', '.gGggg.', '..ggg..', '.gGgggg', 'gGggggg', '..ggg..', '.gGgggg', 'ggggggg', '...t...', '...t...']
const trees = [40, 96, 150, 520, 600, 1000, 1480, 1540]
  .map(tx => {
    const edge = Math.abs(tx - 800) / 800
    const top = 822 - Math.round((14 + edge * edge * 70 + wave(tx, 10, 0.011, 0.5)) / P) * P
    return sprite(PINE, { g: 'tree', G: 'treehi', t: 'trunk' }, tx, top - PINE.length * P + P)
  })
  .join('')

const ground = (() => {
  let tex = ''
  let texDk = ''
  let tufts = ''
  for (let i = 0; i < 260; i++) {
    const x = ri(0, 399) * P
    const y = ri(211, 224) * P
    if (rand() > 0.5) tex += box(x, y, 2 * P, P); else texDk += box(x, y, P, P)
  }
  for (let x = 0; x < 1600; x += ri(3, 9) * P) tufts += box(x, 830, P, P) + box(x + P, 826, P, 2 * P)
  return `<rect class="ground" y="840" width="1600" height="96"/><rect class="grass" y="830" width="1600" height="10"/><rect class="grassdk" y="840" width="1600" height="4"/><path class="grass" d="${tufts}"/><path class="tile" d="${tex}"/><path class="tiledk" d="${texDk}"/>`
})()

// ---- the parade -----------------------------------------------------------

const cast = parade()

// ---- the whole scene ------------------------------------------------------

export const SCENE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges">
<style>
.b0{fill:#06061a}.b1{fill:#0a0a24}.b2{fill:#0e0e2e}.b3{fill:#141438}.b4{fill:#1a1a44}.b5{fill:#222252}
.star{fill:#fcfcfc}.dim{opacity:.6}
.tw{animation:tw 6s steps(1) infinite}
.disc{fill:#f8e8b8}.discsh{fill:#d8c890}.crater{fill:#c8b884}
.cloud{fill:#34346c}.cloudhi{fill:#40407c}.cloudsh{fill:#2a2a5a}
.mtn{fill:#1c2448}.mtnhi{fill:#2c3868}
.stone{fill:#2c2c50}.stonedk{fill:#22223e}.pole{fill:#9c9cb0}.flag{fill:#e40058}
.bldg{fill:#1e2040}.bldg2{fill:#262848}
.winlit{fill:#f8d878}.windk{fill:#14142a}
.hill{fill:#0c3c24}.hillhi{fill:#14502c}
.tree{fill:#0a5a2a}.treehi{fill:#1a7a3a}.trunk{fill:#4c2c10}
.ground{fill:#4c2408}.grass{fill:#00a844}.grassdk{fill:#007828}.tile{fill:#6c3410}.tiledk{fill:#3a1c06}
${cast.css}
.c1{animation:drift 230s steps(690) infinite;animation-delay:-20s}
.c2{animation:drift 300s steps(900) infinite;animation-delay:-120s}
.c3{animation:drift 260s steps(780) infinite;animation-delay:-70s}
.fb{opacity:0}
.flag.fa{animation:fa 1.6s steps(1) infinite}.flag.fb{animation:fb 1.6s steps(1) infinite}
.blink{animation:tw 11s steps(1) infinite}
.shoot{opacity:0;animation:shoot 34s steps(6) infinite;animation-delay:9s}
@keyframes tw{0%{opacity:1}50%{opacity:.3}}
@keyframes fa{0%{opacity:1}50%{opacity:0}}
@keyframes fb{0%{opacity:0}50%{opacity:1}}
@keyframes drift{from{transform:translateX(-1500px)}to{transform:translateX(1700px)}}
@keyframes shoot{0%{opacity:0;transform:translate(300px,60px)}1%{opacity:.9}5%{opacity:0;transform:translate(700px,220px)}100%{opacity:0;transform:translate(700px,220px)}}
@media (prefers-color-scheme: light){
.b0{fill:#4c84f4}.b1{fill:#5c94fc}.b2{fill:#6ca0fc}.b3{fill:#7cacfc}.b4{fill:#8cbcfc}.b5{fill:#a4ccfc}
.star,.shoot{display:none}
.disc{fill:#fcd800}.discsh{fill:#fcb800}.crater{fill:#fcd800}
.cloud{fill:#f8f8f8}.cloudhi{fill:#fcfcfc}.cloudsh{fill:#c8dcfc}
.mtn{fill:#5c8cc8}.mtnhi{fill:#e8f0fc}
.stone{fill:#9c9cb4}.stonedk{fill:#84849c}.pole{fill:#545468}
.bldg{fill:#7c8cb0}.bldg2{fill:#8c9cc0}
.winlit{fill:#3c4c78}.windk{fill:#5c6c98}
.hill{fill:#00a844}.hillhi{fill:#58d854}
.tree{fill:#007828}.treehi{fill:#00a844}.trunk{fill:#7c4c18}
.ground{fill:#c84c0c}.grass{fill:#80d010}.grassdk{fill:#58a800}.tile{fill:#e07030}.tiledk{fill:#a03c08}
}
</style>
${sky}
${stars}
${shootingStar}
${moon}
<g class="c1" style="translate:240px 110px">${cloud(46, 14)}</g>
<g class="c2" style="translate:820px 230px">${cloud(60, 18)}</g>
<g class="c3" style="translate:1060px 40px">${cloud(36, 11)}</g>
${mountains}
${castle}
${city}
<g transform="translate(0 -32)">
${hills}
${trees}
${ground}
${cast.svg}
</g>
</svg>`
