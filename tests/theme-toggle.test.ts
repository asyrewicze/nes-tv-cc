import { expect, test } from 'claude-code/testing'
import { liteScene, SCENE } from '../hooks/scene'

test('/nes-theme full, lite and off are remembered across sessions', async ($, on) => {
  const store: Record<string, unknown> = {}
  on('store.get', (_: unknown, e: any) => ({ value: store[e.key] }))
  on('store.set', (_: unknown, e: any) => { store[e.key] = e.value; return { value: undefined } })
  on('ui.log', () => ({ value: undefined }))

  const lite = await $.command.run({ command: 'nes-theme', args: 'lite' } as any)
  expect(lite.text).toContain('NES theme lite')
  expect(store['theme-mode-v1']).toBe('lite')

  const off = await $.command.run({ command: 'nes-theme', args: 'off' } as any)
  expect(off.text).toContain('NES theme off')
  expect(store['theme-mode-v1']).toBe('off')

  const status = await $.command.run({ command: 'nes-theme', args: '' } as any)
  expect(status.text).toContain('NES theme is off')

  const bad = await $.command.run({ command: 'nes-theme', args: 'turbo' } as any)
  expect(bad.text).toContain('Use /nes-theme full, lite or off')
})

test('an earlier /nes-theme off carries over as off', async ($, on) => {
  const store: Record<string, unknown> = { 'theme-off-v1': true }
  on('store.get', (_: unknown, e: any) => ({ value: store[e.key] }))
  const status = await $.command.run({ command: 'nes-theme', args: '' } as any)
  expect(status.text).toContain('NES theme is off')
})

test('lite mode has no looping animation; full mode does', async () => {
  expect(SCENE).toContain('infinite')
  const still = liteScene()
  expect(still).not.toContain('animation:')
  const running = liteScene({ id: 'knight', nonce: 1 })
  expect(running).toContain('once-run')
  expect(running).not.toContain('infinite')
  // a new run has a new source, so a redraw restarts it
  expect(liteScene({ id: 'knight', nonce: 2 })).not.toBe(running)
})
