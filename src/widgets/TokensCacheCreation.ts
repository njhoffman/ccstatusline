import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { formatTokens } from '../utils/renderer';

import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

export class TokensCacheCreationWidget implements Widget {
    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return 'Shows cache creation token count for the current session'; }
    getDisplayName(): string { return 'Tokens Cache Creation'; }
    getCategory(): string { return 'Tokens'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, 'Cache Write: ', '3.5k');
        }

        if (context.tokenMetrics) {
            return formatRawOrLabeledValue(item, 'Cache Write: ', formatTokens(context.tokenMetrics.cacheCreationTokens));
        }
        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}