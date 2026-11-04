import {
    describe,
    expect,
    it,
    vi
} from 'vitest';

import {
    KEYS,
    renderComponent
} from '../../tui/__tests__/helpers/render-component';
import type {
    RenderContext,
    WidgetItem
} from '../../types';
import { DEFAULT_SETTINGS } from '../../types/Settings';
import * as terminal from '../../utils/terminal';
import { ClaudeSessionIdWidget } from '../ClaudeSessionId';
import { CustomSymbolWidget } from '../CustomSymbol';
import { CustomTextWidget } from '../CustomText';
import { GitWorktreeBranchWidget } from '../GitWorktreeBranch';
import { GitWorktreeNameWidget } from '../GitWorktreeName';
import { GitWorktreeOriginalBranchWidget } from '../GitWorktreeOriginalBranch';
import { TerminalWidthWidget } from '../TerminalWidth';
import { VersionWidget } from '../Version';

const PREVIEW: RenderContext = { isPreview: true };
const EMPTY: RenderContext = { data: {} };

function item(type: string, extra: Partial<WidgetItem> = {}): WidgetItem {
    return { id: '1', type, ...extra };
}

describe('ClaudeSessionIdWidget', () => {
    const widget = new ClaudeSessionIdWidget();
    const context: RenderContext = { data: { session_id: 'abc-123' } };

    it('shows the labeled session id, or only the value when raw', () => {
        expect(widget.render(item('claude-session-id'), context, DEFAULT_SETTINGS)).toBe('Session ID: abc-123');
        expect(widget.render(item('claude-session-id', { rawValue: true }), context, DEFAULT_SETTINGS)).toBe('abc-123');
    });

    it('hides without a session id', () => {
        expect(widget.render(item('claude-session-id'), EMPTY, DEFAULT_SETTINGS)).toBeNull();
    });

    it('shows a placeholder in preview', () => {
        expect(widget.render(item('claude-session-id'), PREVIEW, DEFAULT_SETTINGS)).toBe('Session ID: preview-session-id');
    });
});

describe('VersionWidget', () => {
    const widget = new VersionWidget();
    const context: RenderContext = { data: { version: '2.1.0' } };

    it('prefixes v unless raw', () => {
        expect(widget.render(item('version'), context, DEFAULT_SETTINGS)).toBe('v2.1.0');
        expect(widget.render(item('version', { rawValue: true }), context, DEFAULT_SETTINGS)).toBe('2.1.0');
    });

    it('hides without a version', () => {
        expect(widget.render(item('version'), EMPTY, DEFAULT_SETTINGS)).toBeNull();
    });

    it('shows a placeholder in preview', () => {
        expect(widget.render(item('version'), PREVIEW, DEFAULT_SETTINGS)).toBe('v1.0.0');
        expect(widget.render(item('version', { rawValue: true }), PREVIEW, DEFAULT_SETTINGS)).toBe('1.0.0');
    });
});

describe('TerminalWidthWidget', () => {
    const widget = new TerminalWidthWidget();

    it('prefers the width in the render context', () => {
        const probe = vi.spyOn(terminal, 'getTerminalWidth').mockReturnValue(80);
        try {
            expect(widget.render(item('terminal-width'), { terminalWidth: 132 }, DEFAULT_SETTINGS)).toBe('Term: 132');
            expect(widget.render(item('terminal-width', { rawValue: true }), { terminalWidth: 132 }, DEFAULT_SETTINGS)).toBe('132');
        } finally {
            probe.mockRestore();
        }
    });

    it('falls back to probing the terminal', () => {
        const probe = vi.spyOn(terminal, 'getTerminalWidth').mockReturnValue(80);
        try {
            expect(widget.render(item('terminal-width'), {}, DEFAULT_SETTINGS)).toBe('Term: 80');
        } finally {
            probe.mockRestore();
        }
    });

    it('hides when the width is unknown, except in preview', () => {
        const probe = vi.spyOn(terminal, 'getTerminalWidth').mockReturnValue(null);
        try {
            expect(widget.render(item('terminal-width'), {}, DEFAULT_SETTINGS)).toBeNull();
            expect(widget.render(item('terminal-width'), PREVIEW, DEFAULT_SETTINGS)).toBe('Term: ??');
        } finally {
            probe.mockRestore();
        }
    });
});

