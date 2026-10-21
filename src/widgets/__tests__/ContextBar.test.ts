import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import type { RenderContext } from '../../types';
import { DEFAULT_SETTINGS } from '../../types/Settings';
import type { WidgetItem } from '../../types/Widget';
import * as usage from '../../utils/usage';
import { ContextBarWidget } from '../ContextBar';
import { ContextLengthWidget } from '../ContextLength';
import { ContextWindowWidget } from '../ContextWindow';

describe('ContextBarWidget', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(usage, 'makeUsageProgressBar').mockImplementation((percent: number, width = 15) => `[bar:${percent.toFixed(1)}:${width}]`);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders from context_window data when available', () => {
        const context: RenderContext = {
            data: {
                context_window: {
                    context_window_size: 200000,
                    current_usage: {
                        input_tokens: 20000,
                        output_tokens: 10000,
                        cache_creation_input_tokens: 5000,
                        cache_read_input_tokens: 5000
                    }
                }
            }
        };
        const widget = new ContextBarWidget();

        expect(widget.render({ id: 'ctx', type: 'context-bar' }, context, DEFAULT_SETTINGS)).toBe('Context: [bar:15.0:16] 30k/200k (15%)');
    });

    it('falls back to token metrics and model context size', () => {
        const context: RenderContext = {
            data: { model: { id: 'claude-3-5-sonnet-20241022' } },
            tokenMetrics: {
                inputTokens: 0,
                outputTokens: 0,
                cachedTokens: 0,
                cacheReadTokens: 0,
                cacheCreationTokens: 0,
                totalTokens: 0,
                contextLength: 50000
            }
        };
        const widget = new ContextBarWidget();

        expect(widget.render({ id: 'ctx', type: 'context-bar' }, context, DEFAULT_SETTINGS)).toBe('Context: [bar:25.0:16] 50k/200k (25%)');
    });

    it('uses 1M context label model IDs in fallback mode', () => {
        const context: RenderContext = {
            data: { model: { id: 'Opus 4.6 (1M context)' } },
            tokenMetrics: {
                inputTokens: 0,
                outputTokens: 0,
                cachedTokens: 0,
                cacheReadTokens: 0,
                cacheCreationTokens: 0,
                totalTokens: 0,
                contextLength: 50000
            }
        };
        const widget = new ContextBarWidget();

        expect(widget.render({ id: 'ctx', type: 'context-bar' }, context, DEFAULT_SETTINGS)).toBe('Context: [bar:5.0:16] 50k/1.0M (5%)');
    });

    it('uses 1M in parentheses model IDs in fallback mode', () => {
        const context: RenderContext = {
            data: { model: { id: 'Opus 4.6 (1M)' } },
            tokenMetrics: {
                inputTokens: 0,
                outputTokens: 0,
                cachedTokens: 0,
                cacheReadTokens: 0,
                cacheCreationTokens: 0,
                totalTokens: 0,
                contextLength: 50000
            }
        };
        const widget = new ContextBarWidget();

        expect(widget.render({ id: 'ctx', type: 'context-bar' }, context, DEFAULT_SETTINGS)).toBe('Context: [bar:5.0:16] 50k/1.0M (5%)');
    });

    it('clamps usage percentage to 100 when context length exceeds total', () => {
        const context: RenderContext = {
            data: {
                context_window: {
                    context_window_size: 200000,
                    current_usage: {
                        input_tokens: 250000,
                        output_tokens: 50000,
                        cache_creation_input_tokens: 0,
                        cache_read_input_tokens: 0
                    }
                }
            }
        };
        const widget = new ContextBarWidget();

        expect(widget.render({ id: 'ctx', type: 'context-bar' }, context, DEFAULT_SETTINGS)).toBe('Context: [bar:100.0:16] 250k/200k (100%)');
    });

    it('supports raw mode without context label', () => {
        const context: RenderContext = {
            data: {
                context_window: {
                    context_window_size: 200000,
                    current_usage: {
                        input_tokens: 5000,
                        output_tokens: 5000,
                        cache_creation_input_tokens: 0,
                        cache_read_input_tokens: 0
                    }
                }
            }
        };
        const widget = new ContextBarWidget();

        expect(widget.render({ id: 'ctx', type: 'context-bar', rawValue: true }, context, DEFAULT_SETTINGS)).toBe('[bar:2.5:16] 5k/200k (3%)');
    });

    it('renders long progress bar mode when configured', () => {
        const context: RenderContext = {
            data: {
                context_window: {
                    context_window_size: 200000,
                    current_usage: {
                        input_tokens: 20000,
                        output_tokens: 10000,
                        cache_creation_input_tokens: 5000,
                        cache_read_input_tokens: 5000
                    }
                }
            }
        };
        const widget = new ContextBarWidget();

        expect(widget.render({
            id: 'ctx',
            type: 'context-bar',
            metadata: { display: 'progress' }
        }, context, DEFAULT_SETTINGS)).toBe('Context: [bar:15.0:32] 30k/200k (15%)');
    });

    it('cycles display modes in the expected order', () => {
        const widget = new ContextBarWidget();
        const base: WidgetItem = { id: 'ctx', type: 'context-bar' };

        const first = widget.handleEditorAction('toggle-progress', base);
        const second = widget.handleEditorAction('toggle-progress', first ?? base);
        const third = widget.handleEditorAction('toggle-progress', second ?? base);

        expect(first?.metadata?.display).toBe('progress');
        expect(second?.metadata?.display).toBe('slider');
        expect(third?.metadata?.display).toBe('progress-short');
    });

    it('cycles label modes and clears metadata when returning to full', () => {
        const widget = new ContextBarWidget();
        const base: WidgetItem = { id: 'ctx', type: 'context-bar' };

        const first = widget.handleEditorAction('cycle-labels', base);
        const second = widget.handleEditorAction('cycle-labels', first ?? base);
        const third = widget.handleEditorAction('cycle-labels', second ?? base);
        const fourth = widget.handleEditorAction('cycle-labels', third ?? base);

        expect(first?.metadata?.labels).toBe('percent');
        expect(second?.metadata?.labels).toBe('tokens');
        expect(third?.metadata?.labels).toBe('none');
        expect(fourth?.metadata).toBeUndefined();
    });

    it('keeps the display mode when cycling labels', () => {
        const widget = new ContextBarWidget();
        const item: WidgetItem = { id: 'ctx', type: 'context-bar', metadata: { display: 'progress' } };

        expect(widget.handleEditorAction('cycle-labels', item)?.metadata).toEqual({ display: 'progress', labels: 'percent' });
    });

    it('returns null for unknown editor actions', () => {
        expect(new ContextBarWidget().handleEditorAction('unknown', { id: 'ctx', type: 'context-bar' })).toBeNull();
    });

    it.each([
        ['percent', 'Context: [bar:15.0:16] 15%'],
        ['tokens', 'Context: [bar:15.0:16] 30k/200k'],
        ['none', 'Context: [bar:15.0:16]'],
        ['bogus', 'Context: [bar:15.0:16] 30k/200k (15%)']
    ])('renders the %s label mode', (labels, expected) => {
        const context: RenderContext = {
            data: {
                context_window: {
                    context_window_size: 200000,
                    current_usage: {
                        input_tokens: 20000,
                        output_tokens: 10000,
                        cache_creation_input_tokens: 5000,
                        cache_read_input_tokens: 5000
                    }
                }
            }
        };

        expect(new ContextBarWidget().render({
            id: 'ctx',
            type: 'context-bar',
            metadata: { labels }
        }, context, DEFAULT_SETTINGS)).toBe(expected);
    });

    it('renders only the bar in raw mode with no label', () => {
        const context: RenderContext = { isPreview: true };

        expect(new ContextBarWidget().render({
            id: 'ctx',
            type: 'context-bar',
            rawValue: true,
            metadata: { display: 'progress', labels: 'none' }
        }, context, DEFAULT_SETTINGS)).toBe('[bar:25.0:32]');
    });

    describe('legacy slider-only display', () => {
        const legacy: WidgetItem = { id: 'ctx', type: 'context-bar', metadata: { display: 'slider-only' } };

        it('renders as a slider with no label', () => {
            const rendered = new ContextBarWidget().render(legacy, { isPreview: true }, DEFAULT_SETTINGS);

            expect(rendered).not.toBeNull();
            expect(rendered).toMatch(/^Context: \S+$/);
        });

        it('describes itself as a short bar with no label', () => {
            expect(new ContextBarWidget().getEditorDisplay(legacy).modifierText).toBe('(short bar, no label)');
        });

        it('migrates to slider + labels none when toggling progress', () => {
            expect(new ContextBarWidget().handleEditorAction('toggle-progress', legacy)?.metadata).toEqual({ display: 'progress-short', labels: 'none' });
        });

        it('migrates to slider when cycling labels from none back to full', () => {
            expect(new ContextBarWidget().handleEditorAction('cycle-labels', legacy)?.metadata).toEqual({ display: 'slider' });
        });
    });

    it('exposes the progress and labels keybinds', () => {
        expect(new ContextBarWidget().getCustomKeybinds()).toEqual([
            { key: 'p', label: '(p)rogress toggle', action: 'toggle-progress' },
            { key: 'l', label: '(l)abels', action: 'cycle-labels' }
        ]);
    });

    it('formats context preview samples with the selected styles', () => {
        const context: RenderContext = { isPreview: true };

        expect(new ContextLengthWidget().render({
            id: 'length',
            type: 'context-length',
            numberFormat: { style: 'whole' }
        }, context, DEFAULT_SETTINGS)).toBe('Ctx: 19k');
        expect(new ContextWindowWidget().render({
            id: 'window',
            type: 'context-window',
            numberFormat: { decimals: 2 }
        }, context, DEFAULT_SETTINGS)).toBe('Win: 200.00k');
        expect(new ContextBarWidget().render({
            id: 'bar',
            type: 'context-bar',
            numberFormat: { decimals: 2 }
        }, context, DEFAULT_SETTINGS)).toBe('Context: [bar:25.0:16] 50.00k/200.00k (25.00%)');
    });
});
