import type { RenderContext } from '../types/RenderContext';

import { TokenCountWidget } from './shared/token-count-widget';

export class TokensCachedWidget extends TokenCountWidget {
    protected readonly label = 'Cached: ';
    protected readonly previewTokens = 12000;

    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return 'Shows cached token count for the current session'; }
    getDetails(): string { return 'Input tokens that went through the prompt cache this session, reads and writes combined. Cache reads cost about a tenth of normal input, so in a long session most of the context should end up here.'; }
    getDisplayName(): string { return 'Tokens Cached'; }

    protected getTokenCount(context: RenderContext): number | null {
        return context.tokenMetrics?.cachedTokens ?? null;
    }
}
