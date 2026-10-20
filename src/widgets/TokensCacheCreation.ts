import type { RenderContext } from '../types/RenderContext';

import { TokenCountWidget } from './shared/token-count-widget';

export class TokensCacheCreationWidget extends TokenCountWidget {
    protected readonly label = 'Cache Write: ';
    protected readonly previewTokens = 3500;

    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return 'Shows cache creation token count for the current session'; }
    getDisplayName(): string { return 'Tokens Cache Creation'; }

    protected getTokenCount(context: RenderContext): number | null {
        return context.tokenMetrics?.cacheCreationTokens ?? null;
    }
}
