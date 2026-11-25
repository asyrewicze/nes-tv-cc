import { expect, test } from 'claude-code/testing'

test('/nes-theme on and off are remembered across sessions', async ($, on) => {
  const store: Record<string, unknown> = {}
  on('store.get', (_: unknown, e: any) => ({ value: store[e.key] }))
  on('store.set', (_: unknown, e: any) => { store[e.key] = e.value; return { value: undefined } })
  on('ui.log', () => ({ value: undefined }))

  const off = await $.command.run({ command: 'nes-theme', args: 'off' } as any)
  expect(off.text).toContain('NES theme off')
  expect(store['theme-mode-v1']).toBe('off')

  const status = await $.command.run({ command: 'nes-theme', args: '' } as any)
  expect(status.text).toContain('NES theme is off')

  const bad = await $.command.run({ command: 'nes-theme', args: 'turbo' } as any)
  expect(bad.text).toBe('Use /nes-theme on or /nes-theme off.')
})

test('a saved choice other than off counts as on', async ($, on) => {
  const store: Record<string, unknown> = { 'theme-mode-v1': 'full' }
  on('store.get', (_: unknown, e: any) => ({ value: store[e.key] }))
  expect((await $.command.run({ command: 'nes-theme', args: '' } as any)).text).toContain('NES theme is on')
})
