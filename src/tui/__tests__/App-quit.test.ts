import * as fs from 'node:fs';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import { DEFAULT_SETTINGS } from '../../types/Settings';
import * as claudeSettings from '../../utils/claude-settings';
import * as claudeStatus from '../claude-status';

import {
    KEYS,
    pressKey,
    renderApp,
    setUpAppSandbox,
    type AppSandbox,
    type RenderedApp
} from './helpers/render-app';
import { waitFor } from './helpers/wait-for-ink';

// An unsaved edit, so the menu offers Save & Exit: Color Level 256 → Truecolor
async function makeUnsavedEdit(rendered: RenderedApp): Promise<void> {
    await pressKey(rendered, KEYS.down, '▶  🎨 Edit Colors');
    await pressKey(rendered, KEYS.down, '▶  ⚡ Powerline Setup');
    await pressKey(rendered, KEYS.down, '▶  🎭 Widget Style');
    await pressKey(rendered, KEYS.down, '▶  💻 Terminal Options');
    await pressKey(rendered, KEYS.enter, '▶  ▓ Color Level');
    await pressKey(rendered, KEYS.enter, '(Truecolor)');
    await pressKey(rendered, KEYS.escape, '💾 Save & Exit');
}

describe('App quit with q', () => {
    let sandbox: AppSandbox;
    let rendered: RenderedApp;

    function savedColorLevel(): number {
        return (JSON.parse(fs.readFileSync(sandbox.settingsPath, 'utf-8')) as { colorLevel: number }).colorLevel;
    }

    beforeEach(async () => {
        sandbox = setUpAppSandbox();
        fs.writeFileSync(sandbox.settingsPath, JSON.stringify({ ...DEFAULT_SETTINGS, colorLevel: 2 }));
        vi.spyOn(claudeStatus, 'loadClaudeStatusLineState').mockResolvedValue({ existingStatusLine: null, refreshInterval: null });
        vi.spyOn(claudeSettings, 'isInstalled').mockResolvedValue(false);
        rendered = renderApp();
        await waitFor(() => {
            expect(rendered.getFrame()).toContain('Main Menu');
        });
    });

    afterEach(() => {
        rendered.cleanup();
        sandbox.restore();
    });

    it('mentions the shortcut on the main menu', () => {
        expect(rendered.getFrame()).toContain('Main Menu (q to quit)');
    });

    it('exits straight away with nothing unsaved', async () => {
        rendered.stdin.write('q');
        await rendered.waitUntilExit();
        expect(rendered.getFrame()).not.toContain('unsaved changes');
    });

    it('offers to save unsaved changes, and saving exits', async () => {
        await makeUnsavedEdit(rendered);
        await pressKey(rendered, 'q', 'You have unsaved changes');
        expect(savedColorLevel()).toBe(2);

        rendered.stdin.write(KEYS.enter);
        await rendered.waitUntilExit();
        expect(savedColorLevel()).toBe(3);
    });

    it('can discard unsaved changes', async () => {
        await makeUnsavedEdit(rendered);
        await pressKey(rendered, 'q', 'You have unsaved changes');
        await pressKey(rendered, KEYS.down, '▶  ❌ Exit without saving');

        rendered.stdin.write(KEYS.enter);
        await rendered.waitUntilExit();
        expect(savedColorLevel()).toBe(2);
    });

    it('keeps editing on Esc', async () => {
        await makeUnsavedEdit(rendered);
        await pressKey(rendered, 'q', 'You have unsaved changes');
        await pressKey(rendered, KEYS.escape, 'Main Menu');

        expect(rendered.getFrame()).toContain('💾 Save & Exit');
        expect(savedColorLevel()).toBe(2);
    });

    it('keeps editing from the prompt\'s last option', async () => {
        await makeUnsavedEdit(rendered);
        await pressKey(rendered, 'q', 'You have unsaved changes');
        await pressKey(rendered, KEYS.up, '▶  ← Keep editing');
        await pressKey(rendered, KEYS.enter, 'Main Menu');

        expect(rendered.getFrame()).toContain('💾 Save & Exit');
        expect(savedColorLevel()).toBe(2);
    });

    it('ignores Ctrl+S on the prompt, so the choice stays explicit', async () => {
        await makeUnsavedEdit(rendered);
        await pressKey(rendered, 'q', 'You have unsaved changes');

        rendered.stdin.write(KEYS.ctrlS);
        await new Promise((resolve) => {
            setTimeout(resolve, 100);
        });

        expect(rendered.getFrame()).toContain('You have unsaved changes');
        expect(savedColorLevel()).toBe(2);
    });

    it('does nothing outside the main menu', async () => {
        await pressKey(rendered, KEYS.down, '▶  🎨 Edit Colors');
        await pressKey(rendered, KEYS.down, '▶  ⚡ Powerline Setup');
        await pressKey(rendered, KEYS.down, '▶  🎭 Widget Style');
        await pressKey(rendered, KEYS.down, '▶  💻 Terminal Options');
        await pressKey(rendered, KEYS.enter, '▶  ▓ Color Level');

        rendered.stdin.write('q');
        await new Promise((resolve) => {
            setTimeout(resolve, 100);
        });

        expect(rendered.getFrame()).toContain('▶  ▓ Color Level');
    });
});
