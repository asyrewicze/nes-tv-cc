import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'nes-tv',
  component: 'Pane',
  requestId: 'nes-tv',
  props: {
    title: 'Usage TV',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

const engine = (on: any, stored?: unknown) => {
  on('command.register', () => ({ value: { command: 'tv' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('clock.every', () => ({ value: {} }))
  on('clock.now', () => ({ value: Date.parse('2029-12-31T20:00:00Z') }))
  on('ui.log', () => ({ value: undefined }))
  on('session.measure', (_: unknown, e: any) => ({ changed: e.changed }))
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      context: { tokens: 83000, window: 200000, percent: 42 },
      rateLimits: [
        { kind: 'five_hour', percentUsed: 37, resetsAt: '2030-01-01T00:00:00Z' },
        { kind: 'seven_day', percentUsed: 91 },
      ],
    },
  }))
  on('session.start', (_: unknown, e: any) => ({ cwd: e.cwd }))
  on('store.get', () => ({ value: stored }))
  on('store.set', () => ({ value: undefined }))
  on('prompt.submit', (_: unknown, e: any) => ({ text: e.text }))
  on('tool.call', () => ({ result: {} }))
  on('turn.complete', (_: unknown, e: any) => ({ text: e.text }))
}

test('the quest log narrates a turn and the chart projects the 5-hour window', async ($, on) => {
  // an earlier session saw 10% an hour and a half before "now"
  engine(on, [{ t: Date.parse('2029-12-31T18:30:00Z'), p: 10, reset: '2030-01-01T00:00:00Z' }])
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.prompt.submit({ text: 'fix the bug please' })
  await $.tool.call({ tool: 'Read', file_path: '/a/b/register.tsx' })
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  await $.turn.complete({ answer: 'done', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer', category: null, explanation: null, text: 'done' } as any)

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const svgs = await ui.findAll({ type: 'Svg' })
  const alts = svgs.map((one: any) => String(one.props?.alt))
  // 10% -> 37% over 90 minutes is 18%/h: 63% left takes 3.5h, past the 4h-away reset? no: 3.5h < 4h
  expect(alts.some((a: string) => a.includes('37% used') && a.includes('hit the limit in about 3H 30M'))).toBe(true)
  expect(alts.some((a: string) => a.includes('QUEST COMPLETE! 2 MOVES'))).toBe(true)
  expect(alts.some((a: string) => a.includes('> CASTS NPM TEST') || a.includes('> CASTS npm test'))).toBe(true)
  await ui.unmount()
})

test('the TV shows the three meters on the desktop', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const svg = await ui.find({ type: 'Svg' })
  expect(String(svg?.props?.alt)).toContain('5-hour usage 37%')
  expect(String(svg?.props?.alt)).toContain('7-day usage 91%')
  expect(String(svg?.props?.alt)).toContain('context 42%')
  await ui.unmount()
})

test('the terminal gets a text TV, and a measure updates it', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.session.measure({
    context: { tokens: 150000, window: 200000, percent: 75 },
    rateLimits: [{ kind: 'five_hour', percentUsed: 60 }],
    changed: ['context'],
  })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /CTX/ }))?.text).toContain('75%')
  expect((await ui.find({ type: 'Text', text: /5HR/ }))?.text).toContain('60%')
  await ui.unmount()
})
