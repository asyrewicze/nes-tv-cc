// The parade: five original pixel characters who take turns running along the
// ground, one every 48 seconds, in an order shuffled each time the mod loads.
// With reduced motion the penguin stands by the city and the rest stay offstage.

const box = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h-${w}z`

const sprite = (rows: string[], pal: Record<string, string>, s: number, oy = 0) => {
  const by: Record<string, string> = {}
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const c = row[x]!
      let n = 1
      while (row[x + n] === c) n++
      const cls = pal[c]
      if (cls) by[cls] = (by[cls] ?? '') + box(x * s, oy + y * s, n * s, s)
      x += n
    }
  })
  return Object.entries(by).map(([cls, d]) => `<path class="${cls}" d="${d}"/>`).join('')
}

type Character = {
  id: string
  a: string[]
  b: string[]
  pal: Record<string, string>
  /** size of one art pixel */
  s: number
  /** how far frame B lifts, in art pixels */
  bob: number
  /** seconds to cross the screen */
  cross: number
  /** seconds per two-frame step */
  step: number
  /** height above the ground line it travels at */
  lift: number
  /** where it stands with motion off (offstage unless it's the penguin) */
  restX: number
  css: string
}

// -- penguin ----------------------------------------------------------------
const PENGUIN = [
  '......kkkkk.....',
  '....kkkkkkkkk...',
  '...kkkkkkkkwwk..',
  '...kkkkkkkwekoo.',
  '...kkkkkkkwwwooo',
  '...kkkkkkwwwwk..',
  '..rrrrrrrrrrrr..',
  '..kkkkkkwwwwwwk.',
  '.kkkkkkwwwwwwwk.',
  'kkkkkkkwwwwwwwk.',
  'k..kkkkwwwwwwwk.',
  '...kkkkwwwwwwwk.',
  '...kkkkwwwwwwk..',
  '....kkkkwwwwk...',
  '.....kkkkkkk....',
]
const penguinB = [...PENGUIN]
penguinB[6] = 'rrrrrrrrrrrrrr..'
penguinB[7] = 'r.kkkkkkwwwwwwk.'
penguinB[9] = '.kkkkkkwwwwwwwk.'
penguinB[10] = 'kk.kkkkwwwwwwwk.'

// -- knight -----------------------------------------------------------------
const KNIGHT_TOP = [
  '......rr........',
  '.....rrrr.......',
  '....sssss.......',
  '...sssssss....g.',
  '...ssvvvvv....g.',
  '...sssssss....g.',
  '....SsssS.....g.',
  '...bbbbbbb...yyy',
  '..sbbbybbbssssh.',
  '..sbbyyybbb...h.',
  '..sbbbybbbb.....',
  '...bbbbbbb......',
  '...SSSSSSS......',
]

// -- dragon -----------------------------------------------------------------
const DRAGON_A = [
  '...G................',
  '..GmG...............',
  '.GmmmG......ggg.....',
  '.GmmmmG....ggggg....',
  '..GmmmG...ggekggg...',
  '...GmmGg..gggggggg..',
  '....GGggggggggy.....',
  'g...gggggggyyyy.....',
  'gg.ggggggyyyyy......',
  '.ggggggggyyyy.......',
  '..gggggggyyy........',
  '....gG..gG..........',
  '....G...G...........',
]
const DRAGON_B = [
  '....................',
  '....................',
  '............ggg.....',
  '...........ggggg....',
  '..........ggekggg...',
  '..........ggggggggfo',
  '....GGggggggggy..of.',
  'g..GmmmGgggyyyy.....',
  'ggGmmmmGgyyyyy......',
  '.GmmmmGggyyyy.......',
  '..GmmGgggyyy........',
  '...GGgG..gG.........',
  '....G...G...........',
]

// -- monster (an original one-eyed city stomper) -----------------------------
const MONSTER_TOP = [
  '..hh..............hh..',
  '..hhh............hhh..',
  '...hhpppppppppppphh...',
  '....pppppppppppppp....',
  '...pppppeeeeeepppppp..',
  '...ppppeeeeeeeepppppp.',
  '...ppppeeeeekkeepppppp',
  '...ppppeeeeekkeepppppp',
  '...pppppeeeeeepppppppp',
  '...ppppppppppppppppppp',
  '...ppmmmmmmmmmmmmmpppp',
  '...ppmtmtmtmtmtmtmpppp',
  '...ppmmmmmmmmmmmmmppp.',
  '..pppPpppppppppppPppp.',
  '.ppppPPppppppppPPpppp.',
  'cpppp.PPppppppPP.ppppc',
  'cc.pp..pppppppp..pp.cc',
  '....pppppppppppppp....',
  '....pppppppppppppp....',
  '....ppppPPPPPPpppp....',
]

// -- plumber (orange beanie, big beard, teal coveralls, plunger) -------------
const PLUMBER_TOP = [
  '.....oooo.......',
  '....oooooo......',
  '....OOOOOO......',
  '....ffffff......',
  '....fffeff......',
  '....bfffffb.....',
  '....bbbbbbb.....',
  '.....bbbbb....r.',
  '...tTttttT...rrr',
  '..wtttttttfhhhrr',
  '..wtttttttt..rrr',
  '..ftyyGyyy....r.',
  '...tttttttt.....',
]

const CHARACTERS: Character[] = [
  {
    id: 'penguin',
    a: [...PENGUIN, '....ooo...ooo...'],
    b: [...penguinB, '......oooooo....'],
    pal: { k: 'pk', w: 'pw', e: 'pe', o: 'po', r: 'pr' },
    s: 4, bob: 1, cross: 14.5, step: 0.5, lift: 0, restX: 1180,
    css: '.pk{fill:#101018}.pw{fill:#f8f8f8}.pe{fill:#fcfcfc}.po{fill:#f89820}.pr{fill:#e40058}',
  },
  {
    id: 'knight',
    a: [...KNIGHT_TOP, '...ll...ll......', '..ll.....ll.....', '.SSS.....SSS....'],
    b: [...KNIGHT_TOP, '....ll.ll.......', '....ll.ll.......', '...SSS.SSS......'],
    pal: { r: 'kr', s: 'ks', S: 'kS', v: 'kv', b: 'kb', y: 'ky', g: 'kg', h: 'kh', l: 'kl' },
    s: 4, bob: 1, cross: 13, step: 0.5, lift: 0, restX: -400,
    css: '.kr{fill:#d82800}.ks{fill:#c8c8d0}.kS{fill:#74747c}.kv{fill:#101018}.kb{fill:#0050d8}.ky{fill:#f8b800}.kg{fill:#fcfcfc}.kh{fill:#7c4c18}.kl{fill:#545460}',
  },
  {
    id: 'dragon',
    a: DRAGON_A,
    b: DRAGON_B,
    pal: { g: 'dg', G: 'dG', m: 'dm', y: 'dy', e: 'de', k: 'dk', f: 'df', o: 'do' },
    s: 4, bob: 0, cross: 11, step: 0.5, lift: 100, restX: -400,
    css: '.dg{fill:#00a844}.dG{fill:#006820}.dm{fill:#80d010}.dy{fill:#f8d878}.de{fill:#fcfcfc}.dk{fill:#101018}.df{fill:#f83800}.do{fill:#f8b800}',
  },
  {
    id: 'monster',
    a: [...MONSTER_TOP, '....pppp......pppp....', '....pppp......pppp....', '...PPPPP.....PPPPP....', '..ccPPPP.....PPPPcc...'],
    b: [...MONSTER_TOP, '.....pppp...pppp......', '.....pppp...PPPPP.....', '....PPPPP..ccPPPP.....', '...ccPPPP.............'],
    pal: { h: 'mh', p: 'mp', P: 'mP', e: 'me', k: 'mk', m: 'mm', t: 'mt', c: 'mc' },
    s: 6, bob: 0, cross: 24, step: 1, lift: 0, restX: -400,
    css: '.mh{fill:#fce0a8}.mp{fill:#8c3cd8}.mP{fill:#5c1c9c}.me{fill:#fcfcfc}.mk{fill:#101018}.mm{fill:#3c0c3c}.mt{fill:#fcfcfc}.mc{fill:#fce0a8}',
  },
  {
    id: 'plumber',
    a: [...PLUMBER_TOP, '...ttt..ttt.....', '..ttt....ttt....', '.BBB.....BBB....'],
    b: [...PLUMBER_TOP, '....ttt.tt......', '....ttt.tt......', '...BBBB.BBB.....'],
    pal: { o: 'uo', O: 'uO', f: 'uf', e: 'ue', b: 'ub', t: 'ut', T: 'uT', w: 'uw', h: 'uh', r: 'ur', y: 'uy', G: 'uG', B: 'uB' },
    s: 4, bob: 1, cross: 12, step: 0.5, lift: 0, restX: -400,
    css: '.uo{fill:#f87818}.uO{fill:#c84c0c}.uf{fill:#fcbc8c}.ue{fill:#101018}.ub{fill:#7c4c18}.ut{fill:#008888}.uT{fill:#005858}.uw{fill:#bcbcbc}.uh{fill:#c8a060}.ur{fill:#d82800}.uy{fill:#a87c30}.uG{fill:#e0e0e8}.uB{fill:#503000}',
  },
]

const SLOT = 48 // seconds between runs, as before
const RUN_FPS = 8 // position updates per second while a character runs
const GROUND = 836

/** 15 runs, each character three times, never the same one twice in a row. */
const shuffledOrder = () => {
  const ids = CHARACTERS.flatMap(c => [c.id, c.id, c.id])
  for (let tries = 0; tries < 500; tries++) {
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
    }
    if (ids.every((id, i) => id !== ids[(i + 1) % ids.length])) break
  }
  return ids
}

const pct = (n: number) => `${n.toFixed(3)}%`

export const parade = () => {
  const order = shuffledOrder()
  const cycle = order.length * SLOT
  let svg = ''
  let css = ''
  for (const c of CHARACTERS) {
    const width = Math.max(...c.a.map(r => r.length)) * c.s
    const height = c.a.length * c.s
    const y = GROUND - height - c.lift
    const start = -width - 40 - c.restX
    const end = 1640 - c.restX
    const at = (x: number) => `{transform:translateX(${x}px)}`
    // from the end of a run, jump straight back offstage: no slide back across the screen
    const snap = (x: number) => `{transform:translateX(${x}px);animation-timing-function:steps(1,end)}`
    // the run itself moves in steps at RUN_FPS, as an old console would, rather than
    // gliding at the display's full frame rate: far fewer redraws of the scene
    const go = (x: number) => `{transform:translateX(${x}px);animation-timing-function:steps(${Math.round(c.cross * RUN_FPS)})}`
    let frames = `0%${at(start)}`
    // The waddle swaps frames only while running: an offstage loop would make the
    // whole scene redraw for nothing. Times at which frame A or B starts showing:
    const showA: string[] = ['0%']
    const showB: string[] = []
    const half = c.step / 2
    order.forEach((id, i) => {
      if (id !== c.id) return
      const s0 = i * SLOT
      const t0 = s0 / cycle
      const t1 = (s0 + c.cross) / cycle
      frames += `${pct(t0 * 100)}${go(start)}${pct(t1 * 100)}${snap(end)}${pct(t1 * 100 + 0.01)}${at(start)}`
      for (let k = 1; k * half < c.cross; k++) (k % 2 ? showB : showA).push(pct(((s0 + k * half) / cycle) * 100))
      showA.push(pct(t1 * 100))
    })
    frames += `100%${at(start)}`
    showA.push('100%')
    css += c.css
    css += `@keyframes run-${c.id}{${frames}}`
    css += `.run-${c.id}{animation:run-${c.id} ${cycle}s linear 5s infinite backwards}`
    // Both frames sit side by side on one strip behind a window one frame wide; the
    // waddle slides the strip, so it's one animated piece per character, not two.
    const frameW = Math.max(width, ...c.b.map(r => r.length * c.s))
    const lift = c.bob * c.s
    const list = (l: string[]) => l.join(',')
    css += `@keyframes walk-${c.id}{${list(showA)}{transform:translateX(0)}${showB.length ? `${list(showB)}{transform:translateX(-${frameW}px)}` : ''}}`
    css += `.walk-${c.id}{animation:walk-${c.id} ${cycle}s steps(1,end) 5s infinite backwards}`
    svg +=
      `<g transform="translate(${c.restX} ${y})"><g class="run-${c.id}">` +
      `<svg x="0" y="${-lift}" width="${frameW}" height="${height + lift}" viewBox="0 ${-lift} ${frameW} ${height + lift}" overflow="hidden">` +
      `<g class="walk-${c.id}">` +
      sprite(c.a, c.pal, c.s) +
      `<g transform="translate(${frameW} 0)">${sprite(c.b, c.pal, c.s, -lift)}</g>` +
      `</g></svg></g></g>`
  }
  return { svg, css, order }
}
