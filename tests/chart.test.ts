import { expect, test } from 'claude-code/testing'
import { chartAlt, chartSvg, currentWindow } from '../hooks/chart'

const H = 3600_000
const now = Date.parse('2030-01-01T12:00:00Z')
const iso = (t: number) => new Date(t).toISOString()

test('readings from a 5-hour window that already reset are ignored', async () => {
  const ended = iso(now - 30 * 60_000)
  const stale = [{ t: now - 3 * H, p: 10, reset: ended }, { t: now - 2 * H, p: 32, reset: ended }]
  expect(currentWindow(stale, undefined, now).samples).toEqual([])
  expect(chartAlt(stale, undefined, now)).toBe('5-hour burn rate chart: no data yet.')
  expect(chartSvg(stale, undefined, now)).not.toContain('LIMIT IN')
})

test('before the first reply, the saved readings give the window and its reset', async () => {
  const resets = iso(now + 4 * H)
  const saved = [{ t: now - 50 * 60_000, p: 10, reset: resets }, { t: now - 20 * 60_000, p: 20, reset: resets }]
  const win = currentWindow(saved, undefined, now)
  expect(win.samples.length).toBe(2)
  expect(win.resetsAt).toBe(resets)
  // 10 points in 30 minutes is 20%/h: 80 left takes 4h, just past the reset
  expect(chartAlt(saved, undefined, now)).toContain('20% used')
})
