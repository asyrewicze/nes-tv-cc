import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionContextUsage, SessionRateLimit, ThemeSetArgs, ThemeSound } from 'claude-code'

import type { LogEntry, Reading, Sample } from '../types'
import { chartAlt, chartSvg, CHART_H } from './chart'
import { makeColors } from './make-colors.js'
import { describe, logAlt, logHeight, logSvg } from './questlog'
import { SCENE } from './scene'
import { tvAlt, tvSvg } from './tv'

const PANE = 'nes-tv'
const reading = atom({ plugin: 'nes-tv', key: 'reading' } as const, {}, { shape: 'reading-1' })
const tick = atom({ plugin: 'nes-tv', key: 'tick' } as const, 0)
const samples = atom({ plugin: 'nes-tv', key: 'samples' } as const, [], { shape: 'samples-1' })
const log = atom({ plugin: 'nes-tv', key: 'log' } as const, [], { shape: 'log-1' })

// The 5-hour samples outlive the session ($.store), since the window spans sessions.
const STORE_KEY = 'samples-5h-v1'
// Whether the person turned the theme off with /nes-theme off, kept across sessions:
// 'off' or 'full' (an earlier 'lite' counts as on), with the first key as a fallback.
const THEME_OFF_KEY = 'theme-off-v1'
const THEME_MODE_KEY = 'theme-mode-v1'
const LOG_LINES = 17
const GAP = 6
const MAX_LOG = 80

const addSample = (list: readonly Sample[], r: Reading, now: number): Sample[] => {
  if (!r.five) return [...list]
  const kept = list.filter(s => s.t > now - 5.5 * 3600_000 && (!r.five!.resetsAt || !s.reset || s.reset === r.five!.resetsAt))
  const last = kept.at(-1)
  if (last && last.p === r.five.percent && now - last.t < 10 * 60_000) return kept
  return [...kept, { t: now, p: r.five.percent, reset: r.five.resetsAt }].slice(-400)
}

let seq = 0
const entry = (text: string, kind: LogEntry['kind'], at: number, status?: LogEntry['status']): LogEntry => ({
  id: `${at}-${seq++}`,
  at,
  text,
  kind,
  ...(status ? { status } : {}),
})

const toReading = (rateLimits: readonly SessionRateLimit[], context: SessionContextUsage): Reading => {
  const pick = (kind: string) => {
    const w = rateLimits.find(one => one.kind === kind)
    return w ? { percent: w.percentUsed, resetsAt: w.resetsAt } : undefined
  }
  return {
    five: pick('five_hour'),
    seven: pick('seven_day'),
    ctx: { percent: context.percent, tokens: context.tokens, window: context.window },
  }
}

// ---- the look ----------------------------------------------------------

const { theme, problems } = makeColors({
  label: '8-Bit Console',
  roles: { accent: '#0058f8', danger: '#e40058', success: '#00a844', warning: '#f8b800', pro: '#6844fc' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#dcdcdc',
        'surface-1': '#e6e6e6',
        'surface-2': '#f2f2f2',
        'surface-3': '#f2f2f2',
        'text-primary': '#101010',
        'text-secondary': '#2c2c2c',
        'text-muted': '#484848',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0c0c1c',
        'surface-1': '#14142a',
        'surface-2': '#1a1a34',
        'surface-3': '#20203a',
        'text-primary': '#fcfcfc',
        'text-secondary': '#c8c8e0',
        'text-muted': '#a4a4c4',
      },
    },
  },
})

const hardShadow = { x: 4, y: 4, blur: 0, color: '#000000' }

const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: 'nes-night', glass: { blur: 0, tint: '#000000', opacity: 0.25 } },
  style: {
    Text: { fontFamily: ['mono'], fontSize: 14, lineHeight: 22 },
    Heading: { fontFamily: ['mono'], fontWeight: 'bold', color: '#f8b800', letterSpacing: 1 },
    UserMessage: {
      color: '#fcfcfc',
      backgroundColor: '#00505a',
      borderColor: '#fcfcfc',
      borderWidth: 3,
      radius: 0,
      padding: 14,
      shadow: hardShadow,
    },
    AssistantMessage: {
      color: '#fcfcfc',
      backgroundColor: '#000000',
      borderColor: '#fcfcfc',
      borderWidth: 4,
      radius: 0,
      padding: 18,
      shadow: hardShadow,
    },
    ToolUse: { color: '#fcfcfc', fontFamily: ['mono'], backgroundColor: '#0040b8', borderColor: '#000000', borderWidth: 2, radius: 0, paddingX: 8 },
  },
}

const sq = (notes: string[], step: number, release: number, gain = 0.22) =>
  ({ layers: [{ wave: 'square', notes, step, release, gain, filter: { type: 'lowpass', hz: 3200 } }] }) as const

