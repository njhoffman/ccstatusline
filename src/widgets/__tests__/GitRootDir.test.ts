import chalk from 'chalk';
import { execFileSync } from 'node:child_process';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import type { RenderContext } from '../../types/RenderContext';
import { DEFAULT_SETTINGS } from '../../types/Settings';
import type { WidgetItem } from '../../types/Widget';
import { mockExecutableResolution } from '../../utils/__tests__/executable-path-test-helpers';
import { expectGitExecOptions } from '../../utils/__tests__/git-test-helpers';
import { updateColorMap } from '../../utils/colors';
import * as dotbare from '../../utils/dotbare';
import { clearGitCache } from '../../utils/git';
import { GIT_HARDENING_ARGS } from '../../utils/git-hardening';
import {
    buildIdeFileUrl,
    renderOsc8Link
} from '../../utils/hyperlink';
import { GitRootDirWidget } from '../GitRootDir';

vi.mock('node:child_process', () => ({
    execSync: vi.fn(),
    execFileSync: vi.fn(),
    spawnSync: vi.fn()
}));

const mockExecFileSync = execFileSync as unknown as {
    mock: { calls: unknown[][] };
    mockImplementation: (impl: () => never) => void;
    mockReturnValue: (value: string) => void;
    mockReturnValueOnce: (value: string) => void;
};

function render(options: { cwd?: string; hideNoGit?: boolean; isPreview?: boolean; maxWidth?: number } = {}) {
    const widget = new GitRootDirWidget();
    const context: RenderContext = {
        isPreview: options.isPreview,
        data: options.cwd ? { cwd: options.cwd } : undefined
    };
    const item: WidgetItem = {
        id: 'git-root-dir',
        type: 'git-root-dir',
        maxWidth: options.maxWidth,
        metadata: options.hideNoGit ? { hide: 'no-git' } : undefined
    };

    return widget.render(item, context, DEFAULT_SETTINGS);
}

mockExecutableResolution();

