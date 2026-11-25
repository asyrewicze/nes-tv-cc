import { expect, test } from 'claude-code/testing'
import { drawsThemes, layoutFor, opensUnasked } from '../hooks/layout'

const CHART = 150

test('a maximized window fits the TV, the chart and 17 log lines', async () => {
  expect(layoutFor(38, CHART)).toEqual({ tvW: 320, tvH: 312, showChart: true, logLines: 17 })
})

test('the quest log grows with the room and shrinks a line at a time', async () => {
  expect(layoutFor(50, CHART).logLines).toBe(34)
  expect(layoutFor(30, CHART).logLines).toBe(6)
})

test('the log drops off when it would be tiny, then the chart, then the TV shrinks', async () => {
  // 28 rows leaves room for only 3 log lines, so none show
  expect(layoutFor(28, CHART)).toEqual({ tvW: 320, tvH: 312, showChart: true, logLines: 0 })
  expect(layoutFor(20, CHART)).toEqual({ tvW: 320, tvH: 312, showChart: false, logLines: 0 })
  const short = layoutFor(12, CHART)
  expect(short.tvH).toBe(232)
  expect(short.tvW).toBe(238)
  expect(short.showChart).toBe(false)
})

test('whatever fits never exceeds the room', async () => {
  for (let rows = 0; rows <= 80; rows++) {
    const fit = layoutFor(rows, CHART)
    const used = fit.tvH + (fit.showChart ? 6 + CHART : 0) + (fit.logLines ? 6 + 34 + fit.logLines * 14 : 0)
    // the TV never shrinks below 120px, so only tiny panes can overflow
    if (fit.tvH > 120) expect(used).toBeLessThanOrEqual(rows * 20 - 8)
  }
})

test('the pane opens by itself on desktop, including before a surface attaches, but not in a terminal', async () => {
  expect(opensUnasked('desktop')).toBe(true)
  expect(opensUnasked(null)).toBe(true)
  expect(opensUnasked('terminal')).toBe(false)
  expect(opensUnasked('mobile')).toBe(false)
})

test('the theme is set again when a desktop or mobile display attaches, not a terminal or editor', async () => {
  expect(drawsThemes('desktop')).toBe(true)
  expect(drawsThemes('mobile')).toBe(true)
  expect(drawsThemes('terminal')).toBe(false)
  expect(drawsThemes('vscode')).toBe(false)
  expect(drawsThemes(null)).toBe(false)
})
