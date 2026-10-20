import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { formatTokens } from '../utils/renderer';

import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

export class TokensCacheReadWidget implements Widget {
    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return 'Shows cache read token count for the current session'; }
    getDisplayName(): string { return 'Tokens Cache Read'; }
    getCategory(): string { return 'Tokens'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, 'Cache Read: ', '8.5k');
        }

        if (context.tokenMetrics) {
            return formatRawOrLabeledValue(item, 'Cache Read: ', formatTokens(context.tokenMetrics.cacheReadTokens));
        }
        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}