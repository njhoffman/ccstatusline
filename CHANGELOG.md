# Changelog

All notable changes to this fork of [ccstatusline](https://github.com/sirmalloc/ccstatusline) are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versions up to 2.2.32 are upstream releases: see the "Recent Updates" section of the README.

## [Unreleased]

## [2.7.0] - 2026-11-03

### Added

- From upstream through 2.2.33: Block Forecast, Block Limit Timer, Weekly Limit Timer, Weekly Fable Limit Timer, Cache Misses, Last Cache Miss, Cache Miss Tokens, Cache If Cold, Extra Usage Limit and Fast Mode widgets.
- Longer explanations for the new usage and cache widgets.

### Changed

- From upstream: status lines take their width from `CCSTATUSLINE_WIDTH`, then the `COLUMNS` Claude Code sets, then a terminal probe, and use the full width minus 5 columns.
- The widget picker leaves room for each widget's longer explanation, so it stays within the terminal height.

### Fixed

- From upstream: token and speed metrics count each API response once, context percentage leaves out output tokens, and stale usage windows and outdated service status are no longer shown as current.

### Removed

- From upstream: the Terminal Width options (full, full minus 40, full until compact). Existing `flexMode` and `compactThreshold` settings are ignored.

## [2.6.0] - 2026-10-21

### Added

- Vim navigation in the TUI: j/k move up and down in lists, menus and move modes, and h/l cycle wherever left and right do (colors, separators, number formats). Text entry, search and the widget picker still treat these letters as typed input.
- Longer explanations under the description in the widget list and picker, for the context, token, cache, speed, usage, timer and cost widgets.

### Changed

- Widget list: clone moves from k to y. Widgets keep their own h and l keybinds there.
- Hex color entry moves from h to x in Colors and the separator editor.

## [2.5.0] - 2026-10-21

### Added

- Context Bar label modes: an (l)abels key cycles full, percent, tokens and none, independently of the (p) bar mode.
- "Use existing local install" in the install menu: it writes the bare `ccstatusline` command to Claude settings and skips the package manager. It is disabled when `ccstatusline` is not on PATH.
- Everything from upstream through 2.2.32, merged into the fork.

### Changed

- Global color overrides: `none` now forces no color (transparent background, terminal default foreground) instead of behaving like disabled.
- The Pure widget style strips backgrounds, matching its description.
- Tokens Cache Read and Tokens Cache Creation are replaced by upstream's Cache Read and Cache Write. A settings migration rewrites existing items and keeps what they showed.

## [2.4.0] - 2026-10-20

### Added

- More than 30 powerline separator presets (thin rounds, blocks, slants, flames, waveforms) with matching start and end caps. Left-facing characters invert their background automatically.

### Changed

- Global foreground and background overrides cycle through disabled, none and colors.
- The widget style selector lists styles in the order minimal, pure, slashed, classic, bubble, rainbow.

### Fixed

- Lint and test failures left by 2.3.0.

## [2.3.0] - 2026-03-17

### Added

- `widgetStyle` setting with six presets (classic, bubble, slashed, minimal, rainbow, pure) that control separators, padding and rendering mode, plus a selector in the TUI.
- Tokens Cache Read, Tokens Cache Creation and Transcript Path widgets.
- Claude Code plugin with a `/ccstatusline` setup wizard.

### Changed

- Settings schema moves to v4, with a migration from earlier versions.