describe('GitRootDirWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearGitCache();
    });

    it('should render preview', () => {
        expect(render({ isPreview: true })).toBe('my-repo');
    });

    // A sample long enough for the limit to show, cut the way a real name is
    it('should apply the max width to the preview', () => {
        expect(render({ isPreview: true, maxWidth: 10 })).toBe('my-long...');
    });

    it('should render preview for vscode IDE links', () => {
        const widget = new GitRootDirWidget();

        expect(widget.render({
            id: 'git-root-dir',
            type: 'git-root-dir',
            metadata: { linkToIDE: 'vscode' }
        }, { isPreview: true }, DEFAULT_SETTINGS)).toBe(renderOsc8Link(
            buildIdeFileUrl('/Users/example/my-repo', 'vscode'),
            'my-repo'
        ));
    });

    it('should render root directory name', () => {
        mockExecFileSync.mockReturnValueOnce('true\n');
        mockExecFileSync.mockReturnValueOnce('/some/path/my-repo');

        expect(render({ cwd: '/tmp/worktree' })).toBe('my-repo');
        expect(mockExecFileSync.mock.calls[0]?.[0]).toBe('git');
        expect(mockExecFileSync.mock.calls[0]?.[1]).toEqual([...GIT_HARDENING_ARGS, 'rev-parse', '--is-inside-work-tree']);
        expectGitExecOptions(mockExecFileSync.mock.calls[0]?.[2], '/tmp/worktree');
        expect(mockExecFileSync.mock.calls[1]?.[0]).toBe('git');
        expect(mockExecFileSync.mock.calls[1]?.[1]).toEqual([...GIT_HARDENING_ARGS, 'rev-parse', '--show-toplevel']);
        expectGitExecOptions(mockExecFileSync.mock.calls[1]?.[2], '/tmp/worktree');
    });

    it('should handle trailing separators', () => {
        mockExecFileSync.mockReturnValueOnce('true\n');
        mockExecFileSync.mockReturnValueOnce('/some/path/my-repo/');

        expect(render()).toBe('my-repo');
    });

    it('should render unix root path without returning empty output', () => {
        mockExecFileSync.mockReturnValueOnce('true\n');
        mockExecFileSync.mockReturnValueOnce('/');

        expect(render()).toBe('/');
    });

    it('should render windows drive root without returning empty output', () => {
        mockExecFileSync.mockReturnValueOnce('true\n');
        mockExecFileSync.mockReturnValueOnce('C:/');

        expect(render()).toBe('C:');
    });

    it('should render encoded vscode IDE links for repository roots', () => {
        const widget = new GitRootDirWidget();
        mockExecFileSync.mockReturnValueOnce('true\n');
        mockExecFileSync.mockReturnValueOnce('C:/Work/my repo#1');

        expect(widget.render({
            id: 'git-root-dir',
            type: 'git-root-dir',
            metadata: { linkToIDE: 'vscode' }
        }, {}, DEFAULT_SETTINGS)).toBe(renderOsc8Link(
            buildIdeFileUrl('C:/Work/my repo#1', 'vscode'),
            'my repo#1'
        ));
    });

    it('should continue honoring legacy cursor link metadata', () => {
        const widget = new GitRootDirWidget();
        mockExecFileSync.mockReturnValueOnce('true\n');
        mockExecFileSync.mockReturnValueOnce('/some/path/my repo#1');

        expect(widget.render({
            id: 'git-root-dir',
            type: 'git-root-dir',
            metadata: { linkToCursor: 'true' }
        }, {}, DEFAULT_SETTINGS)).toBe(renderOsc8Link(
            buildIdeFileUrl('/some/path/my repo#1', 'cursor'),
            'my repo#1'
        ));
    });

    it('should render no git when probe returns false', () => {
        mockExecFileSync.mockReturnValue('false\n');

        expect(render()).toBe('no git');
    });

    it('should render no git when command fails', () => {
        mockExecFileSync.mockImplementation(() => { throw new Error('No git'); });

        expect(render()).toBe('no git');
    });

    it('should hide no git when configured', () => {
        mockExecFileSync.mockImplementation(() => { throw new Error('No git'); });

        expect(render({ hideNoGit: true })).toBeNull();
    });

    it('should cycle IDE link modes in the editor', () => {
        const widget = new GitRootDirWidget();
        const base: WidgetItem = { id: 'git-root-dir', type: 'git-root-dir' };

        const vscode = widget.handleEditorAction('toggle-link', base);
        const cursor = widget.handleEditorAction('toggle-link', vscode ?? base);
        const cleared = widget.handleEditorAction('toggle-link', cursor ?? base);

        expect(vscode?.metadata?.linkToIDE).toBe('vscode');
        expect(cursor?.metadata?.linkToIDE).toBe('cursor');
        expect(cleared?.metadata?.linkToIDE).toBeUndefined();
    });

    it('should migrate legacy cursor metadata when cycling IDE link modes', () => {
        const widget = new GitRootDirWidget();
        const updated = widget.handleEditorAction('toggle-link', {
            id: 'git-root-dir',
            type: 'git-root-dir',
            metadata: { linkToCursor: 'true' }
        });

        expect(updated?.metadata?.linkToCursor).toBeUndefined();
        expect(updated?.metadata?.linkToIDE).toBeUndefined();
    });

    it('should show IDE link modifier text in the editor display', () => {
        const widget = new GitRootDirWidget();
        const display = widget.getEditorDisplay({
            id: 'git-root-dir',
            type: 'git-root-dir',
            metadata: { linkToIDE: 'cursor' }
        });

        expect(display.modifierText).toBe('(link-cursor)');
    });

    it('should expose IDE link keybind', () => {
        const widget = new GitRootDirWidget();

        expect(widget.getCustomKeybinds()).toContainEqual({
            key: 'l',
            label: '(l)ink to IDE',
            action: 'toggle-link'
        });
    });

    it('should disable raw value support', () => {
        const widget = new GitRootDirWidget();

        expect(widget.supportsRawValue()).toBe(false);
    });

    describe('max width', () => {
        const widget = new GitRootDirWidget();

        it.each([
            { name: 'should truncate the directory name to the configured width', maxWidth: 10, expected: 'my-very...' },
            { name: 'should leave the directory name untouched when it fits', maxWidth: 100, expected: 'my-very-long-repo-name' }
        ])('$name', ({ maxWidth, expected }) => {
            mockExecFileSync.mockReturnValueOnce('true\n');
            mockExecFileSync.mockReturnValueOnce('/some/path/my-very-long-repo-name');

            expect(render({ maxWidth })).toBe(expected);
        });

        it('should truncate the visible IDE link label but keep the full link target', () => {
            mockExecFileSync.mockReturnValueOnce('true\n');
            mockExecFileSync.mockReturnValueOnce('/some/path/my-very-long-repo-name');

            expect(widget.render({
                id: 'git-root-dir',
                type: 'git-root-dir',
                maxWidth: 10,
                metadata: { linkToIDE: 'vscode' }
            }, {}, DEFAULT_SETTINGS)).toBe(renderOsc8Link(
                buildIdeFileUrl('/some/path/my-very-long-repo-name', 'vscode'),
                'my-very...'
            ));
        });

        it('should show the max-width modifier in the editor display', () => {
            expect(widget.getEditorDisplay({ id: 'git-root-dir', type: 'git-root-dir', maxWidth: 12 }).modifierText)
                .toBe('(max:12)');
        });

        it('should expose the width keybind', () => {
            expect(widget.getCustomKeybinds()).toContainEqual({
                key: 'w',
                label: '(w)idth',
                action: 'edit-max-width'
            });
        });

        it('should open the width editor for the width action', () => {
            expect(widget.renderEditor({
                widget: { id: 'git-root-dir', type: 'git-root-dir' },
                onComplete: vi.fn(),
                onCancel: vi.fn(),
                action: 'edit-max-width'
            })).not.toBeNull();
        });
    });
    describe('in a directory tracked by dotbare', () => {
        const originalChalkLevel = chalk.level;

        // Set by the real entry point, and needed for color codes
        beforeEach(() => {
            chalk.level = 2;
            updateColorMap();
        });

        afterEach(() => {
            chalk.level = originalChalkLevel;
            updateColorMap();
        });

        const notInGit = () => {
            mockExecFileSync.mockImplementation(() => { throw new Error('not a git repository'); });
        };
        const renderItem = (item: Partial<WidgetItem> = {}, settings = DEFAULT_SETTINGS) => new GitRootDirWidget().render(
            { id: 'git-root-dir', type: 'git-root-dir', ...item },
            { data: { cwd: '/home/me/.config/tmux' } },
            settings
        );
        const plain = (text: string | null) => (text ?? '').replace(/\x1b\[[0-9;]*m/g, '');

        it('shows the project name in its own color instead of no git', () => {
            notInGit();
            const lookup = vi.spyOn(dotbare, 'findDotbareRoot').mockReturnValue('/home/me/.config/tmux');
            try {
                const output = renderItem();

                expect(plain(output)).toBe('tmux');
                expect(output).not.toBe('tmux');
                expect(output?.endsWith('\x1b[39m')).toBe(true);
            } finally {
                lookup.mockRestore();
            }
        });

        it('takes the color from the item', () => {
            notInGit();
            const lookup = vi.spyOn(dotbare, 'findDotbareRoot').mockReturnValue('/home/me/.config/tmux');
            try {
                const standard = renderItem();
                const custom = renderItem({ metadata: { dotbareColor: 'red' } });

                expect(plain(custom)).toBe('tmux');
                expect(custom).not.toBe(standard);
            } finally {
                lookup.mockRestore();
            }
        });

        it.each([
            ['color is off', { ...DEFAULT_SETTINGS, colorLevel: 0 as const }],
            ['a global foreground override is set', { ...DEFAULT_SETTINGS, overrideForegroundColor: 'red' }]
        ])('adds no color of its own when %s', (_name, settings) => {
            notInGit();
            const lookup = vi.spyOn(dotbare, 'findDotbareRoot').mockReturnValue('/home/me/.config/tmux');
            try {
                expect(renderItem({}, settings)).toBe('tmux');
            } finally {
                lookup.mockRestore();
            }
        });

        it('applies the max width and IDE link', () => {
            notInGit();
            const lookup = vi.spyOn(dotbare, 'findDotbareRoot').mockReturnValue('/home/me/.config/long-config-name');
            try {
                const output = renderItem({ maxWidth: 7, metadata: { linkToIDE: 'vscode' } }, { ...DEFAULT_SETTINGS, colorLevel: 0 });

                expect(output).toBe(renderOsc8Link(buildIdeFileUrl('/home/me/.config/long-config-name', 'vscode'), 'long...'));
            } finally {
                lookup.mockRestore();
            }
        });

        it('still shows no git, or hides, when dotbare has nothing', () => {
            notInGit();
            const lookup = vi.spyOn(dotbare, 'findDotbareRoot').mockReturnValue(null);
            try {
                expect(renderItem()).toBe('no git');
                expect(renderItem({ metadata: { hide: 'no-git' } })).toBeNull();
            } finally {
                lookup.mockRestore();
            }
        });

        it('leaves a real git repo alone, without looking for dotbare', () => {
            mockExecFileSync.mockReturnValueOnce('true\n');
            mockExecFileSync.mockReturnValueOnce('/some/path/my-repo');
            const lookup = vi.spyOn(dotbare, 'findDotbareRoot');
            try {
                expect(renderItem()).toBe('my-repo');
                expect(lookup).not.toHaveBeenCalled();
            } finally {
                lookup.mockRestore();
            }
        });
    });
});
