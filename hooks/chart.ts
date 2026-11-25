// The burn-rate chart: 5-hour usage across its window, with a projection.

import type { Sample } from '../types'
import { dur, frame, textEl } from './font'

const W = 320
const H = 150
const X0 = 44
const X1 = 300
const Y0 = 26 // 100%
const Y1 = 96 // 0%
const FIVE_H = 5 * 3600_000

const color = (p: number) => (p >= 80 ? '#f83800' : p >= 50 ? '#f8b800' : '#58d854')

export type Projection =
  | { kind: 'none' }
  | { kind: 'steady'; rate: number }
  | { kind: 'limit'; rate: number; at: number }
  | { kind: 'safe'; rate: number; atReset: number }

/** Percent per millisecond, from the last 90 minutes or the window's average. */
export const project = (samples: readonly Sample[], start: number | undefined, end: number | undefined): Projection => {
  const last = samples.at(-1)
  if (!last) return { kind: 'none' }
  const recent = samples.filter(s => s.t >= last.t - 90 * 60_000)
  const first = recent[0]!
  let rate: number | undefined
  if (recent.length >= 2 && last.t - first.t >= 5 * 60_000) rate = (last.p - first.p) / (last.t - first.t)
  else if (start !== undefined && last.t - start >= 5 * 60_000) rate = last.p / (last.t - start)
  if (rate === undefined) return { kind: 'none' }
  if (rate <= 0) return { kind: 'steady', rate: 0 }
  const at = last.t + (100 - last.p) / rate
  if (end !== undefined && at > end) return { kind: 'safe', rate, atReset: last.p + rate * (end - last.t) }
  return { kind: 'limit', rate, at }
}

export const chartSvg = (samples: readonly Sample[], resetsAt: string | undefined, now: number) => {
  const reset = resetsAt ? Date.parse(resetsAt) : NaN
  const end = Number.isFinite(reset) ? reset : undefined
  const start = end !== undefined ? end - FIVE_H : samples[0] ? samples[0].t : now - FIVE_H
  const stop = end ?? start + FIVE_H
  const inWindow = samples.filter(s => s.t >= start - 60_000 && s.t <= stop + 60_000)

  const x = (t: number) => Math.round(X0 + ((Math.min(Math.max(t, start), stop) - start) / (stop - start)) * (X1 - X0))
  const y = (p: number) => Math.round(Y1 - (Math.min(Math.max(p, 0), 100) / 100) * (Y1 - Y0))

  let body = frame(W, H, '5HR BURN RATE')

  // grid and axis labels
  for (const p of [25, 50, 75]) body += `<rect x="${X0}" y="${y(p)}" width="${X1 - X0}" height="1" fill="#1c3438"/>`
  body += `<rect x="${X0}" y="${y(100)}" width="${X1 - X0}" height="2" fill="#f83800" opacity=".7"/>`
  body += textEl('LIMIT', X0 + 4, y(100) + 5, '#f83800', 1.5)
  body += textEl('100', 16, y(100) - 3, '#7c7c7c', 1.5) + textEl('50', 22, y(50) - 3, '#7c7c7c', 1.5) + textEl('0', 28, y(0) - 6, '#7c7c7c', 1.5)
  body += `<rect x="${X0}" y="${Y1}" width="${X1 - X0}" height="2" fill="#7c7c7c"/><rect x="${X0 - 2}" y="${Y0}" width="2" height="${Y1 - Y0 + 2}" fill="#7c7c7c"/>`
  body += textEl(end !== undefined ? 'START' : 'FIRST', X0, Y1 + 6, '#7c7c7c', 1.5)
  body += textEl(end !== undefined ? 'RESET' : '+5H', X1 - (end !== undefined ? 28 : 16), Y1 + 6, '#7c7c7c', 1.5)

  // now marker
  if (now >= start && now <= stop) {
    const nx = x(now)
    for (let yy = Y0; yy < Y1; yy += 6) body += `<rect x="${nx}" y="${yy}" width="1" height="3" fill="#3cbcfc" opacity=".7"/>`
    body += textEl('NOW', Math.min(nx - 8, X1 - 46), Y1 + 6, '#3cbcfc', 1.5)
  }

  const last = inWindow.at(-1)
  if (!last) {
    body += textEl('NO DATA YET', 116, 52, '#5c7c80')
    body += textEl('SEND A MESSAGE TO START', 60, H - 26, '#7cb8b8', 1.5)
    return svg(body)
  }

  // the line, stepped like a pixel plot, and the area under it
  let d = `M${x(inWindow[0]!.t)} ${y(inWindow[0]!.p)}`
  for (const s of inWindow.slice(1)) d += `H${x(s.t)}V${y(s.p)}`
  d += `H${x(Math.min(now, stop))}`
  const c = color(last.p)
  body += `<path d="${d}V${Y1}H${x(inWindow[0]!.t)}Z" fill="${c}" opacity=".18"/>`
  body += `<path d="${d}" fill="none" stroke="${c}" stroke-width="3"/>`

  // the projection
  const pr = project(inWindow, end !== undefined ? start : undefined, end)
  const lx = x(Math.min(now, stop))
  const ly = y(last.p)
  let line1 = ''
  let line1Color = '#58d854'
  if (pr.kind === 'limit') {
    body += `<path d="M${lx} ${ly}L${x(pr.at)} ${y(100)}" stroke="#f83800" stroke-width="2" stroke-dasharray="4 4"/>`
    body += `<g class="blink"><rect x="${x(pr.at) - 4}" y="${y(100) - 4}" width="8" height="8" fill="#f83800"/></g>`
    line1 = `LIMIT IN ${dur(pr.at - now)}`
    line1Color = pr.at - now < 30 * 60_000 ? '#f83800' : '#f8b800'
  } else if (pr.kind === 'safe') {
    body += `<path d="M${lx} ${ly}L${x(stop)} ${y(pr.atReset)}" stroke="#58d854" stroke-width="2" stroke-dasharray="4 4"/>`
    line1 = `ON PACE: ${Math.round(pr.atReset)}% AT RESET`
  } else if (pr.kind === 'steady') {
    line1 = 'HOLDING STEADY'
  } else {
    line1 = 'GATHERING DATA...'
    line1Color = '#7cb8b8'
  }
  body += textEl(line1, 16, H - 36, line1Color)
  const perHour = pr.kind === 'none' ? '--' : `${(pr.rate * 3600_000).toFixed(1)}%/H`
  body += textEl(`NOW ${Math.round(last.p)}%   RATE ${perHour}`, 16, H - 18, '#7cb8b8', 1.5)
  return svg(body)
}

const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="crispEdges"><style>.blink{animation:b 2s steps(1) infinite}@keyframes b{50%{opacity:0}}</style>${body}</svg>`

export const CHART_H = H

export const chartAlt = (samples: readonly Sample[], resetsAt: string | undefined, now: number) => {
  const last = samples.at(-1)
  if (!last) return '5-hour burn rate chart: no data yet.'
  const end = resetsAt ? Date.parse(resetsAt) : undefined
  const pr = project(samples, end !== undefined ? end - FIVE_H : undefined, end)
  const tail =
    pr.kind === 'limit' ? `, projected to hit the limit in about ${dur(pr.at - now)}` :
    pr.kind === 'safe' ? `, on pace for about ${Math.round(pr.atReset)}% at reset` : ''
  return `5-hour burn rate chart: ${Math.round(last.p)}% used${tail}.`
}
