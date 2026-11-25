// The quest log: an RPG text box narrating what Claude does.

import type { LogEntry } from '../types'
import { clean, frame, textEl } from './font'

const W = 320
const LINE = 14
const COLS = 36 // characters across at the 2-unit font

const base = (p: unknown) => String(p ?? '').split('/').filter(Boolean).pop() ?? ''
const short = (s: unknown, n: number) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n - 1)}.` : t
}

/**
 * The part of a shell command worth showing: leading `NAME=value` settings and
 * `cd somewhere &&` steps dropped, and every path shortened to its last part,
 * so `D=/Users/me/x; cd $D && git commit -m hi` reads as `git commit -m hi`.
 */
export const commandGist = (command: unknown) => {
  let c = String(command ?? '').replace(/\s+/g, ' ').trim()
  const lead = /^(?:[A-Za-z_][A-Za-z0-9_]*=(?:"[^"]*"|'[^']*'|\S*)\s*(?:;|&&)?\s*|cd\s+(?:"[^"]*"|'[^']*'|\S+)\s*(?:;|&&)\s*|export\s+[A-Za-z_][A-Za-z0-9_]*=(?:"[^"]*"|'[^']*'|\S*)\s*(?:;|&&)?\s*)/
  for (let i = 0; i < 10 && lead.test(c); i++) c = c.replace(lead, '')
  c = c.replace(/(?:~|\$[A-Za-z_]+|"?\/)[^\s"']*\/([^\s/"']+)"?/g, '$1')
  return c || 'A SPELL'
}

/** What a tool call reads as in the log. */
export const describe = (tool: string, input: Record<string, unknown>) => {
  switch (tool) {
    case 'Read': return `READS ${base(input.file_path)}`
    case 'Edit':
    case 'MultiEdit': return `EDITS ${base(input.file_path)}`
    case 'Write': return `FORGES ${base(input.file_path)}`
    case 'NotebookEdit': return `INSCRIBES ${base(input.notebook_path)}`
    case 'Bash': return `CASTS ${short(commandGist(input.command), 40)}`
    case 'Grep': return `SEARCHES FOR "${short(input.pattern, 20)}"`
    case 'Glob': return `SEEKS ${short(input.pattern, 24)}`
    case 'WebFetch': {
      const m = /^https?:\/\/([^/]+)/.exec(String(input.url ?? ''))
      return `SCOUTS ${m?.[1] ?? 'THE WEB'}`
    }
    case 'WebSearch': return `ASKS THE ORACLE: ${short(input.query, 20)}`
    case 'Agent':
    case 'Task': return 'SUMMONS AN ALLY'
    case 'Skill': return `LEARNS ${short(input.skill, 24)}`
    case 'ToolSearch': return 'OPENS THE SPELLBOOK'
    case 'TodoWrite':
    case 'mcp__ccd_turn__update_plan': return 'UPDATES THE QUEST MAP'
    case 'AskUserQuestion': return 'ASKS PLAYER 1 A RIDDLE'
    default: {
      const name = tool.startsWith('mcp__') ? tool.split('__').pop() ?? tool : tool
      return `USES ${name.replace(/_/g, ' ')}`
    }
  }
}

const KIND_COLOR: Record<LogEntry['kind'], string> = {
  player: '#3cbcfc',
  tool: '#fcfcfc',
  done: '#f8b800',
  info: '#b8b8f8',
}

export const logHeight = (lines: number) => 26 + lines * LINE + 8

export const logSvg = (entries: readonly LogEntry[], lines: number, now: number) => {
  const H = logHeight(lines)
  const shown = entries.slice(-lines)
  let body = frame(W, H, 'QUEST LOG')
  let inner = ''
  const top = 22 + (lines - shown.length) * LINE // newest at the bottom
  shown.forEach((entry, i) => {
    const y = top + i * LINE
    const isNewest = i === shown.length - 1
    const room = entry.kind === 'tool' ? COLS - 3 : COLS
    const raw = clean(entry.text)
    const text = raw.length > room ? `${raw.slice(0, room - 1)}.` : raw
    const fill = entry.status === 'fail' ? '#f87858' : KIND_COLOR[entry.kind]
    inner += textEl(text, 16, y, fill)
    if (entry.status === 'ok') inner += textEl('✓', W - 30, y, '#58d854')
    else if (entry.status === 'fail') inner += textEl('X', W - 30, y, '#f83800')
    else if (entry.status === 'run') inner += textEl('...', W - 38, y, '#f8b800', 2, 'blink')
    // the newest line types itself in: a black cover slides off it
    if (isNewest && now - entry.at < 2500) {
      const width = text.length * 8
      inner += `<rect class="type" x="14" y="${y - 2}" width="${width + 4}" height="${LINE}" fill="#000" style="--w:${width + 4}px;animation-timing-function:steps(${Math.max(1, text.length)})"/>`
    }
  })
  body += `<svg x="10" y="10" width="${W - 20}" height="${H - 20}" viewBox="10 10 ${W - 20} ${H - 20}" overflow="hidden">${inner}</svg>`
  if (shown.length === 0) body += textEl('YOUR QUEST BEGINS...', 80, H / 2 - 4, '#7cb8b8')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="crispEdges"><style>.blink{animation:b 1s steps(1) infinite}@keyframes b{50%{opacity:0}}.type{animation:t .7s both}@keyframes t{from{transform:translateX(0)}to{transform:translateX(var(--w))}}</style>${body}</svg>`
}

export const logAlt = (entries: readonly LogEntry[]) =>
  `Quest log. Latest: ${entries.slice(-3).map(e => e.text).join('; ') || 'nothing yet'}.`
