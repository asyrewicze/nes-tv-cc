// What the pane shows for the room it has, so it never needs a scroll bar.
//
// The desktop app reports the pane's height as rows (`e.props.scroll.bodyRows`)
// and redraws the pane when the window is resized. A row measured about 20
// pixels: at 38 rows, 746 pixels of drawings fit exactly.

export const PX_PER_ROW = 20
const MARGIN = 8 // pixels kept free so rounding never tips into a scroll bar

export const TV_W = 320
export const TV_H = 312
export const GAP = 6
const LOG_FRAME = 34 // the quest log's height besides its lines
const LOG_LINE = 14
const MIN_LOG_LINES = 4 // fewer than this isn't worth showing
const MAX_LOG_LINES = 60
const MIN_TV_H = 120 // below this the TV is unreadable; let it overflow instead

export type Layout = {
  /** the TV's drawn size, shrunk proportionally when the pane is very short */
  tvW: number
  tvH: number
  showChart: boolean
  /** 0 when the quest log is left out */
  logLines: number
}

/** The layout for a pane `bodyRows` tall, with a chart `chartH` pixels tall. */
export const layoutFor = (bodyRows: number, chartH: number): Layout => {
  const room = Math.max(0, bodyRows * PX_PER_ROW - MARGIN)
  if (room < TV_H) {
    const tvH = Math.max(MIN_TV_H, Math.floor(room))
    return { tvW: Math.round((TV_W * tvH) / TV_H), tvH, showChart: false, logLines: 0 }
  }
  let left = room - TV_H
  const showChart = left >= GAP + chartH
  if (showChart) left -= GAP + chartH
  const lines = Math.floor((left - GAP - LOG_FRAME) / LOG_LINE)
  const logLines = lines >= MIN_LOG_LINES ? Math.min(lines, MAX_LOG_LINES) : 0
  return { tvW: TV_W, tvH: TV_H, showChart, logLines: showChart ? logLines : 0 }
}

/**
 * Whether the pane may open by itself at session start: only where it docks as a
 * sidebar. A desktop session can start before its surface attaches (null), so
 * only a known terminal or the mobile app, where it would sit over the prompt,
 * wait for /tv.
 */
export const opensUnasked = (surface: string | null) => surface !== 'terminal' && surface !== 'mobile'
