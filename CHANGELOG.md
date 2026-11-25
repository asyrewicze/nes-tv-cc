# Changelog

All notable changes to Pixel TV are listed here. Versions follow [semantic versioning](https://semver.org/).

## [0.4.2] - 2026-11-25

### Fixed

- The chart now shows only the current 5-hour window. Saved readings outlive sessions, so the chart could project a limit from a window that had already reset, while the TV said `NO DATA YET`. Readings from an ended window are now dropped ([#5](https://github.com/asyrewicze/pixel-tv-cc/pull/5)).
- Chart labels no longer overlap. When "now" is near either end of the window, the covered label steps aside instead of colliding with `NOW` ([#5](https://github.com/asyrewicze/pixel-tv-cc/pull/5)).
- No more misleading "the theme isn't drawn here" lines in the chat at session start. The mod now logs only when the theme will never draw ([#5](https://github.com/asyrewicze/pixel-tv-cc/pull/5)).

### Docs

- The README explains that in the desktop app, the theme and pane appear once you send a new session's first message ([#6](https://github.com/asyrewicze/pixel-tv-cc/pull/6)).

## [0.4.1] - 2026-11-25

### Fixed

- New sessions now come up with the theme after a marketplace install. A session can start before its desktop display attaches, so the mod also sets the theme when a desktop or mobile display joins, unless you turned it off ([#4](https://github.com/asyrewicze/pixel-tv-cc/pull/4)).
- `/pixel-theme on` always sets the look, so it can bring back a theme the app dropped ([#4](https://github.com/asyrewicze/pixel-tv-cc/pull/4)).

## [0.4.0] - 2026-11-25

### Changed

- Renamed from nes-tv to **Pixel TV**: the plugin is now `pixel-tv`, the repository and marketplace `pixel-tv-cc`, and `/nes-theme` is now `/pixel-theme` ([#3](https://github.com/asyrewicze/pixel-tv-cc/pull/3)).
- The pane opens by itself only where it docks as a sidebar. In a terminal or the mobile app, open it with `/tv` ([#3](https://github.com/asyrewicze/pixel-tv-cc/pull/3)).
- Requires Claude Code 2.1.330 or later, so older versions refuse the install instead of half-working ([#3](https://github.com/asyrewicze/pixel-tv-cc/pull/3)).

### Added

- A display name, author, homepage, keywords and icon in the plugin manifest, and a description, category and tags in the marketplace listing ([#3](https://github.com/asyrewicze/pixel-tv-cc/pull/3)).

## [0.3.0] - 2026-11-25

### Added

- The usage pane fits the window's height with no scroll bar. The quest log grows to fill the room, up to 60 lines. On a shorter window the log drops out, then the chart, and on a very short window the TV shrinks. The layout follows the window as you resize it ([#2](https://github.com/asyrewicze/pixel-tv-cc/pull/2)).

## [0.2.0] - 2026-11-25

### Added

- `/nes-theme on | off` (now `/pixel-theme`) turns the look off and back on, remembered across sessions ([#1](https://github.com/asyrewicze/pixel-tv-cc/pull/1)).

### Changed

- Lower CPU use. Every animation moves in steps on a shared one-second beat, nothing animates offstage, and the backdrop went from about 32 animated pieces to 18. On macOS this cut the app's GPU process from about 17% to about 6% ([#1](https://github.com/asyrewicze/pixel-tv-cc/pull/1)).
- Relicensed from GPL-3.0 to MIT.

## [0.1.0] - 2026-11-25

First release, as nes-tv.

- An animated pixel backdrop: a night or day sky, a castle, a city skyline, hills and pines, and a parade of running characters.
- Monospace dialog-box message styling and square-wave sound cues.
- The usage pane: a CRT TV with 5-hour, 7-day and context meters, a 5-hour burn-rate chart with a projection, and a quest log of each turn.
- Shell commands in the quest log show what they do, without leading settings, `cd` steps or full paths.
- A text version of the pane for terminals.

[0.4.2]: https://github.com/asyrewicze/pixel-tv-cc/releases/tag/v0.4.2
[0.4.1]: https://github.com/asyrewicze/pixel-tv-cc/pull/4
[0.4.0]: https://github.com/asyrewicze/pixel-tv-cc/pull/3
[0.3.0]: https://github.com/asyrewicze/pixel-tv-cc/pull/2
[0.2.0]: https://github.com/asyrewicze/pixel-tv-cc/pull/1
[0.1.0]: https://github.com/asyrewicze/pixel-tv-cc/commit/4e3db30
