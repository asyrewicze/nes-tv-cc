// The TV and console, drawn as one SVG with a tiny 3x5 pixel font.

import type { Reading } from '../types'
import { textEl } from './font'

const barColor = (p: number) => (p >= 80 ? '#f83800' : p >= 50 ? '#f8b800' : '#58d854')

const left = (resetsAt: string | undefined, now: number) => {
  if (!resetsAt) return ''
  const ms = Date.parse(resetsAt) - now
  if (!Number.isFinite(ms) || ms <= 0) return 'RESET SOON'
  const m = Math.floor(ms / 60000)
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  return d > 0 ? `RESET ${d}D ${h}H` : `RESET ${h}H ${m % 60}M`
}

const k = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1000)}K`)

/** One meter row inside the screen: label, ten blocks, percent, a sub line. */
const row = (y: number, label: string, pct: number | undefined, sub: string) => {
  let out = textEl(label, 46, y, '#fcfcfc')
  const blocks = 10
  const filled = pct === undefined ? 0 : Math.round(Math.min(100, pct) / 10)
  for (let i = 0; i < blocks; i++) {
    const bx = 96 + i * 9
    out += `<rect x="${bx}" y="${y - 1}" width="7" height="12" fill="${i < filled ? barColor(pct ?? 0) : '#1c3438'}"/>`
    if (i < filled) out += `<rect x="${bx}" y="${y - 1}" width="7" height="2" fill="#fcfcfc" opacity=".35"/>`
  }
  const num = pct === undefined ? '--' : `${Math.round(pct)}%`
  out += textEl(num, 190, y, pct === undefined ? '#5c7c80' : barColor(pct))
  out += textEl(sub, 46, y + 16, '#7cb8b8', 1.5)
  return out
}

export const tvSvg = (r: Reading, now: number) => {
  const ctxSub =
    r.ctx?.tokens !== undefined ? `${k(r.ctx.tokens)} / ${k(r.ctx.window)} TOKENS` : r.ctx ? `${k(r.ctx.window)} WINDOW` : 'NO SIGNAL'
  const screen =
    textEl('PLAYER 1 STATUS', 46, 56, '#f8b800') +
    `<rect class="cursor" x="170" y="56" width="6" height="10" fill="#f8b800"/>` +
    row(78, '5HR', r.five?.percent, r.five ? left(r.five.resetsAt, now) : 'NO DATA YET') +
    row(118, '7DAY', r.seven?.percent, r.seven ? left(r.seven.resetsAt, now) : 'NO DATA YET') +
    row(158, 'CTX', r.ctx?.percent, ctxSub)

  // Antenna, pixel-stepped.
  const ant =
    [0, 1, 2, 3, 4, 5].map(i => `<rect x="${150 - i * 8}" y="${20 - i * 3}" width="6" height="6" fill="#383838"/>`).join('') +
    [0, 1, 2, 3, 4, 5].map(i => `<rect x="${166 + i * 8}" y="${20 - i * 3}" width="6" height="6" fill="#383838"/>`).join('') +
    `<rect class="tip" x="106" y="0" width="6" height="6" fill="#f83800"/><rect class="tip2" x="210" y="0" width="6" height="6" fill="#f83800"/>`

  const grille = [0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="258" y="${118 + i * 9}" width="34" height="4" fill="#2c1808"/>`).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 312" width="320" height="312" shape-rendering="crispEdges">