// Short 8-bit cues for each moment; no background ambience.
const SOUND: ThemeSound = {
  cues: {
    send: sq(['C5', 'E5', 'G5'], 0.05, 0.08),
    tool: { layers: [{ wave: 'triangle', notes: ['A5'], release: 0.05, gain: 0.12 }] },
    ask: sq(['G5', 'C6'], 0.1, 0.15, 0.18),
    error: sq(['E4', 'C4', 'A3'], 0.12, 0.2),
    compact: { layers: [{ wave: 'triangle', notes: ['C6'], glide: -24, release: 0.6, gain: 0.22 }] },
    click: { layers: [{ wave: 'square', notes: ['C5', 'D5', 'E5', 'G5', 'A5', 'C6'], release: 0.1, gain: 0.16 }] },
    done: {
      layers: [
        sq(['G5', 'C6', 'E6', 'G6'], 0.07, 0.3).layers[0],
        { wave: 'triangle', notes: ['C4', 'G4'], step: 0.14, release: 0.3, gain: 0.18 },
      ],
    },
  },
}

// ---- the mod -----------------------------------------------------------

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) $.ui.log(`nes-tv: ${unpainted}`)

    // The look, unless the person turned it off with /nes-theme off.
    if (!(await isThemeOff($))) await applyLook($)

    // Bring back the 5-hour samples earlier sessions saw.
    const stored = await $.store.get(STORE_KEY)
    if (Array.isArray(stored)) {
      const valid = stored.filter(
        (s): s is Sample => typeof s === 'object' && s !== null && typeof s.t === 'number' && typeof s.p === 'number',
      )
      await update($, samples, list => (list.length > 0 ? list : valid))
    }

    const usage = await $.session.usage()
    await record($, toReading(usage.rateLimits, usage.context))

    if ((await read($, log)).length === 0) {
      const startAt = await $.clock.now()
      await update($, log, list => [...list, entry('* NEW GAME *  PRESS START', 'info', startAt)])
    }

    await $.command.register({ name: 'tv', description: 'Turn on the 8-bit usage TV' })
    await $.command.register({ name: 'nes-theme', description: 'Turn the 8-bit theme on or off: /nes-theme on | off' })
    void $.ui.open({ id: PANE, title: 'Usage TV' })

    // Recount the "resets in" lines once a minute.
    $.clock.every(60_000, async () => {
      await update($, tick, n => n + 1)
    })

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await record($, toReading(e.rateLimits, e.context))
    return next(e)
  })

  // ---- the quest log ----

  on('prompt.submit', async ($, e, next) => {
    const now = await $.clock.now()
    const said = e.command ? `/${e.command.name ?? ''}`.trim() : e.text
    await push($, entry(`P1: ${said.replace(/\s+/g, ' ').trim()}`, 'player', now))
    return next(e)
  }).catch(($, e, next) => next(e)) // the log never blocks a prompt

  on('tool.call', async ($, e, next) => {
    let id: string | undefined
    try {
      const now = await $.clock.now()
      const item = entry(`> ${describe(e.tool, e as unknown as Record<string, unknown>)}`, 'tool', now, 'run')
      id = item.id
      await push($, item)
    } catch {
      id = undefined
    }
    const ran = await next(e)
    if (id !== undefined) {
      const status: LogEntry['status'] = ran.deny !== undefined || ran.isError === true ? 'fail' : 'ok'
      try {
        await update($, log, list => list.map(one => (one.id === id ? { ...one, status } : one)))
      } catch {
        // ignore
      }
    }
    return ran
  }).catch(($, e, next) => next(e)) // the log never blocks a tool

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e) // a subagent's turn, not the main quest
    const now = await $.clock.now()
    const list = await read($, log)
    const lastPlayer = list.map(one => one.kind).lastIndexOf('player')
    const moves = list.slice(lastPlayer + 1).filter(one => one.kind === 'tool').length
    const tally = moves > 0 ? ` ${moves} MOVE${moves === 1 ? '' : 'S'}` : ''
    const line =
      e.isAborted || e.reason === 'aborted' ? '* PAUSED *' :
      e.reason === 'error' ? '* GAME OVER: AN ERROR *' :
      `* QUEST COMPLETE!${tally} *`
    await push($, entry(line, e.reason === 'error' ? 'info' : 'done', now))
    return next(e)
  })

  on('command.run', { command: 'nes-theme' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    const wasOff = await isThemeOff($)
    if (arg === '') return { text: `NES theme is ${wasOff ? 'off' : 'on'}. Use /nes-theme on or /nes-theme off.` }
    if (arg !== 'on' && arg !== 'off') return { text: 'Use /nes-theme on or /nes-theme off.' }
    await $.store.set(THEME_MODE_KEY, arg === 'off' ? 'off' : 'full')
    if (arg === 'off') {
      try {
        await $.theme.clear()
      } catch (error) {
        $.ui.log(`nes-tv: ${String(error)}`)
      }
      return { text: 'NES theme off: the app is back to its default look. The usage pane stays; close it from its tab. /nes-theme on brings the theme back.' }
    }
    if (wasOff) await applyLook($)
    return { text: 'NES theme on.' }
  })

  on('command.run', { command: 'tv' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Usage TV' })
    return { text: 'Usage TV switched on.' }
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    const { Svg } = $.ui.resolve(e)
    return <Svg source={SCENE} alt="A pixel night sky over a castle, a city and hills" isInteractive />
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const r = await read($, reading)
    await read($, tick)
    const now = await $.clock.now()

    if (e.surface === 'desktop' || e.surface === 'mobile' || e.surface === 'vscode') {
      const { Box, Svg } = $.ui.resolve(e)
      // Three drawings drawn as images (no isInteractive): an image swaps in place,
      // where a framed drawing reloads and blanks for a moment. The TV and chart
      // read the time to the minute, so a log update leaves their sources unchanged
      // and the app doesn't redraw them at all.
      const minute = Math.floor(now / 60_000) * 60_000
      const tv = <Svg source={tvSvg(r, minute)} alt={tvAlt(r)} width={e.props.placement === 'widget' ? 200 : 320} height={e.props.placement === 'widget' ? 195 : 312} />
      if (e.props.placement === 'widget') {
        return <Box flexDirection="column" alignItems="center">{tv}</Box>
      }
      const s = await read($, samples)
      const entries = await read($, log)
      const chart = topGap(chartSvg(s, r.five?.resetsAt, minute), CHART_H, GAP)
      const quest = topGap(logSvg(entries, LOG_LINES, now), logHeight(LOG_LINES), GAP)
      return (
        <Box flexDirection="column" alignItems="center">
          {tv}
          <Svg source={chart.source} alt={chartAlt(s, r.five?.resetsAt, minute)} width={320} height={chart.height} />
          <Svg source={quest.source} alt={logAlt(entries)} width={320} height={quest.height} />
        </Box>
      )
    }

    // Terminal: a text TV.
    const { Box, Text } = $.ui.resolve(e)
    const bar = (p?: number) => {
      if (p === undefined) return '[----------]  --'
      const n = Math.round(Math.min(100, p) / 10)
      return `[${'█'.repeat(n)}${'·'.repeat(10 - n)}] ${String(Math.round(p)).padStart(3)}%`
    }
    const color = (p?: number) => (p === undefined ? 'gray' : p >= 80 ? 'red' : p >= 50 ? 'yellow' : 'green')
    return (
      <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1}>
        <Text color="yellow" bold>
          ▶ PLAYER 1 STATUS
        </Text>
        <Text color={color(r.five?.percent)}>5HR  {bar(r.five?.percent)}</Text>
        <Text color={color(r.seven?.percent)}>7DAY {bar(r.seven?.percent)}</Text>
        <Text color={color(r.ctx?.percent)}>CTX  {bar(r.ctx?.percent)}</Text>
        {(await read($, log)).slice(-6).map(one => (
          <Text dimColor={one.kind === 'tool'} color={one.status === 'fail' ? 'red' : one.kind === 'done' ? 'yellow' : undefined}>
            {one.text.slice(0, 60)}
            {one.status === 'ok' ? ' ✓' : one.status === 'fail' ? ' ✗' : one.status === 'run' ? ' …' : ''}
          </Text>
        ))}
      </Box>
    )
  })
}

