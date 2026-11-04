---
name: ccstatusline
description: ccstatusline setup wizard - install, configure, and customize your Claude Code status line
allowed_tools: Bash, Read, Write, Edit, AskUserQuestion, Glob
---

# ccstatusline Setup Wizard

You are helping the user set up ccstatusline, a customizable status line formatter for Claude Code. Follow these steps carefully.

## Step 1: Check Current Installation

Check if ccstatusline is already installed:

```bash
cat ~/.claude/settings.json 2>/dev/null | grep -o '"command":[^,}]*' | head -1
```

Also check that the local build of this fork is on `PATH`:
```bash
which ccstatusline 2>/dev/null && ccstatusline --version || echo "ccstatusline not found"
```

If it isn't found, stop and tell the user to run `bun run build` in their checkout and link `dist/ccstatusline.js` into a directory on their `PATH`. Don't install from npm: the published `ccstatusline` package is upstream's and has no widget styles.

Tell the user:
- If ccstatusline is already installed, offer to reconfigure it
- If another statusline is installed, warn that it will be replaced
- If nothing is installed, proceed with fresh setup

## Step 2: Installation Command

The status line command is the bare `ccstatusline`. There is no package runner to choose.

## Step 3: Choose Widget Style

Present the available widget styles and ask the user to pick one:

| Style | Description |
|-------|-------------|
| **classic** | Default - configurable separators between widgets |
| **bubble** | Rounded bubble segments with colored backgrounds (needs Powerline fonts) |
| **slashed** | Forward slash `/` separators |
| **minimal** | No separators, compact display |
| **rainbow** | Powerline arrows with cycling background colors (needs Powerline fonts) |
| **pure** | Bold text only, no backgrounds or separators |

If the user picks **bubble** or **rainbow**, check for Powerline font support:
```bash
echo -e "\uE0B0\uE0B4\uE0B6"
```
Ask if the glyphs render correctly. If not, suggest installing Powerline fonts or picking a different style.

## Step 4: Choose Color Theme (for bubble/rainbow styles)

If the user chose bubble or rainbow, present the available Powerline color themes:
- **nord** - Arctic, north-bluish palette
- **nord-aurora** - Nord with aurora accent colors
- **dracula** - Dark with purple accents
- **catppuccin** - Soothing pastel theme
- **gruvbox** - Retro groove colors
- **monokai** - Dark with vibrant colors
- **solarized** - Precision colors for readability
- **onedark** - Atom-inspired dark theme
- **tokyonight** - Clean Tokyo nightlife inspired
- **minimal** - Clean monochrome

Ask the user to pick a theme. Default to **nord-aurora** if they have no preference.

## Step 5: Choose Widgets

Present the default widget configuration:
- Line 1: Model | Context Length | Git Branch | Git Changes

Ask if they want to customize. If yes, suggest popular combinations:

**Developer focused:**
- Model | Context % | Git Branch | Git Changes | Session Cost

**Token tracker:**
- Model | Tokens Input | Tokens Output | Tokens Cached | Context Bar

**Minimal:**
- Model | Context % | Git Branch

**Full info:**
- Line 1: Model | Context Length | Git Branch | Git Changes
- Line 2: Session Cost | Session Clock | Block Timer

If they want fine-grained control, suggest running the interactive TUI after installation:
```bash
ccstatusline
```

## Step 6: Install

Based on the user's choices, write the ccstatusline settings file and update Claude Code settings.

### Write ccstatusline settings

Create or update `~/.config/ccstatusline/settings.json` with the chosen configuration:

```bash
mkdir -p ~/.config/ccstatusline
```

Then write the settings JSON with the chosen widgetStyle, powerline theme, and widget lines.

The settings format is:
```json
{
  "version": 4,
  "widgetStyle": "<chosen-style>",
  "lines": [
    [
      { "id": "1", "type": "model", "color": "cyan" },
      { "id": "2", "type": "separator" },
      { "id": "3", "type": "context-length", "color": "brightBlack" },
      { "id": "4", "type": "separator" },
      { "id": "5", "type": "git-branch", "color": "magenta" },
      { "id": "6", "type": "separator" },
      { "id": "7", "type": "git-changes", "color": "yellow" }
    ],
    [],
    []
  ],
  "flexMode": "full-minus-40",
  "compactThreshold": 60,
  "colorLevel": 2,
  "inheritSeparatorColors": false,
  "globalBold": false,
  "powerline": {
    "enabled": false,
    "separators": ["\uE0B0"],
    "separatorInvertBackground": [false],
    "startCaps": [],
    "endCaps": [],
    "autoAlign": false
  }
}
```

For **bubble** or **rainbow** styles, set `widgetStyle` accordingly. If they chose a color theme, set `powerline.theme` to the theme name.

For **slashed**, **minimal**, or **pure** styles, set `widgetStyle` accordingly. No powerline config changes needed (the style system handles it).

### Update Claude Code settings

Read the existing `~/.claude/settings.json`, update/add the `statusLine` field, and write it back:

```bash
# Read existing settings
CLAUDE_SETTINGS=$(cat ~/.claude/settings.json 2>/dev/null || echo '{}')
```

Use a tool to merge the statusLine configuration:
```json
{
  "statusLine": {
    "type": "command",
    "command": "ccstatusline",
    "padding": 0
  }
}
```

Write the merged settings back to `~/.claude/settings.json`.

## Step 7: Verify

Test the installation by running:
```bash
echo '{"model":{"id":"claude-sonnet-4-5-20250929"},"transcript_path":"test.jsonl"}' | ccstatusline
```

If it produces output with the model name, the installation is working.

## Step 8: Success

Tell the user:
- ccstatusline is now installed and will show on your next Claude Code message
- To reconfigure at any time, run the interactive TUI: `ccstatusline`
- To change styles/themes quickly, run `/ccstatusline` again
- Documentation: https://github.com/sirmalloc/ccstatusline

Available widget types for reference:
- **Core:** model, version, output-style
- **Git:** git-branch, git-changes, git-insertions, git-deletions, git-root-dir, git-worktree
- **Tokens:** tokens-input, tokens-output, tokens-cached, tokens-total
- **Cache:** cache-read, cache-write, cache-hit-rate, cache-timer
- **Speed:** input-speed, output-speed, total-speed
- **Context:** context-length, context-percentage, context-percentage-usable, context-bar
- **Session:** session-clock, session-cost, block-timer, reset-timer, weekly-reset-timer
- **Usage:** session-usage, weekly-usage
- **Environment:** current-working-dir, terminal-width, free-memory, transcript-path
- **Custom:** custom-text, custom-command, link
- **Other:** claude-session-id, session-name, skills, thinking-effort, vim-mode
- **Layout:** separator, flex-separator
