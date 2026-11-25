export type Meter = { percent: number; resetsAt?: string }
export type Reading = {
  five?: Meter
  seven?: Meter
  ctx?: { percent?: number; tokens?: number; window: number }
}

/** One reading of the 5-hour window: when, how full, and its reset time. */
export type Sample = { t: number; p: number; reset?: string }

export type LogEntry = {
  id: string
  at: number
  text: string
  kind: 'player' | 'tool' | 'done' | 'info'
  status?: 'run' | 'ok' | 'fail'
}

declare module 'claude-code' {
  interface PluginState {
    'nes-tv': {
      reading: Shaped<Reading>
      tick: number
      samples: Shaped<Sample[]>
      log: Shaped<LogEntry[]>
    }
  }
}
