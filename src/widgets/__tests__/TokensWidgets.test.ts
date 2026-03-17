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
import * as renderer from '../../utils/renderer';

async function loadWidgets() {
    const [
        { TokensInputWidget },
        { TokensOutputWidget },
        { TokensCachedWidget },
        { TokensCacheReadWidget },
        { TokensCacheCreationWidget },
        { TokensTotalWidget }
    ] = await Promise.all([
        import('../TokensInput'),
        import('../TokensOutput'),
        import('../TokensCached'),
        import('../TokensCacheRead'),
        import('../TokensCacheCreation'),
        import('../TokensTotal')
    ]);

    return {
        TokensCachedWidget,
        TokensCacheCreationWidget,
        TokensCacheReadWidget,
        TokensInputWidget,
        TokensOutputWidget,
        TokensTotalWidget
    };
}

describe('Token widgets', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(renderer, 'formatTokens').mockImplementation((value: number) => `fmt:${value}`);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('use context_window values for input/output and tokenMetrics totals for cached/total', async () => {
        const { TokensCachedWidget, TokensInputWidget, TokensOutputWidget, TokensTotalWidget } = await loadWidgets();
        const context: RenderContext = {
            data: {
                context_window: {
                    total_input_tokens: 1111,
                    total_output_tokens: 2222,
                    current_usage: {
                        input_tokens: 300,
                        output_tokens: 400,
                        cache_creation_input_tokens: 50,
                        cache_read_input_tokens: 25
                    }
                }
            },
            tokenMetrics: {
                inputTokens: 9999,
                outputTokens: 9999,
                cachedTokens: 9999,
                cacheReadTokens: 5555,
                cacheCreationTokens: 4444,
                totalTokens: 9999,
                contextLength: 9999
            }
        };

        expect(new TokensInputWidget().render({ id: 'in', type: 'tokens-input' }, context, DEFAULT_SETTINGS)).toBe('In: fmt:1111');
        expect(new TokensOutputWidget().render({ id: 'out', type: 'tokens-output' }, context, DEFAULT_SETTINGS)).toBe('Out: fmt:2222');
        expect(new TokensCachedWidget().render({ id: 'cached', type: 'tokens-cached' }, context, DEFAULT_SETTINGS)).toBe('Cached: fmt:9999');
        expect(new TokensCacheReadWidget().render({ id: 'cr', type: 'tokens-cache-read' }, context, DEFAULT_SETTINGS)).toBe('Cache Read: fmt:5555');
        expect(new TokensCacheCreationWidget().render({ id: 'cc', type: 'tokens-cache-creation' }, context, DEFAULT_SETTINGS)).toBe('Cache Write: fmt:4444');
        expect(new TokensTotalWidget().render({ id: 'total', type: 'tokens-total' }, context, DEFAULT_SETTINGS)).toBe('Total: fmt:9999');
    });

    it('fall back to token metrics when context_window data is missing', async () => {
        const { TokensCachedWidget, TokensCacheReadWidget, TokensCacheCreationWidget, TokensInputWidget, TokensOutputWidget, TokensTotalWidget } = await loadWidgets();
        const context: RenderContext = {
            tokenMetrics: {
                inputTokens: 1200,
                outputTokens: 3400,
                cachedTokens: 560,
                cacheReadTokens: 300,
                cacheCreationTokens: 260,
                totalTokens: 5160,
                contextLength: 0
            }
        };

        expect(new TokensInputWidget().render({ id: 'in', type: 'tokens-input' }, context, DEFAULT_SETTINGS)).toBe('In: fmt:1200');
        expect(new TokensOutputWidget().render({ id: 'out', type: 'tokens-output' }, context, DEFAULT_SETTINGS)).toBe('Out: fmt:3400');
        expect(new TokensCachedWidget().render({ id: 'cached', type: 'tokens-cached' }, context, DEFAULT_SETTINGS)).toBe('Cached: fmt:560');
        expect(new TokensCacheReadWidget().render({ id: 'cr', type: 'tokens-cache-read' }, context, DEFAULT_SETTINGS)).toBe('Cache Read: fmt:300');
        expect(new TokensCacheCreationWidget().render({ id: 'cc', type: 'tokens-cache-creation' }, context, DEFAULT_SETTINGS)).toBe('Cache Write: fmt:260');
        expect(new TokensTotalWidget().render({ id: 'total', type: 'tokens-total' }, context, DEFAULT_SETTINGS)).toBe('Total: fmt:5160');
    });

    it('renders raw values without labels for all token widgets', async () => {
        const { TokensCachedWidget, TokensCacheReadWidget, TokensCacheCreationWidget, TokensInputWidget, TokensOutputWidget, TokensTotalWidget } = await loadWidgets();
        const context: RenderContext = {
            data: {
                context_window: {
                    total_input_tokens: 1111,
                    total_output_tokens: 2222,
                    current_usage: {
                        input_tokens: 300,
                        output_tokens: 400,
                        cache_creation_input_tokens: 50,
                        cache_read_input_tokens: 25
                    }
                }
            },
            tokenMetrics: {
                inputTokens: 1200,
                outputTokens: 3400,
                cachedTokens: 560,
                cacheReadTokens: 300,
                cacheCreationTokens: 260,
                totalTokens: 5160,
                contextLength: 20000
            }
        };

        expect(new TokensInputWidget().render({ id: 'in', type: 'tokens-input', rawValue: true }, context, DEFAULT_SETTINGS)).toBe('fmt:1111');
        expect(new TokensOutputWidget().render({ id: 'out', type: 'tokens-output', rawValue: true }, context, DEFAULT_SETTINGS)).toBe('fmt:2222');
        expect(new TokensCachedWidget().render({ id: 'cached', type: 'tokens-cached', rawValue: true }, context, DEFAULT_SETTINGS)).toBe('fmt:560');
        expect(new TokensCacheReadWidget().render({ id: 'cr', type: 'tokens-cache-read', rawValue: true }, context, DEFAULT_SETTINGS)).toBe('fmt:300');
        expect(new TokensCacheCreationWidget().render({ id: 'cc', type: 'tokens-cache-creation', rawValue: true }, context, DEFAULT_SETTINGS)).toBe('fmt:260');
        expect(new TokensTotalWidget().render({ id: 'total', type: 'tokens-total', rawValue: true }, context, DEFAULT_SETTINGS)).toBe('fmt:5160');
    });

    it('renders expected preview labels and raw values for all token widgets', async () => {
        const { TokensCachedWidget, TokensCacheReadWidget, TokensCacheCreationWidget, TokensInputWidget, TokensOutputWidget, TokensTotalWidget } = await loadWidgets();
        const context: RenderContext = { isPreview: true };

        expect(new TokensInputWidget().render({ id: 'in', type: 'tokens-input' }, context, DEFAULT_SETTINGS)).toBe('In: 15.2k');
        expect(new TokensInputWidget().render({ id: 'in', type: 'tokens-input', rawValue: true }, context, DEFAULT_SETTINGS)).toBe('15.2k');
        expect(new TokensOutputWidget().render({ id: 'out', type: 'tokens-output' }, context, DEFAULT_SETTINGS)).toBe('Out: 3.4k');
        expect(new TokensOutputWidget().render({ id: 'out', type: 'tokens-output', rawValue: true }, context, DEFAULT_SETTINGS)).toBe('3.4k');
        expect(new TokensCachedWidget().render({ id: 'cached', type: 'tokens-cached' }, context, DEFAULT_SETTINGS)).toBe('Cached: 12k');
        expect(new TokensCachedWidget().render({ id: 'cached', type: 'tokens-cached', rawValue: true }, context, DEFAULT_SETTINGS)).toBe('12k');
        expect(new TokensTotalWidget().render({ id: 'total', type: 'tokens-total' }, context, DEFAULT_SETTINGS)).toBe('Total: 30.6k');
        expect(new TokensTotalWidget().render({ id: 'total', type: 'tokens-total', rawValue: true }, context, DEFAULT_SETTINGS)).toBe('30.6k');
        expect(new TokensCacheReadWidget().render({ id: 'cr', type: 'tokens-cache-read' }, context, DEFAULT_SETTINGS)).toBe('Cache Read: 8.5k');
        expect(new TokensCacheReadWidget().render({ id: 'cr', type: 'tokens-cache-read', rawValue: true }, context, DEFAULT_SETTINGS)).toBe('8.5k');
        expect(new TokensCacheCreationWidget().render({ id: 'cc', type: 'tokens-cache-creation' }, context, DEFAULT_SETTINGS)).toBe('Cache Write: 3.5k');
        expect(new TokensCacheCreationWidget().render({ id: 'cc', type: 'tokens-cache-creation', rawValue: true }, context, DEFAULT_SETTINGS)).toBe('3.5k');
    });
});