/** Add a line to the quest log; it's decoration, so it never gets in the way. */
async function push($: EngineInterface, item: LogEntry) {
  try {
    await update($, log, list => [...list, item].slice(-MAX_LOG))
  } catch {
    // ignore
  }
}

/** Store a reading, add a 5-hour sample, and save the samples for later sessions. */
async function record($: EngineInterface, r: Reading) {
  await update($, reading, () => r)
  if (!r.five) return
  const now = await $.clock.now()
  const next = await update($, samples, list => addSample(list, r, now))
  try {
    await $.store.set(STORE_KEY, next)
  } catch {
    // keeping history is a nicety
  }
}

/** Stacks whole SVG documents into one, top to bottom, `gap` apart. */
function stack(parts: { svg: string; h: number }[], gap: number) {
  let y = 0
  let inner = ''
  for (const part of parts) {
    inner += part.svg.replace('<svg ', `<svg x="0" y="${y}" `)
    y += part.h + gap
  }
  const height = y - gap
  return {
    height,
    source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 ${height}" width="320" height="${height}">${inner}</svg>`,
  }
}

/** One SVG document with `gap` units of empty space above it, for spacing in a column. */
function topGap(svg: string, h: number, gap: number) {
  return stack([{ svg: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="1"></svg>', h: gap - 1 }, { svg, h }], 1)
}

/** Sets the NES look. Newer builds take style and sound; fall back step by step on older ones. */
async function applyLook($: EngineInterface) {
  for (const look of [{ ...LOOK, sound: SOUND }, LOOK, { colors: LOOK.colors, backdrop: LOOK.backdrop }]) {
    try {
      await $.theme.set(look)
      return
    } catch (error) {
      $.ui.log(`nes-tv: ${String(error)}`)
    }
  }
}

/** Whether the person turned the theme off with /nes-theme off. */
async function isThemeOff($: EngineInterface) {
  const saved = await $.store.get(THEME_MODE_KEY)
  if (saved !== undefined) return saved === 'off'
  return (await $.store.get(THEME_OFF_KEY)) === true
}