<style>
.cursor{animation:blink 1.2s steps(1) infinite}
.roll{animation:roll 7s linear infinite}
.tip{animation:blink 2.4s steps(1) infinite}.tip2{animation:blink 2.4s steps(1) infinite;animation-delay:-1.2s}
.led{animation:glow 3s ease-in-out infinite}
.flick{animation:flick 9s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
@keyframes roll{from{transform:translateY(-30px)}to{transform:translateY(170px)}}
@keyframes glow{50%{opacity:.55}}
@keyframes flick{0%{opacity:.06}50%{opacity:.03}}
</style>
${ant}
<rect x="134" y="22" width="52" height="10" fill="#383838"/>
<!-- cabinet -->
<rect x="12" y="30" width="296" height="184" fill="#1c0c00"/>
<rect x="16" y="34" width="288" height="176" fill="#8c4c1c"/>
<rect x="16" y="34" width="288" height="6" fill="#b8682c"/>
<rect x="16" y="204" width="288" height="6" fill="#5c2c08"/>
<!-- bezel and screen -->
<rect x="26" y="40" width="222" height="164" fill="#3c3c3c"/>
<rect x="32" y="44" width="210" height="156" fill="#0c1c20"/>
<rect x="32" y="44" width="4" height="4" fill="#3c3c3c"/><rect x="238" y="44" width="4" height="4" fill="#3c3c3c"/>
<rect x="32" y="196" width="4" height="4" fill="#3c3c3c"/><rect x="238" y="196" width="4" height="4" fill="#3c3c3c"/>
<svg x="32" y="44" width="210" height="156" viewBox="32 44 210 156" overflow="hidden">
${screen}
<g class="roll"><rect x="32" y="44" width="210" height="18" fill="#fcfcfc" opacity=".05"/></g>
${Array.from({ length: 39 }, (_, i) => `<rect x="32" y="${45 + i * 4}" width="210" height="1" fill="#000" opacity=".28"/>`).join('')}
<rect class="flick" x="32" y="44" width="210" height="156" fill="#a8f0f8" opacity=".05"/>
</svg>
<!-- side panel -->
<rect x="256" y="50" width="38" height="14" fill="#2c1808"/>
${textEl('CH 3', 260, 54, '#f8b800', 1.5)}
<rect x="262" y="72" width="26" height="14" fill="#1c1c1c"/><rect x="273" y="72" width="4" height="7" fill="#bcbcbc"/>
<rect x="262" y="94" width="26" height="14" fill="#1c1c1c"/><rect x="265" y="99" width="7" height="4" fill="#bcbcbc"/>
${grille}
<!-- legs -->
<rect x="40" y="214" width="16" height="12" fill="#1c0c00"/><rect x="264" y="214" width="16" height="12" fill="#1c0c00"/>
<!-- cable from console to the tv -->
<path d="M300 150h12v122h-16" fill="none" stroke="#1c1c1c" stroke-width="4"/>
<!-- console -->
<rect x="66" y="232" width="232" height="66" fill="#202020"/>
<rect x="70" y="236" width="224" height="58" fill="#bcbcbc"/>
<rect x="70" y="236" width="224" height="4" fill="#e4e4e4"/>
<rect x="70" y="262" width="224" height="32" fill="#9c9c9c"/>
<rect x="70" y="262" width="224" height="3" fill="#202020"/>
<!-- cartridge slot with a cart in it -->
<rect x="130" y="242" width="104" height="16" fill="#383838"/>
<rect x="144" y="226" width="76" height="22" fill="#545454"/>
<rect x="152" y="230" width="60" height="12" fill="#a80020"/>
${textEl('USAGE', 162, 233, '#fcfcfc', 1.5)}
<!-- power and reset -->
<rect x="84" y="272" width="22" height="10" fill="#202020"/><rect x="86" y="274" width="18" height="6" fill="#d8d8d8"/>
<rect x="114" y="272" width="22" height="10" fill="#202020"/><rect x="116" y="274" width="18" height="6" fill="#d8d8d8"/>
<rect class="led" x="78" y="275" width="4" height="4" fill="#f83800"/>
${textEl('POWER', 84, 285, '#202020', 1)}${textEl('RESET', 114, 285, '#202020', 1)}
<!-- controller ports -->
<rect x="236" y="272" width="16" height="12" fill="#202020"/><rect x="258" y="272" width="16" height="12" fill="#202020"/>
<!-- controller -->
<path d="M244 284v12h-200" fill="none" stroke="#202020" stroke-width="3"/>
<rect x="4" y="282" width="60" height="28" fill="#202020"/>
<rect x="6" y="284" width="56" height="24" fill="#bcbcbc"/>
<rect x="10" y="290" width="16" height="16" fill="#202020"/>
<rect x="14" y="292" width="8" height="12" fill="#545454"/><rect x="12" y="294" width="12" height="8" fill="#545454"/>
<rect x="30" y="296" width="6" height="3" fill="#545454"/><rect x="38" y="296" width="6" height="3" fill="#545454"/>
<rect x="46" y="293" width="6" height="6" fill="#a80020"/><rect x="54" y="293" width="6" height="6" fill="#a80020"/>
</svg>`
}

export const tvAlt = (r: Reading) => {
  const p = (n?: number) => (n === undefined ? 'no reading' : `${Math.round(n)}%`)
  return `A pixel TV and console. 5-hour usage ${p(r.five?.percent)}, 7-day usage ${p(r.seven?.percent)}, context ${p(r.ctx?.percent)}.`
}
