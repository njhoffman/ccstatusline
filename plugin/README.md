# ccstatusline Claude Code Plugin

This directory contains the ccstatusline Claude Code plugin, which provides a `/ccstatusline` setup wizard command.

## Installation

```bash
claude plugin add sirmalloc/ccstatusline
```

## Usage

After installing the plugin, run the `/ccstatusline` command in Claude Code to launch the interactive setup wizard. It will guide you through:

1. Choosing an installation method (npx or bunx)
2. Selecting a widget style (classic, bubble, slashed, minimal, rainbow, pure)
3. Picking a color theme (for bubble/rainbow styles)
4. Configuring widgets
5. Installing to your Claude Code settings

## Reconfiguration

- Run `/ccstatusline` again to reconfigure
- Run `npx ccstatusline` (or `bunx ccstatusline`) for the full interactive TUI
