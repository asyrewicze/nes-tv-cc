import { expect, test } from 'claude-code/testing'

test('/nes-theme off and on are remembered across sessions', async ($, on) => {
  const store: Record<string, unknown> = {}
  on('store.get', (_: unknown, e: any) => ({ value: store[e.key] }))
  on('store.set', (_: unknown, e: any) => { store[e.key] = e.value; return { value: undefined } })
  on('ui.log', () => ({ value: undefined }))

  const off = await $.command.run({ command: 'nes-theme', args: 'off' } as any)
  expect(off.text).toContain('NES theme off')
  expect(store['theme-off-v1']).toBe(true)

  const back = await $.command.run({ command: 'nes-theme', args: 'on' } as any)
  expect(back.text).toBe('NES theme on.')
  expect(store['theme-off-v1']).toBe(false)
})
