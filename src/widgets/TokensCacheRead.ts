import type { RenderContext } from '../types/RenderContext';

import { TokenCountWidget } from './shared/token-count-widget';

export class TokensCacheReadWidget extends TokenCountWidget {
    protected readonly label = 'Cache Read: ';
    protected readonly previewTokens = 8500;

    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return 'Shows cache read token count for the current session'; }
    getDisplayName(): string { return 'Tokens Cache Read'; }

    protected getTokenCount(context: RenderContext): number | null {
        return context.tokenMetrics?.cacheReadTokens ?? null;
    }
}