describe.each([
    { name: 'GitWorktreeBranchWidget', widget: new GitWorktreeBranchWidget(), field: 'branch', preview: 'wt-my-feature' },
    { name: 'GitWorktreeNameWidget', widget: new GitWorktreeNameWidget(), field: 'name', preview: 'my-feature' },
    { name: 'GitWorktreeOriginalBranchWidget', widget: new GitWorktreeOriginalBranchWidget(), field: 'original_branch', preview: 'main' }
])('$name', ({ widget, field, preview }) => {
    it('shows its field from the status JSON', () => {
        const context = { data: { worktree: { [field]: 'value-here' } } } as RenderContext;
        expect(widget.render(item('git-worktree'), context, DEFAULT_SETTINGS)).toBe('value-here');
    });

    it('hides outside a worktree', () => {
        expect(widget.render(item('git-worktree'), EMPTY, DEFAULT_SETTINGS)).toBeNull();
    });

    it('shows a placeholder in preview', () => {
        expect(widget.render(item('git-worktree'), PREVIEW, DEFAULT_SETTINGS)).toBe(preview);
    });
});

describe('CustomTextWidget', () => {
    const widget = new CustomTextWidget();

    it('renders its text, or nothing when unset', () => {
        expect(widget.render(item('custom-text', { customText: 'hello' }), {}, DEFAULT_SETTINGS)).toBe('hello');
        expect(widget.render(item('custom-text'), {}, DEFAULT_SETTINGS)).toBe('');
    });

    it('edits the text and saves on Enter', async () => {
        const onComplete = vi.fn();
        const source = item('custom-text', { customText: 'hi' });
        const editor = renderComponent(widget.renderEditor({ widget: source, onComplete, onCancel: vi.fn() }));

        try {
            await editor.waitForFrame('Enter custom text: hi');
            await editor.pressKey('!', 'Enter custom text: hi!');
            await editor.pressKeyAndExpect(KEYS.enter, () => {
                expect(onComplete).toHaveBeenCalledWith({ ...source, customText: 'hi!' });
            });
        } finally {
            editor.cleanup();
        }
    });

    it('cancels on Esc without saving', async () => {
        const onComplete = vi.fn();
        const onCancel = vi.fn();
        const editor = renderComponent(widget.renderEditor({ widget: item('custom-text'), onComplete, onCancel }));

        try {
            await editor.waitForFrame('Enter custom text:');
            await editor.pressKeyAndExpect(KEYS.escape, () => {
                expect(onCancel).toHaveBeenCalledTimes(1);
            });
            expect(onComplete).not.toHaveBeenCalled();
        } finally {
            editor.cleanup();
        }
    });
});

describe('CustomSymbolWidget', () => {
    const widget = new CustomSymbolWidget();

    it('renders its symbol, or nothing when unset', () => {
        expect(widget.render(item('custom-symbol', { customSymbol: '*' }), {}, DEFAULT_SETTINGS)).toBe('*');
        expect(widget.render(item('custom-symbol'), {}, DEFAULT_SETTINGS)).toBe('');
    });

    it('shows the symbol, or a question mark, in the editor list', () => {
        expect(widget.getEditorDisplay(item('custom-symbol', { customSymbol: '*' })).displayText).toBe('Custom Symbol (*)');
        expect(widget.getEditorDisplay(item('custom-symbol')).displayText).toBe('Custom Symbol (?)');
    });

    it('keeps one symbol, the latest typed, even from a joined emoji', async () => {
        const onComplete = vi.fn();
        const source = item('custom-symbol');
        const editor = renderComponent(widget.renderEditor({ widget: source, onComplete, onCancel: vi.fn() }));
        const joinedEmoji = '\u{1F469}‍\u{1F4BB}';

        try {
            await editor.waitForFrame('Enter custom symbol:');
            await editor.pressKey('a', 'Enter custom symbol: a');
            await editor.pressKey(`${joinedEmoji}b`, joinedEmoji);
            await editor.pressKeyAndExpect(KEYS.enter, () => {
                expect(onComplete).toHaveBeenCalledWith({ ...source, customSymbol: joinedEmoji });
            });
        } finally {
            editor.cleanup();
        }
    });

    it('clears on backspace', async () => {
        const onComplete = vi.fn();
        const source = item('custom-symbol', { customSymbol: '*' });
        const editor = renderComponent(widget.renderEditor({ widget: source, onComplete, onCancel: vi.fn() }));

        try {
            await editor.waitForFrame('Enter custom symbol: *');
            await editor.pressKeyAndExpect(KEYS.backspace, () => {
                expect(editor.frame()).not.toContain('*');
            });
            await editor.pressKeyAndExpect(KEYS.enter, () => {
                expect(onComplete).toHaveBeenCalledWith({ ...source, customSymbol: '' });
            });
        } finally {
            editor.cleanup();
        }
    });
});
